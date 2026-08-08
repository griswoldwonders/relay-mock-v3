# Gridline Dashboard Integration

Requested Watermelon/shadcn registry block:

```bash
npx shadcn@latest add https://registry.watermelon.sh/r/gridline-dashboard.json
```

## Registry status

The exact URL was fetched from a GitHub-hosted Ubuntu runner on 2026-08-08. The request completed, but the response body began with `<!doctype html>` rather than a shadcn registry JSON object. A JSON parser therefore failed with `Unexpected token '<'`.

That means the URL is **not currently usable as a shadcn registry item**. Relay Rider should not add Tailwind/shadcn dependencies or modify its lockfile while the requested registry endpoint is returning HTML instead of JSON.

## Current implementation

Relay Rider is a Vite + React application and does not currently carry Tailwind/shadcn runtime dependencies in its locked npm graph. The SaaS Foundation shell in this sprint adapts the Gridline visual direction with repository-native CSS so the locked build remains deterministic while the SaaS foundation work can proceed.

## If the registry endpoint is corrected

Before importing the block directly, initialize shadcn for Vite and commit the resulting dependency and lockfile changes together:

1. Add Tailwind v4 and the Vite plugin.
2. Add the `@/*` TypeScript/Vite alias required by shadcn.
3. Run `npx shadcn@latest init`.
4. Re-check that `https://registry.watermelon.sh/r/gridline-dashboard.json` returns valid shadcn JSON.
5. Run the requested Gridline registry command.
6. Review generated dependencies and files before replacing Relay Rider product components.
7. Preserve Relay Rider's institutional TDM terminology, privacy rules, planned-route model, Access Point workflow, and demonstration-data labels.

The third-party dashboard should be treated as a presentation system, not as an authority for Relay Rider's data model or product behavior.
