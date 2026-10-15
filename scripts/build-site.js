'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, '_site');
const data = JSON.parse(fs.readFileSync(path.join(root, 'docs/site-content.json'), 'utf8'));
const search = JSON.parse(fs.readFileSync(path.join(root, 'docs/search-content.json'), 'utf8'));
const repo = 'https://github.com/dzrdzrdzr/codex-model-switcher';
const market = 'https://marketplace.visualstudio.com/items?itemName=dzr.codex-local-model-switcher';
const base = 'https://dzrdzrdzr.github.io/codex-model-switcher/';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const language = lang => lang === 'zh' ? 'zh-CN' : 'en';
const urlFor = (lang, slug) => base + (lang === 'zh' ? 'zh/' : '') + (slug ? slug + '.html' : '');
const locations = [];
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'zh'), { recursive: true });
fs.copyFileSync(path.join(root, 'docs/site.css'), path.join(out, 'site.css'));
fs.copyFileSync(path.join(root, 'assets/icon.png'), path.join(out, 'icon.png'));

function page(lang, slug, title, description, body, questions = []) {
  const c = data[lang];
  const s = search[lang];
  const prefix = lang === 'zh' ? '../' : '';
  const file = (lang === 'zh' ? 'zh/' : '') + (slug ? slug + '.html' : 'index.html');
  const alternate = (lang === 'zh' ? '../' : 'zh/') + (slug ? slug + '.html' : 'index.html');
  const canonical = urlFor(lang, slug);
  const software = {
    '@type': ['SoftwareApplication', 'SoftwareSourceCode'], '@id': base + '#software',
    name: 'Codex DeepSeek Switcher', applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Windows x64 (local), Linux (Remote SSH only)', description: s.description,
    codeRepository: repo, url: base, sameAs: [repo, market], license: repo + '/blob/main/LICENSE'
  };
  const webpage = {
    '@type': questions.length ? 'FAQPage' : 'WebPage', '@id': canonical + '#webpage',
    url: canonical, name: title, description, inLanguage: language(lang),
    about: { '@id': base + '#software' }
  };
  if (questions.length) webpage.mainEntity = questions.map(q => ({
    '@type': 'Question', name: q.question,
    acceptedAnswer: { '@type': 'Answer', text: q.answer }
  }));
  const graph = [software, webpage];
  if (slug) {
    webpage.breadcrumb = { '@id': canonical + '#breadcrumb' };
    graph.push({ '@type': 'BreadcrumbList', '@id': canonical + '#breadcrumb', itemListElement: [
      { '@type': 'ListItem', position: 1, name: c.home, item: urlFor(lang, '') },
      { '@type': 'ListItem', position: 2, name: title, item: canonical }
    ] });
  }
  const schema = { '@context': 'https://schema.org', '@graph': graph };
  const html = `<!doctype html>
<html lang="${language(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | Codex DeepSeek Switcher</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="${urlFor('en', slug)}"><link rel="alternate" hreflang="zh-CN" href="${urlFor('zh', slug)}"><link rel="alternate" hreflang="x-default" href="${urlFor('en', slug)}"><link rel="sitemap" type="application/xml" href="${base}sitemap.xml">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${base}icon.png">
<link rel="stylesheet" href="${prefix}site.css"><link rel="icon" href="${prefix}icon.png">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script></head>
<body><a class="skip" href="#main">${lang === 'zh' ? '跳到正文' : 'Skip to content'}</a><header><nav aria-label="${lang === 'zh' ? '主导航' : 'Main navigation'}"><a class="brand" href="index.html"><img src="${prefix}icon.png" alt="" width="32" height="32">Codex DeepSeek Switcher</a><a href="faq.html">${esc(s.faqLabel)}</a><a href="${repo}">GitHub</a><a href="${alternate}" lang="${lang === 'zh' ? 'en' : 'zh-CN'}">${lang === 'zh' ? 'English' : '简体中文'}</a></nav></header><main id="main">${body}</main><footer><div class="footer-links"><a href="${repo}/blob/main/docs/PRIVACY.md">${esc(c.privacy)}</a><a href="${repo}/blob/main/docs/VALIDATION.md">${lang === 'zh' ? '验证范围' : 'Verification scope'}</a><a href="${prefix}llms.txt">llms.txt</a></div><p>${esc(c.footer)}</p></footer></body></html>\n`;
  fs.writeFileSync(path.join(out, file), html);
  locations.push(canonical);
}

