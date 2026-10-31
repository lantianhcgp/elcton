import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

// Synthetic ephemeral QA keys only. Never use an account or device signing key in tests.
const require = createRequire(new URL('../tools/sign/package.json', import.meta.url));
const JsZip = require('jszip');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'elcton-sign-qa-'));
function run(command, arguments_) {
  const result = spawnSync(command, arguments_, { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}
function certificate(name, issuer) {
  const pair = crypto.generateKeyPairSync('ec', { namedCurve: 'secp384r1',
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' } });
  const key = path.join(directory, name + '.pem');
  const cert = path.join(directory, name + '.crt');
  fs.writeFileSync(key, pair.privateKey, { mode: 0o600 });
  if (issuer) {
    const csr = path.join(directory, name + '.csr');
    run('openssl', ['req', '-new', '-key', key, '-out', csr, '-subj', '/CN=' + name]);
    run('openssl', ['x509', '-req', '-in', csr, '-CA', issuer.cert, '-CAkey', issuer.key,
      '-set_serial', name.endsWith('unrelated') ? '3' : '2', '-days', '1', '-out', cert]);
  } else {
    // The CMS verifier deliberately uses -noverify; only the QA issuer name matches the
    // bundled public chain. This synthetic CA is never trusted or shipped to a device.
    run('openssl', ['req', '-new', '-x509', '-key', key, '-out', cert, '-days', '1',
      '-subj', '/C=CN/O=Huawei/OU=Huawei CBG/CN=Huawei CBG Developer Relations CA G2']);
  }
  return { key, cert, pem: pair.privateKey };
}
const issuer = certificate('elcton-qa-issuer');
const signing = certificate('elcton-qa-signing', issuer);
const unrelated = certificate('elcton-qa-unrelated', issuer);
function profile(name, leaf) {
  const json = path.join(directory, name + '.json');
  const p7b = path.join(directory, name + '.p7b');
  const now = Math.floor(Date.now() / 1000);
  fs.writeFileSync(json, JSON.stringify({ 'bundle-info': {
    'bundle-name': 'elcton.qa.synthetic',
    'development-certificate': fs.readFileSync(leaf.cert, 'utf8')
  }, validity: { 'not-before': now - 60, 'not-after': now + 3600 } }));
  run('openssl', ['cms', '-sign', '-binary', '-nodetach', '-in', json,
    '-signer', signing.cert, '-inkey', signing.key, '-outform', 'DER', '-out', p7b]);
  return p7b;
}
const matchedProfile = profile('matched', signing);
const wrongProfile = profile('wrong', unrelated);
process.env.SIGN_P12_PEM = signing.pem;
process.env.FORCE_P7B_BUNDLE = '1';
const { signHap } = await import('../tools/sign/sign-app-to-hap.js');
const inner = new JsZip();
inner.file('config.json', JSON.stringify({ app: { bundleName: 'elcton.qa.synthetic',
  version: { code: 1000107, name: '1.0.7-qa' } } }));
inner.file('pages/index/index.js', 'SYNTHETIC_QA_PAYLOAD');
const outer = new JsZip();
outer.file('entry-default.hap', await inner.generateAsync({ type: 'nodebuffer' }));
const app = await outer.generateAsync({ type: 'nodebuffer' });
const valid = await signHap(app, fs.readFileSync(matchedProfile));
const validPath = path.join(directory, 'valid.hap');
fs.writeFileSync(validPath, valid);
function verify(hap, p7b = matchedProfile) {
  return spawnSync('python', ['tools/sign/verify_sign.py', hap, p7b], { encoding: 'utf8' });
}
test('matching synthetic signing identity creates a verifiable artifact', () => {
  const result = verify(validPath);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
test('signer rejects a private key not belonging to the profile certificate before packaging', async () => {
  await assert.rejects(signHap(app, fs.readFileSync(wrongProfile)), /SIGNING_IDENTITY_MISMATCH/);
});
test('verification rejects a modified unsigned payload even when the CMS remains intact', async () => {
  const zip = await JsZip.loadAsync(valid);
  const raw = await zip.file('signed.bin').async('nodebuffer');
  const index = raw.indexOf(Buffer.from('SYNTHETIC_QA_PAYLOAD'));
  assert.ok(index > 0);
  raw[index] ^= 1;
  zip.file('signed.bin', raw);
  const target = path.join(directory, 'modified.hap');
  fs.writeFileSync(target, await zip.generateAsync({ type: 'nodebuffer' }));
  const result = verify(target);
  assert.notEqual(result.status, 0, 'Tampered package was incorrectly accepted: ' + result.stdout);
});
test('verification rejects a signed CMS whose signer differs from the embedded profile leaf', async () => {
  const target = path.join(directory, 'wrong-identity.hap');
  try {
    fs.writeFileSync(target, await signHap(app, fs.readFileSync(wrongProfile)));
  } catch (error) {
    assert.match(error.message, /SIGNING_IDENTITY_MISMATCH/);
    return;
  }
  const result = verify(target, wrongProfile);
  assert.notEqual(result.status, 0, 'Wrong signing identity was incorrectly accepted: ' + result.stdout);
});
test('an explicitly requested profile cannot silently fall back to another certs file', () => {
  const result = verify(validPath, wrongProfile);
  assert.notEqual(result.status, 0, 'An unrelated requested profile was accepted: ' + result.stdout);
});
test.after(() => fs.rmSync(directory, { recursive: true, force: true }));
