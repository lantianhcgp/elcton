#!/usr/bin/env python3
"""Evidence only, after FAILED frozen SDK gate. Never authorizes delivery.

Run exact SDK interpreter --parse-only on exact public CI JS bytes. Preserve
both output streams and native returncode. No source transformation or heap
configuration changes. This helper itself does not replace final_gate.py.
"""
from pathlib import Path
import hashlib
import io
import json
import runpy
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
SDK_SHA = '7cb8af6c01f4848216f429bf35d1d497734ee299e055f3f93d58a4d176cfda31'
sha = lambda b: hashlib.sha256(b).hexdigest()


def diagnostic(app, sdk, output):
    gate = runpy.run_path(str(ROOT/'scripts/verify_we_logger_bundle.py'))
    gate['verify'](app)  # refuses credentials, .bc/JRRY/gzip, shape/budget errors
    assert sha(sdk.read_bytes()) == SDK_SHA, 'Unrecognized SDK interpreter'
    outer = gate['archive'](app)
    hap = next(name for name in outer if name.endswith('.hap'))
    files = gate['archive'](io.BytesIO(outer[hap]))
    rows = []
    report = {'scope': 'DIAGNOSTIC ONLY: frozen acceptance gate failed; not delivered',
              'source_app_sha256': sha(app.read_bytes()),
              'exact_sdk_sha256': SDK_SHA, 'original_compiled_bytes': True,
              'heap_or_parse_options_changed': False, 'rows': rows,
              'all_parsed': False}
    try:
        with tempfile.TemporaryDirectory(prefix='we-sdk-evidence-') as work:
            for i, (name, content) in enumerate(sorted(files.items())):
                if not name.startswith('assets/js/') or not name.endswith('.js'):
                    continue
                src = Path(work)/('original-%d.js'%i)
                src.write_bytes(content)
                row = {'path': name, 'bytes': len(content),
                       'sha256': sha(content), 'returncode': None}
                try:
                    p = subprocess.run([str(sdk), '--parse-only', str(src)],
                                       capture_output=True, text=False, timeout=30)
                    row.update(status='completed', returncode=p.returncode)
                    stdout, stderr = p.stdout, p.stderr
                except subprocess.TimeoutExpired as error:
                    row.update(status='timeout', error=str(error))
                    stdout, stderr = error.stdout, error.stderr
                except OSError as error:
                    row.update(status='launch_error', error=str(error))
                    stdout = getattr(error, 'stdout', None)
                    stderr = getattr(error, 'stderr', None)
                for stream, raw in (('stdout', stdout), ('stderr', stderr)):
                    raw = b'' if raw is None else raw
                    row[stream+'_hex'] = raw.hex()
                    row[stream+'_bytes'] = len(raw)
                    row[stream+'_sha256'] = sha(raw)
                rows.append(row)
        report['all_parsed'] = bool(rows) and all(
            r['status'] == 'completed' and r['returncode'] == 0 for r in rows)
    finally:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report))


if __name__ == '__main__':
    diagnostic(*map(Path, sys.argv[1:4]))
