#!/usr/bin/env python3
import json, re, subprocess, sys
from pathlib import Path
label, *cmd = sys.argv[1:]
root = Path(__file__).resolve().parents[3]
evidence = Path(__file__).resolve().parent
log = evidence / (label + '.log')
meta = evidence / (label + '.meta.json')
if log.exists() or meta.exists():
    raise SystemExit('Refusing existing evidence')
r = subprocess.run(cmd, cwd=root, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
log.write_bytes(r.stdout)
text = r.stdout.decode('utf-8', 'replace')
counts = {k:int(v) for k,v in re.findall(r'^(?:# |ℹ )(tests|pass|fail|cancelled|skipped) (\d+)$', text, re.M)}
if not counts:
    counts = {}
result = {'command':cmd, 'exit_code':r.returncode, 'counts':counts, 'log':str(log)}
meta.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
if r.returncode:
    lines = text.splitlines()
    snippets=[]
    for i,line in enumerate(lines):
        if line.startswith('not ok'):
            snippets.extend(lines[i:i+14])
    print('\n'.join(snippets)[:2500])
sys.exit(r.returncode)
