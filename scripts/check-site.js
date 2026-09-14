'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../_site');
let pages=0,links=0;
for(const sub of ['','zh']) for(const name of fs.readdirSync(path.join(root,sub))) {
  if(!name.endsWith('.html'))continue;
  const file=path.join(root,sub,name);const html=fs.readFileSync(file,'utf8');pages++;
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`One h1 required: ${file}`);
  assert.match(html,/<html lang="(?:en|zh-CN)"/);assert.match(html,/name="viewport"/);assert.match(html,/rel="canonical"/);
  assert.ok(!/<script(?![^>]*type="application\/ld\+json")/i.test(html),'No executable site scripts');
  for(const [,url]of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if(/^(?:https:|#)/.test(url))continue;
    assert.ok(!/^(?:http:|javascript:|data:)/i.test(url),'Unsafe URL');
    const target=path.resolve(path.dirname(file),url.split('#')[0]);
    assert.ok(target.startsWith(root+path.sep),'Link leaves site directory');
    assert.ok(fs.existsSync(target),`Broken local link in ${file}: ${url}`);links++;
  }
  for(const [,attrs]of html.matchAll(/<img\b([^>]*)>/g))assert.match(attrs,/\balt="/);
}
assert.equal(pages,8,'Expected two homepages and six guides');
assert.equal((fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').match(/<loc>/g)||[]).length,pages);
console.log(`PASS: ${pages} HTML pages; ${links} local resource links; titles, language, metadata, alt attributes and no-script checks.`);
