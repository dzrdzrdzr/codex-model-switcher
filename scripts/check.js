'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const files=['extension.js'];
for(const dir of ['lib','scripts','test']) for(const name of fs.readdirSync(path.join(root,dir))) {
  if(name.endsWith('.js')) files.push(`${dir}/${name}`);
}
for(const name of files) execFileSync(process.execPath,['--check',path.join(root,name)],{stdio:'inherit'});
require('./release-tools').check();
console.log(`Syntax checked: ${files.length} JavaScript files.`);
