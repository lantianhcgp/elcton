// Build-host-only packaging step. No compression transforms or identifier mangling.
import fs from 'node:fs';
import path from 'node:path';
import JSZip from '../tools/sign/node_modules/jszip/lib/index.js';
import { minify } from '../tools/sign/node_modules/terser/main.js';

const input = process.argv[2];
if (!input) throw new Error('Usage: compact_lite_app.mjs actual-built.app');
const app = await JSZip.loadAsync(fs.readFileSync(input));
const haps = Object.values(app.files).filter(f => !f.dir && f.name.endsWith('.hap'));
if (haps.length !== 1) throw new Error('Expected exactly one Lite HAP');
const hap = await JSZip.loadAsync(await haps[0].async('nodebuffer'));
const results = [];
for (const entry of Object.values(hap.files)) {
  if (entry.dir || !entry.name.endsWith('.js')) continue;
  const source = await entry.async('string');
  const result = await minify({[entry.name]: source}, {
    compress: false, mangle: false, ecma: 5,
    format: { comments: false, ascii_only: true },
    sourceMap: { filename: path.basename(entry.name), url: path.basename(entry.name) + '.map', includeSources: true }
  });
  if (typeof result.code !== 'string' || !result.map) throw new Error('Missing compact output');
  hap.file(entry.name, result.code);
  hap.file(entry.name + '.map', result.map);
  results.push({page: entry.name, before: Buffer.byteLength(source), after: Buffer.byteLength(result.code)});
}
app.file(haps[0].name, await hap.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
fs.writeFileSync(input, await app.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
console.log(JSON.stringify({action:'format-only-compaction',identifierMangling:false,compressionTransforms:false,results}));
