/* The sizing calibration prototype (youj.css section 5b), for the user to
 * judge before anything changes: off unless the build sets
 * NEXT_PUBLIC_YOUJ_CALIBRATION=next. On, <html> carries
 * data-yj-calibration="next", so every preview's 100% draws the geometry at
 * 80% of today's and the UI type at 92.5% (12px). */
export const CALIBRATION: 'next' | undefined = process.env.NEXT_PUBLIC_YOUJ_CALIBRATION === 'next' ? 'next' : undefined
