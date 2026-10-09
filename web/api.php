<?php
/**
 * 多用户课表接口（elcton 取件码系统 · 手机/网页/手表共用）
 *
 * 设计（用户拍板）：
 *   - 取件码 = 6 位纯数字，**只读**凭据：手表用它拉课表
 *   - 编辑钥匙 = 24 位十六进制，只存在编辑页 URL / localStorage 里：改、重生成取件码都要它
 *   - 永久保留；180 天没被访问的自动清理
 *   - 不做限速（用户明确要求不加）
 *
 * 端点：
 *   GET  api.php?action=get&pickup=123456     → {code:"ok", doc:{...}}
 *   POST api.php   {"action":"create","doc":{...}}              → {code:"ok", pickup, key}
 *   POST api.php   {"action":"put","pickup":"123456","key":"..","doc":{...}} → {code:"ok", rev}
 *   POST api.php   {"action":"info","key":".."}                 → {code:"ok", pickup, doc, updatedAt}
 *   POST api.php   {"action":"regen","key":".."}                → {code:"ok", pickup}（换新取件码）
 *
 * 存储（都在 data/ 下，每个文件都用 PHP 头包装成 404，防静态直读）：
 *   data/p_<取件码>.php  → {"key":"..."}                    取件码 → 钥匙
 *   data/k_<钥匙>.php    → {"key","pickup","createdAt","lastAccess","doc"}  本体
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');

$DATA = __DIR__ . '/data';
$KNOWN_VERSION = 1;                 // 本端已知最高课表格式版本
$STALE_DAYS = 180;                  // 未访问超过该天数即清理
$WRAP = "<?php http_response_code(404); exit; ?>\n";   // 数据文件伪装成 404

function out($code, $http = 200, $extra = array()) {
    http_response_code($http);
    echo json_encode(array_merge(array('code' => $code), $extra), JSON_UNESCAPED_UNICODE);
    exit;
}
function isPost() { return $_SERVER['REQUEST_METHOD'] === 'POST'; }

/* ── 输入校验（不是限速，是防止路径穿越/乱写） ── */
function vPickup($v) { return is_string($v) && preg_match('/^[0-9]{6}$/', $v) ? $v : null; }
function vKey($v)    { return is_string($v) && preg_match('/^[a-f0-9]{24}$/', $v) ? $v : null; }

function ensureDir() {
    global $DATA;
    if (!is_dir($DATA)) { @mkdir($DATA, 0755, true); }
}
function pathPickup($p) { global $DATA; return $DATA . '/p_' . $p . '.php'; }
function pathKey($k)    { global $DATA; return $DATA . '/k_' . $k . '.php'; }

/* 写：先写 tmp 再 rename（原子），内容带 404 伪装头 */
function saveFile($path, $payload) {
    global $WRAP;                     // 不写 global 会拿到 null → 404 伪装头丢失
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) { out('序列化失败', 500); }
    $tmp = $path . '.' . uniqid('', true) . '.tmp';
    if (file_put_contents($tmp, $WRAP . $json, LOCK_EX) === false) { out('写文件失败', 500); }
    if (!@rename($tmp, $path)) { @unlink($tmp); out('替换失败', 500); }
}
/* 读：剥掉伪装头 */
function loadFile($path) {
    if (!is_file($path)) { return null; }
    $raw = file_get_contents($path);
    if ($raw === false) { return null; }
    $pos = strpos($raw, '?>');
    $body = ($pos === false) ? $raw : substr($raw, $pos + 2);
    $j = json_decode($body, true);
    return is_array($j) ? $j : null;
}

function newKey() { return bin2hex(random_bytes(12)); }              // 24 hex
function newPickup() {                                                // 6 位数字，避让已占用
    for ($i = 0; $i < 60; $i++) {
        $c = strval(random_int(100000, 999999));
        if (!is_file(pathPickup($c)) && !is_file(pathKey($c))) { return $c; }
    }
    out('取件码生成冲突，请重试', 500);
}

/* 课表文档校验（schema/version 是硬门槛，见 docs/schedule-format.md） */
function checkDoc($doc) {
    global $KNOWN_VERSION;            // 不写 global → null → `1 > null` 成立，误报版本过高
    if (!is_array($doc)) { return '缺少 doc'; }
    if (!isset($doc['schema']) || $doc['schema'] !== 'elcton.schedule') { return 'schema 不匹配'; }
    if (!isset($doc['courses']) || !is_array($doc['courses'])) { return 'courses 不是数组'; }
    $ver = isset($doc['version']) ? intval($doc['version']) : 0;
    if ($ver > $KNOWN_VERSION) { return '格式版本高于本端'; }
    if ($ver < 1) { $doc['version'] = 1; }
    return null;
}

/* 180 天未访问清理（挂在 create 上，按 .cleanup 标记每天最多跑一次） */
function gcStale() {
    global $DATA, $STALE_DAYS;
    $marker = $DATA . '/.cleanup';
    if (is_file($marker) && (time() - filemtime($marker)) < 86400) { return; }
    @touch($marker);
    $cut = time() - $STALE_DAYS * 86400;
    foreach (glob($DATA . '/k_*.php') as $f) {
        $j = loadFile($f);
        if (!$j) { @unlink($f); continue; }
        $last = isset($j['lastAccess']) ? intval($j['lastAccess']) :
                (isset($j['createdAt']) ? intval($j['createdAt']) : 0);
        if ($last > 0 && $last < $cut) {
            @unlink(pathPickup(isset($j['pickup']) ? $j['pickup'] : ''));
            @unlink($f);
        }
    }
}

