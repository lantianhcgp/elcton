#!/usr/bin/env python3
"""Offline, read-only verification of this research delivery; no ADB or network."""
import hashlib
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent

def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    manifest = json.loads((BASE / 'delivery-manifest.json').read_bytes())
    assert manifest['manifest_self_excluded'] is True
    expected = {x['path']: x for x in manifest['files']}
    actual = {str(p.relative_to(BASE)) for p in BASE.rglob('*') if p.is_file() and p.name != 'delivery-manifest.json' and '__pycache__' not in p.parts}
    assert set(expected) == actual, 'Delivery file set mismatch'
    for name, row in expected.items():
        p = BASE / name
        assert p.stat().st_size == row['bytes'], name
        assert digest(p) == row['sha256'], name
    metas = [json.loads(p.read_bytes()) for p in (BASE / 'official').glob('*.meta.json')]
    ok = [m for m in metas if m['status'] == 'success']
    for m in ok:
        raw = BASE / 'official' / Path(m['raw_file']).name
        body = BASE / 'official' / Path(m['body_file']).name
        assert digest(raw) == m['raw_sha256'], m['id']
        assert raw.stat().st_size == m['response_bytes'], m['id']
        assert digest(body) == m['body_sha256'], m['id']
        assert m['text_body_complete'] and m['article_text_validated'], m['id']
        if 'api_code' in m:
            d = json.loads(raw.read_bytes())
            assert d['code'] == 0 and d['value']['title'] == m['expected_title'], m['id']
            assert d['value']['content']['content'].encode('utf-8') == body.read_bytes(), m['id']
    issue = json.loads((BASE / 'community/gitee-issue-api.raw').read_bytes())
    comments = json.loads((BASE / 'community/gitee-comments-api.raw').read_bytes())
    page2 = json.loads((BASE / 'community/gitee-comments-page2.raw').read_bytes())
    assert issue['comments'] == len(comments) == 4 and page2 == []
    runtime = json.loads((BASE / 'runtime/现场只读核查.json').read_bytes())
    assert runtime['hms_family_package_matches'] == []
    assert runtime['actual_exception_error_code'] is None and runtime['actual_failure_phase'] is None
    assert runtime['raw_capture_hashes_verified']
    assert not any(runtime['on_device_actions'].values())
    report = (BASE / 'HMS根因排查.md').read_text(encoding='utf-8')
    assert '本次根因未定' in report or '根因仍未定' in report or '仍未定' in report
    assert 'version-change-history-0000001086350238' in report
    assert 'hms_core_minimum' not in report, 'No schema placeholder expected in report'
    print(json.dumps({'verified': True, 'delivery_files': len(expected), 'manifest_excluded': True, 'official_success': len(ok), 'official_unusable': len(metas) - len(ok), 'gitee_comments_verified': len(comments), 'numeric_error_code_known': False, 'on_device_mutations': False}, ensure_ascii=False))

if __name__ == '__main__':
    main()
