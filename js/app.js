/* ============================================================
   FUEL STATION FINDER — app.js
   Demo data lives client-side; report submissions are stored
   only in memory for this session (no backend in this build).
   ============================================================ */

(function () {
  "use strict";

  // Reference point used to calculate "distance from you" for this demo
  // (Abuja city centre) — a real build would use navigator.geolocation.
  const USER_LOCATION = { lat: 9.0765, lng: 7.3986 };

  const STATIONS = [
    { id: "s1", name: "NNPC Mega Station", brand: "NNPC Retail", area: "Wuse II",
      lat: 9.0833, lng: 7.4833, price: 890, fuelUpdated: "2 hours ago", status: "In stock" },
    { id: "s2", name: "TotalEnergies Garki", brand: "TotalEnergies", area: "Garki",
      lat: 9.0400, lng: 7.4900, price: 905, fuelUpdated: "5 hours ago", status: "In stock" },
    { id: "s3", name: "Mobil Central", brand: "Mobil", area: "Central Business District",
      lat: 9.0579, lng: 7.4951, price: 895, fuelUpdated: "1 hour ago", status: "In stock" },
    { id: "s4", name: "Conoil Maitama", brand: "Conoil", area: "Maitama",
      lat: 9.0929, lng: 7.4901, price: 915, fuelUpdated: "Yesterday", status: "Low stock" },
    { id: "s5", name: "Ardova Utako", brand: "Ardova", area: "Utako",
      lat: 9.0722, lng: 7.4444, price: 899, fuelUpdated: "3 hours ago", status: "In stock" },
    { id: "s6", name: "NIPCO Jabi", brand: "NIPCO", area: "Jabi",
      lat: 9.0765, lng: 7.4265, price: 888, fuelUpdated: "6 hours ago", status: "In stock" },
    { id: "s7", name: "TotalEnergies Wuye", brand: "TotalEnergies", area: "Wuye",
      lat: 9.0512, lng: 7.4589, price: 910, fuelUpdated: "4 hours ago", status: "In stock" },
    { id: "s8", name: "Rainoil Gwarinpa", brand: "Rainoil", area: "Gwarinpa",
      lat: 9.1109, lng: 7.4165, price: 892, fuelUpdated: "2 hours ago", status: "In stock" },
  ];

  let PRICE_REPORTS = [
    { station: "NNPC Mega Station", area: "Wuse II", fuel: "Petrol", price: 890, when: "2 hours ago" },
    { station: "Mobil Central", area: "Central Business District", fuel: "Petrol", price: 895, when: "3 hours ago" },
    { station: "NIPCO Jabi", area: "Jabi", fuel: "Petrol", price: 888, when: "6 hours ago" },
    { station: "TotalEnergies Garki", area: "Garki", fuel: "Diesel", price: 1180, when: "8 hours ago" },
    { station: "Rainoil Gwarinpa", area: "Gwarinpa", fuel: "Petrol", price: 892, when: "Yesterday" },
    { station: "Ardova Utako", area: "Utako", fuel: "Kerosene", price: 1050, when: "Yesterday" },
  ];

  // ---------- helpers ----------
  function distanceKm(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(h));
  }

  STATIONS.forEach((s) => {
    s.distance = Math.round(distanceKm(USER_LOCATION, { lat: s.lat, lng: s.lng }) * 10) / 10;
  });

  function formatNaira(n) {
    return "₦" + Number(n).toLocaleString("en-NG");
  }

  // ---------- ticker ----------
  function renderTicker() {
    const track = document.getElementById("tickerTrack");
    const items = STATIONS.map(
      (s) => `<span class="ticker__item">${s.name} · ${s.area} — <b>${formatNaira(s.price)}/L</b></span>`
    );
    track.innerHTML = items.join("") + items.join("");
  }

  // ---------- hero meta ----------
  function renderHeroMeta() {
    document.getElementById("stationCount").textContent = `${STATIONS.length} stations tracked`;
  }

  // ---------- map ----------
  let map, markers = {};
  function initMap() {
    map = L.map("map", { scrollWheelZoom: false }).setView([USER_LOCATION.lat, USER_LOCATION.lng], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const pumpIcon = L.divIcon({
      className: "",
      html:
        '<div style="background:#F2A93B;border:2px solid #0F2038;width:16px;height:16px;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    STATIONS.forEach((s) => {
      const marker = L.marker([s.lat, s.lng], { icon: pumpIcon }).addTo(map);
      marker.bindPopup(popupHtml(s));
      marker.on("click", () => openStationModal(s.id));
      markers[s.id] = marker;
    });
  }

  function popupHtml(s) {
    return `
      <div style="font-family:Inter,sans-serif;min-width:170px">
        <strong style="font-family:'Space Grotesk',sans-serif">${s.name}</strong><br>
        <span style="color:#5B6B84;font-size:.8rem">${s.area} · ${s.distance} km</span><br>
        <span style="font-family:'IBM Plex Mono',monospace;color:#D98A16;font-weight:600">${formatNaira(s.price)}/L</span>
      </div>`;
  }

  // ---------- list ----------
  function renderList(stations) {
    const list = document.getElementById("stationList");
    if (!stations.length) {
      list.innerHTML = `<p style="grid-column:1/-1">No stations match your search or filters.</p>`;
      return;
    }
    list.innerHTML = stations
      .map(
        (s) => `
      <article class="station-card" data-id="${s.id}" tabindex="0" role="button" aria-label="View details for ${s.name}">
        <div class="station-card__top">
          <div>
            <div class="station-card__name">${s.name}</div>
            <div class="station-card__brand">${s.brand} · ${s.area}</div>
          </div>
          <span class="price-led">${formatNaira(s.price)}</span>
        </div>
        <div class="station-card__meta">
          <span class="station-card__dist">${s.distance} km away</span>
          <span>${s.status}</span>
        </div>
      </article>`
      )
      .join("");

    list.querySelectorAll(".station-card").forEach((card) => {
      card.addEventListener("click", () => openStationModal(card.dataset.id));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") openStationModal(card.dataset.id);
      });
    });
  }

  // ---------- filtering ----------
  function getFiltered() {
    const q = (document.getElementById("filterSearch").value || "").trim().toLowerCase();
    const dist = document.getElementById("distanceFilter").value;
    const priceSort = document.getElementById("priceFilter").value;

    let result = STATIONS.filter((s) => {
      const matchesQuery = !q || s.name.toLowerCase().includes(q) || s.area.toLowerCase().includes(q);
      const matchesDist = dist === "all" || s.distance <= Number(dist);
      return matchesQuery && matchesDist;
    });

    if (priceSort === "low") result = result.slice().sort((a, b) => a.price - b.price);
    if (priceSort === "high") result = result.slice().sort((a, b) => b.price - a.price);

    return result;
  }

  function applyFilters() {
    const filtered = getFiltered();
    renderList(filtered);

    STATIONS.forEach((s) => {
      const isVisible = filtered.some((f) => f.id === s.id);
      const marker = markers[s.id];
      if (!marker) return;
      if (isVisible && !map.hasLayer(marker)) marker.addTo(map);
      if (!isVisible && map.hasLayer(marker)) map.removeLayer(marker);
    });
  }

  // ---------- view toggle ----------
  function setView(view) {
    const mapView = document.getElementById("mapView");
    const listView = document.getElementById("listView");
    const btnMap = document.getElementById("btnViewMap");
    const btnList = document.getElementById("btnViewList");

    if (view === "map") {
      mapView.hidden = false;
      listView.hidden = true;
      btnMap.classList.add("is-active");
      btnList.classList.remove("is-active");
      setTimeout(() => map && map.invalidateSize(), 50);
    } else {
      mapView.hidden = true;
      listView.hidden = false;
      btnList.classList.add("is-active");
      btnMap.classList.remove("is-active");
    }
  }

  // ---------- station modal ----------
  function openStationModal(id) {
    const s = STATIONS.find((st) => st.id === id);
    if (!s) return;
    const content = document.getElementById("modalContent");
    content.innerHTML = `
      <div class="station-detail__brand">${s.brand}</div>
      <div class="station-detail__name" id="modalTitle">${s.name}</div>
      <div class="station-detail__row"><span>Area</span><span>${s.area}</span></div>
      <div class="station-detail__row"><span>Distance</span><span>${s.distance} km away</span></div>
      <div class="station-detail__row"><span>Reported price</span><span class="price-led">${formatNaira(s.price)}/L</span></div>
      <div class="station-detail__row"><span>Status</span><span>${s.status}</span></div>
      <div class="station-detail__row"><span>Last updated</span><span>${s.fuelUpdated}</span></div>
      <div class="station-detail__map" id="modalMap"></div>
    `;
    const modal = document.getElementById("stationModal");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    setTimeout(() => {
      const detailMap = L.map("modalMap", {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
      }).setView([s.lat, s.lng], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(detailMap);
      L.marker([s.lat, s.lng]).addTo(detailMap);
    }, 50);
  }

  function closeModal() {
    const modal = document.getElementById("stationModal");
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.getElementById("modalContent").innerHTML = "";
  }

  // ---------- price reports table ----------
  function renderReportsTable() {
    const body = document.getElementById("reportsTableBody");
    body.innerHTML = PRICE_REPORTS.map(
      (r) => `
      <tr>
        <td>${r.station}</td>
        <td>${r.area}</td>
        <td>${r.fuel}</td>
        <td class="price-led">${formatNaira(r.price)}</td>
        <td>${r.when}</td>
      </tr>`
    ).join("");
  }

  // ---------- report form ----------
  function populateStationSelect() {
    const select = document.getElementById("rStation");
    select.innerHTML = STATIONS.map((s) => `<option value="${s.name}|${s.area}">${s.name} — ${s.area}</option>`).join("");
  }

  function handleReportSubmit(e) {
    e.preventDefault();
    const [station, area] = document.getElementById("rStation").value.split("|");
    const fuel = document.getElementById("rFuelType").value;
    const price = document.getElementById("rPrice").value;
    const locationNote = document.getElementById("rLocation").value;

    PRICE_REPORTS.unshift({
      station,
      area: locationNote ? `${area} — ${locationNote}` : area,
      fuel,
      price,
      when: "Just now",
    });
    renderReportsTable();

    const status = document.getElementById("reportStatus");
    status.textContent = `Thanks — your report for ${station} was added to Price Reports below.`;
    e.target.reset();
    populateStationSelect();
    setTimeout(() => (status.textContent = ""), 6000);
  }

  // ---------- wire up ----------
  document.addEventListener("DOMContentLoaded", () => {
    renderTicker();
    renderHeroMeta();
    initMap();
    renderList(STATIONS);
    renderReportsTable();
    populateStationSelect();

    document.getElementById("filterSearch").addEventListener("input", applyFilters);
    document.getElementById("distanceFilter").addEventListener("change", applyFilters);
    document.getElementById("priceFilter").addEventListener("change", applyFilters);

    document.getElementById("btnViewMap").addEventListener("click", () => setView("map"));
    document.getElementById("btnViewList").addEventListener("click", () => setView("list"));

    document.getElementById("heroSearchForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const val = document.getElementById("heroSearchInput").value;
      document.getElementById("filterSearch").value = val;
      applyFilters();
      setView("list");
      document.getElementById("finder").scrollIntoView({ behavior: "smooth" });
    });

    document.getElementById("reportForm").addEventListener("submit", handleReportSubmit);

    document.getElementById("modalClose").addEventListener("click", closeModal);
    document.getElementById("modalBackdrop").addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    document.getElementById("navBurger").addEventListener("click", (e) => {
      const links = document.querySelector(".nav__links");
      const expanded = e.currentTarget.getAttribute("aria-expanded") === "true";
      e.currentTarget.setAttribute("aria-expanded", String(!expanded));
      links.style.display = expanded ? "none" : "flex";
    });
  });
})();
