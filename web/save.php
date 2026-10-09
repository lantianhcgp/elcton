<?php
/**
 * 课程表保存接口（elcton 同步 · 手机侧落盘）
 *
 * POST /elcton/save.php   body: {"token":"...","doc":{...}}
 * 返回: {"code":"ok","rev":N,"updatedAt":...,"count":N}
 *
 * 规则（对应 docs/schedule-format.md §四）：
 *  - schema 必须是 elcton.schedule，version 不得高于本端已知版本（防降级覆盖）
 *  - rev 单调递增：newRev = max(当前rev, 传入rev) + 1
 *  - 写前先把当前文件备份到 schedule.prev.json（§4.6 远端保留上一份好数据）
 *  - 原子写：先写 tmp 再 rename，避免写一半被手表读到
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store');

/* 真实口令不入库（本仓库是 public）：部署时把下面这行改成与 index.html 里
 * TOKEN 一致的值。线上运行的那份在主机上，来源是本地 600 权限的配置文件。 */
$TOKEN = 'CHANGE_ME';
$KNOWN_VERSION = 1;                     // 本端已知最高格式版本
$FILE = __DIR__ . '/schedule.json';
$PREV = __DIR__ . '/schedule.prev.json';

function out($code, $http = 200, $extra = array()) {
    http_response_code($http);
    echo json_encode(array_merge(array('code' => $code), $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { out('仅支持 POST', 405); }

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    $payload = array('doc' => isset($_POST['doc']) ? $_POST['doc'] : null,
                     'token' => isset($_POST['token']) ? $_POST['token'] : '');
    $payload['doc'] = is_string($payload['doc']) ? json_decode($payload['doc'], true) : $payload['doc'];
}
if (!is_array($payload)) { out('请求体不是合法 JSON', 400); }

$token = isset($payload['token']) ? strval($payload['token']) : '';
if (!hash_equals($TOKEN, $token)) { out('口令错误', 403); }

$doc = isset($payload['doc']) ? $payload['doc'] : null;
if (!is_array($doc)) { out('缺少 doc', 400); }
if (!isset($doc['schema']) || $doc['schema'] !== 'elcton.schedule') { out('schema 不匹配', 422); }
$ver = isset($doc['version']) ? intval($doc['version']) : 0;
if ($ver > $KNOWN_VERSION) { out('远端格式版本高于本端，拒绝覆盖', 409, array('version' => $ver)); }
if (!isset($doc['courses']) || !is_array($doc['courses'])) { out('courses 不是数组', 422); }

$curRev = 0;
if (is_file($FILE)) {
    $old = json_decode(file_get_contents($FILE), true);
    if (is_array($old) && isset($old['rev'])) { $curRev = intval($old['rev']); }
}
$inRev = isset($doc['rev']) ? intval($doc['rev']) : 0;
$newRev = max($curRev, $inRev) + 1;
$now = (int) round(microtime(true) * 1000);

$out = array(
    'schema' => 'elcton.schedule',
    'version' => max(1, $ver),
    'rev' => $newRev,
    'updatedAt' => $now,
    'settings' => isset($doc['settings']) && is_array($doc['settings']) ? $doc['settings'] : new stdClass(),
    'courses' => $doc['courses'],
);

$json = json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false) { out('序列化失败', 500); }

if (is_file($FILE)) { @copy($FILE, $PREV); }          // 保留上一份好数据
$tmp = $FILE . '.tmp';
if (file_put_contents($tmp, $json, LOCK_EX) === false) { out('写文件失败', 500); }
if (!@rename($tmp, $FILE)) { out('替换失败', 500); }

out('ok', 200, array(
    'rev' => $newRev,
    'updatedAt' => $now,
    'count' => count($doc['courses']),
    'bytes' => strlen($json),
));
