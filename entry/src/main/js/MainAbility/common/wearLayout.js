/* Window-adaptive phone-sync page. Fixed device sizes are test inputs only. */
function layout(info) {
    var w = Number(info && info.windowWidth);
    var h = Number(info && info.windowHeight);
    if (!isFinite(w) || !isFinite(h) || w < 120 || h < 120) { throw new Error('INVALID_WINDOW'); }
    var circle = info.screenShape === 'circle';
    var side = Math.ceil(w * (circle ? 0.17 : 0.1));
    var top = Math.ceil(h * (circle ? 0.16 : 0.12));
    var bottom = Math.ceil(h * (circle ? 0.18 : 0.16));
    var header = Math.floor(h * 0.13);
    var footer = Math.floor(h * 0.12);
    var body = h - top - bottom - header - footer;
    return {pageW: w, pageH: h, side: side, top: top, bottom: bottom, headerH: header,
        bodyW: w - side * 2, bodyH: body, footerH: footer, buttonBottom: h - bottom,
        titleSize: Math.floor(w * 0.061), textSize: Math.floor(w * 0.044),
        buttonW: Math.floor((w - side * 2 - w * 0.03) / 2), gap: Math.floor(w * 0.03)};
}
export default layout;
