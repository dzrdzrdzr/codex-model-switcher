'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const readPackage=()=>JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
function check(pkg=readPackage(),tag) {
  if(pkg.name!=='codex-local-model-switcher'||pkg.publisher!=='dzr') throw new Error('Extension identity must be dzr.codex-local-model-switcher.');
  if(!/^\d+\.\d+\.\d+$/.test(pkg.version)) throw new Error('A stable x.y.z package version is required.');
  if(tag!==undefined&&tag!==`v${pkg.version}`) throw new Error(`Tag ${tag} does not match v${pkg.version}.`);
  if(!/^\d+\.\d+\.\d+$/.test(pkg.buildTools?.vsce||'')) throw new Error('Pin an exact vsce version.');
  const commands=new Set(pkg.contributes.commands.map(c=>c.command));
  for(const prefix of ['codexLocalModelSwitcher','codexModelSwitcher']) for(const suffix of ['switch','useGpt','useDeepSeek','status','repair']) {
    if(!commands.has(`${prefix}.${suffix}`)) throw new Error(`Missing legacy command ${prefix}.${suffix}`);
  }
  return pkg;
}
function runVsce(args,capture=false) {
  if(!process.env.npm_execpath) throw new Error('Run through npm run package:list or npm run package:vsix.');
  return execFileSync(process.execPath,[process.env.npm_execpath,'exec','--yes',`--package=@vscode/vsce@${readPackage().buildTools.vsce}`,'--','vsce',...args],
    {cwd:root,encoding:'utf8',stdio:capture?['ignore','pipe','inherit']:'inherit'});
}
function main() {
  const [command='check',...args]=process.argv.slice(2);
  if(command==='check') {
    if(args.length&&!(args.length===2&&args[0]==='--tag')) throw new Error('Usage: check [--tag vX.Y.Z]');
    const pkg=check(readPackage(),args.length?args[1]:undefined);
    console.log(`Identity/version checked: ${pkg.publisher}.${pkg.name} ${pkg.version}`);return;
  }
  const pkg=check();
  if(command==='list') {process.stdout.write(runVsce(['ls','--no-dependencies'],true));return;}
  if(command!=='package') throw new Error('Expected check, list or package.');
  const dist=path.join(root,'dist');fs.mkdirSync(dist,{recursive:true});
  const name=`${pkg.name}-${pkg.version}.vsix`;
  const file=path.join(dist,name);
  const sourceRef=process.env.BUILD_SOURCE_REF||process.env.GITHUB_HEAD_REF||process.env.GITHUB_SHA||'main';
  runVsce(['package','--no-dependencies','--githubBranch',sourceRef,'--out',file]);
  const digest=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  fs.writeFileSync(path.join(dist,'SHA256SUMS'),`${digest}  ${name}\n`);
  console.log(`Packaged ${name}; inspect with python3 scripts/verify-vsix.py ${file}`);
}
module.exports={check};
if(require.main===module) {try{main();}catch(e){console.error(`Release check failed: ${e.message}`);process.exitCode=1;}}
