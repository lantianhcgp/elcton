#!/usr/bin/env python3
"""Configure a downloaded public APP locally, write-only and provenance checked.

Only actual MainAbility/app.js and its present source map may change. Any .bc,
JRRY or gzip payload refuses BEFORE opening runtime config. Source and runtime
are read-only; output is exclusive mode0600 and must never be published.
"""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import zipfile

APP_JS = 'assets/js/MainAbility/app.js'
APP_MAP = APP_JS + '.map'
ENDPOINT = 'https://example.invalid/ELCTON_WE_LOG_ENDPOINT_PLACEHOLDER_20261115'
WRITE_KEY = 'ELCTON_WE_WRITE_KEY_PLACEHOLDER_20261115'


class GateError(ValueError):
    pass


def safe(path):
    path = Path(os.path.abspath(path.expanduser()))
    if any(p.is_symlink() for p in (path, *path.parents)):
        raise GateError('Symlink path refused')
    return path


def unpack(data):
    if data[:2] == b'\x1f\x8b':
        raise GateError('Gzip refused')
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        names = z.namelist()
        if len(names) != len(set(names)):
            raise GateError('Duplicate ZIP paths')
        if any(n.startswith('/') or '..' in n.split('/') or '\\' in n for n in names):
            raise GateError('Unsafe ZIP path refused')
        if z.testzip() is not None:
            raise GateError('ZIP CRC refused')
        files = {n:z.read(n) for n in names}
        for name, value in files.items():
            if name.lower().endswith('.bc') or value[:4] == b'JRRY':
                raise GateError('Bytecode refused')
            if name.lower().endswith(('.gz', '.gzip')) or value[:2] == b'\x1f\x8b':
                raise GateError('Gzip refused')
        return files


def repack(data, replacements):
    out = io.BytesIO()
    with zipfile.ZipFile(io.BytesIO(data)) as src, zipfile.ZipFile(out, 'w') as dst:
        dst.comment = src.comment
        for info in src.infolist():
            dst.writestr(info, replacements.get(info.filename, src.read(info)))
    return out.getvalue()


def quoted(value, quote):
    # JSON escaping is also valid for single-quoted JS after escaping apostrophes.
    escaped = json.dumps(value, ensure_ascii=True)[1:-1]
    if quote == "'":
        escaped = escaped.replace("'", "\\'")
    return quote + escaped + quote


def patch_literals(text, endpoint, write_key, expected=1):
    for old, value in ((ENDPOINT, endpoint), (WRITE_KEY, write_key)):
        pattern = r'([\'"])' + re.escape(old) + r'\1'
        hits = list(re.finditer(pattern, text))
        if len(hits) != expected:
            raise GateError('Compiled public placeholders refused')
        text = re.sub(pattern, lambda m:quoted(value, m.group(1)), text)
    return text


def patch_map(data, endpoint, write_key):
    try:
        m = json.loads(data)
        sources = m['sourcesContent']
        if m.get('version') != 3 or m.get('file') != 'app.js' or not isinstance(sources, list):
            raise GateError('Actual source map refused')
        endpoint_count = sum(s.count(ENDPOINT) for s in sources if isinstance(s, str))
        key_count = sum(s.count(WRITE_KEY) for s in sources if isinstance(s, str))
        if not endpoint_count or endpoint_count != key_count:
            raise GateError('Actual source map refused')
        updated = []
        for s in sources:
            if not isinstance(s, str):
                updated.append(s)
                continue
            count = s.count(ENDPOINT)
            if count != s.count(WRITE_KEY):
                raise GateError('Actual source map refused')
            updated.append(patch_literals(s, endpoint, write_key, count) if count else s)
        m['sourcesContent'] = updated
        return json.dumps(m, ensure_ascii=True, separators=(',', ':')).encode('ascii')
    except (KeyError, TypeError, ValueError, AttributeError):
        raise GateError('Actual source map refused') from None


