/* @youj/miniatures: the catalogue. Every miniature's metadata (names, keys,
 * first readout, frame) for a showroom to list and caption them, with no
 * components and no drawing code, so it's safe on a server and costs a few
 * hundred bytes. Each miniature is its own import:
 *
 *   import { MiniatureTurntable } from '@youj/miniatures/turntable'
 */
import { threeDPrinter } from './meta/3d-printer'
import { aquarium } from './meta/aquarium'
import { bankVault } from './meta/bank-vault'
import { cardCatalog } from './meta/card-catalog'
import { cellTower } from './meta/cell-tower'
import { coffeeGrinder } from './meta/coffee-grinder'
import { coolingUnit } from './meta/cooling-unit'
import { crtTelevision } from './meta/crt-television'
import { cuckooClock } from './meta/cuckoo-clock'
import { deskFan } from './meta/desk-fan'
import { droneDock } from './meta/drone-dock'
import { drumMachine } from './meta/drum-machine'
import { espresso } from './meta/espresso'
import { filmProjector } from './meta/film-projector'
import { firewallAppliance } from './meta/firewall-appliance'
import { greenhouse } from './meta/greenhouse'
import { groundStation } from './meta/ground-station'
import { guitarAmp } from './meta/guitar-amp'
import { homeBattery } from './meta/home-battery'
import { homeRouter } from './meta/home-router'
import { hourglass } from './meta/hourglass'
import { instantCamera } from './meta/instant-camera'
import { letterpress } from './meta/letterpress'
import { lighthouse } from './meta/lighthouse'
import { mainframe } from './meta/mainframe'
import { mechanicalKeyboard } from './meta/mechanical-keyboard'
import { metronome } from './meta/metronome'
import { microscope } from './meta/microscope'
import { mixingDesk } from './meta/mixing-desk'
import { nas } from './meta/nas'
import { networkSwitch } from './meta/network-switch'
import { nixieClock } from './meta/nixie-clock'
import { officePrinter } from './meta/office-printer'
import { orrery } from './meta/orrery'
import { oscilloscope } from './meta/oscilloscope'
import { packagingLine } from './meta/packaging-line'
import { parcelLocker } from './meta/parcel-locker'
import { paymentTerminal } from './meta/payment-terminal'
import { pinball } from './meta/pinball'
import { pipeOrgan } from './meta/pipe-organ'
import { quantumFridge } from './meta/quantum-fridge'
import { receiptPrinter } from './meta/receipt-printer'
import { repairBench } from './meta/repair-bench'
import { retroFridge } from './meta/retro-fridge'
import { robotArm } from './meta/robot-arm'
import { rotaryPhone } from './meta/rotary-phone'
import { sbcCluster } from './meta/sbc-cluster'
import { serverCabinet } from './meta/server-cabinet'
import { sewingMachine } from './meta/sewing-machine'
import { smartTrainer } from './meta/smart-trainer'
import { splitFlapBoard } from './meta/split-flap-board'
import { stageSynth } from './meta/stage-synth'
import { standMixer } from './meta/stand-mixer'
import { tapeLibrary } from './meta/tape-library'
import { telescope } from './meta/telescope'
import { thermostatBoiler } from './meta/thermostat-boiler'
import { toaster } from './meta/toaster'
import { tubeRadio } from './meta/tube-radio'
import { turntable } from './meta/turntable'
import { typewriter } from './meta/typewriter'
import { upsCabinet } from './meta/ups-cabinet'
import { vintageCamera } from './meta/vintage-camera'
import { vinylJukebox } from './meta/vinyl-jukebox'
import { washingMachine } from './meta/washing-machine'
import { weatherStation } from './meta/weather-station'
import { workstation } from './meta/workstation'
/* MINIATURES */

export { threeDPrinter, aquarium, bankVault, cardCatalog, cellTower, coffeeGrinder, coolingUnit, crtTelevision, cuckooClock, deskFan, droneDock, drumMachine, espresso, filmProjector, firewallAppliance, greenhouse, groundStation, guitarAmp, homeBattery, homeRouter, hourglass, instantCamera, letterpress, lighthouse, mainframe, mechanicalKeyboard, metronome, microscope, mixingDesk, nas, networkSwitch, nixieClock, officePrinter, orrery, oscilloscope, packagingLine, parcelLocker, paymentTerminal, pinball, pipeOrgan, quantumFridge, receiptPrinter, repairBench, retroFridge, robotArm, rotaryPhone, sbcCluster, serverCabinet, sewingMachine, smartTrainer, splitFlapBoard, stageSynth, standMixer, tapeLibrary, telescope, thermostatBoiler, toaster, tubeRadio, turntable, typewriter, upsCabinet, vintageCamera, vinylJukebox, washingMachine, weatherStation, workstation }

/** Every miniature's metadata, in id order. */
export const miniatures = [threeDPrinter, aquarium, bankVault, cardCatalog, cellTower, coffeeGrinder, coolingUnit, crtTelevision, cuckooClock, deskFan, droneDock, drumMachine, espresso, filmProjector, firewallAppliance, greenhouse, groundStation, guitarAmp, homeBattery, homeRouter, hourglass, instantCamera, letterpress, lighthouse, mainframe, mechanicalKeyboard, metronome, microscope, mixingDesk, nas, networkSwitch, nixieClock, officePrinter, orrery, oscilloscope, packagingLine, parcelLocker, paymentTerminal, pinball, pipeOrgan, quantumFridge, receiptPrinter, repairBench, retroFridge, robotArm, rotaryPhone, sbcCluster, serverCabinet, sewingMachine, smartTrainer, splitFlapBoard, stageSynth, standMixer, tapeLibrary, telescope, thermostatBoiler, toaster, tubeRadio, turntable, typewriter, upsCabinet, vintageCamera, vinylJukebox, washingMachine, weatherStation, workstation] as const

/** The import path segment of each miniature: `@youj/miniatures/<id>`. */
export type MiniatureId = (typeof miniatures)[number]['id']

export { palette, relight, stage, type MaterialRole } from './engine/palette'
export type {
  AnyMiniatureHandle,
  MiniatureHandle,
  MiniatureKeyboard,
  MiniatureKeyHint,
  MiniatureKeyName,
  MiniatureKeyOf,
  MiniatureMeta,
  MiniatureProgressHandle,
  MiniatureProgressProps,
  MiniatureProps,
  MiniatureReducedMotion,
  MiniatureMode,
  MiniatureSnapshot,
} from './engine/types'
