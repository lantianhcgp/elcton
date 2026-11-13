import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {loader} from './loadSource.mjs';
const require=createRequire(import.meta.url);
const acorn=require('../tools/sign/node_modules/acorn');
const root='entry/src/main/js/MainAbility';
const base='9517f345e8d0e0995708b0a5d0b37b4cae8689ac';
const oldSource=execFileSync('git',['show',base+':'+root+'/common/wearProtocol.js'],{encoding:'utf8'});
const oldProtocol=Function(oldSource.replace('export default ','return '))();
const current=loader()('common/wearProtocol.js');
function outcome(fn,arg){try{return {value:fn(arg)}}catch(e){return {error:e.message}}}
function walk(node,rows){
 if(!node||typeof node!=='object')return;
 if(node.type==='Literal'&&node.regex)rows.push(node.regex.pattern);
 for(const v of Object.values(node))if(Array.isArray(v))v.forEach(n=>walk(n,rows));else if(v&&typeof v==='object')walk(v,rows);
}
test('selected watch source is parseable without regexp literal syntax rejected by exact SDK',()=>{
 const rows=[];
 function scan(dir){for(const d of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,d.name);if(d.isDirectory())scan(p);else if(p.endsWith('.js'))walk(acorn.parse(fs.readFileSync(p,'utf8'),{ecmaVersion:2020,sourceType:'module'}),rows);}}
 scan(root);assert.deepEqual(rows,[],'Exact SDK rejects these expressions before runtime; not an install guarantee');
});
test('wire JSON stays byte-identical to original regexp encoder over all UTF-16 units',()=>{
 for(let start=0;start<65536;start+=256){const value={text:String.fromCharCode(...Array.from({length:256},(_,n)=>start+n))};assert.deepEqual(outcome(current.ascii,value),outcome(oldProtocol.ascii,value));}
 for(const value of [null,undefined,{},[],{x:'\r\n\t/\\🙂'},NaN,Infinity])assert.deepEqual(outcome(current.ascii,value),outcome(oldProtocol.ascii,value));
 const circular={};circular.self=circular;assert.deepEqual(outcome(current.ascii,circular),outcome(oldProtocol.ascii,circular));
});
test('transfer ID acceptance matches original protocol across length and character edges',()=>{
 const strings=['','a','x'.repeat(40),'x'.repeat(41),'id_09-AZ','constructor','__proto__'];
 for(let c=0;c<256;c++)strings.push('x'+String.fromCharCode(c));
 strings.push('中','🙂','a\u2028','a\u2029',null,undefined,4,{},[]);
 for(const id of strings){const info={transferId:id,datasetId:'d',sourceRevision:1};assert.deepEqual(outcome(x=>current.plan('{}',x),info),outcome(x=>oldProtocol.plan('{}',x),info),String(id));}
});
const course={id:'c1',name:'课',teacher:'',location:'',dayOfWeek:1,startPeriod:1,endPeriod:1,startTime:'00:00',endTime:'23:59',weekType:'all',weeks:[],colorIndex:0};
function doc(date,time){return {schema:'elcton.schedule',version:1,settings:{semesterStart:date},courses:[{...course,startTime:time}]};}
test('date/time acceptance and canonical output are unchanged against source baseline',()=>{
 const dates=['2026-09-01','2000-02-29','1900-02-29','0000-01-01','9999-12-31','2026-13-01','2026-00-01','2026-01-00','2026-01-32','2026-1-01','2026-09-01\n','20-6-09-01','２０２６-09-01',null,{},12];
 for(let month=0;month<=13;month++)for(let day=0;day<=32;day++)dates.push('2026-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0'));
 for(const date of dates)assert.deepEqual(outcome(current.snapshot,doc(date,'08:00')),outcome(oldProtocol.snapshot,doc(date,'08:00')),String(date));
 const times=['8:00','08:00\n','08:0a','-1:00','08::0','08: 0','０８:00',null,4];
 for(let hour=0;hour<=25;hour++)for(let minute=0;minute<=61;minute++)times.push(String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0'));
 for(const time of times)assert.deepEqual(outcome(current.snapshot,doc('2026-09-01',time)),outcome(oldProtocol.snapshot,doc('2026-09-01',time)),String(time));
});

test('new bounded validators keep original regexp string-domain behavior',()=>{
 const values=['', 'constructor', '__proto__', 'a'.repeat(40), 'a'.repeat(41), 'f'.repeat(8), 'f'.repeat(64), null, undefined, 4, {}, []];
 for(let c=0;c<65536;c++)values.push('a'+String.fromCharCode(c));
 for(const v of values){
  assert.equal(current.id(v,40),/^[A-Za-z0-9_-]{1,40}$/.test(v),String(v));
  assert.equal(current.hex(v,8),/^[0-9a-f]{8}$/.test(v),String(v));
  if(typeof v==='string')assert.equal(current.pr(v),!/[^\x20-\x7e]/.test(v),String(v));
 }
 const packages=['com.example.good','a-b','a_b','1',1,true,[],{},null,undefined,'a\n','a\u2028','a\u2029'];
 const fingerprints=['a'.repeat(64),'F'.repeat(64),'a'.repeat(63),'g'.repeat(64),null,undefined];
 for(const pkg of packages)assert.equal(current.id(pkg||'',Infinity,'_.'),/^[A-Za-z0-9_.]+$/.test(pkg||''));
 for(const fp of fingerprints)assert.equal(current.hex(String(fp||'').toLowerCase(),64),/^[0-9a-fA-F]{64}$/.test(fp||''));
});

test('pickup-code validation retains all six-digit accept/reject cases',()=>{
 const src=fs.readFileSync(root+'/pages/code/code.js','utf8');
 const begin=src.indexOf('function digitsOnly('),end=src.indexOf('\n}',begin)+2;
 assert.ok(begin>=0&&end>begin);
 const digits=Function(src.slice(begin,end)+'; return digitsOnly;')();
 const values=['123456','000000','999999','12345','1234567','123456\n','123456\r','１２３４５６','12345\u2028'];
 for(let c=0;c<256;c++)values.push('12345'+String.fromCharCode(c));
 for(const v of values)assert.equal(v.length===6&&digits(v)===v,/^[0-9]{6}$/.test(v),JSON.stringify(v));
});

test('error brief replacement and fixed-length hex preserve original behavior',()=>{
 const source=fs.readFileSync(root+'/pages/sync/sync.js','utf8');
 const decl=acorn.parse(source,{ecmaVersion:2020,sourceType:'module'}).body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='brief');
 assert.ok(decl);
 const brief=Function(source.slice(decl.start,decl.end)+';return brief;')();
 const original=(v,n)=>(typeof v==='string'||typeof v==='number')?String(v).substr(0,n).replace(/[\r\n\t]/g,' '):'ERROR';
 for(const value of ['', 'a\r\nb\tc', '中\r\n🙂', 123, NaN, null, undefined, {}, true])for(const n of [-1,0,1,3,100])assert.equal(brief(value,n),original(value,n));
 for(let c=0;c<256;c++){
  const ch=String.fromCharCode(c);
  assert.equal(brief('a'+ch+'\r\n\tb',20),original('a'+ch+'\r\n\tb',20));
  for(const n of [8,64]){
   const s='a'.repeat(n-1)+ch;
   assert.equal(current.hex(s,n),new RegExp('^[0-9a-f]{'+n+'}$').test(s));
  }
 }
});
