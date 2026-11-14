#!/usr/bin/env python3
"""Readonly exact SHA/workflow GitHub Actions wait. Never dispatches or installs."""
import argparse,json,subprocess,time,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--repo',required=True);p.add_argument('--sha',required=True);p.add_argument('--workflow',required=True);p.add_argument('--out',required=True);p.add_argument('--max-seconds',type=int,default=1800);a=p.parse_args()
out=Path(a.out);out.parent.mkdir(parents=True,exist_ok=True);start=time.monotonic();runid=None
while time.monotonic()-start<a.max_seconds:
 cmd=['gh','run','view',str(runid),'--repo',a.repo,'--json','databaseId,headSha,status,conclusion,url,jobs'] if runid else ['gh','run','list','--repo',a.repo,'--commit',a.sha,'--workflow',a.workflow,'--limit','15','--json','databaseId,headSha,status,conclusion,url']
 r=subprocess.run(cmd,capture_output=True,text=True,timeout=40)
 if r.returncode:
  print('Readonly status request failed (exit='+str(r.returncode)+'); retrying.',flush=True)
 else:
  data=json.loads(r.stdout)
  matches=[x for x in data if x['headSha']==a.sha] if isinstance(data,list) else [data]
  if len(matches)>1:raise RuntimeError('Ambiguous repeated exact-SHA workflow runs; inspect manually')
  if matches:
   result=matches[0];assert result['headSha']==a.sha
   runid=result['databaseId'];out.write_text(json.dumps(result,indent=2)+'\n')
   if result['status']=='completed':
    print(json.dumps(result),flush=True);sys.exit(0 if result['conclusion']=='success' else 1)
 time.sleep(15)
raise TimeoutError('No completed exact-SHA workflow within bounded wait; no delivery claim')
