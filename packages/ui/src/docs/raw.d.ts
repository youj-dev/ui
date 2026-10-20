// Vite's ?raw imports (the Tokens page reads the token CSS as text).
declare module '*?raw' {
  const source: string
  export default source
}
