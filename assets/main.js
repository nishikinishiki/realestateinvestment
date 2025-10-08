/* assets/main.js */
const $ = (s, r = document) => r.querySelector(s);
const el = (t, a = {}, kids = []) => {
  const n = document.createElement(t);
  for (const [k, v] of Object.entries(a)) {
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else n.setAttribute(k, v);
  }
  kids.forEach(k => n.appendChild(k));
  return n;
};

async function loadCompanies() {
  const res = await fetch("assets/company-data.json", { cache: "no-store" });
  return res.json();
}

function getStrengths(c) {
  // テキストから“得意領域”を簡易抽出（例：中古/新築/ワンルーム等の含有）
  const blob = JSON.stringify([c.reasons, c.points, c.detailsTable]);
  const tags = [];
  if (/中古/.test(blob)) tags.push("中古");
  if (/新築/.test(blob)) tags.push("新築");
  if (/ワンルーム/.test(blob)) tags.push("ワンルーム");
  if (/アパート/.test(blob)) tags.push("アパート");
  if (/都心|東京23区/.test(blob)) tags.push("都心/23区");
  return Array.from(new Set(tags));
}

function renderControls(onChange) {
  const sel = el("select", { "aria-label": "並び替え" });
  ["総合","初心者向け","実績重視"].forEach(v => sel.appendChild(el("option", { value: v, html: v })));
  sel.addEventListener("change", () => onChange(sel.value));
  $("#controls").innerHTML = "";
  $("#controls").appendChild(sel);
}

function scoreByPreset(c, preset) {
  // 総合は overallRating をベースに、簡易補正
  let s = c.overallRating ?? 3.5;
  const strengths = getStrengths(c);
  if (preset === "初心者向け") {
    if (strengths.includes("ワンルーム")) s += 0.15;
    if (strengths.includes("中古")) s += 0.1;
  }
  if (preset === "実績重視") {
    const txt = JSON.stringify(c.evaluations || {});
    if (/実績|創業|上場|グッドデザイン/.test(JSON.stringify(c)) || /trackRecord/.test(txt)) s += 0.15;
  }
  return +Math.max(0, Math.min(5, s)).toFixed(2);
}

function renderRanking(data, preset = "総合") {
  const tbody = $("#rankBody");
  tbody.innerHTML = "";
  // Set header columns and wrap for horizontal scroll
  try {
    const table = tbody && tbody.closest('table');
    if (table) {
      table.classList.add('wide-table');
      if (table.parentElement && !table.parentElement.classList.contains('table-wrap')) {
        const wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        table.parentElement.insertBefore(wrap, table);
        wrap.appendChild(table);
      }
      const thead = table.querySelector('thead');
      if (thead) {
        thead.innerHTML = `
          <tr>
            <th>順位</th>
            <th>会社名</th>
            <th>総合</th>
            <th>得意領域</th>
            <th>初期費用</th>
            <th>管理のしやすさ</th>
            <th>サポート体制</th>
            <th>入居率</th>
            <th>物件エリア</th>
            <th>面談特典</th>
            <th>会社規模</th>
            <th>公式リンク</th>
          </tr>`;
      }
    }
  } catch {}
  const ranked = data
    .map(c => ({ ...c, _score: preset === "総合" ? (c.overallRating ?? 3.5) : scoreByPreset(c, preset) }))
    .sort((a, b) => b._score - a._score);

  // 構造化データ（ItemList）も更新
  try {
    const ld = document.querySelector('script[type="application/ld+json"]');
    const obj = JSON.parse(ld.textContent);
    obj.itemListElement = ranked.map((c, idx) => ({ "@type":"ListItem", "position": idx+1, "name": c.name }));
    ld.textContent = JSON.stringify(obj);
  } catch {}

  ranked.forEach((c, i) => {
    const tr = el("tr", {}, [
      el("td", { html: i + 1 }),
      el("td", { html: `<img src="${c.logo}" alt="" width="88" height="28" style="vertical-align:middle;margin-right:8px"><strong>${c.name}</strong>` }),
      el("td", { html: c._score.toFixed(2) }),
      el("td", { html: getStrengths(c).join("・") || "—" }),
      el("td", {}, [
        el("a", {
          href: c.officialLink,
          target: "_blank",
          rel: "nofollow sponsored noopener",
          class: "btn",
          html: "公式で資料請求"
        })
      ])
    ]);
    // Insert additional evaluation columns before the last (link) cell
    try {
      const getEval = key => (c.evaluations && c.evaluations[key] && c.evaluations[key].text) ? c.evaluations[key].text : "-";
      const linkTd = tr.lastElementChild;
      [
        'initialCost',
        'easeOfManagement',
        'supportSystem',
        'occupancyRate',
        'propertyArea',
        'interviewBonus',
        'companyScale'
      ].forEach(key => {
        tr.insertBefore(el('td', { html: getEval(key) }), linkTd);
      });
    } catch {}
    tbody.appendChild(tr);
  });
}

