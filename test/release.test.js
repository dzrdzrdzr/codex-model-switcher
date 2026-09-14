'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {check}=require('../scripts/release-tools');
const pkg=require('../package.json');

test('release accepts the canonical identity and matching tag',()=>assert.equal(check(pkg,`v${pkg.version}`).version,pkg.version));
for(const [name,change] of [['publisher',{publisher:'hanzaidao'}],['package name',{name:'different'}],['floating tool version',{buildTools:{vsce:'^3'}}]]) {
 test(`release rejects wrong ${name}`,()=>assert.throws(()=>check({...pkg,...change})));
}
test('release rejects a tag/source version mismatch',()=>assert.throws(()=>check(pkg,'v0.0.1')));
test('release prevents loss of old command IDs',()=>assert.throws(()=>check({...pkg,contributes:{commands:[]}})));
