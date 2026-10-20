'use client'

import { useSyncExternalStore } from 'react'
import { createStoreSignal, onStorageKey } from '@/lib/store-signal'
import { useMediaQuery } from '@/lib/use-media-query'

/* How a docs preview is operated: with a pointer (a popover grows out of its
 * trigger) or by touch (a sheet rises from the bottom edge). The choice is the
 * reader's, shared by every preview on every page and remembered across visits
 * like the component style (lib/showcase-theme). Until they pick, a preview
 * follows the hardware: a phone shows Touch, a desktop Pointer. Nothing is
 * written until a pick, so the default keeps following the hardware. */

export type PreviewDevice = 'pointer' | 'touch'
export const PREVIEW_DEVICES: readonly PreviewDevice[] = ['pointer', 'touch']
export const PREVIEW_DEVICE_KEY = 'youj-preview-device'

export const isPreviewDevice = (value: unknown): value is PreviewDevice => PREVIEW_DEVICES.includes(value as PreviewDevice)

/** What the phone-sized stage shows: the screen of a phone, in CSS px. */
export const PHONE_WIDTH = 393

function stored(): PreviewDevice | null {
  try {
    const value = localStorage.getItem(PREVIEW_DEVICE_KEY)
    return isPreviewDevice(value) ? value : null
  } catch {
    return null
  }
}

const { subscribe, notify } = createStoreSignal(onStorageKey(PREVIEW_DEVICE_KEY))

/** Remembers the reader's pick for every preview, now and on later visits. */
export function setPreviewDevice(device: PreviewDevice) {
  try {
    localStorage.setItem(PREVIEW_DEVICE_KEY, device)
  } catch {
    // Storage blocked: the pick holds for this page's lifetime only.
    picked = device
  }
  notify()
}

let picked: PreviewDevice | null = null

/** The reader's pick, or null while they have not chosen (and before hydration). */
export function usePickedPreviewDevice(): PreviewDevice | null {
  return useSyncExternalStore(
    subscribe,
    () => stored() ?? picked,
    () => null,
  )
}

/** True when the visitor's primary pointer is a finger. */
export const useHardwareTouch = () => useMediaQuery('(pointer: coarse)')

export interface DevicePreview {
  /** What the stage shows: the pick, else the hardware's. */
  device: PreviewDevice
  /** The visitor's hardware. */
  hardware: PreviewDevice
  /** The stage is a phone-sized viewport: touch on a screen that is not one. */
  phone: boolean
}

export function useDevicePreview(): DevicePreview {
  const hardware: PreviewDevice = useHardwareTouch() ? 'touch' : 'pointer'
  const device = usePickedPreviewDevice() ?? hardware
  return { device, hardware, phone: device === 'touch' && hardware === 'pointer' }
}
