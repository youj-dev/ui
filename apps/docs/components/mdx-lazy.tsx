'use client'

import type { ComponentType, FunctionComponent } from 'react'
import dynamic from 'next/dynamic'
import { deferHydration } from '@/components/ui/defer-hydration'

/** Typed as the function components MDX takes; the dynamic() calls stay direct, so Next can preload each one's chunk. */
const fc = <P,>(component: ComponentType<P>) => component as FunctionComponent<P>

/* The docs pages share one route, so every client component an MDX page can
 * use would otherwise ship with all of them: the icon set, the scenes, the
 * playground, the theme builder. Each one here is its own chunk, loaded by
 * the pages that render it (the server renders it in full, and the page
 * preloads its chunk), so a page carries only its own. */

export const DoDont = fc(dynamic(() => import('@/components/motion-guidelines/do-dont').then((m) => m.DoDont)))
export const DurationBands = fc(dynamic(() => import('@/components/motion-guidelines/duration-bands').then((m) => m.DurationBands)))
export const MotionPlayground = fc(dynamic(() => import('@/components/motion-playground/playground').then((m) => m.MotionPlayground)))
// Client-only: the page sends a box, and the builder's code is fetched as the box nears the screen (components/sound/sound-builder-lazy.tsx).
export const SoundBuilder = fc(dynamic(() => import('@/components/sound/sound-builder-lazy').then((m) => m.SoundBuilder)))
export const SoundStrip = fc(dynamic(() => import('@/components/sound/sound-strip').then((m) => m.SoundStrip)))
export const ThemePresets = fc(dynamic(() => import('@/components/theming').then((m) => m.ThemePresets)))
// Client-only: the page sends a box, and the builder's code is fetched as the box nears the screen (components/theme-builder-lazy.tsx).
export const ThemeBuilder = fc(dynamic(() => import('@/components/theme-builder-lazy').then((m) => m.ThemeBuilder)))
export const LookComparison = fc(dynamic(() => import('@/components/theming').then((m) => m.LookComparison)))
export const BackdropGallery = fc(dynamic(() => import('@/components/docs/backdrop-gallery').then((m) => m.BackdropGallery)))
export const IconLayers = fc(dynamic(() => import('@/components/graphics/icons/icon-layers').then((m) => m.IconLayers)))
export const ThemeLayers = fc(dynamic(() => import('@/components/graphics/themes/theme-layers').then((m) => m.ThemeLayers)))
export const Principles = fc(dynamic(() => import('@youj/core/docs/components/principles').then((m) => m.Principles)))
export const PrincipleCards = fc(dynamic(() => import('@youj/core/docs/components/intro-blocks').then((m) => m.PrincipleCards)))

/* The client halves of server components (they read the registry or the content on the server and pass it down). */
export const IconGalleryView = fc(dynamic(() => import('@/components/icons/icon-gallery-view').then((m) => m.IconGalleryView)))
export const RegistryExplorerView = fc(dynamic(() => import('@/components/docs/registry-explorer-view').then((m) => m.RegistryExplorer)))
// Decoration: the server draws the band, and its scenes' code (the illustrations) waits for the page to be idle and the band near the screen.
export const PageArtScenes = deferHydration(() => import('@/components/docs/page-art-scenes').then((m) => m.PageArtScenes), { idle: true, view: true })
// The block-family pages' viewer and the parts that follow it share one chunk (the viewer frame, the code panel, the Story menu).
export const BlockStoriesView = fc(dynamic(() => import('@/components/docs/block-stories-view').then((m) => m.BlockStoriesView)))
export const BlockInstall = fc(dynamic(() => import('@/components/docs/block-stories-view').then((m) => m.BlockInstall)))
export const BlockCode = fc(dynamic(() => import('@/components/docs/block-stories-view').then((m) => m.BlockCode)))
export const BlockReference = fc(dynamic(() => import('@/components/docs/block-stories-view').then((m) => m.BlockReference)))
export const CardPreview = fc(dynamic(() => import('@/components/docs/card-preview').then((m) => m.CardPreview)))
