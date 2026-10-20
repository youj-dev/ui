/* Blocks whose frame builds in each time it opens (Generate, @youj/motion generate/engine.ts), by their /view id: the auth
 * screens' "first view". Read by the /view page on the server, so a frame of any other block carries none of the code. */
export const BUILT_BLOCKS = new Set(['blocks/auth-login', 'blocks/auth-signup'])
