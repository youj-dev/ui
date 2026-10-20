import type { TranslationReviews, TranslationValue } from './index'

/** Forty locales a global storefront ships in. */
export const FORTY = [
  'en', 'en-GB', 'fr', 'fr-CA', 'de', 'es', 'es-419', 'it', 'pt-BR', 'pt-PT',
  'nl', 'sv', 'da', 'nb', 'fi', 'pl', 'cs', 'sk', 'hu', 'ro',
  'bg', 'el', 'tr', 'uk', 'ru', 'ar', 'he', 'fa', 'hi', 'bn',
  'th', 'vi', 'id', 'ms', 'fil', 'ja', 'ko', 'zh-Hans', 'zh-Hant', 'sw',
]

export const EIGHT = ['en', 'fr', 'de', 'es', 'ja', 'ar', 'he', 'hi']

const OLD_DESCRIPTION = 'Garment-dyed linen with horn buttons. Cut to wear open over a tee.'

export const PRODUCT = {
  name: {
    en: 'Linen overshirt',
    fr: 'Surchemise en lin',
    de: 'Leinen-Overshirt',
    es: 'Sobrecamisa de lino',
    ja: 'リネンオーバーシャツ',
    ar: 'قميص علوي من الكتان',
    he: 'חולצת פשתן עליונה',
  } as TranslationValue,
  tagline: {
    en: 'The shirt you wear as a jacket.',
    fr: 'La chemise qui se porte comme une veste.',
    de: 'Das Hemd, das man als Jacke trägt.',
    ja: 'ジャケットのように羽織るシャツ。',
    ar: 'القميص الذي ترتديه كسترة.',
  } as TranslationValue,
  description: {
    en: 'Garment-dyed European linen with horn buttons. Relaxed through the body, cut to wear open over a tee.',
    fr: 'Lin européen teint en pièce, boutons en corne. Coupe ample, à porter ouverte sur un t-shirt.',
    de: 'Stückgefärbtes Leinen mit Hornknöpfen. Offen über einem T-Shirt zu tragen.',
    es: 'Lino europeo teñido en prenda con botones de cuerno. Holgada, para llevar abierta sobre una camiseta.',
    ja: 'ガーメントダイのヨーロッパリネンに、ホーンボタン。ゆったりとしたシルエットで、Tシャツの上に羽織って。',
  } as TranslationValue,
}

/** German was translated before English gained "European" and "Relaxed through the body"; the Spanish is machine output. */
export const DESCRIPTION_REVIEW: TranslationReviews = {
  de: { basis: OLD_DESCRIPTION },
  es: { basis: PRODUCT.description.en, unreviewed: true },
}

export const SUGGESTIONS = {
  ar: 'كتان أوروبي مصبوغ بعد الخياطة بأزرار من القرن. واسع عند الجسم، يُرتدى مفتوحًا فوق قميص قطني.',
  hi: 'बटन वाली यूरोपीय लिनन, कपड़ा बनने के बाद रंगी हुई। ढीली कटिंग, टी-शर्ट के ऊपर खुला पहनने के लिए।',
}
