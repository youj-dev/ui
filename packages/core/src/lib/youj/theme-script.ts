/* The early theme script: sets `data-theme` and `color-scheme` on <html> from
 * the visitor's stored choice (localStorage "theme", `system` when there is
 * none) before the page paints. @youj/react's ThemeScript renders it; with no
 * React here, `youj init` writes the same code into a static index.html. */

export function themeScriptCode({ storageKey = 'theme', defaultValue = 'system' }: { storageKey?: string; defaultValue?: 'light' | 'dark' | 'system' } = {}) {
  // `<` escaped, so a key can't close the script.
  const args = JSON.stringify([storageKey, defaultValue]).slice(1, -1).replace(/</g, '\\u003c')
  return `(function(k,d){try{var m=localStorage.getItem(k);if(m!=='light'&&m!=='dark'&&m!=='system')m=d;var s=m==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;var e=document.documentElement;e.setAttribute('data-theme',s);e.style.colorScheme=s}catch(e){}})(${args})`
}
