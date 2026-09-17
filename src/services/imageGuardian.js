/**
 * LOUMOO Image Error Guardian
 * Gracefully handles missing, slow, or broken images with luxury placeholder SVG.
 */
(function() {
  'use strict';
  var FALLBACK_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300' fill='none'%3E%3Crect width='400' height='300' fill='%23F4F6F9'/%3E%3Cpath d='M160 130C160 141.046 151.046 150 140 150C128.954 150 120 141.046 120 130C120 118.954 128.954 110 140 110C151.046 110 160 118.954 160 130Z' fill='%23CCD2DC'/%3E%3Cpath d='M110 210L165 155L200 190L245 145L290 210H110Z' fill='%23CCD2DC'/%3E%3Ctext x='200' y='245' font-family='sans-serif' font-size='13' font-weight='600' fill='%239AA2B1' text-anchor='middle'%3ELOUMOO%3C/text%3E%3C/svg%3E";
  window.addEventListener('error', function(e) {
    if (e.target && e.target.tagName === 'IMG') {
      var img = e.target;
      if (img.dataset.hasFallback) return;
      img.dataset.hasFallback = 'true';
      img.onerror = null;
      img.src = FALLBACK_SVG;
      img.style.objectFit = 'contain';
    }
  }, true);
})();
