import test from 'node:test';
import assert from 'node:assert/strict';
import {loader} from './loadSource.mjs';

// Original pages keep their own layout: focus depends on the mounted list,
// never on a window query or dimensions introduced by the sync feature.
test('crown focus waits for the original list to mount without a new layout field',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const focus=[];const apply=loader()('common/crownFocus.js');
 const page={$refs:{},dead:false,_uiGen:1};
 apply(page);t.mock.timers.tick(32);assert.deepEqual(focus,[]);
 page.$refs.courseList={rotation(p){focus.push(p.focus);}};
 t.mock.timers.tick(32);assert.deepEqual(focus,[true]);
 assert.equal(page._focusTimer,null);
});
test('focus retries are bounded when the original list does not exist',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const apply=loader()('common/crownFocus.js'),page={$refs:{},dead:false,_uiGen:1};
 apply(page);
 for(let attempt=0;attempt<3;attempt++)t.mock.timers.tick(32);
 assert.equal(page._focusTimer,null);
 t.mock.timers.tick(1000);assert.equal(page._focusTimer,null);
});
test('a hidden or superseded original page cannot gain crown focus',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const focus=[];const apply=loader()('common/crownFocus.js');
 const page={$refs:{courseList:{rotation(){focus.push(true);}}},dead:false,_uiGen:1};
 apply(page);page.dead=true;t.mock.timers.tick(64);assert.deepEqual(focus,[]);
 page.dead=false;apply(page);page._uiGen++;t.mock.timers.tick(64);assert.deepEqual(focus,[]);
});
