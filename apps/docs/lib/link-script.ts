/**
 * A script for a page that is static (the server can't read the address): when `?param=` names anything but the
 * flagship, it marks the document with `attr` before first paint, so the page can hide the flagship's words until the
 * browser has drawn the one the link names.
 */
export const linkScript = (param: string, flagship: string, attr: string) =>
  `(function(){try{var s=new URLSearchParams(location.search).get('${param}');if(s&&s!==${JSON.stringify(flagship)})document.documentElement.setAttribute('${attr}','')}catch(e){}})()`
