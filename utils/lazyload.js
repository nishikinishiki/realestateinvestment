/* =========================================
   lazyload.js
   - 画面に見えるタイミングで画像を読み込む
   - loading="lazy"を補助する仕組み
   ========================================= */

(function () {
  const imgs = document.querySelectorAll('img[data-src]');
  if (!('IntersectionObserver' in window)) {
    imgs.forEach(img => (img.src = img.dataset.src));
    return;
  }

  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      observer.unobserve(img);
    });
  }, { rootMargin: '200px' });

  imgs.forEach(img => io.observe(img));
})();
