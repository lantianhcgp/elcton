import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public failure evidence retains the exact SDK APP before the new sharing transform',()=>{
  const y=fs.readFileSync(new URL('../.github/workflows/wearengine.yml',import.meta.url),'utf8');
  const build=y.slice(y.indexOf('- name: Build actual Lite package'),y.indexOf('- name: Sign and verify'));
  const compact=build.indexOf('node scripts/compact_lite_app.mjs');
  const preserve=build.indexOf('cp build/outputs/default/*.app build/qa-pre-share/actual-pre-share.app');
  const share=build.indexOf('node scripts/share_we_compat_app.mjs');
  assert.ok(compact>=0 && preserve>compact && share>preserve);
  const failed=y.slice(y.indexOf('- name: Upload public failure evidence only'),y.indexOf('- uses: actions/upload-artifact@v4',y.indexOf('- name: Upload public failure evidence only')+50));
  assert.match(failed,/failure\(\)/);
  assert.match(failed,/build\/qa-pre-share\/\*\.app/);
  assert.match(failed,/build\/qa-pre-share\/source-sha\.txt/);
  assert.doesNotMatch(failed,/dist\/\*\.hap|sdk-exact|PRIVATE/);
});
