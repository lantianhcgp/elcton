#!/usr/bin/env python3
"""Verify R4 source attribution and receipts without modifying product data."""
from pathlib import Path
import collections
import hashlib
import json
import re
import time

ROOT = Path(__file__).resolve().parents[4]
Q = ROOT / 'qa/we-handshake-20261115'
R = Q / 'research/r4'
E = Q / 'evidence/r4'
checks = {}

def check(name, condition):
    checks[name] = bool(condition)
    if not condition:
        raise AssertionError(name)

sessions = json.loads((R / 'watch-real-sessions.json').read_text())
host = sessions['mwh5okyh-1']
real = sessions['mwh7l2un-1']
previous = json.loads((Q / 'evidence/r3/cloud-canonical-collector-readback.json').read_text())
previous_rows = {row['cursor']: row for row in previous['rows']}
check('host_marker', any(row['log']['seq'] == 3 and row['log']['tag'] == 'console'
      and row['log']['msg'] == previous['marker'] for row in host))
check('host_12_entire_canonical_rows_match', len(host) == 12 and all(
    hashlib.sha256(json.dumps(row, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
    == previous_rows[row['cursor']]['canonical_row_sha256'] for row in host))
source = (Q / 'compiled-logger-https.mjs').read_text()
compact = re.sub(r'\s+', '', source)
# HTTPS fixture directly injects logger stages; the separate WE fixture models native fail.
injection = "app._elctonLog(stage,{code:stage==='SEND_FAIL'?206:0,arg1:stage==='SEND_FAIL'?210301031:0,arg2:0})"
check('host_injected_210301031_not_device', injection in compact)
native_dispatch = source.split('requireNative(name){', 1)[1].split('      },{name:', 1)[0]
exercise = source.split('exercise:async app=>{', 1)[1].split('async cleanup(){', 1)[0]
check('host_https_stage_only_no_we_send',
      "if(name==='system.fetch')" in native_dispatch
      and "throw Error('NATIVE_MODULE_UNMODELLED')" in native_dispatch
      and '210301031' not in native_dispatch
      and not re.search(r'wearengine|sendMsg\s*\(|\.send\s*\(|\.fail\s*\(', native_dispatch + exercise)
      and 'fail(210301031,0)' not in compact)
seqs = {row['log']['seq'] for row in real}
counts = collections.Counter(row['log']['tag'] for row in real)
check('real_row_count_and_seq_gap', len(real) == 36 and set(range(1, 38)) - seqs == {15})
check('real_hello4_fail5_prepared4', counts['WE/HELLO_RECV'] == 4 and counts['WE/SEND_FAIL'] == 5
      and counts['WE/READY_PREPARED'] == 4 and counts['WE/READY_FAIL'] == 5)
check('real_native_args_undefined', all(row['log']['msg'] == 'code=206 type1=0 type2=0'
      for row in real if row['log']['tag'] == 'WE/SEND_FAIL'))
cloud = json.loads((R / 'cloud-mirror-readback.json').read_text())['response']
local = {row['cursor']: row for rows in sessions.values() for row in rows}
check('cloud48_no_more_exact_wrapper_equality', len(cloud['rows']) == len(local) == 48
      and cloud['has_more'] is False and cloud['next'] == 1460
      and all(row == local.get(row['cursor']) for row in cloud['rows']))
regression = json.loads((E / 'unchanged-full-regression.json').read_text())
tap = (E / 'unchanged-full-regression.tap').read_text()
summary = {key: int(value) for key, value in re.findall(
    r'[ℹ#]?\s*(tests|suites|pass|fail|cancelled|skipped|todo)\s+(\d+)', tap)}
check('real_regression445_totals', regression['exit_code'] == 0 and summary == regression['totals']
      and summary['tests'] == summary['pass'] == 445 and summary['fail'] == summary['skipped'] == 0)
scope = json.loads((E / 'scope-protection-final.json').read_text())
check('scope_phone9455_watch121_receipt', scope['passed'] and scope['phone_files_checked'] == 9455
      and scope['watch_protected_files_checked'] == 121 and not scope['phone_drift'] and not scope['watch_drift'])
text = (R / 'official/errocode-0000001054450278.txt').read_text()
check('official_exact_206_207_contract', 'ERROR_CODE_COMM_FAIL' in text and 'ERROR_CODE_COMM_SUCCESS' in text
      and '210301031' not in text)
android_doc = (R / 'official/p2pclient-0000001061098712.txt').read_text()
check('android_document_no_connectChannel', 'connectChannel' not in android_doc and 'registerReceiver' in android_doc)
report = {'passed': all(checks.values()), 'checks': checks, 'at': time.strftime('%Y-%m-%d %H:%M:%S %z'),
          'device_operations': False, 'root_cause_resolved': False, 'new_hap': False}
(E / 'evidence-verification.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
