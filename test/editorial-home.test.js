'use strict';
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '../docs/home.en.html'), 'utf8');

test('Editorial homepage is English-only, article-first and script-free', () => {
  assert.match(html, /<html lang="en">/);
  assert.ok(!/[\u3400-\u9fff]/u.test(html));
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  assert.match(html, /<article aria-labelledby="title">/);
  assert.match(html, /class="article-head"/);
  assert.match(html, /class="article-body"/);
  assert.ok(!/class="(?:card|hero|grid|button)(?:[ "])/.test(html));
  assert.ok(!/<script(?![^>]*type="application\/ld\+json")/i.test(html));
  assert.ok(!/@import|@font-face|<iframe|<form|onclick=/i.test(html));
});

test('Editorial homepage preserves real installation and documentation entry points', () => {
  for (const href of ['deepseek.html', 'openai.html', 'remote-ssh.html', 'faq.html']) {
    assert.ok(html.includes(`href="${href}"`), `Missing guide: ${href}`);
  }
  assert.ok(html.includes('code --install-extension dzr.codex-local-model-switcher'));
  assert.ok(html.includes('https://github.com/dzrdzrdzr/codex-model-switcher'));
  assert.ok(html.includes('stored in plaintext'));
  assert.ok(html.includes('not affiliated with or endorsed by'));
});
