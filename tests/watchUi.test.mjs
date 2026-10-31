import test from 'node:test';
import assert from 'node:assert/strict';
import {loader,fakeFile} from './loadSource.mjs';
test('all watch pages share supplied windows and fit their controls in the safe frame',()=>{
 let ui;try{ui=loader({device:{}})('common/watchUi.js');}catch(e){if(!e.message.includes('ENOENT'))throw e;}
 assert.equal(typeof ui,'object','cross-page adaptive metrics missing');
 for(const [w,h,shape] of [[412,484,'rect'],[390,390,'circle'],[466,466,'circle'],[336,480,'rect'],[280,456,'rect']]){
  for(const page of ['index','week','detail','sync','code']){
   const m=ui.layout({windowWidth:w,windowHeight:h,screenShape:shape},page);
   assert.equal(m.w,w);assert.equal(m.h,h);assert.ok(m.paneW>100);
   assert.ok(m.top+m.headerH+m.bodyH+m.footerH+m.bottom<=h);
   assert.ok(m.buttonW*2+m.gap<=m.paneW);
   assert.ok(m.rowH>35&&m.titleSize>=16&&m.textSize>=13);
   if(shape==='circle')assert.ok(m.paneW<=w*.68);
   if(page==='code')assert.ok(m.keyW*3+m.keyGap*3<=m.paneW&&m.keyH*4+m.keyGapY*4<=m.padH);
   if(w===412&&h===484)assert.ok(h-m.bottom<=410);
  }
 }
 assert.throws(()=>ui.layout({windowWidth:0,windowHeight:0},'week'),/INVALID_WINDOW/);
});

test('pickup-code hints fit one complete line in the smallest supported safe pane',async()=>{
 for(const saved of ['', '123456']){
  const file=fakeFile(saved?{'internal://app/sync.code.txt':saved}:{});
  const spec=loader({file:file.api,router:{replace(){}},device:{getInfo(p){p.success({windowWidth:280,windowHeight:456,screenShape:'rect'});}}})('pages/code/code.js');
  const page={...spec,...spec.data};delete page.data;
  page.onInit.call(page);await new Promise(r=>setTimeout(r,0));
  function completeHint(){
   const estimatedWidth=Array.from(page.hint).reduce((sum,ch)=>sum+(ch.charCodeAt(0)>255?1:0.62)*page.smallSize,0);
   assert.ok(estimatedWidth+8<=page.paneW,'Hint wraps into a clipped second line: '+page.hint);
   assert.ok(page.hintH>=page.smallSize+4);
  }
  completeHint();page.value='';page.onOk.call(page);completeHint();page.onKey.call(page,0);completeHint();
  page.onDestroy.call(page);
 }
});
