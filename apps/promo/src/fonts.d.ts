/* Font files resolve to their URL (Remotion's bundler emits them as assets). */
declare module '*.woff2' {
  const url: string
  export default url
}
