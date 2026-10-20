// The kit data, injected by scripts/build.ts as a virtual module.
declare module 'virtual:youj-kit' {
  const kit: import('../kit').Kit
  export default kit
}
