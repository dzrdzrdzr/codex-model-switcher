'use strict';

const TARGET_KEYS = new Set([
  'model',
  'model_provider',
  'preferred_auth_method',
  'forced_login_method',
  'model_reasoning_effort',
  'model_catalog_json'
]);

// These match the conflicts removed by DeepSeek's official Codex setup script.
const INCOMPATIBLE_KEYS = new Set([
  'profile',
  'oss_provider',
  'openai_base_url',
  'model_context_window',
  'model_auto_compact_token_limit',
  'model_auto_compact_token_limit_scope',
  'base_instructions',
  'model_instructions_file',
  'compact_prompt',
  'experimental_compact_prompt_file',
  'service_tier',
  'model_verbosity',
  'model_reasoning_summary',
  'plan_mode_reasoning_effort',
  'experimental_use_unified_exec_tool'
]);

const SECTION_PATTERN = /^\s*\[([^\]]+)]\s*(?:#.*)?$/;
const KEY_PATTERN = /^\s*([A-Za-z0-9_-]+)\s*=/;

function tomlString(value) {
  return JSON.stringify(String(value));
}

function normalizeSection(raw) {
  return raw.trim().replace(/["']/g, '').toLowerCase();
}

function shouldRemoveSection(section) {
  return section === 'model_providers.deepseek' ||
    section.startsWith('model_providers.deepseek.') ||
    section === 'model_providers.moonbridge' ||
    section.startsWith('model_providers.moonbridge.') ||
    section === 'profiles' ||
    section.startsWith('profiles.');
}

function countToken(text, token) {
  let count = 0;
  let index = 0;
  while ((index = text.indexOf(token, index)) !== -1) {
    count += 1;
    index += token.length;
  }
  return count;
}

function tripleDelimiterFor(line) {
  const doubleCount = countToken(line, '"""');
  if (doubleCount % 2 === 1) return '"""';
  const singleCount = countToken(line, "'''");
  if (singleCount % 2 === 1) return "'''";
  return undefined;
}

function skipAssignment(lines, start) {
  const line = lines[start];
  const equals = line.indexOf('=');
  const value = equals === -1 ? '' : line.slice(equals + 1);
  const delimiter = tripleDelimiterFor(value);
  if (!delimiter) return start + 1;

  let index = start + 1;
  while (index < lines.length) {
    if (countToken(lines[index], delimiter) % 2 === 1) return index + 1;
    index += 1;
  }
  return index;
}

function rewriteLeadingAndSections(source) {
  const lines = String(source || '').replace(/^\uFEFF/, '').split(/\r?\n/);
  const output = [];
  let section = '';
  let skipSection = false;
  let triple;

  for (let index = 0; index < lines.length;) {
    const line = lines[index];

    if (triple) {
      if (!skipSection) output.push(line);
      if (countToken(line, triple) % 2 === 1) triple = undefined;
      index += 1;
      continue;
    }

    const sectionMatch = SECTION_PATTERN.exec(line);
    if (sectionMatch) {
      section = normalizeSection(sectionMatch[1]);
      skipSection = shouldRemoveSection(section);
      if (!skipSection) output.push(line);
      index += 1;
      continue;
    }

    if (!section) {
      const key = KEY_PATTERN.exec(line)?.[1];
      if (key && (TARGET_KEYS.has(key) || INCOMPATIBLE_KEYS.has(key))) {
        index = skipAssignment(lines, index);
        continue;
      }
    }

    if (!skipSection) output.push(line);
    triple = tripleDelimiterFor(line);
    index += 1;
  }

  return output;
}

function configureDeepSeekConfig(source, options) {
  const model = options?.model;
  const effort = options?.effort;
  const modelCatalogPath = options?.modelCatalogPath;
  const apiKey = options?.apiKey;

  if (!['deepseek-v4-pro', 'deepseek-v4-flash'].includes(model)) {
    throw new Error(`Unsupported DeepSeek model: ${model}`);
  }
  if (!['low', 'high', 'max'].includes(effort)) {
    throw new Error(`Unsupported reasoning effort: ${effort}`);
  }
  if (!modelCatalogPath) throw new Error('modelCatalogPath is required.');
  if (!apiKey || /[\r\n\0]/.test(apiKey)) throw new Error('A valid DeepSeek API Key is required.');

  const kept = rewriteLeadingAndSections(source);
  let firstSection = kept.findIndex((line) => SECTION_PATTERN.test(line));
  if (firstSection === -1) firstSection = kept.length;

  const before = kept.slice(0, firstSection);
  const after = kept.slice(firstSection);
  while (before.length && before[before.length - 1].trim() === '') before.pop();
  while (after.length && after[0].trim() === '') after.shift();

  const target = [
    `model = ${tomlString(model)}`,
    'model_provider = "deepseek"',
    'preferred_auth_method = "apikey"',
    'forced_login_method = "api"',
    `model_reasoning_effort = ${tomlString(effort)}`,
    `model_catalog_json = ${tomlString(modelCatalogPath)}`
  ];

  const result = [];
  if (before.length) result.push(...before, '');
  result.push(...target);
  if (after.length) result.push('', ...after);
  while (result.length && result[result.length - 1].trim() === '') result.pop();
  result.push(
    '',
    '[model_providers.deepseek]',
    'name = "deepseek"',
    'base_url = "https://api.deepseek.com/"',
    'wire_api = "responses"',
    `experimental_bearer_token = ${tomlString(apiKey)}`
  );

  return `${result.join('\n')}\n`;
}

function parseTomlString(value) {
  const trimmed = String(value || '').trim();
  if (trimmed.startsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, trimmed.lastIndexOf('"'));
    }
  }
  if (trimmed.startsWith("'")) {
    const end = trimmed.lastIndexOf("'");
    return trimmed.slice(1, end > 0 ? end : undefined).replace(/''/g, "'");
  }
  return trimmed.replace(/\s+#.*$/, '');
}

function readScalar(source, wantedSection, wantedKey) {
  const lines = String(source || '').replace(/^\uFEFF/, '').split(/\r?\n/);
  let section = '';
  let triple;

  for (const line of lines) {
    if (triple) {
      if (countToken(line, triple) % 2 === 1) triple = undefined;
      continue;
    }

    const sectionMatch = SECTION_PATTERN.exec(line);
    if (sectionMatch) {
      section = normalizeSection(sectionMatch[1]);
      continue;
    }

    const match = /^\s*([A-Za-z0-9_-]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (match && section === wantedSection && match[1] === wantedKey) {
      return parseTomlString(match[2]);
    }
    triple = tripleDelimiterFor(line);
  }
  return '';
}

function inspectDeepSeekConfig(source) {
  const model = readScalar(source, '', 'model');
  const provider = readScalar(source, '', 'model_provider');
  const catalog = readScalar(source, '', 'model_catalog_json');
  const baseUrl = readScalar(source, 'model_providers.deepseek', 'base_url');
  const wireApi = readScalar(source, 'model_providers.deepseek', 'wire_api');
  const apiKey = readScalar(source, 'model_providers.deepseek', 'experimental_bearer_token');
  const forbiddenRelay = /(?:127\.0\.0\.1|localhost|moonbridge|:38440|:17899)/i.test(baseUrl);
  const direct = provider === 'deepseek' &&
    /^https:\/\/api\.deepseek\.com\/?$/i.test(baseUrl) &&
    wireApi === 'responses' &&
    !forbiddenRelay;

  return {
    model,
    provider,
    catalog,
    baseUrl,
    wireApi,
    apiKey,
    apiKeyConfigured: Boolean(apiKey),
    direct
  };
}

function parseStatus(text) {
  const result = {};
  for (const line of String(text || '').split(/\r?\n/)) {
    const match = /^([a-z_]+):\s*(.*)$/.exec(line.trim());
    if (match) result[match[1]] = match[2];
  }
  return {
    mode: result.mode || 'unknown',
    target: result.target || '',
    model: result.model || '',
    provider: result.provider || '',
    baseUrl: result.base_url || '',
    wireApi: result.wire_api || '',
    codexHome: result.codex_home || '',
    launcher: result.launcher || '',
    apiKeyConfigured: result.api_key_configured === 'true',
    direct: result.direct === 'true',
    codexVersion: result.codex_version || ''
  };
}

module.exports = {
  configureDeepSeekConfig,
  inspectDeepSeekConfig,
  parseStatus,
  readScalar,
  tomlString
};
