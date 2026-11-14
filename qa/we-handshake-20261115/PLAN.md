# WE handshake repair Implementation Plan

> For Hermes: use subagent-driven-development with spec then quality review.

Goal: repair reproducible watch-side WE adapter defects, add the user's existing logger and page-owned keep-screen-on, deliver a verified same-identity HAP for morning device acceptance.

Architecture: retain schedule/journal/protocol and original five-page design. The app owns versioned WE service and a pinned bounded logger; the receive page owns only its listener, watchdog and keep-screen-on request. Native callback semantics must be supported by the official SDK source, never inferred from a screenshot or an Android error table alone.

Tech stack: existing FA Lite HML/CSS/callback JS, Node tests, existing debug CLT 6.1.1.280 CI, exact elcton profile and signature chain. No Chromium or mobile operations tonight.

## Scope and authorization

The overnight brief explicitly delegates implementation and packaging, chooses the existing logger and Lite brightness API, and forbids touching the phone. No further design question is required. Alternate approaches rejected: bypass WE with a different transport (would not repair the requested handshake), rewrite phone registration (read-only), or redesign UI (unrelated). The minimal existing-adapter approach is selected. Source/official evidence and test records live under this GitHub QA directory; Documents contains only the existing progress file.

## Task 1: evidence before repair

Files: read `common/wearChannel.js`, `common/wearService.js`, `pages/phone-sync/phone-sync.js`, official SDK under `references/source-apps/腕上词典-FIT3`, legacy QA, read-only phone source.

1. Preserve HEAD, original 32 test files + loader and phone source hashes in `evidence/baseline-protection.json`.
2. Run unchanged `node --test --test-reporter=tap tests/p2pReadyContract.test.mjs tests/wearChannel.test.mjs` (Node 26 removed the old experimental-default-type flag; the actual failed invocation is retained).
3. Independently read official/native send/subscribe/version dispatch and identify data vs callback status, service-version and fallback semantics.
4. Independently inspect 10 October source and Android Device capability constants. Never equate HTTPS pickup with WE known-good or infer that capability 0 means unsupported without the exact SDK enum.
5. Write exact evidence, confirmed defects and unverified device hypotheses; do not announce a unique hardware root without watch logs.

## Task 2: handshake RED→GREEN

Files: only necessary WE adapters and additive `tests/weNativeContract.test.mjs`; preserve original tests verbatim.

1. Write contract-derived failing cases and save actual RED output.
2. Minimal callback parsing/registration/transport fix based on that evidence; keep bounded ASCII packets, generations, journal and transaction semantics.
3. Run identical new tests GREEN, then all original tests; no assertion edits.
4. Spec reviewer checks contract/original-test scope; quality reviewer checks ordering, generation races and unavailable modules.

## Task 3: logger (app-owned)

Files: `app.js`, pinned `vendor` module/provenance, generation/configuration scripts, additive `tests/weLogger.test.mjs`, pipeline as needed.

1. Add failing app lifecycle/config/WE-stage/timer-owner tests and retain RED.
2. Dry-run then integrate the canonical logger via its actual integration tool; repeat must say NO CHANGES. Freeze canonical 2921B SHA. Strict count-checked native timer null-sentinel adapter follows the existing validated Liubai compatibility transform; preserve canonical vendor.
3. Keep public CI placeholders only. Local post-download config injects endpoint and WRITE key into inspected actual JS (reject any bytecode first); read key/private key never enter source, CI or HAP.
4. App `$app.$def` owns logging cross-page. All SDK/VER/PKG/CERT/REG/HELLO/READY/SEND stages record fixed bounded metadata, no schedule text/fingerprint/keys. Existing console remains forwarded.
5. Verify generated source and real SDK app lifecycle. Node HTTPS smoke + authenticated pull + collector equality are adapter/cloud tests, NOT watch-origin evidence. No idle persistent poller needed overnight.

## Task 4: synchronous page keep-on

Files: new `common/wearAwake.js`, additive `tests/weScreenOn.test.mjs`, lifecycle wiring in phone-sync.js only; HML/CSS unchanged.

1. RED tests normal, missing API, thrown/fail, hide/back/legacy/destroy/reentry and late callbacks.
2. Guarded `@system.brightness.setKeepScreenOn({keepScreenOn:true})` in onShow; false on every exit. No brightness/mode changes, no claimed getKeepScreenOn (not in the SDK), no interval.
3. GREEN exact tests; original receive/persistence tests remain unchanged. SDK since3/reserved liteWearable; cover-screen/system maximum keep-on period cannot be prevented.

## Task 5: review, CI, packaging

1. Exact original-test and read-only phone hashes must match; all Node and new pipeline tests and compaction gates pass.
2. Spec and quality independent review of current diff; fix legitimate findings and rerun, retain original refusals.
3. Add only exact scoped files and commit on isolated `fix/we-handshake-logger-20261115`; set origin to the authorized elcton repository. Avoid triggering unrelated focus CI; use only wearengine workflow.
4. CI verify original tests, compile fresh actual APP, existing compaction and decoded 49152B per page/app redline, ES5/SDK parse, no external imports/bytecode.
5. Read exact workflow result/head artifact; configure logger locally and re-sign with matching profile/key and full Huawei Root+intermediate chain. Verify profile/header/config/version, exclusive CMS leaf, all nonconfig APP resources, sliced payload digest, chain and real CRC-valid one-byte negative.
6. Read back GitHub evidence/commit bytes. Configured HAP remains local-only because WRITE key is extractable.

## Task 6: delivery and truthful boundaries

1. Only after final gates pass, mv older elcton HAPs to `/storage/emulated/0/haps/旧包归档/` preserving bytes; do not touch non-elcton projects or 表盘.
2. Deliver named actual-date version/sha7 signed HAP, verify exact target and SHA256.
3. Update the existing progress with root/changes/test counts/CI/commit/HAP hash/remaining device boundaries. No completed claim for actual WE until morning.
4. Morning: user installs, watch week→sync→receive (onShow requests keep-on); initiator uses phone MCP devices_list→sync_connect→sync_state→start_publish→readback. On failure pull watch logger plus phone error_tail/diag_read. No watch navigation by agent tonight.
5. At budget deadline preserve accurate CONTINUATION under QA with current gate/blocker and link from progress. Never ship a known-failed gate or reuse an old APP.
