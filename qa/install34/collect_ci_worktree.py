#!/usr/bin/env python3
"""Worktree-only collector adapter. Original committed collector stays immutable.
Change only the cache parent: a worktree's .git is a file, not a directory.
"""
import hashlib
from pathlib import Path
from typing import Any
import sys

ROOT = Path(__file__).resolve().parents[2]
original = ROOT / 'qa/install34/collect_ci.py'
text = original.read_text()
assert hashlib.sha256(original.read_bytes()).hexdigest() == '8f4a202314c031bab95bbfebcbeb5b60241d018e8ff71cd61afcba3ed1c24fd0'
old = "cache = ROOT / '.git' / ('install34-ci-' + str(runid))"
new = "cache = ROOT / 'qa/install34/.artifact-cache' / ('install34-ci-' + str(runid))"
assert text.count(old) == 1
adapted = text.replace(old, new)
assert adapted.replace(new, old) == text
# Only a fresh empty cache parent is needed; all immutable child target guards stay.
parent = ROOT / 'qa/install34/.artifact-cache'
parent.mkdir(parents=True, exist_ok=True)
namespace: dict[str, Any] = {'__file__': str(original), '__name__': 'worktree_adapter'}
exec(compile(adapted, str(original), 'exec'), namespace)
if __name__ == '__main__':
    namespace['collect'](*sys.argv[1:3])
