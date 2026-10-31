/* Platform-neutral wire helpers. ASCII bytes are shared with Android. */
function ascii(value) {
    var text = JSON.stringify(value);
    if (typeof text !== 'string') { throw new Error('INVALID_JSON'); }
    return text.replace(/[\u007f-\uffff]/g, function (c) {
        return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
    });
}
function crc32(text) {
    var crc = -1;
    for (var i = 0; i < text.length; i++) {
        var code = text.charCodeAt(i);
        if (code > 127) { throw new Error('NON_ASCII'); }
        crc = crc ^ code;
        for (var bit = 0; bit < 8; bit++) {
            crc = (crc >>> 1) ^ ((crc & 1) ? -306674912 : 0);
        }
    }
    return ('00000000' + ((crc ^ -1) >>> 0).toString(16)).slice(-8);
}
function packet(type, transferId) {
    return { protocol: 'elcton.sync', version: 1, sender: 'phone', type: type, transferId: transferId };
}
function plan(text, info) {
    var digest = crc32(text);
    if (!info || typeof info.transferId !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(info.transferId)) { throw new Error('INVALID_TRANSFER_ID'); }
    var start = packet('BEGIN', info.transferId);
    start.datasetId = info.datasetId;
    start.sourceRevision = info.sourceRevision;
    start.baseDigest = info.baseDigest || '';
    start.force = info.force === true;
    start.length = text.length;
    start.digest = digest;
    var messages = [start];
    var offset = 0;
    var sequence = 0;
    while (offset < text.length) {
        var chunk = packet('CHUNK', info.transferId);
        chunk.seq = sequence;
        var size = Math.min(700, text.length - offset);
        do { chunk.data = text.substr(offset, size); if (ascii(chunk).length <= 1024) { break; } size--; } while (size > 0);
        if (!size) { throw new Error('PACKET_TOO_LARGE'); }
        messages.push(chunk);
        offset += size;
        sequence++;
    }
    start.chunks = sequence;
    if (ascii(start).length > 1024) { throw new Error('PACKET_TOO_LARGE'); }
    messages.push(packet('END', info.transferId));
    return messages;
}
function integer(value, low, high) {
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value && value >= low && value <= high;
}
function field(value, limit) {
    if (typeof value !== 'string' || value.length > limit) { throw new Error('INVALID_FIELD'); }
    return value;
}
function minutes(value) {
    if (typeof value !== 'string' || !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)) { throw new Error('INVALID_TIME'); }
    return Number(value.substr(0, 2)) * 60 + Number(value.substr(3, 2));
}
function snapshot(doc) {
    if (!doc || doc.schema !== 'elcton.schedule' || doc.version !== 1) { throw new Error('UNSUPPORTED_SCHEMA'); }
    var start = doc.settings && doc.settings.semesterStart;
    if (typeof start !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(start)) { throw new Error('INVALID_DATE'); }
    var year = Number(start.substr(0,4)), month = Number(start.substr(5,2)), day = Number(start.substr(8,2));
    var days = [31, (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28, 31,30,31,30,31,31,30,31,30,31];
    if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month-1]) { throw new Error('INVALID_DATE'); }
    if (Object.prototype.toString.call(doc.courses) !== '[object Array]' || doc.courses.length > 200) { throw new Error('INVALID_COURSES'); }
    var courses = [];
    var ids = {};
    for (var i = 0; i < doc.courses.length; i++) {
        var c = doc.courses[i];
        if (!c || typeof c !== 'object') { throw new Error('INVALID_COURSE'); }
        var id = field(c.id, 64);
        if (!id) { throw new Error('INVALID_ID'); }
        if (ids['@' + id]) { throw new Error('DUPLICATE_ID'); }
        ids['@' + id] = true;
        if (!integer(c.dayOfWeek, 1, 7) || !integer(c.startPeriod, 1, 24) || !integer(c.endPeriod, c.startPeriod, 24)) { throw new Error('INVALID_PERIOD'); }
        if (minutes(c.endTime) <= minutes(c.startTime)) { throw new Error('INVALID_TIME'); }
        if (c.weekType !== 'all' && c.weekType !== 'odd' && c.weekType !== 'even') { throw new Error('UNSUPPORTED_WEEK_TYPE'); }
        if (Object.prototype.toString.call(c.weeks) !== '[object Array]' || c.weeks.length !== 0) { throw new Error('UNSUPPORTED_WEEKS'); }
        if (!integer(c.colorIndex, 0, 7)) { throw new Error('INVALID_COLOR'); }
        courses.push({ id: id, name: field(c.name, 80), location: field(c.location, 80), teacher: field(c.teacher, 80),
            dayOfWeek: c.dayOfWeek, startPeriod: c.startPeriod, endPeriod: c.endPeriod, startTime: c.startTime,
            endTime: c.endTime, weekType: c.weekType, weeks: [], colorIndex: c.colorIndex });
    }
    courses.sort(function (a, b) {
        if (a.dayOfWeek !== b.dayOfWeek) { return a.dayOfWeek - b.dayOfWeek; }
        if (a.startPeriod !== b.startPeriod) { return a.startPeriod - b.startPeriod; }
        if (a.startTime !== b.startTime) { return a.startTime < b.startTime ? -1 : 1; }
        return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
    });
    return ascii({schema: 'elcton.schedule', version: 1, settings: {semesterStart: start}, courses: courses});
}
export default { ascii: ascii, crc32: crc32, plan: plan, snapshot: snapshot };
