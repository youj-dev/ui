'use client'

import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { useEffect, type ReactNode } from 'react'
import { animate, m, useMotionValue, useTransform, useVelocity, type HTMLMotionProps, type TargetAndTransition } from 'motion/react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'
import { useFieldRequired } from './field'
import { MotionFeatures, useSoundCue } from '@youj/core'

/* The thumb travels on k.spring('snappy'). The spring drives one number,
 * --thumb-t (0 off, 1 on), and CSS turns it into a translate of exactly one
 * thumb width, negated under RTL, so the direction of travel is declarative
 * and a toggle mid-flight retargets the spring without a jump. The track is
 * sized 2 thumbs + padding, so one thumb width is the whole travel. Pressing
 * stretches the thumb a quarter wider toward the side it will travel to, its
 * resting edge anchored; the track color crossfades on the fast token.
 *
 * Off: page-colored thumb on an fg-subtle track; on: the same thumb on the
 * accent. Both clear 3:1 against the track and the track against the page.
 * With sound on, a toggle sounds as the thumb sets off.
 *
 * variant="liquid": a wider track and a glass droplet for a thumb. The root
 * owns --thumb-t here, driven on k.spring('settle') so it overshoots and
 * settles, and the thumb and the accent fill both read it. The thumb's
 * stretch comes from the spring's speed (wider and flatter while it travels)
 * and its overshoot (squashed against the end it lands on); the fill is the
 * accent clipped to the traveled part of the track, so the color pours in
 * behind the droplet. Reduced motion is the plain switch's: a jump. */

const LIQUID_TRACK = [
  'own:p-0.5 own:shadow-[inset_0_1px_2px_color-mix(in_oklab,var(--yj-shade)_22%,transparent)] own:data-checked:bg-fg-subtle',
  'own:data-[size=sm]:h-5 own:data-[size=sm]:w-10 data-[size=sm]:[--ui--liquid-travel:calc(var(--spacing)*3)]',
  'own:data-[size=default]:h-6 own:data-[size=default]:w-12.5 data-[size=default]:[--ui--liquid-travel:calc(var(--spacing)*4)]',
  'own:data-[size=lg]:h-7.5 own:data-[size=lg]:w-15.5 own:data-[size=lg]:p-[2.5px] data-[size=lg]:[--ui--liquid-travel:calc(var(--spacing)*5)]',
]

const LIQUID_THUMB = [
  'pointer-events-none relative block rounded-full',
  'own:group-data-[size=sm]/switch:h-4 own:group-data-[size=sm]/switch:w-6',
  'own:group-data-[size=default]/switch:h-5 own:group-data-[size=default]/switch:w-7.5',
  'own:group-data-[size=lg]/switch:h-6.25 own:group-data-[size=lg]/switch:w-9.25',
  'own:[translate:calc(var(--thumb-t)*var(--ui--liquid-travel))_0] own:rtl:[translate:calc(var(--thumb-t)*var(--ui--liquid-travel)*-1)_0]',
  'own:[transform:scale(var(--ui--liquid-sx,1),var(--ui--liquid-sy,1))]',
  // The glass: a bright specular cap over a body that lets the track through, blurred and saturated, a light rim,
  // a darker lower lip and a soft drop.
  'own:[background:radial-gradient(90%_70%_at_35%_18%,color-mix(in_oklab,var(--yj-light)_95%,transparent),transparent_62%),linear-gradient(to_bottom,color-mix(in_oklab,var(--yj-light)_82%,transparent),color-mix(in_oklab,var(--yj-light)_62%,transparent))]',
  'backdrop-blur-[1.5px] backdrop-saturate-[1.8]',
  'own:[box-shadow:inset_0_0_0_1px_color-mix(in_oklab,var(--yj-light)_70%,transparent),inset_0_-2px_3px_color-mix(in_oklab,var(--yj-shade)_14%,transparent),0_1px_2px_color-mix(in_oklab,var(--yj-shade)_22%,transparent),0_3px_8px_-2px_color-mix(in_oklab,var(--yj-shade)_28%,transparent)]',
  // Refraction: a small hard highlight up top, and the accent caught in the lower lip as the droplet crosses the fill.
  'before:absolute before:top-[14%] before:start-[20%] own:before:h-[24%] own:before:w-[38%] before:rounded-full own:before:bg-[color-mix(in_oklab,var(--yj-light)_92%,transparent)] before:blur-[0.5px]',
  'after:absolute after:inset-x-[18%] after:bottom-[10%] own:after:h-[30%] after:rounded-full own:after:bg-accent after:opacity-[calc(var(--thumb-t)*0.6)] after:blur-[2px]',
  // Pressed, the droplet swells; released on the CSS spring.
  'transition-[scale] [transition-duration:calc(var(--yj-duration-spring)*var(--yj-motion,1))] [transition-timing-function:var(--ease-spring)]',
  'origin-center own:group-active/switch:scale-110 group-active/switch:yj-duration-instant group-active/switch:ease-standard',
  'own:reduced:group-active/switch:scale-100 own:group-data-disabled/switch:group-active/switch:scale-100',
]

