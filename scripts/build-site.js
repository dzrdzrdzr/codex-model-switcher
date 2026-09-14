'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'_site');
const data=JSON.parse(fs.readFileSync(path.join(root,'docs/site-content.json'),'utf8'));
const repo='https://github.com/dzrdzrdzr/codex-model-switcher';
const market='https://marketplace.visualstudio.com/items?itemName=dzr.codex-local-model-switcher';
const base='https://dzrdzrdzr.github.io/codex-model-switcher/';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const locations=[];
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(path.join(out,'zh'),{recursive:true});
fs.copyFileSync(path.join(root,'docs/site.css'),path.join(out,'site.css'));
fs.copyFileSync(path.join(root,'assets/icon.png'),path.join(out,'icon.png'));
function page(lang,slug,title,description,body) {
  const c=data[lang];const prefix=lang==='zh'?'../':'';
  const file=(lang==='zh'?'zh/':'')+(slug?slug+'.html':'index.html');
  const alternate=(lang==='zh'?'../':'zh/')+(slug?slug+'.html':'index.html');
  const canonical=base+(file==='index.html'?'':file);
  const schema={'@context':'https://schema.org','@type':'SoftwareApplication',name:'Codex DeepSeek Switcher',applicationCategory:'DeveloperApplication',operatingSystem:'Windows x64 (local), Linux (Remote SSH only)',description:c.description,codeRepository:repo,url:base,license:repo+'/blob/main/LICENSE'};
  const html=`<!doctype html>
<html lang="${lang==='zh'?'zh-CN':'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | Codex DeepSeek Switcher</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="${lang==='zh'?'en':'zh-CN'}" href="${base+(lang==='zh'?'':'zh/')+(slug?slug+'.html':'index.html')}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${base}icon.png">
<link rel="stylesheet" href="${prefix}site.css"><link rel="icon" href="${prefix}icon.png">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script></head>
<body><a class="skip" href="#main">${lang==='zh'?'跳到正文':'Skip to content'}</a><header><nav aria-label="${lang==='zh'?'主导航':'Main navigation'}"><a class="brand" href="index.html"><img src="${prefix}icon.png" alt="" width="32" height="32">Codex DeepSeek Switcher</a><a href="${repo}">GitHub</a><a href="${alternate}" lang="${lang==='zh'?'en':'zh-CN'}">${lang==='zh'?'English':'简体中文'}</a></nav></header><main id="main">${body}</main><footer><div class="footer-links"><a href="${repo}/blob/main/docs/PRIVACY.md">${esc(c.privacy)}</a><a href="${repo}/blob/main/docs/VALIDATION.md">${lang==='zh'?'验证范围':'Verification scope'}</a><a href="${prefix}llms.txt">llms.txt</a></div><p>${esc(c.footer)}</p></footer></body></html>\n`;
  fs.writeFileSync(path.join(out,file),html);locations.push(canonical);
}
for(const lang of ['en','zh']) {
  const c=data[lang];
  const buttons=`<div class="actions"><a class="button primary" href="${market}">${esc(c.install)}</a><a class="button" href="${repo}">${esc(c.source)}</a><a class="button" href="${repo}/releases/latest">${esc(c.download)}</a></div>`;
  page(lang,'',c.title.replace('\n',' '),c.description,`<section class="hero"><div class="eyebrow">${esc(c.label)}</div><h1>${esc(c.title).replace('\n','<br>')}</h1><p class="lead">${esc(c.description)}</p>${buttons}<p class="install">code --install-extension dzr.codex-local-model-switcher</p></section>
<section class="section"><h2>${esc(c.guidesTitle)}</h2><div class="grid">${c.guides.map((g,i)=>`<article class="card"><p class="number">0${i+1}</p><h3>${esc(g.title)}</h3><p>${esc(g.summary)}</p><a href="${g.slug}.html">${esc(c.more)}</a></article>`).join('')}</div></section>
<section class="section"><h2>${esc(c.scopeTitle)}</h2><div class="grid flow">${[c.local,c.remote].map(t=>`<article class="card"><h3>${esc(t)}</h3><code class="profiles">${esc(c.profile).replace(' · ','<br>')}</code><p>${esc(c.choice)}</p></article>`).join('')}</div><p class="note">${esc(c.scopeNote)}</p></section>
<section class="section"><h2>${esc(c.limitsTitle)}</h2><div class="limits">${c.limits.map(t=>`<p>${esc(t)}</p>`).join('')}</div><p>${esc(c.star)}</p></section>`);
  for(const g of c.guides) page(lang,g.slug,g.title,g.summary,`<article class="guide"><div class="eyebrow">${esc(c.guideLabel)}</div><h1>${esc(g.title)}</h1><p class="lead">${esc(g.summary)}</p><ol class="steps">${g.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><pre><code>${esc(g.command)}</code></pre><p class="note">${esc(g.note)}</p><a href="${repo}/blob/main/docs/guides.md#${g.slug}">${lang==='zh'?'仓库完整指南':'Full repository guide'}</a><br><a class="return" href="index.html">← ${esc(c.home)}</a></article>`);
}
fs.writeFileSync(path.join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+locations.map(l=>`<url><loc>${esc(l)}</loc></url>`).join('')+'</urlset>\n');
fs.writeFileSync(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`);
fs.writeFileSync(path.join(out,'.nojekyll'),'');
fs.copyFileSync(path.join(root,'llms.txt'),path.join(out,'llms.txt'));
console.log(`Built ${locations.length} bilingual HTML pages in _site (not deployed).`);
