import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function adapter() {
    const files=new Map([['internal://app/a.txt','a'.repeat(4096)+'中末尾']]);
    const ctx=vm.createContext({TextEncoder,TextDecoder,console,DeviceFeatureVirtualFS:{
        readText(uri,c){files.has(uri)?c.success({text:files.get(uri)}):c.fail('missing',301);},
        writeText(uri,text,append,c){files.set(uri,(append?(files.get(uri)||''):'')+text);c.success();},
        getInfo(uri,c){files.has(uri)?c.success({size:files.get(uri).length,exist:true}):c.fail('missing',301);}
    }});
    const source=fs.readFileSync((process.env.HMLWSIM_ROOT || '../elcton-sim-qa') + '/js/runtime/apiSim_file.js','utf8');
    const api=vm.runInContext(source+'\nApiSimFile;',ctx);return api;
}
test('hmlwsim file adapter reads actual UTF-8 byte windows and reports length through get',()=>{
    const api=adapter();assert.equal(typeof api.get,'function','simulator file.get missing');
    let meta;api.get({uri:'internal://app/a.txt',success:m=>meta=m});
    assert.equal(meta.length,4105);
    let text;api.readText({uri:'internal://app/a.txt',position:4096,length:9,success:r=>text=r.text});
    assert.equal(text,'中末尾');
});
