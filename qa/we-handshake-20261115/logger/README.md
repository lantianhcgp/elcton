# WE app logger — scoped TDD evidence

Authorized seams: actual `MainAbility/app.js` lifecycle, `_elctonLog` / `_elctonLogStatus`, pinned logger public API and owned timers, prepare CLI, local compiled APP configure CLI. No business/page/SDK source is modified here. The parent owns WE stage calls and actual SDK/cloud smoke.

The upstream integration CLI automatically edits `.gitignore`, which is outside this subtask's allowed product files. Its dry-run → integrate → NO CHANGES runs against a byte-identical, credential-free app/config mirror under this directory. Only its app.js lifecycle patch is applied to the real app; prepare generates ignored common copies locally and supplies public-only configuration. This boundary is explicit, not a claimed direct CLI integration of the product tree.

All evidence is append-only. Host callback/timer tests do not establish JerryScript/FIT3/HTTPS acceptance. No secrets are printed or committed.
