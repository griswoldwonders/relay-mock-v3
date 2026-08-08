# Gridline Dashboard Integration

Requested Watermelon/shadcn registry block:

```bash
npx shadcn@latest add https://registry.watermelon.sh/r/gridline-dashboard.json
```

Relay Rider is a Vite + React application and currently does not carry Tailwind/shadcn runtime dependencies in its locked npm graph. The SaaS Foundation shell in this sprint therefore adapts the Gridline visual direction using repository-native CSS so the current locked build remains deterministic.

Before importing the registry block directly, initialize shadcn for Vite and commit the resulting lockfile changes together:

1. Add Tailwind v4 and the Vite plugin.
2. Add the `@/*` TypeScript/Vite alias required by shadcn.
3. Run `npx shadcn@latest init`.
4. Run the requested Gridline registry command above.
5. Review the generated dependencies and generated files before replacing Relay Rider product components.
6. Preserve Relay Rider's institutional TDM terminology, privacy rules, planned-route model, Access Point workflow, and demonstration-data labels when adapting the generated dashboard.

The third-party dashboard should be treated as a presentation system, not as an authority for Relay Rider's data model or product behavior.
