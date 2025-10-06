/* =========================================
   utm-helper.js
   - 外部リンクに自動でUTMパラメータを付与
   ========================================= */

(function () {
  const base = {
    utm_source: 'compare',
    utm_medium: 'cpc',
    utm_campaign: 'ranking'
  };

  function appendUTM(url, extra = {}) {
    const u = new URL(url, location.href);
    const params = u.searchParams;
    const all = { ...base, ...extra };

    for (const [key, val] of Object.entries(all)) {
      // 既にあるパラメータは上書きしない
      if (!params.has(key)) params.set(key, val);
    }
    u.search = params.toString();
    return u.toString();
  }

  // ページ読み込み後にすべての外部リンクへ適用
  window.__applyUtmToOutbound = function (extra = {}) {
    document.querySelectorAll('a[target="_blank"][rel~="sponsored"]').forEach(a => {
      a.href = appendUTM(a.href, extra);
    });
  };
})();
