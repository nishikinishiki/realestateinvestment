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
      el("p", { class: "muted", html: getStrengths(c).length ? `得意領域：${getStrengths(c).join("・")}` : "" }),
      el("p", {}, [
        el("a", { href: c.officialLink, target: "_blank", rel: "nofollow sponsored noopener", class: "btn", html: "公式で資料請求" })
      ]),
      el("h4", { html: "選ばれる理由" }),
      el("ul", { html: reasons }),
      el("h4", { html: "利用者の声" }),
      el("div", { html: reviews }),
      el("h4", { html: "詳細データ" }),
      el("table", { class: "table", html: `<tbody>${details}</tbody>` }),
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

(async function init(){
  try{
    const companies = await loadCompanies();
    renderControls(preset => renderRanking(companies, preset));
    renderRanking(companies, "総合");
    renderCards(companies);
    renderColumns();
  }catch(e){
    console.error(e);
    $("#rankBody").innerHTML = `<tr><td colspan="5">読み込みに失敗しました</td></tr>`;
  }
})();
