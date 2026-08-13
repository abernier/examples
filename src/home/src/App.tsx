import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { ExternalLink } from 'lucide-react'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import examples from 'virtual:examples'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from '@/components/ui/message'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'

const REPO_URL = 'https://github.com/abernier/examples'

// The selected example lives in the hash — /examples/#lp-arcade — so a view is
// linkable and the back button walks through them.
function useHash() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('hashchange', onChange)
      return () => window.removeEventListener('hashchange', onChange)
    },
    () => window.location.hash.slice(1)
  )
}

function Thumb({ name, shot }: { name: string; shot: boolean }) {
  const className = 'block aspect-[16/10] w-full rounded-md bg-muted ring-1 ring-border'
  return shot ? (
    <img
      src={`_previews/${name}.jpg`}
      alt={name}
      loading="lazy"
      width={1280}
      height={800}
      className={`${className} object-cover`}
    />
  ) : (
    <span className={className} />
  )
}

type Example = (typeof examples)[number]
type Manifest = NonNullable<Example['manifest']>

// Two vocabularies in the one filter, and neither list is hardcoded — both are
// read off the manifests, so a new example brings its own words with it.
//
// A `kind` is what the page *is* (`landing`, `game`): one per example, so
// picking two widens to their union. A `tag` is a technique on screen (`water`,
// `caustics`): several per example, so picking two narrows to the pages carrying
// both. They share one input, so kinds go in prefixed — `kind:landing` — and
// that prefix is what tells the two apart everywhere after.
const KIND = 'kind:'
const label = (option: string) => (option.startsWith(KIND) ? option.slice(KIND.length) : option)

const COUNTS: Record<string, number> = {}
const KINDS: string[] = []
const TAGS: string[] = []
for (const example of examples) {
  const manifest = example.manifest
  const options = [...(manifest?.kind ? [KIND + manifest.kind] : []), ...(manifest?.tags ?? [])]
  for (const option of options) {
    if (!(option in COUNTS)) (option.startsWith(KIND) ? KINDS : TAGS).push(option)
    COUNTS[option] = (COUNTS[option] ?? 0) + 1
  }
}
KINDS.sort()
TAGS.sort()

// Base UI takes grouped items as `{ items }` objects and hides a group its
// filtering empties, so a label only shows up while it has something under it,
// and a vocabulary nothing uses yet drops out entirely.
const GROUPS = [
  { value: 'kind', items: KINDS },
  { value: 'technique', items: TAGS },
].filter((group) => group.items.length > 0)

// Text widens where the options narrow: it looks at the slug, the title, and the
// prompt and brief the page came out of, so you can find a page by something you
// remember asking for rather than by its name.
function matches(example: Example, kinds: string[], tags: string[], query: string) {
  const own = example.manifest?.tags ?? []
  const kind = example.manifest?.kind
  if (kinds.length && !(kind && kinds.includes(kind))) return false
  if (!tags.every((tag) => own.includes(tag))) return false
  if (!query) return true
  const needle = query.toLowerCase()
  const haystack = [
    example.name,
    example.manifest?.title,
    example.manifest?.prompt,
    example.manifest?.brief,
    kind,
    ...own,
  ]
  return haystack.some((field) => field?.toLowerCase().includes(needle))
}

