import test from 'node:test';
import assert from 'node:assert/strict';
let layout;
try {layout=(await import('../entry/src/main/js/MainAbility/common/wearLayout.js')).default;}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
test('sync layout uses supplied windows and keeps primary controls inside circle and rounded-rect safe areas',()=>{
    assert.equal(typeof layout,'function','window-adaptive layout is missing');
    for(const [w,h,shape] of [[412,484,'rect'],[390,390,'circle'],[466,466,'circle'],[336,480,'rect'],[280,456,'rect']]){
        const box=layout({windowWidth:w,windowHeight:h,screenShape:shape});
        assert.equal(box.pageW,w);assert.equal(box.pageH,h);
        assert.ok(box.bodyW+2*box.side<=w);
        assert.ok(box.top+box.headerH+box.bodyH+box.footerH+box.bottom<=h);
        assert.ok(box.bodyW>100 && box.footerH>30);
        if(shape==='circle')assert.ok(box.bodyW<=w*0.7);
        if(w===412&&h===484)assert.ok(box.buttonBottom<=410);
    }
    assert.throws(()=>layout({windowWidth:0,windowHeight:0}),/INVALID_WINDOW/);
});
