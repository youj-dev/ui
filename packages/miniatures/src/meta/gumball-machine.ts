import type { MiniatureMeta } from '../engine/types'

/** TWILLBY G–5, gumball machine: what a showroom shows before it mounts. */
export const gumballMachine = {
  id: 'gumball-machine',
  name: 'Gumball machine',
  model: 'TWILLBY G–5',
  maker: 'TWILLBY / PENNY VENDING WORKS',
  study: '047',
  spec: 'G–5 / GLASS GLOBE · COIN MECH · SPIRAL RUN',
  label: 'Gumball machine, TWILLBY G–5',
  description:
    'A glass globe full of bright gumballs on a red cast-metal body, with a coin slot, a chrome turn crank and a spiral of wire that winds down round a post to a little flap door and a cup. Press Space or Enter, click the crank or drag it round: a gumball drops out under the body, rolls down the spiral, swings the flap open and lands in the cup. Each turn takes a coin: C drops one in. The globe empties as you go, D takes the gumballs from the cup and R lifts the cap to refill it. Left alone, it serves itself now and then.',
  keys: [
    { keys: [' ', 'Enter'], caps: ['Space', 'Enter'], label: 'turn the crank' },
    { keys: ['c'], caps: ['C'], label: 'coin' },
    { keys: ['d'], caps: ['D'], label: 'take' },
    { keys: ['r'], caps: ['R'], label: 'refill · drag the crank' },
  ],
  initial: { readout: 'CREDIT 1 · OUT 0 · GLOBE 100%', state: 'READY / SPACE TURNS THE CRANK', pressed: {} },
  viewBox: '-75.81793068761733 -160.74907406137243 151.63586137523467 280.7490740613724',
  progress: false,
} as const satisfies MiniatureMeta
