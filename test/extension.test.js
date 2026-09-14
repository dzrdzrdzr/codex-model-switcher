'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

function harness(platform='linux', remoteName='ssh-remote') {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'switcher-test-'));
  const lines=[];
  const vscode={
    env:{remoteName},
    workspace:{workspaceFolders:[],getConfiguration:()=>({get:(_,fallback)=>fallback})},
    window:{createOutputChannel:()=>({appendLine:s=>lines.push(s),show:()=>{}})}};
  const sandbox={module:{exports:{}},console:{log:()=>{}},setTimeout,clearTimeout,Buffer,
    process:{platform,env:{PATH:process.env.PATH,LOCALAPPDATA:path.join(root,'Local')}},
    require:id=>id==='vscode'?vscode:id==='os'?{homedir:()=>root}:id==='./lib/config'?require('../lib/config'):require(id)};
  const source=fs.readFileSync(path.join(__dirname,'../extension.js'),'utf8');
  vm.runInNewContext(source+`\nmodule.exports.testing={currentTarget,runProcess,localStatus,atomicWrite};`,sandbox);
  return {...sandbox.module.exports.testing, root, lines, cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}

for (const platform of ['linux','darwin']) test(`local ${platform} fails before writes`,()=>{
 const local=harness(platform,null);
 try {assert.throws(()=>local.currentTarget(),/requires Windows/); assert.deepEqual(fs.readdirSync(local.root),[]);}
 finally {local.cleanup();}
});

test('Windows local scope and Linux SSH scope are distinct',()=>{
 const local=harness('win32',null), remote=harness();
 try {assert.equal(local.currentTarget().kind,'local');assert.equal(remote.currentTarget().kind,'remote-host');}
 finally {local.cleanup();remote.cleanup();}
});

for (const remote of ['wsl','dev-container','codespaces']) test(`rejects unsupported remote ${remote}`,()=>{
 const h=harness('linux',remote);
 try {assert.throws(()=>h.currentTarget(),/supports local VS Code and Remote SSH/);} finally {h.cleanup();}
});

test('sensitive subprocess failure withholds stdout, stderr and error detail',async()=>{
 const h=harness();
 const sentinel='FAKE_CREDENTIAL_FOR_REGRESSION_ONLY';
 try {
   await assert.rejects(h.runProcess(process.execPath,['-e',"process.stdin.on('data', b => { process.stdout.write(b); process.stderr.write(b); }); process.stdin.on('end', () => process.exit(2));"],
     {input:sentinel,sensitiveOutput:true,timeout:3000}), e=>!e.message.includes(sentinel)&&e.message.includes('withheld'));
   assert.ok(!h.lines.join('\n').includes(sentinel));
 } finally {h.cleanup();}
});

test('atomic writes support spaces and Unicode; no temporary files remain',()=>{
 const h=harness();
 try {
  const p=path.join(h.root,'测试 space','config.toml');
  h.atomicWrite(p,'first\n');h.atomicWrite(p,'second\n');
  assert.equal(fs.readFileSync(p,'utf8'),'second\n');
  assert.deepEqual(fs.readdirSync(path.dirname(p)),['config.toml']);
  if(process.platform!=='win32') assert.equal(fs.statSync(p).mode&0o777,0o600);
 } finally {h.cleanup();}
});

test('local status does not return a credential value',()=>{
 const h=harness('win32',null);
 try {
  const home=path.join(h.root,'.codex-vscode-deepseek'); fs.mkdirSync(home,{recursive:true});
  const runtime=path.join(h.root,'Local','Codex-Direct-Model-Switcher');fs.mkdirSync(runtime,{recursive:true});
  fs.writeFileSync(path.join(runtime,'mode.txt'),'deepseek\n');
  fs.writeFileSync(path.join(home,'config.toml'),require('../lib/config').configureDeepSeekConfig('',{
   model:'deepseek-v4-pro',effort:'high',modelCatalogPath:path.join(home,'models.json'),apiKey:'FAKE_CREDENTIAL_FOR_REGRESSION_ONLY'}));
  const state=h.localStatus(); assert.equal(state.apiKeyConfigured,true);
  assert.ok(!JSON.stringify(state).includes('FAKE_CREDENTIAL_FOR_REGRESSION_ONLY'));
 }finally {h.cleanup();}
});
