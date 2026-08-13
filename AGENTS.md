# AGENTS.md

The gallery app is `src/home/`. Everything else under `src/` is an example page —
see `.claude/skills/new-example/SKILL.md` for how those get built, and `README.md`
for how the whole thing deploys.

## pnpm workspaces, turbo, and no built output in git

Every folder under `src/` is a workspace (`pnpm-workspace.yaml`), built by turbo
into its own `dist/`. The deployed `dist/` at the root is assembled from those by
`./sync.sh` and **is gitignored** — CI rebuilds it on every push, so a PR only
ever carries sources. Don't commit build output, and don't hand-edit `dist/`.

- `pnpm install` at the root, never `npm install` in a workspace. Adding a
  dependency: `pnpm --filter <name> add <dep>`.
- `pnpm --filter <name> dev` runs one example, on a port derived from its slug —
  `packages/dev/port.mjs`, which its `vite.config` and the gallery both read, so
  neither has to be told. `pnpm dev` runs the gallery, which in dev iframes those
  servers and, for one that isn't running, prints that command.
- A workspace is an *example* when it has a `manifest.json`. That is the rule
  everywhere: what turbo builds (`node bin/examples.mjs --filter`), what
  `sync.sh` ships, what the gallery lists. `packages/dev` holds that shared
  answer; anything that needs to know which examples exist imports it rather
  than globbing `src/` again.

## shadcn: as stock as possible

The gallery's UI is shadcn/ui (`base-nova` style, Base UI underneath). Keep it
that way.

- **Install with the CLI.** `npx shadcn@latest add <name>` from `src/home/`.
  Never hand-write a component into `src/components/ui/`, never paste one from
  the docs, never copy one from another project. The CLI resolves the style, the
  registry dependencies and the import aliases from `components.json`; doing it
  by hand gets one of those wrong silently.
- **Don't edit `src/components/ui/`.** Those files are the CLI's output and
  should stay diffable against it. A change there is a change you'll have to
  remember forever.
- **Use the component's own shape before reaching for `className`.** Its
  variants, its sizes, its parts. If the docs show a pattern — chips through
  `<ComboboxValue>`, the anchor from `useComboboxAnchor` — follow it rather than
  rebuilding the same result from state you hold yourself.
- **Adding content inside a component is fine.** A match count in a
  `ComboboxItem`, an icon in a button. Restyling what the component already
  decided is what to avoid: sizes, colours, spacing, radii.
- **An override needs a reason, in a comment, on the line.** There are two in
  `App.tsx` and both say why: `MessageAvatar` undoes a built-in translate that
  would move the button under the cursor mid-click, and `SidebarMenuButton`
  drops its padding because the thumbnail is the label and goes edge to edge.
  Two is the budget's shape, not a precedent to grow.

If a component genuinely doesn't fit, say so and pick a different one — that's a
better trade than a styled-over version of the wrong one.
