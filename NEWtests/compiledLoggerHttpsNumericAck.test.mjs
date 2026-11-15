import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createHTTPSAdapter} from '../qa/we-handshake-20261115/compiled-logger-https.mjs';

function response(body) {
  const req=new EventEmitter(), res=new EventEmitter(), socket=new EventEmitter();
  req.setTimeout=()=>req; req.end=()=>{}; req.destroy=()=>{};
  res.destroy=()=>{}; socket.destroy=()=>{}; res.statusCode=200;
  let deliver, completed=0;
  const runtime={endpoint:'https://host-test.invalid/logger',write_key:'TEST_ONLY_NOT_A_CREDENTIAL'};
  const https={request(_url,_options,callback){deliver=callback;return req;}};
  const requests=[];
  const adapter=createHTTPSAdapter({runtime,https,requests});
  adapter.fetch({url:runtime.endpoint,header:{'X-Log-Key':runtime.write_key},method:'POST',
    data:JSON.stringify({logs:[{tag:'NEW/ack-fixture'}]}),success(){completed++;},fail(){assert.fail('Unexpected transport failure');}});
  req.emit('socket',socket); deliver(res);
  res.emit('data',Buffer.from(JSON.stringify(body))); res.emit('end');
  assert.equal(completed,1);
  req.emit('close');socket.emit('close');adapter.cleanup();
  assert.equal(adapter.activeRequests.size,0);assert.equal(adapter.sockets.size,0);
  return requests[0];
}

test('NEW QA ACK matches actual PHP ok=1 and boolean ok=true, without truthy coercion',()=>{
  for(const ok of [1,true]) {
    const record=response({ok,accepted:1});
    assert.equal(record.ack,true,'canonical PHP numeric and boolean ACK accepted exactly');
    assert.equal(record.accepted,1);assert.equal(record.http,200);
  }
});
test('NEW QA ACK rejects all other types/values and preserves independent accepted field',()=>{
  for(const ok of [0,2,-1,false,null,'1','true',{},[]]) {
    const record=response({ok,accepted:1});
    assert.equal(record.ack,false,'Non-contract ACK must fail closed');
  }
  assert.equal(response({accepted:1}).ack,false);
  assert.equal(response({ok:1,accepted:'1'}).accepted,null);
});