def configure(source, output, runtime_path, report_path=None):
    source, output = safe(source), safe(output)
    if output.exists() or source == output:
        raise GateError('Existing output refused')
    if report_path:
        report_path = safe(report_path)
        if report_path.exists() or report_path in (source, output, safe(runtime_path)):
            raise GateError('Existing or conflicting report refused')
    data = source.read_bytes()
    outer = unpack(data)
    haps = [n for n in outer if n.endswith('.hap')]
    if len(haps) != 1:
        raise GateError('Exactly one compiler HAP required')
    name = haps[0]
    before = unpack(outer[name])
    if APP_JS not in before:
        raise GateError('Actual compiled app missing')
    js = before[APP_JS].decode('utf-8')
    if len(before[APP_JS]) > 49152:
        raise GateError('Whole app JS budget refused')
    # Package shape and placeholder gates occur before any credential read.
    patch_literals(js, ENDPOINT, WRITE_KEY)
    if APP_MAP in before:
        patch_map(before[APP_MAP], ENDPOINT, WRITE_KEY)
    runtime_bytes = safe(runtime_path).read_bytes()
    runtime = json.loads(runtime_bytes)
    # Deliberately select ONLY the write-side fields, never read/read_key/private keys.
    endpoint = runtime.get('endpoint')
    write_key = runtime.get('write_key')
    if (not isinstance(endpoint, str) or not endpoint.startswith('https://')
            or len(endpoint) > 512 or any(ord(c) < 32 for c in endpoint)
            or not isinstance(write_key, str) or not 16 <= len(write_key) <= 256
            or any(ord(c) < 32 for c in write_key)):
        raise GateError('Write-side runtime refused (contents suppressed)')
    replacements = {APP_JS:patch_literals(js, endpoint, write_key).encode('utf-8')}
    if len(replacements[APP_JS]) > 49152:
        raise GateError('Whole configured app JS budget refused')
    check = subprocess.run(['node', '--check'], input=replacements[APP_JS], capture_output=True)
    if check.returncode:
        raise GateError('Configured JS syntax refused (contents suppressed)')
    if APP_MAP in before:
        replacements[APP_MAP] = patch_map(before[APP_MAP], endpoint, write_key)
    inner = repack(outer[name], replacements)
    after = unpack(inner)
    changed = [n for n in before if before[n] != after[n]]
    if APP_JS not in changed or not set(changed) <= {APP_JS, APP_MAP} or set(after) != set(before):
        raise GateError('Provenance refused')
    if any(ENDPOINT.encode() in b or WRITE_KEY.encode() in b for b in after.values()):
        raise GateError('Remaining public placeholder refused')
    if any(re.search(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----', b) for b in after.values()):
        raise GateError('Private-key payload refused')
    result = repack(data, {name:inner})
    verified = unpack(result)
    if any(verified[n] != b for n, b in outer.items() if n != name):
        raise GateError('Outer provenance refused')
    if source.read_bytes() != data or safe(runtime_path).read_bytes() != runtime_bytes:
        raise GateError('Read-only input changed during operation')
    report = {'source':str(source), 'output':str(output), 'source_sha256':hashlib.sha256(data).hexdigest(),
              'configured_sha256':hashlib.sha256(result).hexdigest(), 'changed_paths':changed,
              'all_other_files_identical':True, 'write_only':True, 'bytecode_absent':True, 'gzip_absent':True,
              'configured_file_hashes':{n:hashlib.sha256(after[n]).hexdigest() for n in changed}}
    # All gates pass before creating output/report. Existing files are never replaced.
    output.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, 'O_NOFOLLOW', 0), 0o600)
    with os.fdopen(fd, 'wb') as f:
        f.write(result); f.flush(); os.fsync(f.fileno())
    # Verify actual persisted artifact; a successful write alone is not provenance.
    if output.read_bytes() != result:
        raise GateError('Persisted configured artifact mismatch')
    if report_path:
        report_path.parent.mkdir(parents=True, exist_ok=True)
        fd = os.open(report_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, 'O_NOFOLLOW', 0), 0o600)
        with os.fdopen(fd, 'w') as f:
            json.dump(report, f, indent=2); f.write('\n')
    return report


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('source', type=Path)
    p.add_argument('output', type=Path)
    p.add_argument('--runtime-config', type=Path, required=True)
    p.add_argument('--report', type=Path)
    a = p.parse_args()
    try:
        print(json.dumps(configure(a.source, a.output, a.runtime_config, a.report)))
    except GateError as e:
        raise SystemExit('FAIL: ' + str(e)) from None
    except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile, subprocess.SubprocessError):
        raise SystemExit('FAIL: local config/provenance gate (credential details suppressed)') from None


if __name__ == '__main__':
    main()
