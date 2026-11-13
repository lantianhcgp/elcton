// Planning estimate only: final compiled/signed package gate remains authoritative.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {minify} from '../../tools/sign/node_modules/terser/main.js';
let delta=0;
const rows=[];
for(const name of ['wearProtocol','wearReceiver','wearExporter','wearChannel','wearJournal']) {
 const p='entry/src/main/js/MainAbility/common/'+name+'.js';
 const before=execFileSync('git',['show','9517f345e8d0e0995708b0a5d0b37b4cae8689ac:'+p],{encoding:'utf8'});
 const opts={compress:false,mangle:false,ecma:5,format:{comments:false,ascii_only:true}};
 const a=await minify(before,opts),b=await minify(fs.readFileSync(p,'utf8'),opts);
 const n=Buffer.byteLength(b.code)-Buffer.byteLength(a.code);delta+=n;
 rows.push({file:p,delta:n});
}
console.log(JSON.stringify({approximate:true,rows,delta,estimatedPhoneBytes:48760+delta,budget:49152},null,2));
