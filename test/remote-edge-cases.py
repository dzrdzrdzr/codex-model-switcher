"""Disposable-home integration tests. Codex is a mock; no credentials/network are used."""
from pathlib import Path
import json
import os
import shutil
import subprocess
import tempfile
import unittest
import tomllib

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / 'scripts/remote-helper.sh'
BASH = shutil.which('bash')

class RemoteTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='switcher-')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.home = self.make_home('用户 A space')
        self.config = self.root / 'uploaded.config.toml'
        self.config.write_text('''model = "deepseek-v4-pro"
model_provider = "deepseek"
model_reasoning_effort = "high"
model_catalog_json = "placeholder"
[model_providers.deepseek]
base_url = "https://api.deepseek.com/"
wire_api = "responses"
experimental_bearer_token = "FAKE_KEY_FOR_TESTS_ONLY"
''', encoding='utf-8')
        self.catalog = ROOT / 'assets/models.json'

    def make_home(self, name):
        home = self.root / name
        (home / '.codex').mkdir(parents=True)
        (home / '.codex/config.toml').write_text('model = "gpt-test"\n', encoding='utf-8')
        (home / '.codex/auth.json').write_text('{"fixture":"not-a-token"}\n', encoding='utf-8')
        (home / '.vscode-server/cli/servers/Stable-test/server/bin/remote-cli').mkdir(parents=True)
        binary = home / '.vscode-server/extensions/openai.chatgpt-99.0.0/bin/linux-x86_64/codex'
        binary.parent.mkdir(parents=True)
        binary.write_text('''#!/usr/bin/env python3
import json, os, sys
if '--version' in sys.argv:
    print('codex-cli 0.145.0')
else:
    print(json.dumps({'home': os.environ.get('CODEX_HOME'), 'args': sys.argv[1:]}))
''', encoding='utf-8')
        binary.chmod(0o700)
        return home

    def run_helper(self, *args, home=None, input=None, path=None):
        env = dict(os.environ, HOME=str(home or self.home))
        if path is not None: env['PATH'] = str(path)
        return subprocess.run([BASH, str(HELPER), *map(str,args)], env=env, input=input,
                              capture_output=True, text=True, timeout=15)

    def install(self, mode='deepseek', home=None):
        p = self.run_helper('install', mode, 'high', 'deepseek-v4-pro', self.config, self.catalog, home=home)
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertNotIn('FAKE_KEY_FOR_TESTS_ONLY', p.stdout+p.stderr)
        return p

    def test_round_trip_repeated_and_permissions(self):
        original = {p.name:p.read_bytes() for p in (self.home/'.codex').iterdir()}
        for mode in ['deepseek','deepseek','gpt','deepseek','gpt']:
            self.install(mode)
        for name, content in original.items(): self.assertEqual((self.home/'.codex'/name).read_bytes(),content)
        for p in [self.home/'.codex-vscode-mode', self.home/'.codex-vscode-deepseek/config.toml',self.home/'.codex-vscode-deepseek/models.json']:
            self.assertEqual(p.stat().st_mode & 0o777, 0o600)
        parsed=tomllib.loads((self.home/'.codex-vscode-deepseek/config.toml').read_text())
        self.assertEqual(parsed['model_catalog_json'],str((self.home/'.codex-vscode-deepseek/models.json').resolve()))

    def test_different_homes_are_independent_shared_home_is_not(self):
        other=self.make_home('用户 B')
        self.install('deepseek');self.install('gpt',home=other)
        self.assertIn('mode: deepseek',self.run_helper('status').stdout)
        self.assertIn('mode: gpt',self.run_helper('status',home=other).stdout)
        self.install('gpt',home=self.home)
        self.assertIn('mode: gpt',self.run_helper('status',home=self.home).stdout)

    def test_invalid_mode_effort_model_fail_without_state_write(self):
        for mode,effort,model in [('invalid','high','deepseek-v4-pro'),('gpt','invalid','deepseek-v4-pro'),('gpt','high','invalid')]:
            self.assertNotEqual(self.run_helper('install',mode,effort,model).returncode,0)
            self.assertFalse((self.home/'.codex-vscode-mode').exists())

    def test_missing_assets_fail_without_state_write(self):
        result=self.run_helper('install','deepseek','high','deepseek-v4-pro',self.root/'absent',self.catalog)
        self.assertNotEqual(result.returncode,0)
        self.assertFalse((self.home/'.codex-vscode-mode').exists())

    def test_corrupt_catalog_fails_before_overwriting_config(self):
        self.install('deepseek')
        before=(self.home/'.codex-vscode-deepseek/config.toml').read_bytes()
        bad=self.root/'bad.json';bad.write_text('{not valid json')
        result=self.run_helper('install','deepseek','high','deepseek-v4-pro',self.config,bad)
        self.assertNotEqual(result.returncode,0)
        self.assertEqual((self.home/'.codex-vscode-deepseek/config.toml').read_bytes(),before)

    def test_missing_dependency_fails_before_write(self):
        empty=self.root/'empty-path';empty.mkdir()
        result=self.run_helper('install','gpt',path=empty)
        self.assertEqual(result.returncode,127)
        self.assertIn('Missing required command: python3',result.stderr)
        self.assertFalse((self.home/'.local/bin').exists())

    def test_key_rotation_preserves_literal_backslashes_and_quotes(self):
        self.install('deepseek')
        key=r'FAKE_\g<1>_"quoted"_TEST_ONLY'
        result=self.run_helper('set-api-key',input=key)
        self.assertEqual(result.returncode,0,result.stderr)
        config=tomllib.loads((self.home/'.codex-vscode-deepseek/config.toml').read_text())
        self.assertEqual(config['model_providers']['deepseek']['experimental_bearer_token'],key)
        self.assertNotIn(key,result.stdout+result.stderr+self.run_helper('status').stdout)

    def test_launcher_handles_space_arguments(self):
        self.install('deepseek')
        launcher=self.home/'.local/bin/codex-vscode-profile'
        p=subprocess.run([str(launcher),'a b','中文'],env=dict(os.environ,HOME=str(self.home)),capture_output=True,text=True,timeout=10)
        self.assertEqual(p.returncode,0,p.stderr)
        result=json.loads(p.stdout)
        self.assertEqual(result['home'],str(self.home/'.codex-vscode-deepseek'))
        self.assertEqual(result['args'][-2:],['a b','中文'])

    def test_cleanup_refuses_unrelated_files(self):
        keep=self.root/'keep.config.toml';keep.write_text('keep')
        result=self.run_helper('cleanup',keep)
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertTrue(keep.exists())

if __name__=='__main__': unittest.main(verbosity=2)
