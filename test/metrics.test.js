'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {snapshot,collect}=require('../scripts/metrics');
const repo={full_name:'dzrdzrdzr/codex-model-switcher',private:false,stargazers_count:1,forks_count:0};
test('metrics keep unavailable fields null and real zero counts as zero',()=>{
 const s=snapshot(repo,{tag_name:'v0.2.7',published_at:'2026-08-20T03:50:05Z',assets:[{name:'fixture.vsix',download_count:0}]},'2026-09-14T00:00:00Z');
 assert.equal(s.traffic,null);assert.equal(s.marketplace_installs,null);assert.equal(s.latest_release.assets[0].downloads,0);
});
test('missing counts fail rather than fabricate zero',()=>assert.throws(()=>snapshot({...repo,stargazers_count:undefined},null)));
test('unreleased repository can have a null latest release',()=>assert.equal(snapshot(repo,null).latest_release,null));
test('HTTP failures do not create plausible-looking metrics',async()=>{
 await assert.rejects(collect(async()=>({ok:false,status:403})),/403/);
});
