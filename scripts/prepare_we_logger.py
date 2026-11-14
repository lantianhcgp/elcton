#!/usr/bin/env python3
"""Generate ignored, pinned WE logger and explicit public-only runtime config.

No credentials, environment secrets or network are read. Same output is
idempotent; every differing existing generated file refuses all source writes.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
sys.dont_write_bytecode = True
from we_logger_timer_compat import adapt

ROOT = Path(__file__).resolve().parents[1]
CANONICAL = ROOT / 'vendor/we-logger/watch/logsink.js'
CANONICAL_SHA = '6810b5f9ff34fe4dd6cf4655f75a89172c248dd01bb40ade94937e567cefbe77'
ENDPOINT = 'https://example.invalid/ELCTON_WE_LOG_ENDPOINT_PLACEHOLDER_20261115'
WRITE_KEY = 'ELCTON_WE_WRITE_KEY_PLACEHOLDER_20261115'


def safe(path):
    path = Path(os.path.abspath(path))
    for p in (path, *path.parents):
        if p.is_symlink():
            raise ValueError('Symlink path refused')
    return path


def local_ignore(project):
    """Ignore generated copies in local Git metadata, not another product file."""
    r = subprocess.run(['git', '-C', str(project), 'rev-parse', '--show-toplevel'], capture_output=True, text=True)
    if r.returncode or Path(r.stdout.strip()) != project:
        return False
    paths = ['entry/src/main/js/MainAbility/common/logsink.js', 'entry/src/main/js/MainAbility/common/log-config.js']
    for name in paths:
        tracked = subprocess.run(['git', '-C', str(project), 'ls-files', '--error-unmatch', '--', name], capture_output=True)
        if tracked.returncode == 0:
            raise ValueError('Generated logger/config is tracked; explicit untrack required')
    gitpath = subprocess.check_output(['git', '-C', str(project), 'rev-parse', '--git-path', 'info/exclude'], text=True).strip()
    exclude = safe(project / gitpath if not Path(gitpath).is_absolute() else Path(gitpath))
    rules = ['**/common/logsink.js', '**/log-config.js']
    original = exclude.read_text() if exclude.exists() else ''
    missing = [r for r in rules if r not in original.splitlines()]
    if missing:
        exclude.parent.mkdir(parents=True, exist_ok=True)
        with exclude.open('a') as f:
            f.write(('\n' if original and not original.endswith('\n') else '') + '\n# Local generated WE logger copies (never force-add)\n' + '\n'.join(missing) + '\n')
    checked = subprocess.run(['git', '-C', str(project), 'check-ignore', '--', *paths], capture_output=True)
    if checked.returncode or set(checked.stdout.decode().splitlines()) != set(paths):
        raise ValueError('Generated copies not ignored; inspect local Git rules')
    return True


def prepare(project, mode):
    project = safe(project)
    dst = safe(project / 'entry/src/main/js/MainAbility/common')
    config = json.loads(safe(project / 'entry/src/main/config.json').read_text())
    ver = config['app']['version']['name']
    if not isinstance(ver, str) or not ver or len(ver.encode()) > 24:
        raise ValueError('Invalid actual source version')
    canonical = safe(CANONICAL).read_bytes()
    if len(canonical) != 2921 or hashlib.sha256(canonical).hexdigest() != CANONICAL_SHA:
        raise ValueError('Pinned canonical logger drift')
    data = adapt(canonical)
    runtime = {'endpoint': ENDPOINT, 'key': WRITE_KEY if mode == 'public-build' else '', 'app': 'elcton', 'ver': ver}
    cfg = ('// Generated public-only WE logger config; never commit runtime values.\n'
           + 'export default ' + json.dumps(runtime, ensure_ascii=True, separators=(',', ':')) + ';\n').encode('ascii')
    targets = [(safe(dst / 'logsink.js'), data, 0o644), (safe(dst / 'log-config.js'), cfg, 0o600)]
    # Validate every existing output BEFORE touching logger, config or local ignore.
    for path, desired, _ in targets:
        if path.exists() and path.read_bytes() != desired:
            raise ValueError('Existing configuration differs' if path.name == 'log-config.js' else 'Existing logger differs')
    for path, desired, _ in targets:
        check = subprocess.run(['node', '--input-type=module', '--check'], input=desired, capture_output=True)
        if check.returncode:
            raise ValueError('Generated syntax gate failed (contents suppressed)')
    ignored = local_ignore(project)
    dst.mkdir(parents=True, exist_ok=True)
    changed = []
    for path, desired, mode_bits in targets:
        if path.exists():
            continue
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, 'O_NOFOLLOW', 0), mode_bits)
        with os.fdopen(fd, 'wb') as f:
            f.write(desired); f.flush(); os.fsync(f.fileno())
        changed.append(str(path))
    return {'project':str(project), 'public_only':True, 'write_enabled':mode == 'public-build',
            'ignored':ignored, 'changed_paths':changed, 'canonical_sha256':CANONICAL_SHA,
            'generated_sha256':hashlib.sha256(data).hexdigest(), 'generated_path':str(targets[0][0]),
            'configuration_path':str(targets[1][0]), 'no_changes':not changed}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('project', type=Path)
    p.add_argument('--mode', choices=['disabled', 'public-build'], required=True)
    a = p.parse_args()
    try:
        print(json.dumps(prepare(a.project, a.mode)))
    except (ValueError, OSError, KeyError, TypeError, subprocess.SubprocessError) as error:
        # Fixed gate messages never include config values or native diagnostics.
        message = str(error) if isinstance(error, ValueError) else 'Prepare gate failed (contents suppressed)'
        raise SystemExit('FAIL: ' + message)


if __name__ == '__main__':
    main()
