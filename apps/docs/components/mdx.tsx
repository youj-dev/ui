import Link from 'fumadocs-core/link'
import type { MDXComponents } from 'mdx/types'
// The page-specific client components, each loaded only by the pages that use it (components/mdx-lazy.tsx).
import {
  BackdropGallery,
  BlockCode,
  BlockInstall,
  BlockReference,
  DoDont,
  DurationBands,
  IconLayers,
  MotionPlayground,
  PrincipleCards,
  Principles,
  SoundBuilder,
  SoundStrip,
  LookComparison,
  ThemeBuilder,
  ThemeLayers,
  ThemePresets,
} from '@/components/mdx-lazy'
import { Callout, Card, Cards, CodeBlock, Heading, Step, Steps } from '@/components/docs/blocks'
import { ComingSoon } from '@/components/docs/coming-soon'
import { ComponentIndex } from '@/components/docs/component-index'
import { ComponentPreview } from '@/components/docs/component-preview'
import { BlockStories, BlockStory } from '@/components/docs/block-stories'
import { ComponentStories, Story } from '@/components/docs/component-stories'
import { StoryCode, StoryDescription } from '@/components/docs/stories-view'
import { Deprecated } from '@/components/docs/deprecated'
import { FigmaKit } from '@/components/docs/figma-kit'
import { FrameworkTab, FrameworkTabs } from '@/components/docs/framework-tabs'
import { IconGallery } from '@/components/icons/icon-gallery'
import { InstallTabs } from '@/components/docs/install-tabs'
import { KitNames } from '@/components/docs/kit-names'
import { PackageInstallView } from '@/components/docs/install-tabs-view'
import { McpConnect } from '@/components/docs/mcp-connect'
import { McpSetup } from '@/components/docs/mcp-setup'
import { MotionSpec } from '@/components/docs/motion-spec'
import { PropsTable } from '@/components/docs/props-table'
import { Example, Examples } from '@/components/docs/examples'
import { Reference, ReferenceRow } from '@/components/docs/reference'
import { RegistryExplorer } from '@/components/docs/registry-explorer'
import { ScrollTable } from '@/components/docs/scroll-table'
import { Snippet } from '@/components/docs/snippet'
import { RoleTable } from '@/components/docs/theme-roles'
import { TokenClasses } from '@/components/docs/token-classes'
import { RoleSampler, ThemeCharacter, TwoToneExample } from '@/components/docs/theme-samples-lazy'
import { TopicLoop } from '@/components/docs/topic-loop'
import { PageArt } from '@/components/docs/page-art'
import { IntroFilm } from '@/components/docs/intro-film'

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  // Every element the docs' Markdown makes is the site's own; fumadocs-ui's defaults (its headings, code blocks and
  // their class-merging library) would ship to every page for elements the content never uses.
  return {
    a: Link,
    h2: (props) => <Heading as="h2" {...props} />,
    h3: (props) => <Heading as="h3" {...props} />,
    h4: (props) => <Heading as="h4" {...props} />,
    pre: CodeBlock,
    table: ScrollTable,
    BlockCode,
    BlockInstall,
    BlockReference,
    BlockStories,
    BlockStory,
    Callout,
    Card,
    Cards,
    ComingSoon,
    ComponentIndex,
    ComponentPreview,
    ComponentStories,
    Deprecated,
    DoDont,
    Example,
    Examples,
    DurationBands,
    FigmaKit,
    FrameworkTab,
    FrameworkTabs,
    IconGallery,
    InstallTabs,
    KitNames,
    McpConnect,
    McpSetup,
    MotionPlayground,
    MotionSpec,
    PackageInstall: PackageInstallView,
    PageArt,
    IntroFilm,
    PrincipleCards: () => (
      <div className="embed-contrast">
        <PrincipleCards />
      </div>
    ),
    Principles: () => (
      <div className="embed-contrast">
        <Principles />
      </div>
    ),
    PropsTable,
    Reference,
    ReferenceRow,
    RegistryExplorer,
    RoleSampler,
    RoleTable,
    TokenClasses,
    Snippet,
    SoundBuilder,
    SoundStrip,
    Step,
    Steps,
    Story,
    StoryCode,
    StoryDescription,
    LookComparison,
    BackdropGallery,
    ThemeBuilder,
    ThemeCharacter,
    ThemePresets,
    ThemeLayers,
    IconLayers,
    TopicLoop,
    TwoToneExample,
    ...components,
  }
}
