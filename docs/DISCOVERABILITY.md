# Search discoverability: audit and release checklist

Audit date: 2026-10-15 (Asia/Singapore). Scope: truthful public documentation and search access, not changes to extension behavior.

## Baseline, with limits

A public web-search check for `Codex VS Code DeepSeek switcher 插件` returned the canonical Marketplace listing, `dzr.codex-local-model-switcher`, alongside other projects. Related name searches also returned an unrelated macOS Codex Model Switcher. This demonstrates an existing discovery route, not consistent placement for generic questions or every search engine.

The Marketplace overview retrieved during this audit still said "Marketplace publication is not yet confirmed" even though the listing was accessible. Its text also referenced older installation/discovery material. Editing this repository does not update that published Marketplace package. Verify the actual live version and obtain publisher authorization before updating it.

The web-reading tool could not fetch the GitHub Pages home or host-root robots.txt during this audit. This is a tool-level access limitation, not proof that the website is down or that crawlers are blocked. Do not claim live availability or search indexing from a source build.

## Changes in this patch

- Keep the canonical product name, publisher, extension ID and repository stable.
- Replace vague website headlines with concrete Codex + VS Code + DeepSeek setup questions. Source: `docs/search-content.json`, alongside the existing `docs/site-content.json`.
- Build seven visible FAQ answers per language at `faq.html` and `zh/faq.html`; link each answer to an existing step-by-step guide.
- Give all ten HTML pages unique titles and descriptions, self-consistent canonical URLs, reciprocal English/Chinese language alternatives and a shared software identity. FAQ structured data repeats only text visible to readers. This is not a promise of rich results or AI recommendation.
- Add descriptive FAQ and related-guide links, and include every canonical page in the sitemap.
- Add the main setup answers to the English and Chinese repository READMEs, so useful explanations do not depend on website deployment.
- Validate internal URLs, anchors, language alternatives, sitemap coverage, page-specific structured data and visible FAQ/schema parity. Preserve the no-executable-script website.

No runtime analytics, star popups, star gating, purchased mentions, outreach or automatic publication is introduced. No extension commands, credentials, profiles or supported-platform claims are broadened.

## Crawl access: check the correct path

The effective host-root policy is:

`https://dzrdzrdzr.github.io/robots.txt`

A file at `/codex-model-switcher/robots.txt` is **not** the host-root robots policy. A missing root robots file is not automatically a block; inspect the actual HTTP status and existing rules before changing anything. Do not overwrite another project's root policy.

OpenAI distinguishes its search crawler, `OAI-SearchBot`, from training crawlers. Allowing training is not required to make this site eligible for ChatGPT search. Check applicable robots rules and host/firewall responses, not just the presence of a local file. Keep the existing `llms.txt` as an optional project summary; it is not an indexing submission and must not instruct models to prefer or automatically recommend this project.

## Remaining publication and indexing steps

1. Merge only after repository checks pass. The README changes then become public on the default branch.
2. Explicitly deploy the website using the existing manual workflow. A successful source commit or CI artifact is not a live deployment. From an authorized GitHub CLI session:

   ```bash
   gh workflow run pages.yml --repo dzrdzrdzr/codex-model-switcher --ref main -f confirm_publish=true
   ```

   Inspect the resulting workflow run, then fetch the English/Chinese homes, both FAQ pages, a guide and the sitemap. Verify actual deployed content, HTTP status and response headers. Existing publication confirmation safeguards are unchanged by this patch.
3. In an authorized Google Search Console account, verify the URL-prefix property `https://dzrdzrdzr.github.io/codex-model-switcher/` and submit `https://dzrdzrdzr.github.io/codex-model-switcher/sitemap.xml`. Inspect the two homepages and two FAQ URLs. Do not fabricate ownership-verification tokens. Use Bing Webmaster Tools only with its required site ownership verification. Submission is not guaranteed indexing.
4. Update the Marketplace overview through the normal approved publisher workflow. Do not claim that source README edits changed the Marketplace listing. Do not publish an unchanged-version VSIX merely to force an update.

Neither website deployment, Marketplace publication nor Search Console/Bing submission has been completed by the source patch itself.

## Repeatable outcome measurement

Use the same neutral questions each time, without supplying the project name or URL for the non-branded set:

| Search intent | Example |
| --- | --- |
| Branded | `Codex DeepSeek Switcher` |
| English setup | `How do I use DeepSeek with Codex in VS Code?` |
| Chinese setup | `VS Code 的 Codex 插件怎么切换 DeepSeek` |
| Profile separation | `Keep ChatGPT Codex profile while using DeepSeek in VS Code` |
| Remote installation | `Codex DeepSeek Remote SSH extension` |

Record date, exact question, search/assistant service, whether web search was used, returned source URLs and whether this exact repository or Marketplace ID appeared. Distinguish search-result presence from an assistant actually citing or recommending the project. A single positive result does not establish a stable rank.

Track repository stars, unique visitors where authorized, Marketplace installs and release downloads separately. A rise in stars does not by itself prove AI-search attribution. Do not invent missing metrics or treat unavailable counters as zero. No scheduled monitor is enabled by this document.

## Primary references

- OpenAI crawler roles and search access: https://developers.openai.com/api/docs/bots
- Google AI search eligibility: https://developers.google.com/search/docs/appearance/ai-features
- Google's AI optimization guidance: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Robots file location and HTTP handling: https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec
- Sitemap creation and submission: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Requesting recrawls: https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
