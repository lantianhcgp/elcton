/* Common safe frame for real runtime windows, not a FIT3-size fallback. */
import device from '@system.device';
function layout(info,kind) {
    var w=Number(info && info.windowWidth),h=Number(info && info.windowHeight);
    if (!isFinite(w)||!isFinite(h)||w<120||h<120) { throw new Error('INVALID_WINDOW'); }
    var round=info.screenShape==='circle';
    var top=Math.ceil(h*(round ? 0.11 : 0.10));
    var bottom=Math.ceil(h*(round ? 0.14 : 0.18));
    var paneW=Math.floor(w*(round ? 0.64 : 0.82));
    var headerH=Math.floor(h*0.11),footerH=Math.floor(h*0.11);
    var bodyH=h-top-bottom-headerH-footerH;
    var gap=Math.max(6,Math.floor(w*0.025));
    var tabsH=Math.floor(h*0.10);
    var keyGap=Math.floor(w*0.018),keyGapY=Math.floor(h*0.01);
    var digitsH=Math.floor(h*0.075),hintH=Math.floor(h*0.07);
    var padH=bodyH-digitsH-hintH;
    return {w:w,h:h,top:top,bottom:bottom,headerH:headerH,bodyH:bodyH,paneW:paneW,footerH:footerH,
        titleSize:Math.max(16,Math.floor(w*0.058)),textSize:Math.max(13,Math.floor(w*0.043)),smallSize:Math.max(12,Math.floor(w*0.038)),
        titleH:Math.floor(headerH*0.58),subtitleH:Math.floor(headerH*0.42),
        rowH:Math.max(42,Math.floor(h*0.21)),cardH:Math.max(38,Math.floor(h*0.19)),
        cardW:paneW,cardInnerW:paneW-28,cardNameH:Math.floor(h*0.055),cardMetaH:Math.floor(h*0.045),cardTimeH:Math.floor(h*0.045),
        tabsH:tabsH,tabW:Math.floor((paneW-7*3)/7),tabH:Math.floor(tabsH*0.8),tabGap:3,
        listH:kind==='week' ? bodyH-tabsH : bodyH,
        buttonW:Math.floor((paneW-gap)/2),buttonH:Math.floor(footerH*0.9),gap:gap,
        detailRowH:Math.max(42,Math.floor(h*0.13)),labelW:Math.floor(paneW*0.28),valueW:Math.floor(paneW*0.60),
        dialogW:paneW,dialogH:Math.floor(h*0.45),dialogButtonW:Math.floor((paneW-36-gap)/2),dialogTitleH:Math.floor(h*0.13),
        endpointH:Math.floor(h*0.06),detailH:Math.floor(h*0.10),probeH:bodyH-Math.floor(h*0.06)-Math.floor(h*0.10),
        digitsH:digitsH,hintH:hintH,padH:padH,keyGap:keyGap,keyGapY:keyGapY,
        keyW:Math.floor((paneW-3*keyGap)/3),keyH:Math.floor((padH-4*keyGapY)/4)};
}
function init(page,kind) {
    var gen=(page._uiGen || 0)+1;page._uiGen=gen;
    try { device.getInfo({success:function(info){
        if(gen!==page._uiGen)return;
        try {var metrics=layout(info,kind);for(var k in metrics)if(Object.prototype.hasOwnProperty.call(metrics,k))page[k]=metrics[k];page.ready=true;}
        catch(e){page.layoutError='\u5c4f\u5e55\u4fe1\u606f\u65e0\u6548\uff0c\u8bf7\u91cd\u8bd5';}
    },fail:function(){if(gen===page._uiGen)page.layoutError='\u65e0\u6cd5\u83b7\u53d6\u5c4f\u5e55\u4fe1\u606f';}}); }
    catch(e){page.layoutError='\u8bbe\u5907\u4fe1\u606f\u63a5\u53e3\u4e0d\u53ef\u7528';}
}
export default {layout:layout,init:init};
