// Compatibility entry for browsers holding the retired root-page HTML.
(() => {
  'use strict';
  if (!['/', '/index.html'].includes(location.pathname)) return;
  const destination = new URL('/01._qb_public_homepage/code.html', location.origin);
  destination.search = location.search;
  destination.searchParams.set('ui', '20261104-responsive-home-v2');
  destination.hash = location.hash;
  location.replace(destination.href);
})();
