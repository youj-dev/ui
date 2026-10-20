import '@testing-library/jest-dom/vitest'

// Motion's jsdom stubs (matchMedia, ResizeObserver, preloaded features): the
// scenes run on its provider. The builder's codegen tests run in node.
if (typeof window !== 'undefined') await import('@youj/core/test/setup')
