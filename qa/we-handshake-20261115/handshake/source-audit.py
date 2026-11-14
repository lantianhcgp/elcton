import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
BASE = '83d58a8'
FILES = [
    'entry/src/main/js/MainAbility/common/wearService.js',
    'entry/src/main/js/MainAbility/common/wearChannel.js',
    'entry/src/main/js/MainAbility/common/wearTrace.js',
    'entry/src/main/js/MainAbility/pages/phone-sync/phone-sync.js',
    'tests/weNativeContract.test.mjs',
]
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)

report: dict = {'time': datetime.datetime.now().astimezone().isoformat(), 'baseline': BASE}
original = git('ls-tree', '-r', '--name-only', BASE, 'tests/').decode().splitlines()
report['original_test_file_count'] = len(original)
report['original_test_files_changed'] = [p for p in original if (ROOT / p).read_bytes() != git('show', BASE + ':' + p)]
report['frozen_files_byte_equal'] = {p: (ROOT / p).read_bytes() == git('show', BASE + ':' + p) for p in [
    'qa/p2p-ready-20261114/final_gate.py', 'entry/src/main/js/MainAbility/common/wearIdentity.js']}
report['source_files'] = {p: {'bytes': (ROOT / p).stat().st_size,
    'sha256': hashlib.sha256((ROOT / p).read_bytes()).hexdigest()} for p in FILES}
report['syntax_checks'] = []
report['syntax_forbidden'] = []
for p in FILES:
    if not p.endswith('.js'):
        continue
    s = (ROOT / p).read_text()
    r = subprocess.run(['node', '--input-type=module', '--check'], input=s, text=True, capture_output=True)
    report['syntax_checks'].append({'path': p, 'exit_code': r.returncode, 'stderr': r.stderr})
    for pattern in [r'\?\.', r'\?\?', r'\basync\s+function', r'\bawait\s+', r'\.test\(']:
        if re.search(pattern, s):
            report['syntax_forbidden'].append({'path': p, 'pattern': pattern})
t = (ROOT / FILES[2]).read_text()
report['projection_static_checks'] = {
    'no_stringify': 'JSON.stringify' not in t,
    'no_message_read': '.message' not in t,
    'no_toString_read': '.toString' not in t,
    'own_code_descriptor_gate': "Object.getOwnPropertyDescriptor(value, 'code')" in t,
    'uses_9_digit_range': '-999999999' in t and '<= 999999999' in t,
}
page = (ROOT / FILES[3]).read_text()
awake_diff = (ROOT / 'qa/we-handshake-20261115/awake/phone-sync.diff').read_text()
awake_added = [line[1:] for line in awake_diff.splitlines() if line.startswith('+') and not line.startswith('+++')]
report['awake_added_lines_preserved'] = all(line in page for line in awake_added)
report['onShow_block_preserved'] = ('    onShow: function () {\n        if (this._closed) { return; }\n'
    '        if (!this._awake) { this._awake = makeAwake(); }\n        this._awake.show();\n    },') in page
report['diff_check_exit'] = subprocess.run(['git', 'diff', '--check'], cwd=ROOT, capture_output=True).returncode
report['host_boundary'] = 'source syntax and host tests only; no SDK build, Bluetooth, firmware, device, install or CI'
(OUT / 'source-audit-verified.json').write_text(json.dumps(report, indent=2) + '\n')
(OUT / 'product-source.diff').write_bytes(git('diff', '--', *FILES[:2], FILES[3]))
print(json.dumps({k: report[k] for k in ['original_test_files_changed', 'frozen_files_byte_equal',
    'awake_added_lines_preserved', 'onShow_block_preserved', 'syntax_forbidden', 'diff_check_exit', 'source_files']}, indent=2))
assert not report['original_test_files_changed']
assert all(report['frozen_files_byte_equal'].values())
assert report['awake_added_lines_preserved'] and report['onShow_block_preserved']
assert not report['syntax_forbidden'] and all(r['exit_code'] == 0 for r in report['syntax_checks'])
assert all(report['projection_static_checks'].values())
assert report['diff_check_exit'] == 0
