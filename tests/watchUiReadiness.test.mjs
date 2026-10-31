import test from 'node:test';
import assert from 'node:assert/strict';
import {loader} from './loadSource.mjs';
const info={windowWidth:412,windowHeight:484,screenShape:'rect'};

test('a repeated window query never leaves a failed or invalid query looking ready',()=>{
 const calls=[];const ui=loader({device:{getInfo(p){calls.push(p);}}})('common/watchUi.js');
 const page={ready:true,layoutError:'old',$refs:{},dead:false};
 ui.init(page,'week');assert.equal(page.ready,false);assert.notEqual(page.layoutError,'old');
 calls[0].success(info);assert.equal(page.ready,true);
 ui.init(page,'week');assert.equal(page.ready,false);calls[1].fail();assert.equal(page.ready,false);
 ui.init(page,'week');calls[2].success({windowWidth:0,windowHeight:0});assert.equal(page.ready,false);
 assert.ok(page.layoutError);if(page._focusTimer)clearTimeout(page._focusTimer);
});

test('crown focus waits for layout and list mounting and cannot fire after hiding',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const calls=[];const focus=[];const load=loader({device:{getInfo(p){calls.push(p);}}});
 const ui=load('common/watchUi.js'),crownFocus=load('common/crownFocus.js');
 const page={ready:false,layoutError:'',$refs:{},dead:false};
 ui.init(page,'week',crownFocus);t.mock.timers.tick(64);assert.equal(focus.length,0);
 calls[0].success(info);
 page.$refs.courseList={rotation(p){focus.push(p.focus);}};
 t.mock.timers.tick(64);assert.deepEqual(focus,[true]);
 assert.equal(typeof crownFocus,'function');crownFocus(page);page.dead=true;page._uiGen++;
 t.mock.timers.tick(64);assert.deepEqual(focus,[true]);
});
