# FIT3 Wear Engine install 34 investigation

Branch: `fix/wearengine-install34-20261113`, based on `9517f345e8d0e0995708b0a5d0b37b4cae8689ac`. Mainline and the other active product tracks are unchanged. No device actions are automated.

## Exact evidence inputs

- Failed timerfix HAP: SHA-256 `e61ea7189ce342bdefc905d15c131d6c5ce8cbf0b8169f26a5dfb98441ca4b1d`; CI https://github.com/lantianhcgp/elcton/actions/runs/43375036523 . Version 1.1.13 / 1000116.
- Probe 1.1.12 is a source baseline ONLY. Delivery records explicitly say physical install had not been performed; it is not a successful installation control.
- Successful historical course HAP: SHA-256 `16376f777f46333d7920cc20a27f9bd2301321de5503b1aee89bcbf44efe1df0`, MD5 `653f9dafa23909e43b37cfb8f16ff7e6`; CI https://github.com/lantianhcgp/elcton/actions/runs/38066700492 . Local archived bytes match the contemporaneous delivery MD5; the user confirmed success immediately following that delivery. No personal transcript is published.
- Exact shared p7b hash: `29675fba03bc5be63ba4072c4ab0daec58090c9df3447496b52892c6dd0c764e`. Identity `watchapp.nexus.0zzip`. No substitute profile is allowed.

## Investigation state

1. Failing phone copy/source/checklist SHA-256 match was supplied and confirmed before this investigation.
2. Actual signed.bin comparison: magic 0xBE, same exact p7b and CMS certificate set, same API/device config, both manifests/actual pages and resource order. Timerfix differs from probe in version fields, phone-sync JS (+106 B) and its generated map; 23 other records are unchanged.
3. Both full build logs contain no failed snapshot conversion. Debug packaging plus format-only compaction is deliberate; missing .bc is not a cause by itself.

Candidate: regexp-test expressions added to the Wear Engine path. This is supported by byte/AST differences and a separate historical install lane, but is NOT a proven cause for this exact failure. Test exact SDK controls first. In particular keep successfully installed legacy JS in the parse matrix: a host parser can reject valid device inputs, and must not be promoted to an installation oracle.

`diagnose_sdk.py` downloads only the exact historical and failing CI artifacts, verifies their HAP hashes, locates the CLT 6.1.1.280 ace-loader `jerry` binary, records its SHA and help, and runs parse-only positive/negative/dead-code/real-page controls. No source rewrite, profile replacement or signing is performed in this diagnostic CI.

Machine evidence under `evidence/` contains public code/config/certificate hashes and sanitized summaries, not credentials, raw profiles or hardware identifiers. Any eventual candidate must be rebuilt in CI with the existing elcton identity, exact payload readback and semantic regression checks; installation remains a user-executed gate.
