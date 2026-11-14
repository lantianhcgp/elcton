# WE handshake source repair — host-only TDD handoff

Workspace: `/data/data/com.termux/files/home/we-handshake-repair-20261115-watch`
Baseline: `83d58a8f931848bdf65bb923e5579ff7285a0714`.

## Outcomes

- Native `fail(d,c)` always returns business `SEND_206`; native success alone returns `null` and emits `SEND_OK {code:207}`. This follows the acquired official JS wrapper; neither native second argument 0 nor a send success is proof of peer receipt.
- `wearTrace` sends fixed stages to guarded `$app.$def || $app` `_elctonLog`. It permits only own scalar metadata, integer numbers ±999999999 or nonempty ≤9-character ASCII numeric strings (optional leading minus), type codes and bounded string lengths. Native objects only expose an own **data descriptor** numeric `.code`. No native message/toString/toJSON/stringify/payload/package/fingerprint/key logging.
- Numeric versions with 1–4 nonempty segments, ≤40 characters, use the last segment. All-segment ASCII digit checks, integer/finite value and minimum 302 remain. Bus policy unchanged: ≥401 native; 302–400 FeatureAbility; missing version API remains direct-native compatibility and `isNegotiated() === false`.
- Registered receiver failure is terminal for that subscription generation, notifies its subscriber once, disables delivery/send and ignores duplicate/stale registration and pending-send callbacks. A send failure does **not** stop the receiver.
- Configuration milestones (SDK service / VER / PKG / CERT / REG) no longer rotate out after six later events. One short latest READY/failure event stays bounded. The page preserves that summary when showing bounded failed-reply errors and HELLO preparation errors, including synchronous native send callbacks.
- `READY_PREPARE`, `READY_PREPARED`, `READY_PREPARE_FAIL` are distinct from protocol-valid inbound `HELLO_RECV`. The local synthetic proactive HELLO does not emit `HELLO_RECV`. Response error strings are not logged.
- Existing awake onShow/back/legacy/hide/destroy wiring kept byte-for-byte for all added awake lines; no protocol, schedule storage, identity or bus policy refactor.

## TDD receipts

| Receipt | Tests | Pass | Fail | Exit |
|---|---:|---:|---:|---:|
| `native-contract-red.log` (before any product edit) | 43 | 3 | 40 | 1 |
| `native-contract-green-attempt1.log` | 43 | 43 | 0 | 0 |
| `preparation-summary-red.log` (two additional failures before their fix) | 2 | 0 | 2 | 1 |
| `native-contract-green-final.log` | 45 | 45 | 0 | 0 |
| `baseline-251-regression.log` (every original tracked test file) | 251 | 251 | 0 | 0 |

Initial full shared-suite run: `full-suite-attempt1.log`, 338/342, four failures entirely in parent-owned `weDeliveryPipeline.test.mjs` while its gate/workflow/ignore/public-config lane was being written. Later `full-suite-final.log`: 343/344, one remaining parent-owned workflow-branch assertion. Latest `full-suite-handoff.log`: 344/355, the prior pipeline cases pass; 11 failures are newly added parent `weBundleGate.test.mjs` invoking missing `scripts/verify_we_logger_bundle.py` before its implementation landed. All actual outputs and exits are preserved with `.meta.json`; parent will rerun the completed shared suite. Product acceptance remains 45/45 new and 251/251 original; no whole shared-suite GREEN claim.

All RED failures are assertion failures in loaded actual product source, not loader failures. Original 33 tracked test files and frozen `qa/p2p-ready-20261114/final_gate.py` are byte-equal to baseline. Read-only identity byte comparison also passes.

## Owned files

- Modified `entry/src/main/js/MainAbility/common/wearService.js` (7798 bytes)
- Modified `entry/src/main/js/MainAbility/common/wearChannel.js` (5844 bytes)
- Added `entry/src/main/js/MainAbility/common/wearTrace.js` (3065 bytes)
- Diagnostic-only increments in `entry/src/main/js/MainAbility/pages/phone-sync/phone-sync.js` (13804 bytes including prior awake worker changes)
- Added `tests/weNativeContract.test.mjs` (45 host tests)
- Added receipts/audit script/report only under this `handshake/` directory.

Exact source SHA-256 values and syntactic/read-only guards: `source-audit-verified.json`, produced by actual `python qa/we-handshake-20261115/handshake/source-audit.py` (exit 0). This supersedes the initial coarse `source-audit.json` for syntax/projection scanning. `product-source.diff` includes the baseline-to-current page's earlier awake changes; those are not attributed to this worker.

## Remaining boundaries

- **Real device handshake root cause remains unknown/unclosed.** No target-firmware native implementation, original device fail arguments, or actual HELLO → READY delivery was obtained here. This is a callback-contract/observability/receive-safety candidate, not proof of Bluetooth/firmware repair.
- No SDK build, compiled-page budget, HAP/signing, on-device heap, install, browser, phone operation, commit, push or CI was performed by this worker. Parent owns pipeline/config/version changes and ensuing actual-artifact verification.
- `source-audit.py` uses host Python and syntax checking only. The harness timers/native/file APIs are declared adapters, not device evidence. The public logger configuration/disabled test stub belongs to parent; this worker never rewrites it to manufacture green assertions.
- One audit shell attempt failed due quoting (exit 2); replacement on-disk audit script executed successfully. All test receipts retained; no old evidence removed.