/** The liquid switch's root: owns --thumb-t and the droplet's stretch, so the thumb and the fill share them. */
function LiquidTrack({ checked, style, children, ...props }: Omit<HTMLMotionProps<'span'>, 'children'> & { checked: boolean; children?: ReactNode }) {
  const k = useYouj()
  const t = useMotionValue(checked ? 1 : 0)
  const speed = useVelocity(t)
  useEffect(() => {
    const target = checked ? 1 : 0
    if (k.reduced) {
      t.jump(target)
      return
    }
    const run = animate(t, target, k.spring('settle'))
    return () => run.stop()
  }, [checked, k, t])
  // Wider and flatter with speed; squashed against the end while it overshoots.
  const over = () => Math.max(0, t.get() - 1, -t.get())
  const sx = useTransform(() => 1 + Math.min(Math.abs(speed.get()) * 0.04, 0.3) - Math.min(over() * 3, 0.15))
  const sy = useTransform(() => 1 - Math.min(Math.abs(speed.get()) * 0.025, 0.18) + Math.min(over() * 2, 0.1))
  return (
    <m.span {...props} style={{ ...style, '--thumb-t': t, '--ui--liquid-sx': sx, '--ui--liquid-sy': sy } as HTMLMotionProps<'span'>['style']}>
      <span
        aria-hidden
        data-slot="switch-fill"
        className="pointer-events-none absolute inset-0 rounded-[inherit] own:bg-accent [clip-path:inset(0_calc((1_-_var(--thumb-t))*100%)_0_0_round_9999px)] rtl:[clip-path:inset(0_0_0_calc((1_-_var(--thumb-t))*100%)_round_9999px)]"
      />
      {children}
    </m.span>
  )
}

interface SwitchProps extends SwitchPrimitive.Root.Props {
  size?: 'sm' | 'default' | 'lg'
  /** `liquid` draws a glass droplet for a thumb that stretches as it travels, overshoots and settles, pouring the accent into the track behind it. Default `default`. */
  variant?: 'default' | 'liquid'
  /** With sound on (`YoujProvider`’s `sound`), toggling plays `toggleOn` or `toggleOff`. `false` keeps this one silent. Default true. */
  sound?: boolean
}

