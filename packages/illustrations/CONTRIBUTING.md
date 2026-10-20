# Working on @youj/illustrations

What it is: the isometric kit (`IsoScene`, `IsoBox`, grids; the stage is copy-in only), its scenes and, at `/builder`, the illustration builder's scene format, spec, codegen and renderer (its UI is the docs site's). What it does for users is in [README.md](README.md).

## House rules

What typically drifts here. The root [Principles](../../CONTRIBUTING.md#principles) apply too.

- Draw scenes with the kit (`IsoScene`, `IsoBox`, `IsoPiece`) and its classes (`faceClass`, `kg-edge`, `kg-line`). No inline face styles and no hard-coded colors.
- Colors come from theme roles so a scene follows every preset, light and dark (`lint:tokens`).
- A resting scene is static; motion mounts only when a piece drops, parts or bobs. Reduced motion shows the final pose (`ssr.test.tsx`, `iso-scene.test.tsx`).
- Scenes are decorative: `aria-hidden`, with the meaning in nearby text. Illustrations are for blocks and docs, never inside a component.
- Fictional subjects only. Real logos and brand marks do not belong in a scene.
- List a scene in `registry.tsx`, then run `generate`; the standalone file and registry item are generated.
- The stage is copy-in only and the package does not export it.

## Layout

```
src/components/youj/graphics/                 the kit
src/components/youj/graphics/illustrations/   scenes: <category>.tsx, listed in registry.tsx,
                                              and scenes/<id>.tsx (generated, one standalone file per scene)
src/builder/, src/builder.ts                  the builder's scene format, spec, codegen and renderer
registry/                                     generated, one item per scene
```

The kit and the scenes sit at the path `youj add` installs them at.

## Adding a scene

1. Write it in `illustrations/<category>.tsx` and list it in `illustrations/registry.tsx`.
2. Run `pnpm -F @youj/illustrations generate`. It writes the standalone file (`illustrations/scenes/<id>.tsx`) and the registry item; `verify` fails until they are current.
3. Run `pnpm -F @youj/illustrations verify` and look at the scene in Storybook in both themes and with reduced motion.

## Commands

`pnpm -F @youj/illustrations typecheck|test|lint:tokens|generate|generate:check|registry:check|verify`

## Rules

- The stage is copy-in only; the package doesn't export it.
- Keep a resting scene static: shapes mount motion only once they drop, part or bob (`IsoPiece`). Draw faces and hairlines with the kit's classes (`faceClass`, `kg-edge`, `kg-line`… from `KIT_CSS` in `tones.ts`, which `IsoScene` renders once per page) rather than inline styles. `ssr.test.tsx` and `iso-scene.test.tsx` hold that line.
- Timing and color follow motion's rules ([packages/motion/CONTRIBUTING.md](../motion/CONTRIBUTING.md)); `lint:tokens` checks them.
