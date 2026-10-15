'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../_site');
const base = 'https://dzrdzrdzr.github.io/codex-model-switcher/';
const content = require('../docs/site-content.json');
const search = require('../docs/search-content.json');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const decode = text => text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const canonicals = new Set();
const titles = new Set();
const descriptions = new Set();
let pages = 0, links = 0, questions = 0;
for (const sub of ['', 'zh']) for (const name of fs.readdirSync(path.join(root, sub))) {
  if (!name.endsWith('.html')) continue;
  const file = path.join(root, sub, name);
  const html = fs.readFileSync(file, 'utf8');
  const lang = sub ? 'zh' : 'en';
  const prefix = sub ? 'zh/' : '';
  const slug = name === 'index.html' ? '' : name.slice(0, -5);
  const canonical = base + prefix + (slug ? slug + '.html' : '');
  pages++;
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `One h1 required: ${file}`);
  assert.match(html, new RegExp(`<html lang="${sub ? 'zh-CN' : 'en'}"`));
  assert.match(html, /name="viewport"/);
  assert.match(html, /name="robots" content="index,follow,max-image-preview:large"/);
  assert.ok(!/noindex|nosnippet/i.test(html), `Unexpected indexing restriction: ${file}`);
  assert.ok(!/<script(?![^>]*type="application\/ld\+json")/i.test(html), 'No executable site scripts');
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `Wrong canonical: ${file}`);
  assert.ok(!canonicals.has(canonical), `Duplicate canonical: ${canonical}`);
  canonicals.add(canonical);
  for (const [label, languagePrefix] of [['en', ''], ['zh-CN', 'zh/'], ['x-default', '']]) {
    const alternate = base + languagePrefix + (slug ? slug + '.html' : '');
    assert.ok(html.includes(`<link rel="alternate" hreflang="${label}" href="${alternate}">`), `Wrong language alternate: ${file}, ${label}`);
  }
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/name="description" content="([^"]+)"/)?.[1];
  assert.ok(title && title.includes('Codex DeepSeek Switcher') && !titles.has(title), `Missing/duplicate title: ${file}`);
  assert.ok(description && !descriptions.has(description), `Missing/duplicate description: ${file}`);
  titles.add(title); descriptions.add(description);
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  const schema = JSON.parse(json);
  assert.equal(schema['@context'], 'https://schema.org');
  const webpage = schema['@graph'].find(item => item['@id'] === canonical + '#webpage');
  assert.ok(webpage, `Missing page-specific structured data: ${file}`);
  assert.equal(webpage.description, decode(description));
  assert.equal(webpage.inLanguage, sub ? 'zh-CN' : 'en');
  if (slug === 'faq') {
    assert.equal(webpage['@type'], 'FAQPage');
    assert.equal(webpage.mainEntity.length, search[lang].questions.length);
    for (const q of search[lang].questions) {
      assert.ok(html.includes(`<h2>${esc(q.question)}</h2>`), 'Structured FAQ question must be visible');
      assert.ok(html.includes(`<p>${esc(q.answer)}</p>`), 'Structured FAQ answer must be visible');
      const entity = webpage.mainEntity.find(item => item.name === q.question);
      assert.equal(entity?.acceptedAnswer.text, q.answer);
      questions++;
    }
  }
  for (const [, raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = decode(raw);
    assert.ok(!/^(?:http:|javascript:|data:)/i.test(url), 'Unsafe URL');
    const resolved = new URL(url, canonical);
    if (!resolved.href.startsWith(base)) continue;
    const relative = decodeURIComponent(resolved.pathname.slice(new URL(base).pathname.length));
    let target = path.resolve(root, relative || 'index.html');
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    assert.ok(target.startsWith(root + path.sep), 'Link leaves site directory');
    assert.ok(fs.existsSync(target), `Broken local link in ${file}: ${url}`);
    if (resolved.hash && target.endsWith('.html')) {
      const destination = fs.readFileSync(target, 'utf8');
      assert.ok(destination.includes(`id="${decodeURIComponent(resolved.hash.slice(1))}"`), `Broken fragment: ${url}`);
    }
    links++;
  }
  for (const [, attrs] of html.matchAll(/<img\b([^>]*)>/g)) assert.match(attrs, /\balt="/);
}
const expectedPages = Object.values(content).reduce((count, c) => count + c.guides.length + 2, 0);
assert.equal(pages, expectedPages, 'Expected two homepages, two FAQs and all localized guides');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => decode(match[1]));
assert.equal(sitemapUrls.length, pages);
assert.deepEqual(new Set(sitemapUrls), canonicals, 'Sitemap and canonical URLs must match');
console.log(`PASS: ${pages} HTML pages; ${links} internal links/resources; ${questions} visible FAQ answers; canonical/hreflang/sitemap/schema/no-script checks.`);
