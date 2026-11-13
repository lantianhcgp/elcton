// Host-only AST inventory; never runs or modifies the watch payload.
const fs = require('node:fs');
const path = require('node:path');
const acorn = require('../../tools/sign/node_modules/acorn');
const crypto = require('node:crypto');
const report = JSON.parse(fs.readFileSync(path.join(__dirname,'evidence/package-comparison.json'),'utf8'));
function walk(node, parent, rows, source) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'Literal' && node.regex) rows.regex.push({pattern:node.regex.pattern,flags:node.regex.flags,offset:node.start});
  if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
    const c=node.callee, prop=c.computed?c.property.value:c.property.name;
    if (prop === 'test' || prop === 'exec') rows.calls.push({method:prop,offset:node.start,line:node.loc.start.line,column:node.loc.start.column,parent:parent.type,expression:source.slice(node.start,node.end)});
  }
  for (const [key,value] of Object.entries(node)) {
    if (key==='loc'||key==='regex') continue;
    if (Array.isArray(value)) for(const child of value) walk(child,node,rows,source);
    else if(value && typeof value==='object') walk(value,node,rows,source);
  }
}
const output={};
for(const [label,sample] of Object.entries(report.samples)) {
  const rows=[];
  for(const item of sample.js) {
    const source=fs.readFileSync(path.join(sample.extracted_js_cache,item.path),'utf8');
    const row={path:item.path,sha256:crypto.createHash('sha256').update(source).digest('hex'),regex:[],calls:[]};
    walk(acorn.parse(source,{ecmaVersion:5,locations:true}),null,row,source);
    rows.push(row);
  }
  output[label]=rows;
}
const sourceRoot=path.join(__dirname,'../../entry/src/main/js/MainAbility');
output.source=[];
function scan(dir) {
  for(const d of fs.readdirSync(dir,{withFileTypes:true})) {
    const name=path.join(dir,d.name);
    if(d.isDirectory()) scan(name);
    else if(name.endsWith('.js')) {
      const source=fs.readFileSync(name,'utf8');
      const row={path:path.relative(sourceRoot,name),regex:[],calls:[]};
      walk(acorn.parse(source,{ecmaVersion:2020,sourceType:'module',locations:true}),null,row,source);
      if(row.regex.length||row.calls.length) output.source.push(row);
    }
  }
}
scan(sourceRoot);
fs.writeFileSync(path.join(__dirname,'evidence/ast-inventory.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(output).map(([name,rows])=>[name,rows.map(r=>({file:r.path,regex:r.regex.length,test:r.calls.filter(c=>c.method==='test').length,exec:r.calls.filter(c=>c.method==='exec').length}))])),null,2));
