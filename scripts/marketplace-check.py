#!/usr/bin/env python3
"""Read public Marketplace metadata; never retrieve publisher credentials."""
import argparse
import datetime
import io
import json
from pathlib import Path
import urllib.error
import urllib.request
import zipfile

REPOSITORY = Path(__file__).resolve().parents[1]
IDENTITY = 'dzr.codex-local-model-switcher'
QUERY_URL = 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery'
PACKAGE_URL = 'https://marketplace.visualstudio.com/_apis/public/gallery/publishers/dzr/vsextensions/codex-local-model-switcher/latest/vspackage'

def version_tuple(value):
    parts = value.split('.')
    if len(parts) != 3 or not all(p.isdigit() for p in parts):
        raise ValueError('Unsupported version format')
    return tuple(int(p) for p in parts)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default='dist/marketplace-status.json')
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--require-publishable', action='store_true')
    args = parser.parse_args()
    candidate = json.loads((REPOSITORY/'package.json').read_text())['version']
    status = {'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'extension_id': IDENTITY, 'candidate_version': candidate, 'status': 'unavailable',
              'published_version': None, 'candidate_strictly_newer': None,
              'published_binary_verified': False}
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    try:
        payload = {'filters': [{'criteria': [{'filterType': 7, 'value': IDENTITY}], 'pageNumber': 1, 'pageSize': 1}],
                   'flags': 1 | 128 | 256 | 512}
        request = urllib.request.Request(QUERY_URL, data=json.dumps(payload).encode(),
            headers={'Content-Type': 'application/json', 'Accept': 'application/json;api-version=7.2-preview.1',
                     'User-Agent': 'codex-model-switcher-release-check'}, method='POST')
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.load(response)
        matches = [ext for result in data.get('results', []) for ext in result.get('extensions', [])
                   if ext.get('publisher', {}).get('publisherName') == 'dzr'
                   and ext.get('extensionName') == 'codex-local-model-switcher']
        if len(matches) != 1:
            status.update(status='not_found', candidate_strictly_newer=True)
        else:
            extension = matches[0]
            latest = max(extension['versions'], key=lambda row: version_tuple(row['version']))
            version = latest['version']
            status.update(status='found', published_version=version,
                published_last_updated=latest.get('lastUpdated'),
                candidate_strictly_newer=version_tuple(candidate)>version_tuple(version))
            if args.download:
                try:
                    with urllib.request.urlopen(PACKAGE_URL, timeout=45) as response:
                        raw = response.read(16*1024*1024 + 1)
                    if len(raw)>16*1024*1024: raise ValueError('Unexpectedly large package')
                    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
                        package = json.loads(archive.read('extension/package.json'))
                    if package['publisher']+'.'+package['name'] != IDENTITY or package['version'] != version:
                        raise ValueError('Published package identity/version mismatch')
                    (output.parent/'marketplace-current.vsix').write_bytes(raw)
                    status['published_binary_verified'] = True
                except (OSError, ValueError, KeyError, zipfile.BadZipFile) as error:
                    status['binary_error'] = str(error)[:200]
    except (OSError, ValueError, KeyError, TypeError) as error:
        status['error'] = str(error)[:200]
    output.write_text(json.dumps(status, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(status, indent=2))
    if args.require_publishable and status['candidate_strictly_newer'] is not True:
        raise SystemExit('Marketplace preflight did not establish a strictly newer candidate; publishing blocked.')

if __name__ == '__main__': main()
