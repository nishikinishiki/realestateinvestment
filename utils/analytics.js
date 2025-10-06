/* =========================================
   analytics.js
   - CTAクリックやランキング切替などをdataLayerに送る
   - GTMとの連携前提
   ========================================= */

(function () {
  // GTM用のデータレイヤー
  const dl = (...args) => (window.dataLayer = window.dataLayer || []).push(...args);

  // 外部リンク（資料請求ボタンなど）のクリックを監視
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href]');
    if (!link) return;

    // 広告主LPなど外部リンクだけを対象にする（条件調整可）
    if (!/^https?:\/\//.test(link.href)) return;

    const company = link.dataset.company || ''; // main.jsで company-id を付与予定
    const label = link.textContent.trim();

    // GTMに送信（非同期）
    dl({ event: 'cta_click', company_id: company, label, url: link.href });

    // sendBeaconでバックアップ送信（任意）
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ event: 'cta_click', company, label, url: link.href })], {
        type: 'application/json'
      });
      // 自前APIに送信したい場合はこちらをアンコメント
      // navigator.sendBeacon('/collect', blob);
    }
  }, { passive: true });

  // 並び替え変更イベント（main.js側から呼び出し）
  window.__rankPresetChanged = function (preset) {
    dl({ event: 'rank_preset', preset });
  };
})();