function renderCards(data) {
  const wrap = $("#companyCards");
  wrap.innerHTML = "";
  data.forEach(c => {
    const reasons = (c.reasons || []).map(r => `<li><strong>${r.title}</strong>：${r.text}</li>`).join("");
    const reviews = (c.reviews || []).map(r => `<blockquote><p>${r.quote}</p><footer class="muted">— ${r.author}${r.source ? `（${r.source}）` : ""}</footer></blockquote>`).join("");
    const details = (c.detailsTable || []).map(d => `<tr><th>${d.label}</th><td>${d.value}</td></tr>`).join("");
    const notes = (c.notes || []).length ? `<p class="muted" style="font-size:13px">${c.notes.join("<br>")}</p>` : "";

    const card = el("article", { class: "card", "aria-labelledby": `ttl-${c.id}` }, [
      el("h3", { id: `ttl-${c.id}`, html: c.name }),
      el("img", { class: "company-logo", src: c.logo, alt: `${c.name} ロゴ`, loading: "lazy" }),
      el("p", { class: "muted", html: getStrengths(c).length ? `得意領域：${getStrengths(c).join("・")}` : "" }),
      el("a", { href: c.officialLink, target: "_blank", rel: "nofollow sponsored noopener" }, [
        el("img", { class: "company-banner", src: `assets/images/banners/${c.id}_banner_1.png`, alt: `${c.name} バナー1`, loading: "lazy", onerror: "this.style.display='none'" })
      ]),
      el("p", {}, [
        el("a", { href: c.officialLink, target: "_blank", rel: "nofollow sponsored noopener", class: "btn", html: "公式で資料請求" })
      ]),
      el("h4", { html: "選ばれる理由" }),
      el("ul", { html: reasons }),
      el("h4", { html: "利用者の声" }),
      el("div", { html: reviews }),
      el("h4", { html: "詳細データ" }),
      el("table", { class: "table", html: `<tbody>${details}</tbody>` }),
      el("a", { href: c.officialLink, target: "_blank", rel: "nofollow sponsored noopener" }, [
        el("img", { class: "company-banner second", src: `assets/images/banners/${c.id}_banner_2.png`, alt: `${c.name} バナー2`, loading: "lazy", onerror: "this.style.display='none'" })
      ]),
      el("p", {}, [
        el("a", { href: c.officialLink, target: "_blank", rel: "nofollow sponsored noopener", class: "btn", html: "公式で資料請求" })
      ]),
      el("div", { html: notes })
    ]);
    wrap.appendChild(card);
  });
}

function renderColumns() {
  const topics = [
    { title:"中古と新築の違い", href:"#"},
    { title:"与信と金利の基礎", href:"#"},
    { title:"減価償却の要点Q&A", href:"#"},
    { title:"出口戦略の考え方", href:"#"},
    { title:"シミュレーションの落とし穴", href:"#"}
  ];
  const ul = $("#columnList"); ul.innerHTML = "";
  topics.forEach(t => ul.appendChild(el("li", {}, [ el("a", { href:t.href, html:t.title }) ])));
}

function setupFadeIn() {
  const targets = Array.from(document.querySelectorAll(".fade-in"));
  if (!targets.length) return;

  const activate = el => el.classList.add("visible");

  if (!("IntersectionObserver" in window)) {
    targets.forEach(activate);
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      activate(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -10%" });

  targets.forEach(t => observer.observe(t));
}

// FAQ accordion

document.addEventListener('DOMContentLoaded', () => {
  const faqItems = document.querySelectorAll('.faq__item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq__question');
    btn.addEventListener('click', () => {
      // 他の開閉状態は維持し、自分だけトグルする
      item.classList.toggle('active');
    });
  });
});

(async function init(){
  try{
    const companies = await loadCompanies();
    renderControls(preset => renderRanking(companies, preset));
    renderRanking(companies, "総合");
    renderCards(companies);
    renderColumns();
    setupFadeIn();

    // Populate right rail widgets (desktop)
    try {
      // 今月のおすすめ（jpreturns 優先）
      const railMonthly = document.querySelector('#railMonthly');
      if (railMonthly && Array.isArray(companies)) {
        const pick = companies.find(c => c.id === 'jpreturns') || companies[0];
        if (pick) {
          railMonthly.innerHTML = '';
          railMonthly.appendChild(
            el('a', { href: pick.officialLink, target: '_blank', rel: 'nofollow sponsored noopener' }, [
              el('img', { src: pick.logo, alt: `${pick.name} ロゴ`, style: 'max-width:100%;height:auto' })
            ])
          );
        }
      }

      // コラム記事（#columnList から複製 or 生成）
      const railColumns = document.querySelector('#railColumns');
      const mainCols = document.querySelectorAll('#columnList li a');
      if (railColumns) {
        railColumns.innerHTML = '';
        if (mainCols.length) {
          Array.from(mainCols).slice(0,5).forEach(a => {
            railColumns.appendChild(el('li', {}, [ el('a', { href: a.getAttribute('href') || '#', html: a.textContent }) ]));
          });
        }
      }

      // 人気TOP3（overallRating 降順）
      const railTop3 = document.querySelector('#railTop3');
      if (railTop3 && Array.isArray(companies)) {
        const top3 = [...companies]
          .sort((a,b) => (b.overallRating ?? 0) - (a.overallRating ?? 0))
          .slice(0,3);
        railTop3.innerHTML = '';
        top3.forEach(c => {
          railTop3.appendChild(el('li', {}, [ el('a', { href: c.officialLink, target: '_blank', rel: 'nofollow sponsored noopener', html: c.name }) ]));
        });
      }
    } catch {}
  }catch(e){
    console.error(e);
    $("#rankBody").innerHTML = `<tr><td colspan="5">読み込みに失敗しました</td></tr>`;
  }
})();
