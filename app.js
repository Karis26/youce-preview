(function () {
  const KEY = "youceCompare";
  const MAX = 3;
  const data = window.OILS || [];
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function getCompare() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(raw) ? raw.filter(Boolean).slice(0, MAX) : [];
    } catch (e) {
      return [];
    }
  }
  function setCompare(ids) {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
    renderDock();
    syncCompareButtons();
  }
  function toggleCompare(id) {
    if (!id) return;
    const ids = getCompare();
    const i = ids.indexOf(id);
    if (i >= 0) ids.splice(i, 1);
    else if (ids.length < MAX) ids.push(id);
    setCompare(ids);
  }

  function oilById(id) {
    return data.find(function (p) { return p.id === id; });
  }

  function displayOrStatus(p, key) {
    const rec = (p.fields && p.fields[key]) || {};
    const st = rec.status || "";
    const v = rec.value || "";
    if (st === "提取未识别，待人工" || v === "提取未识别，待人工") {
      return '<span class="human">提取未识别，待人工</span>';
    }
    if (st === "厂商未公布" || v === "厂商未公布") {
      return '<span class="empty">厂商未公布</span>';
    }
    if (v) return escapeHtml(v);
    return '<span class="empty">暂缺</span>';
  }

  function saeHtml(p) {
    const rec = (p.fields && p.fields["粘度等级"]) || {};
    if (rec.status === "提取未识别，待人工" || (p.nameNote || "").indexOf("提取未识别") === 0) {
      return '<span class="human">提取未识别，待人工</span>';
    }
    if (p.sae) return escapeHtml(p.sae);
    if (rec.status === "厂商未公布" || p.nameNote === "厂商未公布") {
      return '<span class="empty">厂商未公布</span>';
    }
    return '<span class="empty">暂缺</span>';
  }

  function marks(p) {
    var bits = [];
    if (p.qa) bits.push('<span class="mark-tag qa">已对照原文</span>');
    else bits.push('<span class="mark-tag">尚未人工抽检</span>');
    if (p.foreignBadge) bits.push('<span class="mark-tag warn">非中国市场数据表，配方可能不同</span>');
    return bits.join("");
  }

  function rootPrefix() {
    return document.body.getAttribute("data-root") || "./";
  }

  function renderDock() {
    const dock = $("#compareDock");
    if (!dock) return;
    const ids = getCompare();
    if (!ids.length) {
      dock.classList.remove("is-on");
      dock.innerHTML = "";
      return;
    }
    const names = ids.map(function (id) {
      const p = oilById(id);
      return p ? p.name : id;
    });
    const root = rootPrefix();
    dock.classList.add("is-on");
    dock.innerHTML =
      '<div class="inner"><div class="names">对照栏（' + ids.length + "/" + MAX + "）" +
      " · " + names.map(escapeHtml).join("、") + "</div>" +
      '<div><a href="' + root + "compare.html?ids=" + ids.map(encodeURIComponent).join(",") + '">查看对照</a></div></div>';
  }

  function syncCompareButtons() {
    const ids = getCompare();
    $$("[data-compare]").forEach(function (btn) {
      const id = btn.getAttribute("data-compare");
      const on = ids.indexOf(id) >= 0;
      btn.textContent = on ? "移出对照" : (ids.length >= MAX ? "对照已满" : "加入对照");
      btn.disabled = !on && ids.length >= MAX;
      btn.classList.toggle("ghost", !on);
    });
  }

  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-compare]");
    if (!btn) return;
    e.preventDefault();
    toggleCompare(btn.getAttribute("data-compare"));
  });

  /* —— catalog —— */
  function unique(arr) {
    return arr.filter(function (v, i) { return v && arr.indexOf(v) === i; });
  }
  function saeKey(s) {
    const m = String(s).match(/^(\d+)W-?(\d+)?$/);
    if (!m) return 9999;
    return Number(m[1]) * 100 + Number(m[2] || 0);
  }
  function fillSelect(sel, values, allLabel) {
    if (!sel) return;
    sel.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = allLabel;
    sel.appendChild(opt0);
    values.forEach(function (v) {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
  }

  function catalogCard(p, root) {
    const href = root + "oils/" + encodeURIComponent(p.id) + ".html";
    const specs = [
      p.apiTokens && p.apiTokens[p.apiTokens.length - 1],
      (p.ilsacTokens && p.ilsacTokens[p.ilsacTokens.length - 1]) || (p.aceaTokens && p.aceaTokens[p.aceaTokens.length - 1])
    ].filter(Boolean).join(" · ");
    return (
      '<a class="oil-card" href="' + href + '">' +
        '<div class="brand">' + escapeHtml(p.brandShort || p.brand) + "</div>" +
        "<h3>" + escapeHtml(p.name) + "</h3>" +
        '<div class="sae">' + (p.sae ? escapeHtml(p.sae) : "—") + "</div>" +
        '<div class="meta">' + escapeHtml(specs) +
          '<div class="marks">' + marks(p) + "</div>" +
        "</div>" +
      "</a>"
    );
  }

  function renderCatalog() {
    const mount = $("#catalogGrid");
    if (!mount) return;
    const root = rootPrefix();
    const params = new URLSearchParams(location.search);
    const qEl = $("#fQ");
    const brandEl = $("#fBrand");
    const saeEl = $("#fSae");
    const apiEl = $("#fApi");
    const aceaEl = $("#fAcea");
    const ilsacEl = $("#fIlsac");
    const chinaEl = $("#fChina");

    const brands = unique(data.map(function (p) { return p.brandShort || p.brand; })).sort(function (a, b) {
      return a.localeCompare(b, "zh");
    });
    const saes = unique(data.map(function (p) { return p.sae; })).sort(function (a, b) { return saeKey(a) - saeKey(b); });
    const apis = unique(data.flatMap(function (p) { return p.apiTokens || []; })).sort();
    const aceas = unique(data.flatMap(function (p) { return p.aceaTokens || []; })).sort();
    const ilsacs = unique(data.flatMap(function (p) { return p.ilsacTokens || []; })).sort();
    fillSelect(brandEl, brands, "全部品牌");
    fillSelect(saeEl, saes, "全部粘度");
    fillSelect(apiEl, apis, "全部 API");
    fillSelect(aceaEl, aceas, "全部 ACEA");
    fillSelect(ilsacEl, ilsacs, "全部 ILSAC");

    if (qEl && params.get("q")) qEl.value = params.get("q");
    if (brandEl && params.get("brand")) brandEl.value = params.get("brand");
    if (saeEl && params.get("sae")) saeEl.value = params.get("sae");
    if (apiEl && params.get("api")) apiEl.value = params.get("api");
    if (aceaEl && params.get("acea")) aceaEl.value = params.get("acea");
    if (ilsacEl && params.get("ilsac")) ilsacEl.value = params.get("ilsac");
    if (chinaEl && params.get("all") === "1") chinaEl.checked = false;

    function apply() {
      const q = (qEl && qEl.value.trim().toLowerCase()) || "";
      const brand = (brandEl && brandEl.value) || "";
      const sae = (saeEl && saeEl.value) || "";
      const api = (apiEl && apiEl.value) || "";
      const acea = (aceaEl && aceaEl.value) || "";
      const ilsac = (ilsacEl && ilsacEl.value) || "";
      const chinaOnly = chinaEl ? chinaEl.checked : true;
      const rows = data.filter(function (p) {
        if (chinaOnly && !p.chinaDefault) return false;
        if (brand && (p.brandShort || p.brand) !== brand) return false;
        if (sae && p.sae !== sae) return false;
        if (api && (p.apiTokens || []).indexOf(api) < 0) return false;
        if (acea && (p.aceaTokens || []).indexOf(acea) < 0) return false;
        if (ilsac && (p.ilsacTokens || []).indexOf(ilsac) < 0) return false;
        if (q) {
          const blob = (p.name + " " + (p.nameEn || "") + " " + p.brand + " " + (p.sae || "") + " " + (p.api || "") + " " + (p.ilsac || "")).toLowerCase();
          if (blob.indexOf(q) < 0) return false;
        }
        return true;
      });
      rows.sort(function (a, b) {
        return (a.brandShort + a.name).localeCompare(b.brandShort + b.name, "zh");
      });
      const countEl = $("#resultCount");
      if (countEl) {
        countEl.textContent = chinaOnly
          ? "当前 " + rows.length + " 种（默认展示中国市场条目）"
          : "当前 " + rows.length + " 种";
      }
      if (!rows.length) {
        mount.innerHTML = '<p class="result-line">没有同时符合这些条件的油品。可减少筛选条件后再看。</p>';
        return;
      }
      mount.innerHTML = rows.map(function (p) { return catalogCard(p, root); }).join("");
    }

    ["input", "change"].forEach(function (ev) {
      [qEl, brandEl, saeEl, apiEl, aceaEl, ilsacEl, chinaEl].forEach(function (el) {
        if (el) el.addEventListener(ev, apply);
      });
    });
    const clear = $("#clearFilters");
    if (clear) {
      clear.addEventListener("click", function () {
        if (qEl) qEl.value = "";
        if (brandEl) brandEl.value = "";
        if (saeEl) saeEl.value = "";
        if (apiEl) apiEl.value = "";
        if (aceaEl) aceaEl.value = "";
        if (ilsacEl) ilsacEl.value = "";
        if (chinaEl) chinaEl.checked = true;
        apply();
      });
    }
    apply();
  }

  /* —— compare page —— */
  function renderCompare() {
    const mount = $("#compareMount");
    if (!mount) return;
    const params = new URLSearchParams(location.search);
    let ids = (params.get("ids") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    if (!ids.length) ids = getCompare();
    if (ids.length && JSON.stringify(ids) !== JSON.stringify(getCompare())) {
      // keep URL selection visible, also persist if empty storage
      if (!getCompare().length) setCompare(ids);
    }
    const oils = ids.map(oilById).filter(Boolean).slice(0, MAX);
    if (!oils.length) {
      mount.innerHTML = '<p class="compare-empty">还没有选定要对照的油品。请到油品库或产品页，选择两到三种加入对照。</p>';
      return;
    }
    const root = rootPrefix();
    const rows = [
      ["粘度等级", function (p) { return saeHtml(p); }],
      ["API", function (p) { return displayOrStatus(p, "API"); }],
      ["ACEA", function (p) { return displayOrStatus(p, "ACEA"); }],
      ["ILSAC", function (p) { return displayOrStatus(p, "ILSAC"); }],
      ["OEM 认证", function (p) { return displayOrStatus(p, "OEM认证"); }],
      ["OEM 推荐或满足", function (p) { return displayOrStatus(p, "OEM推荐或满足"); }],
      ["40℃运动粘度", function (p) { return displayOrStatus(p, "40℃运动粘度"); }],
      ["100℃运动粘度", function (p) { return displayOrStatus(p, "100℃运动粘度"); }],
      ["粘度指数", function (p) { return displayOrStatus(p, "粘度指数"); }],
      ["闪点", function (p) { return displayOrStatus(p, "闪点"); }],
      ["倾点", function (p) { return displayOrStatus(p, "倾点"); }],
      ["TBN", function (p) { return displayOrStatus(p, "TBN"); }],
      ["HTHS", function (p) { return displayOrStatus(p, "HTHS"); }],
      ["硫酸盐灰分", function (p) { return displayOrStatus(p, "硫酸盐灰分"); }],
      ["出处", function (p) {
        return '<span class="source">' + escapeHtml((p.sourceKind || "品牌官方产品数据表") + " · " + (p.pdsDate || "")) + "</span>";
      }],
      ["核对状态", function (p) {
        return p.qa ? "已对照原文" : "尚未人工抽检";
      }]
    ];
    let head = "<thead><tr><th>项目</th>";
    oils.forEach(function (p) {
      head += "<th><a href='" + root + "oils/" + encodeURIComponent(p.id) + ".html'>" + escapeHtml(p.name) + "</a>" +
        '<div class="source">' + escapeHtml(p.brandShort || p.brand) + (p.sae ? " · " + escapeHtml(p.sae) : "") + "</div></th>";
    });
    head += "</tr></thead>";
    let body = "<tbody>";
    rows.forEach(function (row) {
      body += "<tr><th>" + row[0] + "</th>";
      oils.forEach(function (p) { body += "<td>" + row[1](p) + "</td>"; });
      body += "</tr>";
    });
    body += "</tbody>";
    const tools = '<p class="quiet">' + oils.map(function (p) {
      return '<button type="button" class="btn ghost" data-compare="' + escapeHtml(p.id) + '" style="margin:0 .4rem .4rem 0">移出 ' + escapeHtml(p.name) + "</button>";
    }).join("") + "</p>";
    mount.innerHTML = tools + '<div style="overflow-x:auto"><table class="compare-table">' + head + body + "</table></div>";
    syncCompareButtons();
  }

  renderDock();
  syncCompareButtons();
  renderCatalog();
  renderCompare();
})();
