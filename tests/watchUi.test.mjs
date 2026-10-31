import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loader,fakeFile} from './loadSource.mjs';

test('the pickup keyboard keeps its original saved-code and missing-digit messages',async()=>{
 for(const saved of ['', '123456']){
  const file=fakeFile(saved?{'internal://app/sync.code.txt':saved}:{});
  let queries=0;
  const spec=loader({file:file.api,router:{replace(){}},device:{getInfo(){queries++;}}})('pages/code/code.js');
  const page={...spec,...spec.data};delete page.data;
  page.onInit();await new Promise(r=>setImmediate(r));
  assert.equal(queries,0,'Phone sync must not replace the original keyboard layout');
  assert.equal(page.hint,saved?'已填入之前保存的取件码，可直接改':'在网页上建好课表，把 6 位取件码输在这里');
  page.value='';page.onOk();assert.equal(page.hint,'取件码是 6 位数字，还差 6 位');
  page.onKey(0);assert.equal(page.digits,'1 · · · · ·');assert.equal(page.hint,'还差 5 位');
  page.onDestroy();
 }
});
test('the original cross-page metric override is absent from the delivered source',()=>{
 assert.equal(fs.existsSync(new URL('../entry/src/main/js/MainAbility/common/watchUi.js',import.meta.url)),false);
});
