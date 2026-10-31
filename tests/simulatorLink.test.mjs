import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function link(){return vm.runInNewContext(fs.readFileSync('../elcton-sim-qa/js/runtime/deviceFeature_phoneLink.js','utf8')+'\nDeviceFeaturePhoneLink;',{console:{log(){}},Date});}
test('hmlwsim does not replay already delivered input after resubscribing',()=>{
 const l=link();const messages=[];l.subscribeMessages(m=>messages.push(m));l.receiveFromPhone('new');
 assert.equal(messages.length,1);l.unsubscribeMessages();assert.equal(l.subscribeMessages(()=>{}).length,0);
});
test('hmlwsim outgoing messages cannot reenter the watch inbox',()=>{
 const l=link();const messages=[];l.subscribeMessages(m=>messages.push(m));l.sendToPhone('reply');
 assert.equal(messages.length,0);l.unsubscribeMessages();assert.equal(l.subscribeMessages(()=>{}).length,0);
});
