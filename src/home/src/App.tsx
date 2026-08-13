import { useEffect, useState, useSyncExternalStore } from 'react'
import { ExternalLink } from 'lucide-react'
import examples from 'virtual:examples'

import { Button } from '@/components/ui/button'
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
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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

type Manifest = NonNullable<(typeof examples)[number]['manifest']>

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
      <MessageAvatar className="bg-background/80 size-8 shadow-lg ring-1 ring-border backdrop-blur-md">
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? 'Hide the prompt' : 'Show the prompt this was built from'}
          onClick={() => onOpenChange(!open)}
          className="grid size-full cursor-pointer place-items-center opacity-80 transition-opacity hover:opacity-100"
        >
          <ClaudeStar className="size-4" />
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
                href={`${REPO_URL}#contributing-a-landing-page-with-claude-code`}
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

  return (
    <SidebarProvider className="h-svh">
      <Sidebar>
        <SidebarHeader className="gap-1 p-4">
          <h1 className="text-sm font-semibold tracking-tight">examples</h1>
          <p className="text-muted-foreground text-xs">
            react-three-fiber landing pages, each generated in one prompt.
          </p>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{examples.length} examples</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {examples.map((example) => (
                  <SidebarMenuItem key={example.name}>
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
