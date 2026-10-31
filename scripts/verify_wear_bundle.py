#!/usr/bin/env python3
"""Reject Lite artifacts with external CommonJS requires or missing integration markers."""
import io, json, re, sys, zipfile
from pathlib import Path

app = Path(sys.argv[1])
with zipfile.ZipFile(app) as outer:
    inner = next(n for n in outer.namelist() if n.endswith('.hap'))
    with zipfile.ZipFile(io.BytesIO(outer.read(inner))) as hap:
        config = json.loads(hap.read('config.json'))
        files = {n: hap.read(n).decode('utf8') for n in hap.namelist() if n.endswith('.js')}
        broken = [n for n, text in files.items() if re.search(r'(?<![\w$])require\s*\(', text)]
        assert not broken, 'EXTERNAL_REQUIRE_IN_ARTIFACT: ' + ', '.join(broken)
        prefix = 'assets/js/MainAbility/'
        assert 'VERIFY_INCOMING' in files[prefix+'pages/phone-sync/phone-sync.js'], 'Missing receive code'
        assert all(marker in files[prefix+'pages/week/week.js'] for marker in ['CORRUPT_JOURNAL','internal://app/we-','record-','CONFLICT','COMMIT_UNKNOWN']), 'Missing current transactional-store dependency'
        oversized = {n: len(text.encode('utf8')) for n, text in files.items() if '/pages/' in n and len(text.encode('utf8')) >= 49152}
        assert not oversized, 'LITE_PAGE_BUDGET_EXCEEDED: ' + json.dumps(oversized)
        expected = json.loads(Path('entry/src/main/config.json').read_text())['app']['version']
        assert config['app']['version'] == expected, 'Unexpected source/package version'
        print(json.dumps({'app':app.name,'js_files':len(files),'external_requires':0,'largest_page_bytes':max(len(text.encode('utf8')) for n,text in files.items() if '/pages/' in n),'version':config['app']['version'],'passed':True}))
