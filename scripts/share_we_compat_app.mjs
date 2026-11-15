// HOST ONLY: exact factory ownership transfer in a real SDK .app before signing.
// Synthetic fixtures are explicitly QA only; they cannot attest SDK/native behavior.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import JSZip from '../tools/sign/node_modules/jszip/lib/index.js';
import {parse} from '../tools/sign/node_modules/acorn/dist/acorn.mjs';
import sourceMap from '../tools/sign/node_modules/source-map/source-map.js';
const PAGE='assets/js/MainAbility/pages/phone-sync/phone-sync.js';
const APP='assets/js/MainAbility/app.js';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
// Complete SDK module-function bytes, including Babel exports and native stub.
// Module IDs may change; no other external helper shape is trusted.
const EXTERNAL_INTEROP_SHA='e282a73c6d4a635b6aa168ad8ff37d95bc71c3b9fd70b2f56caa63cdc4094bf3';
const markers=['BUS_UNVERSIONED','SDK_UNAVAILABLE','PKG_CALL','CERT_CALL','REG_CALL','SEND_206','READY_FAIL','UNVERSIONED','CHANNEL_CLOSED_OR_TOO_LARGE'];
const apis=['setPackageName','setFingerprint','subscribeMsg','unsubscribeMsg','sendMsg'];
function walk(n,fn){if(!n||typeof n!=='object')return; if(typeof n.type==='string')fn(n);for(const [k,v]of Object.entries(n)){if(k==='start'||k==='end'||k==='loc')continue;if(Array.isArray(v)){for(const c of v)walk(c,fn);}else if(v&&typeof v==='object')walk(v,fn);}}
function clean(n){if(Array.isArray(n))return n.map(clean);if(!n||typeof n!=='object')return n;const o={};for(const [k,v]of Object.entries(n))if(!['start','end','loc','raw'].includes(k))o[k]=clean(v);return o;}
function key(n){return n.type==='Literal'?String(n.value):n.name;}
function isStaticMember(n,name){return n?.type==='MemberExpression'&&(n.computed?n.property.type==='Literal'&&n.property.value===name:n.property.type==='Identifier'&&n.property.name===name);}
function inspect(code,label){
  const ast=parse(code,{ecmaVersion:5});const modules=[];
  walk(ast,n=>{if(n.type==='Property'&&n.value.type==='FunctionExpression'&&n.value.params.length>=3)modules.push({id:key(n.key),node:n.value});if(n.type==='ArrayExpression')n.elements.forEach((v,i)=>{if(v&&v.type==='FunctionExpression'&&v.params.length>=3)modules.push({id:String(i),node:v});});});
  const candidates=[];
  for(const m of modules){const text=code.slice(m.node.start,m.node.end);if(!markers.every(t=>text.includes(t))||!apis.every(t=>text.includes(t)))continue;
    const factories=[];walk(m.node.body,n=>{if((n.type==='FunctionDeclaration'||n.type==='FunctionExpression')&&n.params.length===3){const text=code.slice(n.start,n.end);if(markers.every(t=>text.includes(t))&&apis.every(t=>text.includes(t)))factories.push(n);}});
    if(factories.length!==1)throw Error(label+': ambiguous compatibility factory');
    if(/requireNative|@system\./.test(text))throw Error(label+': native initialization in compat module');
    candidates.push({...m,factory:factories[0],text});
  }
  if(candidates.length!==1)throw Error(label+': expected exactly one pinned compatibility webpack module, got '+candidates.length);
  return {code,ast,modules,target:candidates[0]};
}
function ownerHas(app){
  const target=app.target.id;
  for(const m of app.modules){
    if(m.node.params.some(p=>p.type!=='Identifier'))continue;
    const bindings=new Map(),invalid=new Set(),exportRoots=[],helpers=new Map();
    // Resolve only bindings in this webpack module's lexical scope. Nested
    // functions cannot supply unrelated imports or shadowed owner bindings.
    function scope(n){
      if(!n||typeof n!=='object')return;
      if(n.type==='FunctionDeclaration'){helpers.set(n.id.name,n);return;}
      if(n.type==='FunctionExpression')return;
      if(n.type==='VariableDeclarator'&&n.id.type==='Identifier'){
        if(bindings.has(n.id.name))invalid.add(n.id.name);
        bindings.set(n.id.name,n.init);
      }
      if(n.type==='AssignmentExpression'&&n.operator==='='&&isStaticMember(n.left,'default')&&n.left.object.type==='Identifier'&&n.left.object.name===m.node.params[1].name)exportRoots.push(n.right);
      if((n.type==='AssignmentExpression'||n.type==='UpdateExpression')){
        const lhs=n.left||n.argument;if(lhs.type==='Identifier')invalid.add(lhs.name);
        else if(lhs.type==='MemberExpression'&&lhs.object.type==='Identifier')invalid.add(lhs.object.name);
      }
      for(const v of Object.values(n))if(Array.isArray(v))v.forEach(scope);else if(v&&typeof v==='object')scope(v);
    }
    scope(m.node.body);
    // Only the actual webpack exports.default application definition can own
    // the factory. Resolve stable lexical object aliases, never decoy objects.
    function applicationRoot(n,seen=new Set()){
      if(n?.type==='ObjectExpression')return n;
      if(n?.type!=='Identifier'||invalid.has(n.name)||seen.has(n.name)||!bindings.has(n.name))return null;
      return applicationRoot(bindings.get(n.name),new Set([...seen,n.name]));
    }
    // Babel may initialize exports.default to void 0 before its one definition.
    if(!exportRoots.length||exportRoots.slice(0,-1).some(n=>n.type!=='UnaryExpression'||n.operator!=='void'||n.argument.type!=='Literal'||n.argument.value!==0))continue;
    const root=applicationRoot(exportRoots[exportRoots.length-1]);
    if(!root)continue;
    const owners=root.properties.filter(n=>key(n.key)==='_elctonWearCompat');
    if(owners.length!==1)continue;
    // Babel's default-import helper is allowed only when its AST has the
    // exact __esModule/default conditional shape, never for an arbitrary call.
    function interop(name,shadow){
      const f=helpers.get(name);
      if(!f){
        const imported=bindings.get(name),requireName=m.node.params[2].name;
        if(imported?.type!=='CallExpression'||imported.callee.type!=='Identifier'||imported.callee.name!==requireName||invalid.has(requireName)||shadow.has(requireName)||imported.arguments.length!==1||imported.arguments[0].type!=='Literal')return false;
        const id=String(imported.arguments[0].value),matches=[];
        walk(app.ast,n=>{if(n.type==='Property'&&n.key.type==='Literal'&&String(n.key.value)===id)matches.push(n.value);});
        return matches.length===1&&matches[0].type==='FunctionExpression'&&sha(app.code.slice(matches[0].start,matches[0].end))===EXTERNAL_INTEROP_SHA;
      }
      if(f.params.length!==1||f.params[0].type!=='Identifier'||f.body.body.length!==1)return false;
      const p=f.params[0].name,r=f.body.body[0],e=r.argument;
      const id=n=>n?.type==='Identifier'&&n.name===p;
      return r.type==='ReturnStatement'&&e?.type==='ConditionalExpression'&&e.test.type==='LogicalExpression'&&e.test.operator==='&&'&&id(e.test.left)&&e.test.right.type==='MemberExpression'&&!e.test.right.computed&&id(e.test.right.object)&&key(e.test.right.property)==='__esModule'&&id(e.consequent)&&e.alternate.type==='ObjectExpression'&&e.alternate.properties.length===1&&key(e.alternate.properties[0].key)==='default'&&id(e.alternate.properties[0].value);
    }
    function resolve(n,seen=new Set(),shadow=new Set()){
      if(!n)return null;
      if(n.type==='Identifier'){
        if(shadow.has(n.name)||invalid.has(n.name)||seen.has(n.name))return null;
        if(n.name===m.node.params[2].name)return 'require';
        if(!bindings.has(n.name))return null;
        return resolve(bindings.get(n.name),new Set([...seen,n.name]),shadow);
      }
      if(n.type==='CallExpression'&&n.arguments.length===1){
        if(resolve(n.callee,seen,shadow)==='require'&&n.arguments[0].type==='Literal'&&String(n.arguments[0].value)===target)return 'module';
        if(n.callee.type==='Identifier'&&!shadow.has(n.callee.name)&&!invalid.has(n.callee.name)&&interop(n.callee.name,shadow)&&resolve(n.arguments[0],seen,shadow)==='module')return 'module';
      }
      if(isStaticMember(n,'default')&&resolve(n.object,seen,shadow)==='module')return 'factory';
      if(n.type==='SequenceExpression'&&n.expressions.length===2&&n.expressions[0].type==='Literal'&&n.expressions[0].value===0)return resolve(n.expressions[1],seen,shadow);
      return null;
    }
    for(const owner of owners){
      if(owner.kind!=='init'||owner.computed)continue;
      if(resolve(owner.value)==='factory')return true;
      const f=owner.value;
      if(f.type!=='FunctionExpression'||f.params.length!==3||f.params.some(p=>p.type!=='Identifier')||f.body.body.length!==1)continue;
      const params=f.params.map(p=>p.name),statement=f.body.body[0],call=statement.argument;
      if(new Set(params).size!==3||statement.type!=='ReturnStatement'||call?.type!=='CallExpression'||call.arguments.length!==3)continue;
      if(call.arguments.every((arg,i)=>arg.type==='Identifier'&&arg.name===params[i])&&resolve(call.callee,new Set(),new Set([...params,...(f.id?[f.id.name]:[])]))==='factory')return true;
    }
  }
  return false;
}
function bridge(module){
  const [mod,exports,require]=module.node.params.map(p=>{if(p.type!=='Identifier')throw Error('Unsupported webpack module parameters');return p.name;});
  // Keep the webpack export shape, remove the full page-local factory and imports.
  return 'function('+[mod,exports,require].join(',')+'){'+exports+'.__esModule=true;'+exports+'.default=function(identity,protocol,engine){var owner;try{owner=$app.$def||$app;}catch(e){}if(owner&&typeof owner._elctonWearCompat==="function"){return owner._elctonWearCompat(identity,protocol,engine);}return {open:function(onMessage,cb){cb("APP_COMPAT_UNAVAILABLE");},close:function(){}};};}';
}
function updateMap(code,before,start,end,replacement,oldMap){
  if(!oldMap)throw Error('Source map must retain includeSources for every module');
  const prior=JSON.parse(oldMap);
  if(prior.version!==3||!Array.isArray(prior.sources)||!Array.isArray(prior.sourcesContent)||prior.sources.length!==prior.sourcesContent.length||prior.sourcesContent.some(content=>typeof content!=='string'))throw Error('Source map must retain includeSources for every module');
  const {SourceMapGenerator}=sourceMap;const map=new SourceMapGenerator({file:'phone-sync.js'});
  const bundle='we-compat-sharing/input-phone-sync.js';map.setSourceContent(bundle,before);
  for(let i=0;i<prior.sources.length;i++)map.setSourceContent(prior.sources[i],prior.sourcesContent[i]);
  const delegate='we-compat-sharing/app-owner-delegate.js';map.setSourceContent(delegate,replacement);
  let generatedLine=1,generatedColumn=0,originalLine=1,originalColumn=0;
  // Outside the exact replacement, preserve per-character correspondence to input.
  for(let i=0;i<code.length;i++){
    if(i===start){const skipped=before.slice(start,end);for(const ch of skipped){if(ch==='\n'){originalLine++;originalColumn=0;}else originalColumn++;}}
    if(i>=start&&i<start+replacement.length){if(i===start)map.addMapping({generated:{line:generatedLine,column:generatedColumn},original:{line:1,column:0},source:delegate});}
    else{map.addMapping({generated:{line:generatedLine,column:generatedColumn},original:{line:originalLine,column:originalColumn},source:bundle});const ch=code[i];if(ch==='\n'){originalLine++;originalColumn=0;}else originalColumn++;}
    if(code[i]==='\n'){generatedLine++;generatedColumn=0;}else generatedColumn++;
  }
  const output=map.toJSON();
  // SourceMapGenerator omits contents without mappings. Retain every original
  // module source verbatim, including modules now delegated to the app owner.
  for(let i=0;i<prior.sources.length;i++)if(!output.sources.includes(prior.sources[i])){output.sources.push(prior.sources[i]);output.sourcesContent.push(prior.sourcesContent[i]);}
  if(prior.sourceRoot!==undefined)output.sourceRoot=prior.sourceRoot;
  return JSON.stringify(output);
}
export async function shareCompatApp(input,{syntheticQA=false}={}){
  const outer=await JSZip.loadAsync(input),haps=Object.values(outer.files).filter(f=>!f.dir&&f.name.endsWith('.hap'));
  if(haps.length!==1)throw Error('Expected exactly one unsigned Lite HAP');
  const hap=await JSZip.loadAsync(await haps[0].async('nodebuffer'));
  if(!hap.file(PAGE)||!hap.file(APP))throw Error('Both actual app/page JS bundles are required');
  const before=await hap.file(PAGE).async('string'),appSource=await hap.file(APP).async('string');
  const page=inspect(before,'page'),app=inspect(appSource,'app');
  // Compare complete parsed factories, not a short marker/sample/synthetic replacement.
  const pageFactory=JSON.stringify(clean(page.target.factory)),appFactory=JSON.stringify(clean(app.target.factory));
  if(pageFactory!==appFactory)throw Error('App/page full compatibility factories differ');
  if(!ownerHas(app))throw Error('App _elctonWearCompat is not linked to the full factory module');
  const start=page.target.node.start,end=page.target.node.end,replacement=bridge(page.target);
  const code=before.slice(0,start)+replacement+before.slice(end);parse(code,{ecmaVersion:5});
  if(code.slice(0,start)!==before.slice(0,start)||code.slice(start+replacement.length)!==before.slice(end))throw Error('Non-target module bytes changed');
  const mapName=PAGE+'.map',oldMap=hap.file(mapName)?await hap.file(mapName).async('string'):null;
  const map=updateMap(code,before,start,end,replacement,oldMap);
  const sameInner=new Map(),sameOuter=new Map();
  for(const f of Object.values(hap.files))if(!f.dir&&f.name!==PAGE&&f.name!==mapName)sameInner.set(f.name,await f.async('nodebuffer'));
  for(const f of Object.values(outer.files))if(!f.dir&&f.name!==haps[0].name)sameOuter.set(f.name,await f.async('nodebuffer'));
  hap.file(PAGE,code);hap.file(mapName,map);outer.file(haps[0].name,await hap.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
  const bytes=await outer.generateAsync({type:'nodebuffer',compression:'DEFLATE'}),checkOuter=await JSZip.loadAsync(bytes),checkInner=await JSZip.loadAsync(await checkOuter.file(haps[0].name).async('nodebuffer'));
  for(const [name,b]of sameInner)if(!(await checkInner.file(name).async('nodebuffer')).equals(b))throw Error('Non-target HAP payload changed: '+name);
  for(const [name,b]of sameOuter)if(!(await checkOuter.file(name).async('nodebuffer')).equals(b))throw Error('Non-target APP payload changed: '+name);
  if(sha(await checkInner.file(APP).async('nodebuffer'))!==sha(appSource))throw Error('App bundle changed');
  return {bytes,record:{action:'share-we-compat-app',syntheticQA,actualSDKVerified:false,sdkProvenance:'requires-parent-CI-readback',nativeVerified:false,page:PAGE,app:APP,matches:1,moduleId:page.target.id,start,end,replacementBytes:replacement.length,before:Buffer.byteLength(before),after:Buffer.byteLength(code),beforeSha256:sha(before),afterSha256:sha(code),moduleHash:sha(page.target.text),appModuleHash:sha(app.target.text),fullFactoryHash:sha(pageFactory),appSourceMethodHas:true,appSourceSha256:sha(appSource),unchangedInner:sameInner.size,unchangedOuter:sameOuter.size,nonTargetModuleBytesEqual:true,sourceMapIncludeSources:true}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const input=process.argv[2];if(!input)throw Error('Usage: node scripts/share_we_compat_app.mjs actual-built.app [evidence.json]');
  const result=await shareCompatApp(fs.readFileSync(input));fs.writeFileSync(input,result.bytes);
  if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result.record,null,2)+'\n');
  console.log(JSON.stringify(result.record));
}
