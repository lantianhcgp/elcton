import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import JSZip from '../tools/sign/node_modules/jszip/lib/index.js';

// Explicitly synthetic validation fixtures: never delivered or used as device evidence.
const root=fs.mkdtempSync(path.join(os.tmpdir(),'elcton-verifier-fixture-'));
const version=JSON.parse(fs.readFileSync('entry/src/main/config.json','utf8')).app.version;
const journal=fs.readFileSync('entry/src/main/js/MainAbility/common/wearJournal.js','utf8');
async function fixture(name,week,receive='var x="VERIFY_INCOMING";') {
 const hap=new JSZip();hap.file('config.json',JSON.stringify({app:{version}}));
 hap.file('assets/js/MainAbility/pages/week/week.js',week);
 hap.file('assets/js/MainAbility/pages/phone-sync/phone-sync.js',receive);
 const outer=new JSZip();outer.file('entry-default.hap',await hap.generateAsync({type:'nodebuffer'}));
 const p=path.join(root,name+'.app');fs.writeFileSync(p,await outer.generateAsync({type:'nodebuffer'}));
 return spawnSync('python',['scripts/verify_wear_bundle.py',p],{encoding:'utf8'});
}
test('bundle verifier recognizes the actual journal with separately constructed URI parts',async()=>{
 assert.ok(journal.includes("'internal://app/we-'"));assert.ok(journal.includes("'record-'"));
 assert.equal(journal.includes('we-record-'),false);
 const result=await fixture('current-journal',journal);assert.equal(result.status,0,result.stdout+result.stderr);
});
test('bundle verifier rejects missing transactional journal despite a receive marker',async()=>{
 const result=await fixture('missing-journal','var placeholder=1;');assert.notEqual(result.status,0);
 assert.match(result.stderr,/transactional-store/);
});
test('bundle verifier still blocks oversized pages and external require',async()=>{
 const tooLarge=await fixture('oversized',journal+'\n'+' '.repeat(49152));assert.notEqual(tooLarge.status,0);assert.match(tooLarge.stderr,/LITE_PAGE_BUDGET_EXCEEDED/);
 const external=await fixture('external',journal+'\nrequire("outside");');assert.notEqual(external.status,0);assert.match(external.stderr,/EXTERNAL_REQUIRE/);
});
test.after(()=>fs.rmSync(root,{recursive:true,force:true}));
