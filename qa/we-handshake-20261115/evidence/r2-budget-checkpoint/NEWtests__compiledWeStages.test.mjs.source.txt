import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const script = new URL('../qa/we-handshake-20261115/compiled-we-stages.mjs', import.meta.url);
const tempRoot = fileURLToPath(new URL('./', import.meta.url));

// NEW temporary sentinels only: these are not APP fixtures or stage acceptance.
for (const alias of ['same-path', 'symlink', 'hardlink', 'symlink-parent']) {
  test(`NEW CLI collision rejects ${alias} without mutating input (NOT actualAPP acceptance)`, (t) => {
    const dir = fs.mkdtempSync(path.join(tempRoot, '.compiled-stage-collision-'));
    try {
      const input = path.join(dir, 'sentinel.app');
      const sentinel = Buffer.from('NEW_SENTINEL_ONLY\nnot an APP archive\n');
      fs.writeFileSync(input, sentinel);
      let output = input;
      if (alias === 'symlink') { output = path.join(dir, 'report.json'); fs.symlinkSync(input, output); }
      if (alias === 'hardlink') {
        output = path.join(dir, 'report.json');
        try { fs.linkSync(input, output); }
        catch (error) {
          if (['EACCES','EPERM','ENOTSUP'].includes(error.code)) {
            t.skip(`actual hardlink creation blocked by filesystem: ${error.code}`); return;
          }
          throw error;
        }
      }
      if (alias === 'symlink-parent') {
        const linkedParent = path.join(dir, 'linked-parent');
        fs.symlinkSync(dir, linkedParent); output = path.join(linkedParent, 'sentinel.app');
      }
      const r = spawnSync(process.execPath, [script.pathname, '--app', input, '--report', output], {encoding:'utf8', timeout:5000});
      assert.deepEqual(fs.readFileSync(input), sentinel, 'collision overwrote the NEW input sentinel');
      assert.deepEqual(fs.readFileSync(output), sentinel, 'alias target was written');
      assert.equal(r.status, 1); assert.equal(r.stderr, '');
      const summary = JSON.parse(r.stdout);
      assert.equal(summary.failure, 'report_input_collision');
      assert.equal(summary.passed, false); assert.equal(summary.native, false); assert.equal(summary.real_https, false);
      assert.equal(r.stdout.includes('NEW_SENTINEL_ONLY'), false);
      assert.equal(r.stdout.includes(input), false);
    } finally { fs.rmSync(dir, {recursive:true, force:true}); }
  });
}

test('NEW isolated inode boundary rejects same dev/ino without publishing output (NOT actual hardlink CLI execution)', () => {
  const source = fs.readFileSync(script, 'utf8');
  const start = source.indexOf('    const input=path.resolve(argv[1]);');
  const end = source.indexOf('    const bytes=await loadApp', start);
  assert.ok(start >= 0 && end > start);
  const context = {argv:['--app','/NEW/input','--report','/NEW/report'], path, out:undefined,
    fs:{realpathSync:p=>p, statSync:()=>({dev:7,ino:19})},
    need(value, code) { if (!value) throw new Error(code); }};
  assert.throws(() => vm.runInNewContext(source.slice(start,end), context), /report_input_collision/);
  assert.equal(context.out, undefined);
});

test('NEW isolated row-publication block rejects invalid msg before attaching it (NOT compiled APP execution)', () => {
  const source = fs.readFileSync(script, 'utf8');
  // Execute the unchanged validation/publication block only, not synthesized APP bytes.
  const start = source.indexOf('    report.post_stop_verified=true;');
  const end = source.indexOf('    report.final_timers=', start);
  assert.ok(start >= 0 && end > start, 'row-publication block must remain identifiable');
  const block = source.slice(start, end);
  const invalidMsg = 'NEW_INVALID_TEXT_SENTINEL';
  const report = {};
  const context = {report, rows:[{tag:'WE/SEND_FAIL', msg:invalidMsg}], fetches:0, reads:0,
    need(value, code) { if (!value) throw new Error(code); }};
  assert.throws(() => vm.runInNewContext(block, context), /safe_numeric_stage_rows_only/);
  assert.equal(Object.hasOwn(report, 'safe_rows'), false, 'rejected rows must never be attached to failure report');
  assert.equal(JSON.stringify(report).includes(invalidMsg), false);
  const goodReport = {};
  vm.runInNewContext(block, {...context, report:goodReport, rows:[{tag:'WE/SEND_FAIL', msg:'arg1=210301031 arg2=0 type1=3 type2=3'}]});
  assert.equal(goodReport.safe_rows.length, 1); assert.equal(goodReport.rows, 1);
});
