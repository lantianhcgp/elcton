import test from 'node:test';
import assert from 'node:assert/strict';
import {loader} from './loadSource.mjs';

test('channel registers only after configuring the signed phone identity and drops watch loopback',()=>{
    const seen=[];let subscription;
    const wearengine={
        setPackageName(p){seen.push(p.appName);p.complete();},
        setFingerprint(p){seen.push(p.appCert);p.complete();},
        subscribeMsg(p){subscription=p;p.success({isRegister:true});},
        unsubscribeMsg(){seen.push('closed');},
        sendMsg(p){seen.push(JSON.parse(p.message).type);p.success();}
    };
    let channel;
    try {channel=loader({wearengine})('common/wearChannel.js');}catch(e){if(!e.message.includes('ENOENT'))throw e;}
    assert.equal(typeof channel,'function','signed channel adapter is missing');
    const messages=[];let ready=false;
    const connection=channel({phonePackage:'com.hcbiu.elcton',phoneFingerprint:'a'.repeat(64)});
    connection.open(text=>messages.push(text),error=>{assert.equal(error,null);ready=true;});
    assert.equal(ready,true);assert.deepEqual(seen.slice(0,2),['com.hcbiu.elcton','a'.repeat(64)]);
    subscription.success({isRegister:false,message:'{"sender":"watch","type":"ACK"}'});
    assert.equal(messages.length,0);
    subscription.success({isRegister:false,message:'{"sender":"phone","type":"HELLO"}'});
    assert.equal(messages.length,1);
    connection.close();assert.equal(seen.at(-1),'closed');
});