/* ═══════════ 主逻辑 ═══════════ */
ensureDir();

if (!isPost()) {
    /* GET 只允许 get（手表拉课表） */
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    if ($action !== 'get') { out('仅支持 GET action=get', 405); }
    $pickup = vPickup(isset($_GET['pickup']) ? $_GET['pickup'] : null);
    if (!$pickup) { out('取件码必须是 6 位数字', 422); }

    $map = loadFile(pathPickup($pickup));
    if (!$map || !isset($map['key'])) { out('取件码不存在', 404); }
    $key = vKey($map['key']);
    if (!$key) { out('数据损坏', 500); }
    $rec = loadFile(pathKey($key));
    if (!$rec || !isset($rec['doc'])) { out('课表不存在', 404); }

    $rec['lastAccess'] = time();
    saveFile(pathKey($key), $rec);

    out('ok', 200, array('pickup' => $pickup, 'updatedAt' => isset($rec['doc']['updatedAt']) ? $rec['doc']['updatedAt'] : 0,
                          'rev' => isset($rec['doc']['rev']) ? $rec['doc']['rev'] : 0,
                          'doc' => $rec['doc']));
}

/* POST */
$raw = file_get_contents('php://input');
$req = json_decode($raw, true);
if (!is_array($req)) {
    $req = array('action' => isset($_POST['action']) ? $_POST['action'] : '',
                 'doc' => isset($_POST['doc']) ? $_POST['doc'] : null,
                 'pickup' => isset($_POST['pickup']) ? $_POST['pickup'] : null,
                 'key' => isset($_POST['key']) ? $_POST['key'] : null);
    if (isset($req['doc']) && is_string($req['doc'])) { $req['doc'] = json_decode($req['doc'], true); }
}
if (!is_array($req)) { out('请求体不是合法 JSON', 400); }
$action = isset($req['action']) ? strval($req['action']) : '';

/* ── create：建新课表，发取件码 + 编辑钥匙 ── */
if ($action === 'create') {
    $err = checkDoc(isset($req['doc']) ? $req['doc'] : null);
    if ($err) { out($err, 422); }
    $doc = $req['doc'];
    $key = newKey();
    $pickup = newPickup();
    $now = time();
    $doc['rev'] = max(1, intval(isset($doc['rev']) ? $doc['rev'] : 0));
    $doc['updatedAt'] = (int) round(microtime(true) * 1000);
    $rec = array('key' => $key, 'pickup' => $pickup, 'createdAt' => $now, 'lastAccess' => $now, 'doc' => $doc);
    gcStale();
    saveFile(pathPickup($pickup), array('key' => $key));
    saveFile(pathKey($key), $rec);
    out('ok', 200, array('pickup' => $pickup, 'key' => $key, 'rev' => $doc['rev']));
}

/* ── 以下三个都要编辑钥匙 ── */
$key = vKey(isset($req['key']) ? $req['key'] : null);
if (!$key) { out('编辑钥匙格式不正确', 422); }
$rec = loadFile(pathKey($key));
if (!$rec || !isset($rec['doc'])) { out('编辑钥匙无效（课表可能已被清理）', 404); }

if ($action === 'info') {
    $rec['lastAccess'] = time();
    saveFile(pathKey($key), $rec);
    out('ok', 200, array('pickup' => isset($rec['pickup']) ? $rec['pickup'] : '',
                          'updatedAt' => $rec['doc']['updatedAt'], 'rev' => $rec['doc']['rev'],
                          'createdAt' => $rec['createdAt'], 'doc' => $rec['doc']));
}

if ($action === 'regen') {           // 重新生成取件码（旧码立即失效）
    $old = isset($rec['pickup']) ? $rec['pickup'] : '';
    $new = newPickup();
    $rec['pickup'] = $new;
    $rec['lastAccess'] = time();
    saveFile(pathKey($key), $rec);              // 先写本体
    @unlink(pathPickup($old));                  // 再撤旧映射
    saveFile(pathPickup($new), array('key' => $key));
    out('ok', 200, array('pickup' => $new, 'old' => $old));
}

if ($action === 'put') {
    $pickup = vPickup(isset($req['pickup']) ? $req['pickup'] : $rec['pickup']);
    if (!$pickup) { out('取件码必须是 6 位数字', 422); }
    $err = checkDoc(isset($req['doc']) ? $req['doc'] : null);
    if ($err) { out($err, 422); }
    $doc = $req['doc'];
    $cur = intval(isset($rec['doc']['rev']) ? $rec['doc']['rev'] : 0);
    $in  = intval(isset($doc['rev']) ? $doc['rev'] : 0);
    $doc['rev'] = max($cur, $in) + 1;           // rev 单调递增
    $doc['updatedAt'] = (int) round(microtime(true) * 1000);
    $now = time();

    if ($pickup !== $rec['pickup']) {           // 码变了（比如手上是旧码）→ 重建映射
        @unlink(pathPickup($rec['pickup']));
        saveFile(pathPickup($pickup), array('key' => $key));
        $rec['pickup'] = $pickup;
    }
    $rec['doc'] = $doc;
    $rec['lastAccess'] = $now;
    saveFile(pathKey($key), $rec);
    out('ok', 200, array('pickup' => $pickup, 'rev' => $doc['rev'], 'updatedAt' => $doc['updatedAt']));
}

out('未知 action: ' . htmlspecialchars($action), 400);
