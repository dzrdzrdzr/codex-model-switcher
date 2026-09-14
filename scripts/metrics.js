'use strict';
// Maintainer-only public aggregate snapshot. Never imported by the extension.
const fs=require('node:fs');
const path=require('node:path');
const repo='dzrdzrdzr/codex-model-switcher';
const api=`https://api.github.com/repos/${repo}`;
function count(value,name) {
  if(!Number.isInteger(value)||value<0)throw new Error(`Missing or invalid ${name}; not replacing unknown data with zero.`);
  return value;
}
function snapshot(repository,release,observedAt=new Date().toISOString()) {
  if(repository.full_name!==repo||repository.private!==false)throw new Error('Expected the public canonical repository.');
  return {schema_version:1,observed_at:observedAt,source:'public-github-api',repository:repo,
    stars:count(repository.stargazers_count,'stars'),forks:count(repository.forks_count,'forks'),
    latest_release:release===null?null:{tag:release.tag_name,published_at:release.published_at,
      assets:release.assets.map(a=>({name:a.name,downloads:count(a.download_count,'asset downloads')}))},
    traffic:null,marketplace_installs:null,
    notes:['Asset counts cover the latest release only, not unique users or all historical downloads.','Unknown traffic and Marketplace installs are null.','No extension telemetry or user contact.']};
}
async function collect(fetchFn=fetch) {
  async function get(url,allow404=false) {
    const r=await fetchFn(url,{headers:{Accept:'application/vnd.github+json','User-Agent':'codex-switcher-public-metrics'},redirect:'error',signal:AbortSignal.timeout(15000)});
    if(allow404&&r.status===404)return null;
    if(!r.ok)throw new Error(`GitHub returned HTTP ${r.status}; no numeric snapshot was inferred.`);
    return r.json();
  }
  const [metadata,latest]=await Promise.all([get(api),get(api+'/releases/latest',true)]);
  return snapshot(metadata,latest);
}
module.exports={snapshot,collect};
if(require.main===module) (async()=>{
  const args=process.argv.slice(2);
  if(args.length&&!(args.length===2&&args[0]==='--out'))throw new Error('Usage: npm run metrics -- [--out snapshot.json]');
  const data=await collect();
  const output=path.resolve(args[1]||path.join('.metrics',`${data.observed_at.replace(/[:.]/g,'-')}.json`));
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
  console.log(`Public aggregate snapshot written: ${output}`);
})().catch(e=>{console.error(`Metrics failed: ${e.message}`);process.exitCode=1;});
