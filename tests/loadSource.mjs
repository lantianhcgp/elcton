import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../entry/src/main/js/MainAbility');
export function loader(system={}) {
    const cache=new Map();
    const application=system.app || {};
    function load(name) {
        const filename=path.resolve(root,name);
        if(cache.has(filename))return cache.get(filename);
        const dependencies={};
        let source=fs.readFileSync(filename,'utf8').replace(/import\s+([\w]+)\s+from\s+['"]([^'"]+)['"];?/g,(_,binding,ref)=>{
            dependencies[ref]=ref.startsWith('@system.')?system[ref.slice(8)]:load(path.relative(root,path.resolve(path.dirname(filename),ref)));
            if(dependencies[ref]===undefined)throw new Error('Unknown test dependency '+ref);
            return 'var '+binding+'=dependencies['+JSON.stringify(ref)+'];';
        }).replace(/export default /,'return ');
        const result=Function('dependencies','$app',source)(dependencies,application);
        cache.set(filename,result);return result;
    }
    return load;
}
export function fakeFile(initial={}){
    const files=new Map(Object.entries(initial));
    let fault=null;
    const api={
        get({uri,success,fail}){queueMicrotask(()=>files.has(uri)?success({length:Buffer.byteLength(files.get(uri),'utf8')}):fail('missing',301));},
        readText({uri,position=0,length=4096,success,fail}){queueMicrotask(()=>{
            if(fault&&fault(uri,position))return fail('injected',300);
            if(!files.has(uri))return fail('missing',301);
            success({text:Buffer.from(files.get(uri)).subarray(position,position+length).toString('utf8')});
        });},
        writeText({uri,text,append=false,success,fail}){queueMicrotask(()=>{files.set(uri,(append?(files.get(uri)||''):'')+text);success();});}
    };
    return {api,files,setFault(fn){fault=fn;}};
}