function Switch({ className, size = 'default', variant = 'default', required, sound = true, onCheckedChange, ...props }: SwitchProps) {
  const k = useYouj()
  const cue = useSoundCue()
  const fieldRequired = useFieldRequired()
  const liquid = variant === 'liquid'
  return (
    <MotionFeatures>
      <SwitchPrimitive.Root
        data-slot="switch"
        data-size={size}
        data-variant={variant}
        data-reduced-motion={k.reduced || undefined}
        required={required ?? fieldRequired}
        onCheckedChange={(checked, details) => {
          onCheckedChange?.(checked, details)
          if (sound && !details.isCanceled) cue(checked ? 'toggleOn' : 'toggleOff')
        }}
        className={cn(
          'peer group/switch relative inline-flex shrink-0 items-center rounded-full own:bg-fg-subtle own:p-0.5',
          'transition-[background-color] yj-duration-fast ease-standard',
          'focus-ring own:data-checked:bg-accent',
          'in-[[data-slot=field-label]:has(>[data-slot=field])]:focus-visible:outline-none',
          'own:aria-invalid:ring-1 aria-invalid:ring-danger aria-invalid:ring-offset-1 aria-invalid:ring-offset-canvas',
          'data-disabled:cursor-not-allowed data-disabled:opacity-50',
          liquid
            ? LIQUID_TRACK
            : 'own:data-[size=default]:h-4.5 own:data-[size=default]:w-8 own:data-[size=sm]:h-3.5 own:data-[size=sm]:w-6 own:data-[size=lg]:h-5.5 own:data-[size=lg]:w-10',
          'after:absolute after:-inset-x-1 after:-inset-y-1.5 touch:after:-inset-3',
          className,
        )}
        render={
          liquid
            ? (rootProps, state) => (
                <LiquidTrack {...(rootProps as Omit<HTMLMotionProps<'span'>, 'children'>)} checked={state.checked}>
                  {rootProps.children}
                </LiquidTrack>
              )
            : undefined
        }
        {...props}
      >
        {liquid ? (
          <SwitchPrimitive.Thumb data-slot="switch-thumb" className={cn(LIQUID_THUMB)} />
        ) : (
          <SwitchPrimitive.Thumb
            data-slot="switch-thumb"
            className={cn(
              // A knob inside its track takes only soft elevation, and an ink edge when the theme inks its lines.
              'pointer-events-none block rounded-full own:bg-key own:shadow-xs-soft own:inset-ring-(length:--yj-stroke-width) inset-ring-(--ui--fill-edge)',
              'own:group-data-[size=default]/switch:size-3.5 own:group-data-[size=sm]/switch:size-2.5 own:group-data-[size=lg]/switch:size-4.5',
              'own:[translate:calc(var(--thumb-t)*100%)_0] own:rtl:[translate:calc(var(--thumb-t)*-100%)_0]',
              // The knob's paint fades with the track's: a style that colors the knob by state (Bezel) would otherwise
              // snap it to the new color while the track is still the old one, a gray knob on the accent for a beat.
              // Pressed, the knob stretches toward where it will travel: it grows from the side it rests on
              // (the origin follows --thumb-t, so it moves with the knob and never jumps as the toggle sets off),
              // in on the instant token and released on the CSS spring.
              'transition-[scale,background-color,box-shadow]',
              '[transition-duration:calc(var(--yj-duration-spring)*var(--yj-motion,1)),calc(var(--yj-duration-fast)*var(--yj-motion,1)),calc(var(--yj-duration-fast)*var(--yj-motion,1))] [transition-timing-function:var(--ease-spring),var(--ease-standard),var(--ease-standard)]',
              'origin-[calc(var(--thumb-t)*100%)_50%] rtl:origin-[calc(100%_-_var(--thumb-t)*100%)_50%]',
              'own:group-active/switch:scale-x-125 group-active/switch:yj-duration-instant group-active/switch:ease-standard',
              'own:reduced:group-active/switch:scale-100 own:group-data-disabled/switch:group-active/switch:scale-100',
            )}
            render={(thumbProps, state) => (
              <m.span
                {...(thumbProps as HTMLMotionProps<'span'>)}
                initial={false}
                animate={{ '--thumb-t': state.checked ? 1 : 0 } as TargetAndTransition}
                transition={k.reduced ? { type: false } : k.spring('snappy')}
              />
            )}
          />
        )}
      </SwitchPrimitive.Root>
    </MotionFeatures>
  )
}

export { Switch, type SwitchProps }
