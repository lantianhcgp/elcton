// Host-only regression tests for statically visible prohibited references.
// This gate does not resolve dynamic property names or arbitrary obfuscation.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, test } from 'node:test';

const checker = fileURLToPath(new URL('../qa/install34/check_signed_ast.cjs', import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), 'install34-static-refs-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

function input(name, source) {
  const file = join(scratch, `${name}.js`);
  writeFileSync(file, source, 'utf8');
  return file;
}

function run(files) {
  const result = spawnSync(process.execPath, [checker, ...files], {
    encoding: 'utf8',
    timeout: 10000,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null, result.stderr);
  return result;
}

function inspect(files, status) {
  const result = run(files);
  assert.equal(result.status, status, `stdout: ${result.stdout}\nstderr: ${result.stderr}`);
  assert.equal(result.stderr, '');
  const rows = JSON.parse(result.stdout);
  assert.equal(rows.length, files.length);
  rows.forEach((row, index) => {
    assert.deepEqual(Object.keys(row), ['file', 'bad']);
    assert.equal(row.file, files[index]);
    assert.ok(Array.isArray(row.bad));
    assert.ok(row.bad.every(value => typeof value === 'string'));
  });
  return rows;
}

const rejected = [
  ['regexp literal', 'var r=/x/i;', 'regexp-literal'],
  ['RegExp direct call', 'var r=RegExp("x");', 'RegExp'],
  ['RegExp constructor', 'var r=new RegExp("x");', 'RegExp'],
  ['require direct call', 'var m=require("x");', 'require'],
  ['require constructor', 'var m=new require("x");', 'require'],
  ['RegExp alias reviewer regression', 'var R=RegExp;var r=new R("x");', 'RegExp'],
  ['require alias', 'var load=require;var m=load("x");', 'require'],
  ['RegExp indirect call', '(0,RegExp)("x");', 'RegExp'],
  ['require passed as argument', 'consume(require);', 'require'],
  ['RegExp local binding conservatively rejected', 'var RegExp=function(){return 0;};', 'RegExp'],
  ['require parameter conservatively rejected', 'function f(require){return 0;}', 'require'],
  ['RegExp dot member reviewer regression', 'var r=new globalThis.RegExp("x");', 'RegExp'],
  ['require dot member', 'globalThis.require("x");', 'require'],
  ['RegExp bracket member', 'var r=new globalThis["RegExp"]("x");', 'RegExp'],
  ['require bracket member', "globalThis['require']('x');", 'require'],
  ['RegExp static member alias', 'var R=globalThis["RegExp"];var r=new R("x");', 'RegExp'],
  ['require static member alias', 'var load=globalThis["require"];load("x");', 'require'],
  ['require other receiver without invocation', 'var load=box.require;', 'require'],
  ['RegExp identifier object key', 'var box={RegExp:function(){return 0;}};', 'RegExp'],
  ['require identifier object key', 'var box={require:function(){return 0;}};', 'require'],
  ['RegExp literal object key', 'var box={"RegExp":function(){return 0;}};', 'RegExp'],
  ['require literal object key', "var box={'require':function(){return 0;}};", 'require'],
  ['escaped RegExp identifier', 'var R=R\\u0065gExp;', 'RegExp'],
  ['escaped RegExp static member', 'globalThis["Reg\\u0045xp"]("x");', 'RegExp'],
];

const accepted = [
  ['safe ES5 positive control', 'function sum(a){var n=0;for(var i=0;i<a.length;i++){n+=a[i];}return n;}var box={run:sum};box.run([1,2]);'],
  ['webpack identifier', 'var __webpack_require__=function(id){return id;};var x=__webpack_require__(0);'],
  ['webpack dot member', 'var box={__webpack_require__:function(id){return id;}};box.__webpack_require__(0);'],
  ['webpack literal property and bracket member', 'var box={"__webpack_require__":function(id){return id;}};box["__webpack_require__"](0);'],
  ['similar identifiers remain allowed', 'var myRegExp=1;var requireShim=function(){return myRegExp;};requireShim();'],
  ['ordinary strings values and comments remain allowed', 'var box={message:"RegExp",dependency:"require"};var words=["RegExp","require"];/* RegExp /x/ require("x") */'],
];

for (const [name, source, reason] of rejected) {
  test(`rejects ${name}`, () => {
    const [row] = inspect([input(name, source)], 1);
    assert.ok(row.bad.some(value => value.startsWith(`${reason}@`)), JSON.stringify(row));
  });
}

for (const [name, source] of accepted) {
  test(`accepts ${name}`, () => {
    const [row] = inspect([input(name, source)], 0);
    assert.deepEqual(row.bad, []);
  });
}

test('multiple clean inputs preserve ordered CLI JSON rows', () => {
  const files = [input('clean batch one', accepted[0][1]), input('clean batch two', accepted[1][1])];
  assert.deepEqual(inspect(files, 0), files.map(file => ({ file, bad: [] })));
});

test('mixed inputs fail while retaining every ordered CLI JSON row', () => {
  const files = [input('mixed safe', accepted[0][1]), input('mixed prohibited alias', rejected[5][1])];
  const rows = inspect(files, 1);
  assert.deepEqual(rows[0].bad, []);
  assert.ok(rows[1].bad.some(value => value.startsWith('RegExp@')));
});

for (const [name, source] of [
  ['malformed JavaScript', 'var broken = ;'],
  ['non ES5 syntax', 'const value = 1;'],
]) {
  test(`${name} fails closed`, () => {
    const result = run([input(name, source)]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /SyntaxError/);
    assert.equal(result.stdout, '');
  });
}

test('empty input list fails closed', () => {
  const result = run([]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /No signed JS inputs/);
  assert.equal(result.stdout, '');
});

test('missing input file fails closed', () => {
  const result = run([join(scratch, 'missing.js')]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ENOENT/);
  assert.equal(result.stdout, '');
});