// One control for both halves of the filter: the chips are the kinds and tags,
// and whatever is left in the input is the free-text query. Typing narrows the
// option list *and* the sidebar at the same time — pick an option and it becomes
// a chip, don't and the text keeps filtering on its own.
function Filter({
  options,
  onOptionsChange,
  query,
  onQueryChange,
}: {
  options: string[]
  onOptionsChange: (options: string[]) => void
  query: string
  onQueryChange: (query: string) => void
}) {
  const anchor = useComboboxAnchor()

  return (
    <Combobox
      multiple
      items={GROUPS}
      // The `kind:` prefix keeps the two vocabularies from colliding on a shared
      // word; it's plumbing, so it stays out of the chips and out of the match.
      itemToStringLabel={label}
      value={options}
      // Both handlers get a second `eventDetails` argument from Base UI. Drop it
      // here: it would land on the state setters as their options bag.
      onValueChange={(next: string[]) => onOptionsChange(next)}
      inputValue={query}
      onInputValueChange={(next: string) => onQueryChange(next)}
    >
      <ComboboxChips ref={anchor}>
        <ComboboxValue>
          {(selected: string[]) => (
            <>
              {selected.map((option) => (
                <ComboboxChip key={option}>{label(option)}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                aria-label="Filter the examples"
                placeholder={selected.length ? '' : 'kind, tag, name or prompt…'}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      {/* Anchored on the chips rather than the input, which moves as they wrap. */}
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>nothing in the list says that — filtering on the text alone</ComboboxEmpty>
        <ComboboxList>
          {(group: { value: string; items: string[] }) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection>
                {(option: string) => (
                  <ComboboxItem key={option} value={option}>
                    {label(option)}
                    <span className="text-muted-foreground ml-auto tabular-nums">
                      {COUNTS[option]}
                    </span>
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

// The techniques of one example, laid over the bottom of its thumbnail: a row
// that scrolls sideways rather than wrapping, so a page with nine tags is the
// same height in the list as a page with two. The row is masked at both ends,
// which is what says "there is more that way" without a chevron — and it is
// also what makes a half-scrolled row look deliberate rather than clipped.
// Each badge is the filter too: picking one picks it in the combobox above,
// picking it again lets it go.
function Tags({
  tags,
  picked,
  onPick,
}: {
  tags: string[] | undefined
  picked: string[]
  onPick: (tag: string) => void
}) {
  if (!tags?.length) return null
  return (
    <ScrollArea
      // Base UI's Root sets `position: relative` inline, which a plain
      // `absolute` class can't outrank — hence the `!`.
      className="pointer-events-none absolute! inset-x-0 bottom-0 [mask-image:linear-gradient(to_right,transparent,black_1.25rem,black_calc(100%-1.25rem),transparent)]"
      // The thumbnail underneath is the link; only the badges take the pointer
      // back, so dragging across the row still selects the example.
    >
      <div className="pointer-events-auto flex w-max gap-1 px-2 pb-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant={picked.includes(tag) ? 'default' : 'secondary'}
            className="cursor-pointer bg-background/70 backdrop-blur-sm data-[variant=default]:bg-primary/90"
            render={
              <button type="button" onClick={() => onPick(tag)}>
                {tag}
              </button>
            }
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="pointer-events-auto" />
    </ScrollArea>
  )
}

// Claude's asterisk — ten tapered arms, pointed at the centre, rounded outside.
// Drawn here rather than fetched: the gallery ships as static files.
function ClaudeStar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle) => (
        <path
          key={angle}
          d="M12 12 L10.45 6.05 A1.55 1.55 0 0 1 13.55 6.05 Z"
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
    </svg>
  )
}

// The whole point of the gallery: every page came out of one prompt. It sits
// over the iframe rather than in the chrome, so the answer is next to the thing
// it produced. Closed by default — the page is what you came for; the avatar is
// the only control, and it opens and closes.
function Prompt({ manifest, open, onOpenChange }: {
  manifest: Manifest
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const meta = [manifest.date, manifest.model].filter(Boolean).join(' · ')

  return (
    // Only the bubble carries a surface — the header and footer sit straight on
    // the page, the way a message does anywhere else.
    <Message align="end" className="pointer-events-auto">
      {/* The avatar is the toggle, so it must not move when the message opens.
          Undo the lift the component applies once a footer exists — it would
          shift the button 2rem up under the cursor mid-click. */}
      <MessageAvatar className="bg-background/80 size-10 shadow-lg ring-1 ring-border backdrop-blur-md group-has-data-[slot=message-footer]/message:translate-y-0">
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? 'Hide the prompt' : 'Show the prompt this was built from'}
          onClick={() => onOpenChange(!open)}
          className="grid size-full cursor-pointer place-items-center opacity-80 transition-opacity hover:opacity-100"
        >
          <ClaudeStar className="size-5" />
        </button>
      </MessageAvatar>
      {open && (
        <MessageContent>
          <MessageHeader>built from</MessageHeader>
          <div
            data-slot="message-body"
            className="bg-background/85 max-h-[40vh] overflow-y-auto rounded-lg p-3 shadow-lg ring-1 ring-border backdrop-blur-md"
          >
            <pre className="font-mono text-xs leading-5 whitespace-pre-wrap">{manifest.prompt}</pre>
            {manifest.brief && (
              <p className="text-muted-foreground mt-2.5 border-t pt-2.5 text-xs leading-5">
                {manifest.brief}
              </p>
            )}
          </div>
          {meta && <MessageFooter>{meta}</MessageFooter>}
        </MessageContent>
      )}
    </Message>
  )
}

function HowTo() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="w-full">
            Make your own
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Make your own</DialogTitle>
          <DialogDescription>
            Fork the repo, open it in Claude Code and ask for anything:
          </DialogDescription>
        </DialogHeader>
        <pre className="bg-muted text-muted-foreground overflow-x-auto rounded-md p-3 font-mono text-xs leading-6">
          <code>
            {'/new-example '}
            <span className="text-foreground">jewelry boutique</span>
            {'\n/new-example '}
            <span className="text-foreground">mix 3+ techniques</span>
            {'\n/new-example '}
            <span className="text-foreground">❤️</span>
            {'\n/new-example '}
            <span className="text-foreground">5 of them in parallel</span>
          </code>
        </pre>
        <p className="text-muted-foreground text-xs">
          Your prompt is the brief — the skill doesn't narrow it. It scaffolds{' '}
          <code className="font-mono">src/&lt;slug&gt;/</code> from real{' '}
          <a
            className="underline underline-offset-2"
            href="https://github.com/pmndrs/claude-code-plugin"
          >
            pmndrs
          </a>{' '}
          demos, builds it, and syncs it here. Then open a PR.
        </p>
        <DialogFooter>
          <Button
            nativeButton={false}
            render={
              <a
                href={`${REPO_URL}#contributing-with-claude-code`}
                target="_blank"
                rel="noreferrer"
              >
                Fork on GitHub
              </a>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function App() {
  const hash = decodeURIComponent(useHash())
  const current = examples.find((example) => example.name === hash) ?? examples[0]

  // The iframe keeps the previous site on screen while the next one boots, so
  // cover it until `load` fires.
  const [loading, setLoading] = useState(true)
  useEffect(() => setLoading(true), [current?.name])

  // Closed until asked for, and sticky across examples either way.
  const [promptOpen, setPromptOpen] = useState(false)

  // The filter only ever touches the sidebar. What's on screen stays on screen —
  // it's in the hash, and filtering it away would be a surprise.
  //
  // It lives in the query string next to that hash — /examples/?tags=water,caustics&q=surf#lp-surf
  // is a link to a shortlist, not just to a page. nuqs handles the round trip:
  // replaceState so typing doesn't fill the back button (which is for walking
  // the examples), and the empty value drops the key rather than leaving
  // `?q=` behind. Both are its defaults.
  //
  // One key per vocabulary — ?kind=landing&tags=water — so a URL reads as what it
  // means rather than as the combobox's internal prefixing. The two are joined
  // back into one list on the way in, and split apart on the way out.
  const [kinds, setKinds] = useQueryState('kind', parseAsArrayOf(parseAsString).withDefault([]))
  const [tags, setTags] = useQueryState('tags', parseAsArrayOf(parseAsString).withDefault([]))
  const [query, setQuery] = useQueryState('q', parseAsString.withDefault(''))
  const options = useMemo(() => [...kinds.map((kind) => KIND + kind), ...tags], [kinds, tags])
  const setOptions = (next: string[]) => {
    setKinds(next.filter((option) => option.startsWith(KIND)).map(label))
    setTags(next.filter((option) => !option.startsWith(KIND)))
  }
  const shown = useMemo(
    () => examples.filter((example) => matches(example, kinds, tags, query)),
    [kinds, tags, query]
  )
  const filtering = options.length > 0 || query !== ''

  return (
    <SidebarProvider className="h-svh">
      <Sidebar>
        <SidebarHeader className="gap-3 p-4">
          <div className="grid gap-1">
            {/* The title *is* the count: "18 examples" until the filter bites,
                "3 of 18" after. One number, at the top, where the eye already
                goes — rather than a heading saying what the tab already says
                and a tally repeating itself further down. */}
            <h1 className="text-sm font-semibold tracking-tight">
              {filtering ? `${shown.length} of ${examples.length}` : `${examples.length} examples`}
            </h1>
            <p className="text-muted-foreground text-xs">
              react-three-fiber scenes, each generated in one prompt.
            </p>
          </div>
          <Filter
            options={options}
            onOptionsChange={setOptions}
            query={query}
            onQueryChange={setQuery}
          />
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              {filtering && shown.length === 0 && (
                <p className="text-muted-foreground px-2 py-6 text-center text-xs">nothing matches</p>
              )}
              <SidebarMenu className="gap-4">
                {shown.map((example) => (
                  <SidebarMenuItem key={example.name} className="relative">
                    {/* Text-free: the shot is the label, so it goes edge to edge
                        and the active one is marked with a ring, not a bg. */}
                    <SidebarMenuButton
                      isActive={example.name === current?.name}
                      title={example.name}
                      className="h-auto p-0 opacity-70 transition-opacity hover:bg-transparent hover:opacity-100 data-active:bg-transparent data-active:opacity-100 data-active:ring-2 data-active:ring-sidebar-ring"
                      render={<a href={`#${example.name}`} />}
                    >
                      <Thumb {...example} />
                    </SidebarMenuButton>
                    <Tags
                      tags={example.manifest?.tags}
                      picked={tags}
                      onPick={(tag) =>
                        setTags(
                          tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
                        )
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <HowTo />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="truncate text-sm font-medium">{current?.name ?? 'examples'}</span>
          {current && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              nativeButton={false}
              render={
                <a href={`./${current.name}/`} target="_blank" rel="noreferrer">
                  Open
                  <ExternalLink />
                </a>
              }
            />
          )}
        </header>

        <div className="relative flex-1">
          {current ? (
            <>
              <iframe
                key={current.name}
                src={`./${current.name}/`}
                title={current.name}
                onLoad={() => setLoading(false)}
                className="absolute inset-0 h-full w-full border-0"
              />
              {loading && (
                <div className="bg-background absolute inset-0 grid place-items-center">
                  <span className="text-muted-foreground animate-pulse text-sm">
                    loading {current.name}…
                  </span>
                </div>
              )}
              {current.manifest?.prompt && (
                <div className="pointer-events-none absolute right-4 bottom-4 flex max-w-[min(28rem,calc(100%-2rem))] justify-end">
                  <Prompt
                    manifest={current.manifest}
                    open={promptOpen}
                    onOpenChange={setPromptOpen}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-muted-foreground absolute inset-0 grid place-items-center text-sm">
              no examples yet
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
