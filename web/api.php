<?php
/**
 * 多用户课表接口 v2（elcton 取件码系统）
 *
 * 权限模型（用户 2026-10-09 拍板的第二版）：
 *   - 取件码 6 位纯数字      → **只读**，手表用它拉课表
 *   - 设备标识 did 32 位 hex → 自动识别：网站记在浏览器里，下次进站直接认出是本人，免存链接
 *   - 编辑密码 6 位数字+字母 → 换设备时用它解锁，解锁后该设备自动登记为拥有者
 *   - 不做限速（用户要求不加）；数据永久保留，180 天未访问清理
 *
 * 端点：
 *   GET  api.php?action=get&pickup=123456        → {code:"ok", doc:{...}}      手表走这条
 *   POST {"action":"create","did":"..","doc":{..}}→ {code:"ok", pickup, pass}
 *   POST {"action":"mine","did":".."}             → {code:"ok", pickup, pass, doc}   本人免密进入
 *   POST {"action":"unlock","pass":"ab3k9z","did"}→ {code:"ok", pickup, pass, doc}   换设备解锁
 *   POST {"action":"put","did":"..","doc":{..}}   → {code:"ok", rev}
 *   POST {"action":"regen","did":"..","what":"pickup"|"pass"} → {code:"ok", value}
 *
 * 存储（data/ 下，每个文件都包一层 404 伪装头，防静态直读）：
 *   r_<内部id>.php      → 本体 {id,pickup,pass,dids,createdAt,lastAccess,doc}
 *   p_<取件码>.php       → {"id":...}     取件码 → 本体
 *   d_<设备标识>.php     → {"id":...}     设备 → 本体（免密识别的依据）
 *   w_<编辑密码>.php     → {"id":...}     密码 → 本体
 */
define('DATA_DIR', __DIR__ . '/data');
define('WRAP', "<?php http_response_code(404); exit; ?>\n");
define('KNOWN_VERSION', 1);
define('STALE_DAYS', 180);
/* 可用字符：去掉易混淆的 0/O/1/l/I，31 个字符，6 位 ≈ 8.9 亿种组合 */
define('PASS_ALPHA', '23456789abcdefghjkmnpqrstuvwxyz');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');

