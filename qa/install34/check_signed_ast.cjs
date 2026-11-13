// Host-only strict AST check of the exact signed JavaScript files passed by the gate.
const fs = require('node:fs');
const acorn = require('../../tools/sign/node_modules/acorn');
function inspect(node, bad) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'Literal' && node.regex) bad.push('regexp-literal@'+node.start);
  // Reject statically named references, including aliases and local bindings.
  // This is not data-flow analysis or protection against arbitrary obfuscation.
  if (node.type === 'Identifier' && (node.name === 'RegExp' || node.name === 'require')) {
    bad.push(node.name+'@'+node.start);
  }
  // Dot members/identifier keys are covered above; also check literal keys.
  const property = node.type === 'MemberExpression' && node.computed ? node.property :
    node.type === 'Property' ? node.key : null;
  if (property && property.type === 'Literal' && (property.value === 'RegExp' || property.value === 'require')) {
    bad.push(property.value+'@'+property.start);
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'regex') continue;
    if (Array.isArray(value)) value.forEach(child => inspect(child, bad));
    else if (value && typeof value === 'object') inspect(value, bad);
  }
}
const files=process.argv.slice(2);
if (!files.length) throw new Error('No signed JS inputs');
const rows=files.map(file => {
  const bad=[];
  inspect(acorn.parse(fs.readFileSync(file,'utf8'), {ecmaVersion:5}),bad);
  return {file,bad};
});
console.log(JSON.stringify(rows));
if (rows.some(row=>row.bad.length)) process.exitCode=1;
