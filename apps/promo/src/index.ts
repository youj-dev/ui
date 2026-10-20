// Virtual time must be installed before Motion is evaluated: it captures requestAnimationFrame at import.
import './sim/clock'
import { registerRoot } from 'remotion'
import { Root } from './root'

registerRoot(Root)
