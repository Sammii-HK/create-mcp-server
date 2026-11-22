# Scaffolder review, 20 November 2026

Local release candidate only. The npm package has not been published and no source has been pushed.

## Fixed behaviour

Positional and prompted names use the same validation. A new project must be a named child of the current directory; existing directories and symlinks are preserved. Unsupported example names are rejected before files are created and repeated selections are deduplicated. Package descriptions are serialised as JSON and the displayed client configuration uses the actual platform path.

Generated development mode now uses tsx watch rather than promising reload while launching once. The example labels describe the implementation: notes are in memory and summarise selects a prefix of sentences. A failed dependency install keeps the generated project and provides an explicit recovery command; Git initialisation does not start after that failure.

## Verification

Five regression tests run against the distributed build. They exercise invalid positional inputs through the actual CLI, direct unsafe targets and unsupported tools, existing directories/symlinks, all selected example files and failed installation recovery. The CLI and core TypeScript checks/build pass.

A fresh project was generated from the local candidate, its dependencies installed with scripts disabled, and its TypeScript compiled. A real MCP SDK client connected to the generated stdio server. It listed six tools; hello, add, multiply, create-note, list-notes and sentence selection worked. Invalid calculator input was rejected. The recorded result is generated-server-smoke-20261120.json. No model, provider, database or publishing operation was used.

The scaffolder's full dependency audit reports zero advisories. The template now starts at the tested MCP SDK1.32.2 and Zod4.6.6. A fresh generated project's complete audit also reports zero advisories. Zod's earlier constrained-collection issue is documented at https://github.com/advisories/GHSA-mrhx-c7xc-m3w5; the supported SDKv1 documentation explains Zodv4 compatibility at https://ts.sdk.modelcontextprotocol.io/.

This proves one generated stdio project locally. It does not establish Windows behaviour, a published npm release, a hosted MCP service or broad compatibility with every client. Old screenshots and the npm release still need their release/screenshot pass.
