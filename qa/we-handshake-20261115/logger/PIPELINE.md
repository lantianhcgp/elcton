# Reusable public-build → local write-only configuration

## Before tests (fresh checkout)

```bash
python scripts/prepare_we_logger.py /absolute/project --mode disabled
node --test tests/weLogger.test.mjs
```

The generated config is exactly `{endpoint,key,app:'elcton',ver:<actual entry/src/main/config.json app.version.name>}`. Disabled has empty `key`; no native fetch is called by the original `tests/loadSource.mjs` seam. Generated module/config remain ignored through local Git info/exclude; production `.gitignore` is not edited by this subtask. Never force-add them.

## Public CI build, before Huawei SDK tasks

```bash
python scripts/prepare_we_logger.py /absolute/fresh-checkout --mode public-build
# Existing SDK build + compact_lite_app.mjs is parent-owned, unchanged here.
```

Public placeholder only, no actual endpoint/write-key/read-key/private key in CI. The nonempty public key enables logger serialization for tests but has no authorized cloud destination. Vendor canonical 2921 B → strict local adapter 3018 B. Requires actual compiler APP inspection; .bc and gzip payloads are blockers, not removable artifacts.

Every differing existing generated config or module refuses before writes. Repeating identical mode/version output is idempotent. Do not delete/overwrite old stub/config for mode or source-version changes. Parent may preserve a credential-free old generated file with an explicit safe rename before regenerating. Private existing configuration must instead be preserved under private storage; never copy it into this QA directory.

## Downloaded APP → local configuration (before signing)

```bash
python scripts/configure_we_logger_app.py /absolute/downloaded-public.app /absolute/new-local-configured.app \
  --runtime-config /data/data/com.termux/files/home/.hermes/secrets/watch_logger.json \
  --report /absolute/new-sanitized-report.json
```

Input APP/runtime remain byte-identical. Existing output/report, symlinks, duplicate names, CRC/unsafe paths, ANY .bc/JRRY/gzip entry, ambiguous HAP, missing/colliding public placeholders and malformed actual app map all refuse. The script checks package safety before opening runtime config, selects only endpoint/write_key (never the read side), escapes actual JS string literals, and updates only actual app.js/map sourcesContent. Plain app.js with no map is supported; an existing malformed map is not ignored. Source-map position mappings remain inherited; source text matches runtime, but length changes are not a newly generated debug map.

Local configured output is exclusive mode0600. Safe stdout/report contains booleans/hashes/paths only. Real write key is extractable in the configured APP/local HAP: never git, CI artifact or public release. Signing, exact artifact/negative integrity gates, SDK budget/native execution and cloud/FIT3 smoke remain parent-owned.

## Application stage API

```js
var a = $app.$def || $app;
a._elctonLog('SDK_UNVERSIONED', { code: 206, arg1: 210301031, type1: 3, len1: 0, service: 303 });
var status = a._elctonLogStatus();
```

Caller should isolate access/call in try/catch. Stage is uppercase ASCII A–Z/digit/underscore, 1–29 chars (`WE/` tag ≤32 B). Free strings/payload/identity/key/native error text and getters are not emitted. Own boolean/integer metadata order `ok,code,count,bytes,attempt,ms` is preserved; additional `arg1,arg2,type1,type2,len1,len2,service,v0,v1,v2,v3` accept only integers or strict ASCII optional-minus numeric strings ≤9 chars. Output ≤160 ASCII chars. Status is detached numeric queue counters only, null on faults. Fixed `console.info('WE SDK_UNVERSIONED')` is captured by canonical console wrapping, while forwarding original console.

Boundary: logger helper success only means a safe call was accepted, not ACK/network availability. Disabled seq=0; configured `L.page('MainAbility')` → seq1/pending1/owned timer. `stop()` onDestroy finally drops unsent rows. Native fetch cancellation and concurrency with unrelated business fetch remain device boundaries.
