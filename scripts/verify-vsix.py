"""Validate a locally produced VSIX; never install it or contact a provider."""
from pathlib import Path
import hashlib
import json
import sys
import zipfile
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
ALLOWED={'package.json','extension.js','lib/config.js','scripts/remote-helper.sh',
         'scripts/compile-launcher.ps1','scripts/CodexProfileLauncher.cs',
         'assets/models.json','assets/icon.png','README.md','readme.md','CHANGELOG.md','changelog.md',
         'LICENSE','LICENSE.txt','SECURITY.md','docs/README.zh-CN.md','docs/TROUBLESHOOTING.md','docs/PRIVACY.md'}
REQUIRED={'package.json','extension.js','lib/config.js','scripts/remote-helper.sh',
          'scripts/compile-launcher.ps1','scripts/CodexProfileLauncher.cs','assets/models.json','assets/icon.png'}

def verify(file):
    source=json.loads((ROOT/'package.json').read_text())
    with zipfile.ZipFile(file) as z:
        names={n for n in z.namelist() if not n.endswith('/')}
        assert len(names)==sum(not n.endswith('/') for n in z.namelist()),'Duplicate ZIP entries'
        files={n.removeprefix('extension/') for n in names if n.startswith('extension/')}
        assert REQUIRED<=files, f'Missing runtime files: {REQUIRED-files}'
        assert files<=ALLOWED, f'Unexpected packaged files: {files-ALLOWED}'
        assert names-{f'extension/{n}' for n in files}<={'extension.vsixmanifest','[Content_Types].xml'},'Unexpected archive root entry'
        pkg=json.loads(z.read('extension/package.json'))
        assert pkg['publisher']=='dzr' and pkg['name']=='codex-local-model-switcher','Incorrect extension ID'
        assert pkg['version']==source['version'],'Packaged/source version mismatch'
        for name in REQUIRED-{'package.json'}:
            assert z.read('extension/'+name)==(ROOT/name).read_bytes(),f'Packaged file differs from source: {name}'
        manifest=ET.fromstring(z.read('extension.vsixmanifest'))
        identity=next(e for e in manifest.iter() if e.tag.rsplit('}',1)[-1]=='Identity')
        assert identity.attrib['Publisher']==pkg['publisher'],'Manifest publisher mismatch'
        assert identity.attrib['Id']==pkg['name'],'Manifest name mismatch'
        assert identity.attrib['Version']==pkg['version'],'Manifest version mismatch'
    digest=hashlib.sha256(file.read_bytes()).hexdigest()
    sums=file.parent/'SHA256SUMS'
    assert sums.exists(), 'Missing SHA256SUMS'
    assert f'{digest}  {file.name}' in sums.read_text().splitlines(),'Checksum mismatch'
    print(f'PASS: {file.name}; {len(files)} allowlisted extension files; identity, runtime bytes and checksum verified.')

if __name__=='__main__':
    if len(sys.argv)!=2: raise SystemExit('Usage: python3 scripts/verify-vsix.py dist/package.vsix')
    try: verify(Path(sys.argv[1]))
    except (AssertionError,ValueError,KeyError,OSError,StopIteration,ET.ParseError,zipfile.BadZipFile) as e:
        raise SystemExit(f'VSIX verification failed: {e}')
