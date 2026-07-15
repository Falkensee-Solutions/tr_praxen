/* ============================================================
   Therapiepraxen-Karte – App-Logik
   Leaflet + MarkerCluster, Liste<->Karte-Synchronisation,
   Filter (Bundesland, Zielgruppe, Finanzierung) + Freitextsuche.
   ============================================================ */

(function () {
  "use strict";

  // Embed-Modus (?embed=1) -> Header/Intro/Kontakt ausblenden
  const params = new URLSearchParams(window.location.search);
  if (params.get("embed") === "1") {
    document.body.classList.add("embed");
  }

  const state = {
    all: [],          // alle Praxen
    filtered: [],     // aktuell sichtbare Praxen
    markers: new Map(), // id -> Leaflet-Marker
    activeId: null,
    filters: {
      search: "",
      bundesland: "",
      zielgruppe: new Set(),
      finanzierung: new Set(),
    },
  };

  // ------------------------- Karte -------------------------
  const map = L.map("map", { scrollWheelZoom: true }).setView([51.1, 10.2], 6);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende',
  }).addTo(map);

  const cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
  });
  map.addLayer(cluster);

  // ------------------------- Hilfsfunktionen -------------------------
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
    return `${i}-${p.plz}-${p.name}`.replace(/\s+/g, "_");
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

  // ------------------------- Popups & Karten-Inhalte -------------------------
  function popupHtml(p) {
    const rows = [];
    rows.push(`<h3>${escapeHtml(p.name)}</h3>`);
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
    rows.push(`<a href="${escapeHtml(mapsLink(p))}" target="_blank" rel="noopener">📍 Route planen</a>`);
    rows.push(`</div>`);
    return `<div class="popup">${rows.join("")}</div>`;
  }

  function cardHtml(p) {
    const tags = [...(p.zielgruppe || []), ...(p.finanzierung || [])]
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
      .join("");
    const actions = [];
    if (p.telefon) {
      const tel = p.telefon.split(",")[0].trim();
      actions.push(`<a href="tel:${escapeHtml(tel.replace(/\s/g, ""))}" onclick="event.stopPropagation()">☎ Anrufen</a>`);
    }
    if (p.website) {
      actions.push(`<a href="${escapeHtml(normalizeUrl(p.website))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">🌐 Website</a>`);
    }
    actions.push(`<a href="${escapeHtml(mapsLink(p))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">📍 Route</a>`);

    return `
      <h3>${escapeHtml(p.name)}</h3>
      <p class="addr">${escapeHtml(fullAddress(p))}</p>
      ${tags ? `<div class="card-tags">${tags}</div>` : ""}
      <div class="card-actions">${actions.join("")}</div>
    `;
  }

  // ------------------------- Marker -------------------------
  function buildMarkers() {
    state.all.forEach((p) => {
      const marker = L.marker([p.lat, p.lng], { title: p.name });
      marker.bindPopup(popupHtml(p));
      marker.on("click", () => setActive(p._id, { fromMarker: true }));
      state.markers.set(p._id, marker);
    });
  }

  // ------------------------- Liste -------------------------
  const listEl = document.getElementById("practiceList");
  const emptyEl = document.getElementById("listEmpty");
  const countEl = document.getElementById("resultCount");

  function renderList() {
    listEl.innerHTML = "";
    if (state.filtered.length === 0) {
      emptyEl.hidden = false;
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
    countEl.textContent = `${n} ${n === 1 ? "Praxis" : "Praxen"} gefunden`;
  }

  function highlightMarker(id, on) {
    const marker = state.markers.get(id);
    if (!marker) return;
    const el = marker._icon;
    if (el) el.style.filter = on ? "hue-rotate(150deg) saturate(2)" : "";
  }

  // ------------------------- Aktivierung (Sync Liste<->Karte) -------------------------
  function setActive(id, opts = {}) {
    state.activeId = id;

    // Karten hervorheben
    listEl.querySelectorAll(".practice-card").forEach((c) => {
      c.classList.toggle("active", c.dataset.id === id);
    });

    const p = state.all.find((x) => x._id === id);
    const marker = state.markers.get(id);
    if (!p || !marker) return;

    if (opts.fromCard) {
      // Zur Praxis zoomen und Popup öffnen
      map.setView([p.lat, p.lng], Math.max(map.getZoom(), 13), { animate: true });
      cluster.zoomToShowLayer(marker, () => marker.openPopup());
    }

    if (opts.fromMarker) {
      // Zugehörige Karte in die Liste scrollen
      const card = listEl.querySelector(`.practice-card[data-id="${CSS.escape(id)}"]`);
      if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // ------------------------- Filter -------------------------
  function applyFilters() {
    const { search, bundesland, zielgruppe, finanzierung } = state.filters;
    const q = search.trim().toLowerCase();

    state.filtered = state.all.filter((p) => {
      if (bundesland && p.bundesland !== bundesland) return false;
      if (zielgruppe.size && !(p.zielgruppe || []).some((z) => zielgruppe.has(z))) return false;
      if (finanzierung.size && !(p.finanzierung || []).some((f) => finanzierung.has(f))) return false;
      if (q) {
        const hay = `${p.name} ${p.ort} ${p.plz} ${p.strasse} ${p.bundesland}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    // Marker aktualisieren
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
    resetBtn.hidden = !active;
  }

  // Karte auf alle aktuell sichtbaren Praxen einpassen (nur wenn Karte sichtbar/gemessen)
  function fitToVisible() {
    if (!state.filtered.length) return;
    const size = map.getSize();
    if (size.x === 0 || size.y === 0) return; // Karte (noch) versteckt
    const bounds = L.latLngBounds(state.filtered.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }

  // ------------------------- Filter-UI aufbauen -------------------------
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
    uniqueSorted("bundesland").forEach((b) => {
      const opt = document.createElement("option");
      opt.value = b;
      opt.textContent = b;
      bundeslandSel.appendChild(opt);
    });

    buildChips(chipZ, uniqueSorted("zielgruppe"), state.filters.zielgruppe);
    buildChips(chipF, uniqueSorted("finanzierung"), state.filters.finanzierung);
  }

  function buildChips(container, values, targetSet) {
    values.forEach((val) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = val;
      btn.setAttribute("aria-pressed", "false");
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

  // Debounce für die Suche
  let searchTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.filters.search = searchInput.value;
      applyFilters();
    }, 180);
  });

  bundeslandSel.addEventListener("change", () => {
    state.filters.bundesland = bundeslandSel.value;
    applyFilters();
  });

  resetBtn.addEventListener("click", () => {
    state.filters.search = "";
    state.filters.bundesland = "";
    state.filters.zielgruppe.clear();
    state.filters.finanzierung.clear();
    searchInput.value = "";
    bundeslandSel.value = "";
    document.querySelectorAll(".chip[aria-pressed='true']").forEach((c) =>
      c.setAttribute("aria-pressed", "false")
    );
    applyFilters();
  });

  // ------------------------- Mobile: Ansicht umschalten -------------------------
  const viewToggle = document.getElementById("viewToggle");

  const mobileQuery = window.matchMedia("(max-width: 900px)");

  function syncToggleLabel() {
    const showMap = document.body.classList.contains("show-map");
    viewToggle.textContent = showMap ? "Liste anzeigen" : "Karte anzeigen";
  }

  // Auf dem Handy zuerst die Karte zeigen (kein Scrollen durch die Liste nötig)
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

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", () => {
      setTimeout(() => {
        map.invalidateSize();
        fitToVisible();
      }, 60);
    });
  }

  // ------------------------- Header: Mobile-Menü -------------------------
  const menuToggle = document.getElementById("menuToggle");
  const siteNav = document.getElementById("siteNav");
  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
      const open = siteNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ------------------------- Daten laden -------------------------
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
    })
    .catch((err) => {
      countEl.textContent = "Daten konnten nicht geladen werden.";
      console.error("Laden fehlgeschlagen:", err);
    });
})();