for (const lang of ['en', 'zh']) {
  const c = data[lang];
  const s = search[lang];
  const titleFor = g => s.guideTitles[g.slug] || g.title;
  const buttons = `<div class="actions"><a class="button primary" href="${market}">${esc(c.install)}</a><a class="button" href="${repo}">${esc(c.source)}</a><a class="button" href="${repo}/releases/latest">${esc(c.download)}</a></div>`;
  page(lang, '', s.title.replace('\n', ' '), s.description, `<section class="hero"><div class="eyebrow">${esc(c.label)}</div><h1>${esc(s.title).replace('\n', '<br>')}</h1><p class="lead">${esc(s.description)}</p>${buttons}<p class="install">code --install-extension dzr.codex-local-model-switcher</p></section>
<section class="section"><h2>${esc(c.guidesTitle)}</h2><div class="grid">${c.guides.map((g, i) => `<article class="card"><p class="number">0${i + 1}</p><h3>${esc(titleFor(g))}</h3><p>${esc(g.summary)}</p><a href="${g.slug}.html">${esc(c.more)}</a></article>`).join('')}</div></section>
<section class="section"><h2>${esc(s.faqLabel)}</h2><p>${esc(s.faqDescription)}</p>${s.questions.slice(0, 3).map(q => `<p><a href="faq.html#${esc(q.id)}">${esc(q.question)}</a></p>`).join('')}</section>
<section class="section"><h2>${esc(c.scopeTitle)}</h2><div class="grid flow">${[c.local, c.remote].map(t => `<article class="card"><h3>${esc(t)}</h3><code class="profiles">${esc(c.profile).replace(' · ', '<br>')}</code><p>${esc(c.choice)}</p></article>`).join('')}</div><p class="note">${esc(c.scopeNote)}</p></section>
<section class="section"><h2>${esc(c.limitsTitle)}</h2><div class="limits">${c.limits.map(t => `<p>${esc(t)}</p>`).join('')}</div><p>${esc(c.star)}</p></section>`);
  for (const g of c.guides) page(lang, g.slug, titleFor(g), g.summary, `<article class="guide"><div class="eyebrow">${esc(c.guideLabel)}</div><h1>${esc(titleFor(g))}</h1><p class="lead">${esc(g.summary)}</p><ol class="steps">${g.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol><pre><code>${esc(g.command)}</code></pre><p class="note">${esc(g.note)}</p><a href="${repo}/blob/main/docs/guides.md#${g.slug}">${lang === 'zh' ? '仓库完整指南' : 'Full repository guide'}</a><p><a href="faq.html">${esc(s.faqLabel)}</a></p><nav aria-label="${lang === 'zh' ? '相关指南' : 'Related guides'}">${c.guides.filter(other => other.slug !== g.slug).map(other => `<a href="${other.slug}.html">${esc(titleFor(other))}</a>`).join(' ')}</nav><a class="return" href="index.html">← ${esc(c.home)}</a></article>`);
  page(lang, 'faq', s.faqTitle, s.faqDescription, `<article class="guide"><div class="eyebrow">${esc(s.faqLabel)}</div><h1>${esc(s.faqTitle)}</h1><p class="lead">${esc(s.faqDescription)}</p><p><code>code --install-extension dzr.codex-local-model-switcher</code></p>${s.questions.map(q => `<section class="section" id="${esc(q.id)}"><h2>${esc(q.question)}</h2><p>${esc(q.answer)}</p><a href="${esc(q.guide)}.html">${esc(s.guideTitles[q.guide])}</a></section>`).join('')}<p><a href="${repo}">${esc(c.source)}</a> · <a href="${market}">${esc(c.install)}</a></p><a class="return" href="index.html">← ${esc(c.home)}</a></article>`, s.questions);
}
// English homepage: the approved editorial article, not the card-based layout.
fs.copyFileSync(path.join(root, 'docs/home.en.html'), path.join(out, 'index.html'));
fs.writeFileSync(path.join(out, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + locations.map(loc => `<url><loc>${esc(loc)}</loc></url>`).join('') + '</urlset>\n');
// A project-path robots.txt is NOT the host-root crawler policy. See DISCOVERABILITY.md.
fs.writeFileSync(path.join(out, 'robots.txt'), `# Project-site copy; effective host policy is https://dzrdzrdzr.github.io/robots.txt\nUser-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
fs.copyFileSync(path.join(root, 'llms.txt'), path.join(out, 'llms.txt'));
console.log(`Built ${locations.length} bilingual HTML pages in _site (not deployed or indexed).`);
