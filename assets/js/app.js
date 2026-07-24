/* ============================================================
   Therapiepraxen-Karte – App-Logik
   TÜM SAYFA ÇEVİRİSİ (HTML + App) - Standart Dil: Türkçe
   ============================================================ */

(function () {
  "use strict";

  // --- ÜBERSETZUNGS-LOGIK (i18n) ---
  let currentLang = "tr"; // Sayfa ilk açıldığında Türkçe

  const i18n = {
    de: {
      // App İçi (Harita, Butonlar vb.)
      btnToggleLang: "🇹🇷 Türkçe",
      routePop: "📍 Route planen",
      call: "☎ Anrufen",
      website: "🌐 Website",
      routeCard: "📍 Route",
      practiceSingle: "Praxis gefunden",
      practicePlural: "Praxen gefunden",
      showList: "Liste anzeigen",
      showMap: "Karte anzeigen",
      loadError: "Daten konnten nicht geladen werden.",
      
      // HTML Sayfa İçi Yazılar
      navHome: "Home",
      navAbout: "Über mich",
      navOffer: "Behandlungsangebot",
      navSingle: "Einzeltherapie",
      navGroup: "Gruppentherapie",
      navCouple: "Paartherapie",
      navCosts: "Kosten",
      navTurkish: "Türkçe",
      navContact: "Kontakt",
      navPrivacy: "Datenschutz",
      navImprint: "Impressum",

      pageTitle: "Therapiepraxen in Ihrer Nähe",
      pageDesc: "Auf dieser Karte finden Sie muttersprachliche Psychotherapiepraxen in Deutschland. Nutzen Sie die Suche und die Filter, um Praxen nach Region, Zielgruppe und Finanzierung zu finden. Zoomen Sie in die Karte hinein oder klicken Sie auf einen Eintrag in der Liste, um Details und Kontaktmöglichkeiten zu sehen.",
      searchPlaceholder: "Name, Ort oder PLZ suchen…",
      allStates: "Alle Bundesländer",
      resetFilters: "Filter zurücksetzen",
      emptyList: "Keine Praxen entsprechen Ihren Filtern.",
      
      contactRole1: "Psychologischer Psychotherapeut",
      contactRole2: "Verhaltenstherapie",
      contactRole3: "Praxis für Psychotherapie",
      contactMap: "Karte anzeigen",
      contactHeader: "Kontakt",
      
      // JSON'dan gelen filtre etiketleri Almanca kalsın istenirse:
      // "Kinder": "Kinder", 
      // "Erwachsene": "Erwachsene"
    },
    tr: {
      // App İçi (Harita, Butonlar vb.)
      btnToggleLang: "🇩🇪 Deutsch",
      routePop: "📍 Yol tarifi al",
      call: "☎ Ara",
      website: "🌐 Web sitesi",
      routeCard: "📍 Yol tarifi",
      practiceSingle: "Muayenehane bulundu",
      practicePlural: "Muayenehane bulundu", 
      showList: "Listeyi göster",
      showMap: "Haritayı göster",
      loadError: "Veriler yüklenemedi.",
      
      // HTML Sayfa İçi Yazılar
      navHome: "Ana Sayfa",
      navAbout: "Hakkımda",
      navOffer: "Tedavi Seçenekleri",
      navSingle: "Bireysel Terapi",
      navGroup: "Grup Terapisi",
      navCouple: "Çift Terapisi",
      navCosts: "Ücretler",
      navTurkish: "Türkçe",
      navContact: "İletişim",
      navPrivacy: "Gizlilik Politikası",
      navImprint: "Künye",

      pageTitle: "Yakınınızdaki Terapi Muayenehaneleri",
      pageDesc: "Bu haritada Almanya'daki anadilinizde hizmet veren psikoterapi muayenehanelerini bulabilirsiniz. Arama ve filtreleri kullanarak bölgeye, hedef kitleye ve finansman seçeneklerine göre muayenehaneleri listeleyin. Detayları ve iletişim bilgilerini görmek için haritayı yakınlaştırın veya listedeki bir kayda tıklayın.",
      searchPlaceholder: "İsim, şehir veya posta kodu ara…",
      allStates: "Tüm Eyaletler",
      resetFilters: "Filtreleri sıfırla",
      emptyList: "Bu kriterlere uygun muayenehane bulunamadı.",

      contactRole1: "Uzman Psikolog Psikoterapist",
      contactRole2: "Bilişsel Davranışçı Terapi",
      contactRole3: "Psikoterapi Muayenehanesi",
      contactMap: "Haritada göster",
      contactHeader: "İletişim",
      
      // JSON'dan gelen filtreleri de Türkçeye çevirmek isterseniz buraya yazabilirsiniz:
      "Erwachsene": "Yetişkinler",
      "Kinder": "Çocuklar",
      "Jugendliche": "Gençler",
      "Gesetzliche Krankenkasse": "Devlet Sigortası",
      "Private Krankenkasse": "Özel Sigorta",
      "Selbstzahler": "Kendi Ödeyenler"
    }
  };

  function t(key) {
    return i18n[currentLang][key] || key;
  }

  // --- HTML SABİT YAZILARI ÇEVİRME ---
  function translateStaticHTML() {
    document.documentElement.lang = currentLang; // Sayfa dil etiketini güncelle
    
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (i18n[currentLang][key]) {
        el.textContent = i18n[currentLang][key]; // innerHTML yerine textContent (span oklarını bozmaz)
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (i18n[currentLang][key]) {
        el.placeholder = i18n[currentLang][key];
      }
    });
  }

  // --- DİL BUTONUNU OLUŞTURMA ---
  function setupLanguageButton() {
    const langBtn = document.createElement("button");
    langBtn.id = "translateBtn";
    langBtn.className = "lang-toggle-btn"; 
    langBtn.textContent = t("btnToggleLang");
    
    langBtn.addEventListener("click", () => {
      currentLang = currentLang === "de" ? "tr" : "de";
      langBtn.textContent = t("btnToggleLang");
      refreshUI();
    });

    document.body.appendChild(langBtn);
  }

  // Dil değiştiğinde tüm arayüzü yenile
  function refreshUI() {
    translateStaticHTML();

    cluster.clearLayers();
    state.markers.clear();
    buildMarkers();
    
    const chipZ = document.getElementById("chipZielgruppe");
    const chipF = document.getElementById("chipFinanzierung");
    if(chipZ) chipZ.innerHTML = "";
    if(chipF) chipF.innerHTML = "";
    buildFilterUI(); 

    applyFilters();
    syncToggleLabel();
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("embed") === "1") {
    document.body.classList.add("embed");
  }

  const state = {
    all: [],          
    filtered: [],     
    markers: new Map(), 
    activeId: null,
    filters: {
      search: "",
      bundesland: "",
      zielgruppe: new Set(),
      finanzierung: new Set(),
    },
  };

  const map = L.map("map", { scrollWheelZoom: true }).setView([51.1, 10.2], 6);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap-Mitwirkende',
  }).addTo(map);

  const cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
  });
  map.addLayer(cluster);

  function getDisplayName(p) {
    if (p.name) return p.name;
    return [p.anrede, p.vorname, p.nachname].filter(Boolean).join(" ");
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeUrl(url) {
    if (!url) return "";
    return /^https?:\/\//i.test(url) ? url : "https://" + url;
  }

  function displayUrl(url) {
    return String(url).replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }

  function idFor(p, i) {
    return `${i}-${p.plz}-${getDisplayName(p)}`.replace(/\s+/g, "_");
  }

  function fullAddress(p) {
    const parts = [];
    if (p.strasse) parts.push(p.strasse);
    const city = [p.plz, p.ort].filter(Boolean).join(" ");
    if (city) parts.push(city);
    return parts.join(", ");
  }

  function mapsLink(p) {
    const q = encodeURIComponent(`${p.strasse}, ${p.plz} ${p.ort}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  function popupHtml(p) {
    const rows = [];
    rows.push(`<h3>${escapeHtml(getDisplayName(p))}</h3>`);
    rows.push(`<p class="addr">${escapeHtml(fullAddress(p))}</p>`);
    rows.push(`<div class="popup-actions">`);
    if (p.telefon) {
      const tel = p.telefon.split(",")[0].trim();
      rows.push(`<a href="tel:${escapeHtml(tel.replace(/\s/g, ""))}">☎ ${escapeHtml(p.telefon)}</a>`);
    }
    if (p.email) rows.push(`<a href="mailto:${escapeHtml(p.email)}">✉ ${escapeHtml(p.email)}</a>`);
    if (p.website) {
      const u = normalizeUrl(p.website);
      rows.push(`<a href="${escapeHtml(u)}" target="_blank" rel="noopener">🌐 ${escapeHtml(displayUrl(p.website))}</a>`);
    }
    rows.push(`<a href="${escapeHtml(mapsLink(p))}" target="_blank" rel="noopener">${t("routePop")}</a>`);
    rows.push(`</div>`);
    return `<div class="popup">${rows.join("")}</div>`;
  }

  function cardHtml(p) {
    const tags = [...(p.zielgruppe || []), ...(p.finanzierung || [])]
      .map((tag) => `<span class="tag">${escapeHtml(t(tag))}</span>`)
      .join("");
    const actions = [];
    if (p.telefon) {
      const tel = p.telefon.split(",")[0].trim();
      actions.push(`<a href="tel:${escapeHtml(tel.replace(/\s/g, ""))}" onclick="event.stopPropagation()">${t("call")}</a>`);
    }
    if (p.website) {
      actions.push(`<a href="${escapeHtml(normalizeUrl(p.website))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${t("website")}</a>`);
    }
    actions.push(`<a href="${escapeHtml(mapsLink(p))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${t("routeCard")}</a>`);

    return `
      <h3>${escapeHtml(getDisplayName(p))}</h3>
      <p class="addr">${escapeHtml(fullAddress(p))}</p>
      ${tags ? `<div class="card-tags">${tags}</div>` : ""}
      <div class="card-actions">${actions.join("")}</div>
    `;
  }

  function buildMarkers() {
    state.all.forEach((p) => {
      const marker = L.marker([p.lat, p.lng], { title: getDisplayName(p) });
      marker.bindPopup(popupHtml(p));
      marker.on("click", () => setActive(p._id, { fromMarker: true }));
      state.markers.set(p._id, marker);
    });
  }

  const listEl = document.getElementById("practiceList");
  const emptyEl = document.getElementById("listEmpty");
  const countEl = document.getElementById("resultCount");

  function renderList() {
    listEl.innerHTML = "";
    if (state.filtered.length === 0) {
      emptyEl.hidden = false;
      emptyEl.textContent = t("emptyList");
    } else {
      emptyEl.hidden = true;
      const frag = document.createDocumentFragment();
      state.filtered.forEach((p) => {
        const li = document.createElement("li");
        li.className = "practice-card";
        li.dataset.id = p._id;
        li.innerHTML = cardHtml(p);
        li.addEventListener("click", () => setActive(p._id, { fromCard: true }));
        li.addEventListener("mouseenter", () => highlightMarker(p._id, true));
        li.addEventListener("mouseleave", () => highlightMarker(p._id, false));
        frag.appendChild(li);
      });
      listEl.appendChild(frag);
    }
    const n = state.filtered.length;
    if(countEl) countEl.textContent = `${n} ${n === 1 ? t("practiceSingle") : t("practicePlural")}`;
  }

  function highlightMarker(id, on) {
    const marker = state.markers.get(id);
    if (!marker) return;
    const el = marker._icon;
    if (el) el.style.filter = on ? "hue-rotate(150deg) saturate(2)" : "";
  }

  function setActive(id, opts = {}) {
    state.activeId = id;
    listEl.querySelectorAll(".practice-card").forEach((c) => {
      c.classList.toggle("active", c.dataset.id === id);
    });
    const p = state.all.find((x) => x._id === id);
    const marker = state.markers.get(id);
    if (!p || !marker) return;
    if (opts.fromCard) {
      map.setView([p.lat, p.lng], Math.max(map.getZoom(), 13), { animate: true });
      cluster.zoomToShowLayer(marker, () => marker.openPopup());
    }
    if (opts.fromMarker) {
      const card = listEl.querySelector(`.practice-card[data-id="${CSS.escape(id)}"]`);
      if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function applyFilters() {
    const { search, bundesland, zielgruppe, finanzierung } = state.filters;
    const q = search.trim().toLowerCase();

    state.filtered = state.all.filter((p) => {
      if (bundesland && p.bundesland !== bundesland) return false;
      if (zielgruppe.size && !(p.zielgruppe || []).some((z) => zielgruppe.has(z))) return false;
      if (finanzierung.size && !(p.finanzierung || []).some((f) => finanzierung.has(f))) return false;
      if (q) {
        const hay = `${getDisplayName(p)} ${p.vorname || ""} ${p.nachname || ""} ${p.ort} ${p.plz} ${p.strasse} ${p.bundesland}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    cluster.clearLayers();
    const layers = state.filtered.map((p) => state.markers.get(p._id)).filter(Boolean);
    cluster.addLayers(layers);

    renderList();
    updateResetVisibility();
    fitToVisible();
  }

  function updateResetVisibility() {
    const f = state.filters;
    const active = f.search || f.bundesland || f.zielgruppe.size || f.finanzierung.size;
    if(resetBtn) resetBtn.hidden = !active;
  }

  function fitToVisible() {
    if (!state.filtered.length) return;
    const size = map.getSize();
    if (size.x === 0 || size.y === 0) return;
    const bounds = L.latLngBounds(state.filtered.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }

  const searchInput = document.getElementById("searchInput");
  const bundeslandSel = document.getElementById("filterBundesland");
  const chipZ = document.getElementById("chipZielgruppe");
  const chipF = document.getElementById("chipFinanzierung");
  const resetBtn = document.getElementById("resetFilters");

  function uniqueSorted(key) {
    const set = new Set();
    state.all.forEach((p) => {
      const v = p[key];
      if (Array.isArray(v)) v.forEach((x) => x && set.add(x));
      else if (v) set.add(v);
    });
    return [...set].sort((a, b) => a.localeCompare(b, "de"));
  }

  function buildFilterUI() {
    if (bundeslandSel && bundeslandSel.options.length <= 1) {
      uniqueSorted("bundesland").forEach((b) => {
        const opt = document.createElement("option");
        opt.value = b;
        opt.textContent = b;
        bundeslandSel.appendChild(opt);
      });
    }

    if(chipZ) buildChips(chipZ, uniqueSorted("zielgruppe"), state.filters.zielgruppe);
    if(chipF) buildChips(chipF, uniqueSorted("finanzierung"), state.filters.finanzierung);
  }

  function buildChips(container, values, targetSet) {
    values.forEach((val) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = t(val); 
      btn.dataset.originalValue = val; 
      
      btn.setAttribute("aria-pressed", targetSet.has(val) ? "true" : "false");
      
      btn.addEventListener("click", () => {
        if (targetSet.has(val)) {
          targetSet.delete(val);
          btn.setAttribute("aria-pressed", "false");
        } else {
          targetSet.add(val);
          btn.setAttribute("aria-pressed", "true");
        }
        applyFilters();
      });
      container.appendChild(btn);
    });
  }

  let searchTimer;
  if(searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.filters.search = searchInput.value;
        applyFilters();
      }, 180);
    });
  }

  if(bundeslandSel) {
    bundeslandSel.addEventListener("change", () => {
      state.filters.bundesland = bundeslandSel.value;
      applyFilters();
    });
  }

  if(resetBtn) {
    resetBtn.addEventListener("click", () => {
      state.filters.search = "";
      state.filters.bundesland = "";
      state.filters.zielgruppe.clear();
      state.filters.finanzierung.clear();
      if(searchInput) searchInput.value = "";
      if(bundeslandSel) bundeslandSel.value = "";
      document.querySelectorAll(".chip[aria-pressed='true']").forEach((c) =>
        c.setAttribute("aria-pressed", "false")
      );
      applyFilters();
    });
  }

  const viewToggle = document.getElementById("viewToggle");
  const mobileQuery = window.matchMedia("(max-width: 900px)");

  function syncToggleLabel() {
    const showMap = document.body.classList.contains("show-map");
    if (viewToggle) {
        viewToggle.textContent = showMap ? t("showList") : t("showMap");
    }
  }

  function applyMobileDefault() {
    if (mobileQuery.matches && !document.body.dataset.userToggled) {
      document.body.classList.add("show-map");
      syncToggleLabel();
      setTimeout(() => {
        map.invalidateSize();
        fitToVisible();
      }, 60);
    }
  }

  if (viewToggle) {
      viewToggle.addEventListener("click", () => {
        document.body.dataset.userToggled = "1";
        const showMap = document.body.classList.toggle("show-map");
        syncToggleLabel();
        if (showMap) {
          setTimeout(() => {
            map.invalidateSize();
            fitToVisible();
          }, 60);
        }
      });
  }

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", () => {
      setTimeout(() => {
        map.invalidateSize();
        fitToVisible();
      }, 60);
    });
  }

  const filterBar = document.getElementById("filterBar");
  const filterInner = document.querySelector(".filter-bar-inner");

  function updateFilterFade() {
    if (!filterBar || !filterInner) return;
    const scrollable = filterInner.scrollWidth > filterInner.clientWidth + 2;
    const atEnd =
      filterInner.scrollLeft + filterInner.clientWidth >= filterInner.scrollWidth - 2;
    filterBar.classList.toggle("scroll-end", !scrollable || atEnd);
  }

  function hintFilterScroll() {
    if (!filterInner || !mobileQuery.matches) return;
    if (filterInner.scrollWidth <= filterInner.clientWidth + 8) return;
    setTimeout(() => {
      filterInner.scrollTo({ left: 84, behavior: "smooth" });
      setTimeout(() => filterInner.scrollTo({ left: 0, behavior: "smooth" }), 700);
    }, 600);
  }

  if (filterInner) {
    filterInner.addEventListener("scroll", updateFilterFade, { passive: true });
    window.addEventListener("resize", updateFilterFade);
  }

  const menuToggle = document.getElementById("menuToggle");
  const siteNav = document.getElementById("siteNav");
  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
      const open = siteNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Initialisierung
  setupLanguageButton();
  
  // Yükleme başladığı an her şeyi Türkçeye çevir!
  translateStaticHTML();

  fetch("data/practices.json", { cache: "no-cache" })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      state.all = (data.practices || []).map((p, i) => ({ ...p, _id: idFor(p, i) }));
      buildMarkers();
      buildFilterUI();
      applyFilters();
      applyMobileDefault();
      updateFilterFade();
      hintFilterScroll();
    })
    .catch((err) => {
      if (countEl) countEl.textContent = t("loadError");
      console.error("Laden fehlgeschlagen:", err);
    });
})();