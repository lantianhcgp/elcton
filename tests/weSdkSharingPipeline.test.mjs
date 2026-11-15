import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Additive build-step assertion only: frozen gates and old test files stay unchanged.
test('actual SDK package shares the compat factory before receive compaction and unchanged verification',()=>{
  const y=fs.readFileSync(new URL('../.github/workflows/wearengine.yml',import.meta.url),'utf8');
  const step='node scripts/share_we_compat_app.mjs build/outputs/default/*.app';
  assert.equal(y.split(step).length-1,1);
  for(const next of ['node scripts/compact_p2p_page.mjs','python3 scripts/verify_wear_bundle.py','python3 scripts/verify_we_logger_bundle.py'])assert.ok(y.indexOf(step)<y.indexOf(next));
  assert.ok(y.indexOf('node scripts/compact_lite_app.mjs')<y.indexOf(step));
  assert.ok(y.includes('python3 qa/we-handshake-20261115/final_gate.py dist/*.app dist/elcton-wearengine-probe.hap dist/we-handshake-final-gate.json "$HOS_SDK_HOME/default/openharmony/js/build-tools/ace-loader/bin/jerry"'));
  assert.ok(y.includes('if: ${{ failure() }}'));
});
