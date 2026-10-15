#!/usr/bin/env python3
"""Verify the deployed project bytes, then optionally send one IndexNow batch.

No visitor tracking, account credentials, automatic retries of submissions,
external-site URLs, or claims of search-engine indexing are involved.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

BASE = 'https://dzrdzrdzr.github.io/codex-model-switcher/'
HOST = 'dzrdzrdzr.github.io'
ENDPOINT = 'https://api.indexnow.org/indexnow'
ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 2_000_000
UA = 'CodexDeepSeekSwitcher-PublicationVerification/1.0'


def fetch(url: str, payload: bytes | None = None) -> tuple[int, bytes, dict]:
    headers = {'User-Agent': UA, 'Cache-Control': 'no-cache'}
    if payload is not None:
        if url != ENDPOINT:
            raise ValueError('IndexNow POST endpoint is fixed')
        headers['Content-Type'] = 'application/json; charset=utf-8'
    req = urllib.request.Request(url, data=payload, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            if response.url != url:
                raise ValueError('Unexpected redirect for ' + url)
            body = response.read(MAX_BYTES + 1)
            if len(body) > MAX_BYTES:
                raise ValueError('Response too large')
            return response.status, body, dict(response.headers)
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read(4000), dict(exc.headers)


def site_urls(site: Path) -> list[str]:
    xml = ET.fromstring((site / 'sitemap.xml').read_bytes())
    urls = [n.text or '' for n in xml.findall('{*}url/{*}loc')]
    if len(urls) != 10 or len(set(urls)) != len(urls):
        raise ValueError('Expected exactly ten unique published HTML pages')
    for url in urls:
        u = urllib.parse.urlsplit(url)
        if not url.startswith(BASE) or u.query or u.fragment or u.netloc != HOST:
            raise ValueError('Submission must stay within the project site')
        relative = u.path.removeprefix('/codex-model-switcher/')
        if '..' in relative or '%' in relative or '\\' in relative:
            raise ValueError('Invalid sitemap path')
    return urls


def verify_bytes(site: Path, urls: list[str], key: str) -> list[dict]:
    records = []
    resources = urls + [BASE + p for p in ['sitemap.xml', 'site.css', 'icon.png', 'llms.txt', key + '.txt']]
    for url in resources:
        relative = url.removeprefix(BASE)
        local = site / ((relative + 'index.html') if not relative or relative.endswith('/') else relative)
        expected = local.read_bytes()
        record = {'url': url, 'matches_build': False}
        # Bounded GET retries only, to accommodate Pages CDN propagation.
        for attempt in range(3):
            status, body, headers = fetch(url)
            record.update(http_status=status, sha256=hashlib.sha256(body).hexdigest(),
                          expected_sha256=hashlib.sha256(expected).hexdigest())
            if status == 200 and body == expected:
                robot_header = ','.join(v for k, v in headers.items() if k.lower() == 'x-robots-tag')
                if re.search(r'\b(noindex|none|nosnippet)\b', robot_header, re.I):
                    raise ValueError('Restrictive X-Robots-Tag: ' + url)
                record['matches_build'] = True
                break
            if attempt < 2:
                time.sleep(10)
        records.append(record)
        if not record['matches_build']:
            raise ValueError('Live bytes do not match the approved build: ' + url)
    return records


def check_robots(urls: list[str]) -> dict:
    url = 'https://' + HOST + '/robots.txt'
    status, body, _ = fetch(url)
    result = {'url': url, 'http_status': status}
    if status in (404, 410):
        result.update(status='no_host_root_robots_file', blocked=[])
        return result
    if status != 200:
        raise ValueError('Could not verify host-root robots policy: HTTP ' + str(status))
    parser = urllib.robotparser.RobotFileParser()
    parser.parse(body.decode('utf-8', errors='replace').splitlines())
    blocked = [(agent, page) for agent in ['OAI-SearchBot', 'Googlebot', 'bingbot']
               for page in urls if not parser.can_fetch(agent, page)]
    result.update(status='parsed', blocked=blocked)
    if blocked:
        raise ValueError('Host-root robots policy blocks a target search crawler')
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--submit', action='store_true', help='Send exactly one IndexNow batch after verification')
    parser.add_argument('--prepare', action='store_true', help='Prepare the local ownership file; no network or submission')
    parser.add_argument('--offline', action='store_true', help='Validate the local build without network access')
    parser.add_argument('--output', default='dist/discovery-publication-evidence.json')
    args = parser.parse_args()
    if (args.offline or args.prepare) and args.submit:
        parser.error('--offline/--prepare and --submit are mutually exclusive')
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    evidence = {'checked_at_utc': datetime.now(timezone.utc).isoformat(),
                'source_sha': os.environ.get('GITHUB_SHA'), 'deployed_content_verified': False,
                'indexnow_received': False, 'search_indexing_verified': False,
                'google_search_console_submitted': False}
    try:
        site = ROOT / '_site'
        key = (ROOT / 'docs/indexnow-key.txt').read_text().strip()
        if not re.fullmatch('[a-f0-9]{32}', key):
            raise ValueError('Invalid project ownership key')
        if args.prepare:
            (site / (key + '.txt')).write_text(key + '\n')
        if (site / (key + '.txt')).read_text().strip() != key:
            raise ValueError('Key is missing from the site build')
        urls = site_urls(site)
        evidence['page_urls'] = urls
        if args.offline or args.prepare:
            evidence['local_build_validated'] = True
            print('PASS: ten project-scoped URLs and the ownership file (offline; not deployed/submitted).')
            return 0
        evidence['resources'] = verify_bytes(site, urls, key)
        evidence['robots'] = check_robots(urls)
        evidence['deployed_content_verified'] = True
        if args.submit:
            payload = {'host': HOST, 'key': key, 'keyLocation': BASE + key + '.txt', 'urlList': urls}
            status, body, _ = fetch(ENDPOINT, json.dumps(payload).encode('utf-8'))
            evidence['indexnow'] = {'endpoint': ENDPOINT, 'http_status': status,
                                   'url_count': len(urls), 'response': body.decode('utf-8', errors='replace')[:500],
                                   'key_validation_pending': status == 202}
            if status not in (200, 202):
                raise ValueError('IndexNow submission failed: HTTP ' + str(status) + '; no automatic resubmission')
            evidence['indexnow_received'] = True
        print(json.dumps(evidence, indent=2))
        return 0
    except Exception as exc:
        evidence['error'] = str(exc)
        print('FAILED: ' + str(exc))
        return 1
    finally:
        output.write_text(json.dumps(evidence, indent=2) + '\n')

if __name__ == '__main__':
    raise SystemExit(main())