function out($code, $http = 200, $extra = array()) {
    http_response_code($http);
    echo json_encode(array_merge(array('code' => $code), $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

/* ── 输入校验（挡路径穿越，不是限速） ── */
function vPickup($v) { return is_string($v) && preg_match('/^[0-9]{6}$/', $v) ? $v : null; }
function vPass($v)   { return is_string($v) && preg_match('/^[0-9a-zA-Z]{6}$/', $v) ? $v : null; }
function vDid($v)    { return is_string($v) && preg_match('/^[a-f0-9]{32}$/', $v) ? $v : null; }

function ensureDir() { if (!is_dir(DATA_DIR)) { @mkdir(DATA_DIR, 0755, true); } }
function pRec($id)      { return DATA_DIR . '/r_' . $id . '.php'; }
function pPickup($c)    { return DATA_DIR . '/p_' . $c . '.php'; }
function pDid($d)       { return DATA_DIR . '/d_' . $d . '.php'; }
function pPass($w)      { return DATA_DIR . '/w_' . $w . '.php'; }

function saveFile($path, $payload) {
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) { out('序列化失败', 500); }
    $tmp = $path . '.' . uniqid('', true) . '.tmp';
    if (file_put_contents($tmp, WRAP . $json, LOCK_EX) === false) { out('写文件失败', 500); }
    if (!@rename($tmp, $path)) { @unlink($tmp); out('替换失败', 500); }
}
function loadFile($path) {
    if (!is_file($path)) { return null; }
    $raw = file_get_contents($path);
    if ($raw === false) { return null; }
    $pos = strpos($raw, '?>');
    $body = ($pos === false) ? $raw : substr($raw, $pos + 2);
    $j = json_decode($body, true);
    return is_array($j) ? $j : null;
}
function loadIdx($path) {
    $j = loadFile($path);
    return ($j && isset($j['id'])) ? $j['id'] : null;
}

function newId()     { return bin2hex(random_bytes(16)); }                 // 32 hex
function newPickup() {
    for ($i = 0; $i < 80; $i++) {
        $c = strval(random_int(100000, 999999));
        if (!is_file(pPickup($c))) { return $c; }
    }
    out('取件码生成冲突，请重试', 500);
}
function newPass() {
    $n = strlen(PASS_ALPHA);
    for ($i = 0; $i < 80; $i++) {
        $s = '';
        for ($k = 0; $k < 6; $k++) { $s .= PASS_ALPHA[random_int(0, $n - 1)]; }
        if (!is_file(pPass($s))) { return $s; }
    }
    out('编辑密码生成冲突，请重试', 500);
}

function checkDoc($doc) {
    if (!is_array($doc)) { return '缺少 doc'; }
    if (!isset($doc['schema']) || $doc['schema'] !== 'elcton.schedule') { return 'schema 不匹配'; }
    if (!isset($doc['courses']) || !is_array($doc['courses'])) { return 'courses 不是数组'; }
    $ver = isset($doc['version']) ? intval($doc['version']) : 0;
    if ($ver > KNOWN_VERSION) { return '格式版本高于本端'; }
    return null;
}

/* 按设备标识取本体：d_ 索引 → r_ 本体 */
function recByDid($did) {
    $id = loadIdx(pDid($did));
    if (!$id) { return null; }
    $rec = loadFile(pRec($id));
    if (!$rec || !isset($rec['doc'])) { return null; }
    if (!in_array($did, isset($rec['dids']) ? $rec['dids'] : array(), true)) { return null; }
    return $rec;
}

/* 180 天清理：本体连同三个索引一起删（每天最多跑一次） */
function gcStale() {
    $marker = DATA_DIR . '/.cleanup';
    if (is_file($marker) && (time() - filemtime($marker)) < 86400) { return; }
    @touch($marker);
    $cut = time() - STALE_DAYS * 86400;
    foreach (glob(DATA_DIR . '/r_*.php') as $f) {
        $j = loadFile($f);
        if (!$j || !isset($j['id'])) { @unlink($f); continue; }
        $last = isset($j['lastAccess']) ? intval($j['lastAccess']) :
                (isset($j['createdAt']) ? intval($j['createdAt']) : 0);
        if ($last > 0 && $last < $cut) { dropRecord($j); }
    }
}
function dropRecord($j) {
    if (isset($j['pickup'])) { @unlink(pPickup($j['pickup'])); }
    if (isset($j['pass']))   { @unlink(pPass($j['pass'])); }
    if (isset($j['dids']) && is_array($j['dids'])) {
        foreach ($j['dids'] as $d) { @unlink(pDid($d)); }
    }
    @unlink(pRec($j['id']));
}

/* ═══════════ 主逻辑 ═══════════ */
ensureDir();

/* GET：只给手表拉课表 */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    if ($action !== 'get') { out('仅支持 GET action=get', 405); }
    $pickup = vPickup(isset($_GET['pickup']) ? $_GET['pickup'] : null);
    if (!$pickup) { out('取件码必须是 6 位数字', 422); }
    $id = loadIdx(pPickup($pickup));
    if (!$id) { out('取件码不存在', 404); }
    $rec = loadFile(pRec($id));
    if (!$rec || !isset($rec['doc'])) { out('课表不存在', 404); }
    $rec['lastAccess'] = time();
    saveFile(pRec($id), $rec);
    /* 把 doc 字段摊到顶层：手表端读的是 remote.schema / remote.courses。
     * v1 包了一层 {code,doc:{...}}，真机实测报「schema 不匹配」且 schema= 为空。 */
    $extra = $rec['doc'];
    $extra['pickup'] = $pickup;
    out('ok', 200, $extra);
}

$raw = file_get_contents('php://input');
$req = json_decode($raw, true);
if (!is_array($req)) { out('请求体不是合法 JSON', 400); }
$action = isset($req['action']) ? strval($req['action']) : '';

/* ── create：新建，登记本设备为拥有者 ── */
if ($action === 'create') {
    $did = vDid(isset($req['did']) ? $req['did'] : null);
    if (!$did) { out('设备标识格式不正确', 422); }
    $err = checkDoc(isset($req['doc']) ? $req['doc'] : null);
    if ($err) { out($err, 422); }
    $doc = $req['doc'];
    $doc['rev'] = max(1, intval(isset($doc['rev']) ? $doc['rev'] : 0));
    $doc['updatedAt'] = (int) round(microtime(true) * 1000);
    $id = newId(); $pickup = newPickup(); $pass = newPass(); $now = time();
    $rec = array('id' => $id, 'pickup' => $pickup, 'pass' => $pass,
                 'dids' => array($did), 'createdAt' => $now, 'lastAccess' => $now, 'doc' => $doc);
    gcStale();
    saveFile(pRec($id), $rec);
    saveFile(pPickup($pickup), array('id' => $id));
    saveFile(pDid($did), array('id' => $id));
    saveFile(pPass($pass), array('id' => $id));
    out('ok', 200, array('pickup' => $pickup, 'pass' => $pass, 'rev' => $doc['rev']));
}

/* ── 以下动作都要设备标识（前三个还要校验/绑定） ── */
$did = vDid(isset($req['did']) ? $req['did'] : null);
if (!$did) { out('设备标识格式不正确', 422); }

/* mine：本人免密识别（网站进站时自动调） */
if ($action === 'mine') {
    $rec = recByDid($did);
    if (!$rec) { out('这台设备还没绑定课表', 404); }
    $rec['lastAccess'] = time();
    saveFile(pRec($rec['id']), $rec);
    out('ok', 200, array('pickup' => $rec['pickup'], 'pass' => $rec['pass'],
                          'rev' => $rec['doc']['rev'], 'updatedAt' => $rec['doc']['updatedAt'],
                          'doc' => $rec['doc']));
}

/* unlock：换设备，用 6 位编辑密码解锁并登记本设备 */
if ($action === 'unlock') {
    $pass = vPass(isset($req['pass']) ? $req['pass'] : null);
    if (!$pass) { out('编辑密码是 6 位数字或字母', 422); }
    $id = loadIdx(pPass($pass));
    if (!$id) { out('编辑密码不对', 404); }
    $rec = loadFile(pRec($id));
    if (!$rec || !isset($rec['doc'])) { out('课表不存在', 404); }
    if (!in_array($did, isset($rec['dids']) ? $rec['dids'] : array(), true)) {
        $rec['dids'][] = $did;
        if (count($rec['dids']) > 20) { array_shift($rec['dids']); }   // 防无限堆设备
    }
    $rec['lastAccess'] = time();
    saveFile(pRec($rec['id']), $rec);
    saveFile(pDid($did), array('id' => $rec['id']));
    out('ok', 200, array('pickup' => $rec['pickup'], 'pass' => $rec['pass'],
                          'rev' => $rec['doc']['rev'], 'updatedAt' => $rec['doc']['updatedAt'],
                          'doc' => $rec['doc']));
}

/* 其余动作：必须是已登记设备 */
$rec = recByDid($did);
if (!$rec) { out('设备未登记（用编辑密码解锁，或先新建）', 403); }

if ($action === 'info') {
    out('ok', 200, array('pickup' => $rec['pickup'], 'pass' => $rec['pass'],
                          'rev' => $rec['doc']['rev'], 'updatedAt' => $rec['doc']['updatedAt'],
                          'doc' => $rec['doc']));
}

if ($action === 'put') {
    $err = checkDoc(isset($req['doc']) ? $req['doc'] : null);
    if ($err) { out($err, 422); }
    $doc = $req['doc'];
    $cur = intval(isset($rec['doc']['rev']) ? $rec['doc']['rev'] : 0);
    $in  = intval(isset($doc['rev']) ? $doc['rev'] : 0);
    $doc['rev'] = max($cur, $in) + 1;
    $doc['updatedAt'] = (int) round(microtime(true) * 1000);
    $rec['doc'] = $doc;
    $rec['lastAccess'] = time();
    saveFile(pRec($rec['id']), $rec);
    out('ok', 200, array('pickup' => $rec['pickup'], 'pass' => $rec['pass'],
                          'rev' => $doc['rev'], 'updatedAt' => $doc['updatedAt']));
}

if ($action === 'regen') {
    $what = isset($req['what']) ? strval($req['what']) : '';
    $rec['lastAccess'] = time();
    if ($what === 'pickup') {
        $old = $rec['pickup'];
        $new = newPickup();
        $rec['pickup'] = $new;
        saveFile(pRec($rec['id']), $rec);
        @unlink(pPickup($old));
        saveFile(pPickup($new), array('id' => $rec['id']));
        out('ok', 200, array('what' => 'pickup', 'value' => $new, 'old' => $old));
    }
    if ($what === 'pass') {
        $old = $rec['pass'];
        $new = newPass();
        $rec['pass'] = $new;
        saveFile(pRec($rec['id']), $rec);
        @unlink(pPass($old));
        saveFile(pPass($new), array('id' => $rec['id']));
        out('ok', 200, array('what' => 'pass', 'value' => $new, 'old' => $old));
    }
    out('what 必须是 pickup 或 pass', 422);
}

out('未知 action: ' . htmlspecialchars($action), 400);
