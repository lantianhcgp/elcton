import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
test('signing does not reset an explicitly versioned package to zero',()=>{
 const source=fs.readFileSync('tools/sign/sign-app-to-hap.js','utf8');
 const body=source.slice(source.indexOf('if (process.env.FORCE_P7B_BUNDLE'),source.indexOf('hapLoad.file("config.json", JSON.stringify(config))'));
 const config={app:{bundleName:'com.hcbiu.elcton',version:{code:1000102,name:'1.0.2-probe'}}};
 vm.runInNewContext(body,{config,process:{env:{FORCE_P7B_BUNDLE:'1'}},bundleName:'watchapp.nexus.0zzip'});
 assert.equal(config.app.bundleName,'watchapp.nexus.0zzip');
 assert.equal(config.app.version.code,1000102);
});
