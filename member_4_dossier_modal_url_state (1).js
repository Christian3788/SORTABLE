/**
 * MEMBER 4: DOSSIER MODAL & URL STATE PERSISTENCE
 * Focus: Hero detail modal view with large portrait (.images.lg), tactical directives,
 * and bidirectional URL parameter synchronization (search, sort, page, hero id).
 */
const UrlModalModule = (function () {
  "use strict";

  const PLACEHOLDER_IMG = "https://placehold.co/160x220/14171f/8b9bb4?text=No+Photo";

  function cleanString(val) {
    if (val === null || val === undefined) return "";
    const str = String(val).trim();
    return (str === "-" || str === "null" || str === "undefined") ? "" : str;
  }

  function formatHeight(hero) {
    if (!hero.appearance || !hero.appearance.height) return "-";
    const valid = hero.appearance.height.filter(val => {
      if (!val) return false;
      const s = String(val).trim();
      return s !== "-" && s !== "0 cm";
    });
    return valid.length > 0 ? valid.join(" / ") : "-";
  }

  function formatWeight(hero) {
    if (!hero.appearance || !hero.appearance.weight) return "-";
    const valid = hero.appearance.weight.filter(val => {
      if (!val) return false;
      const s = String(val).trim();
      return s !== "-" && s !== "- lb" && s !== "0 kg";
    });
    return valid.length > 0 ? valid.join(" / ") : "-";
  }

  function formatAlignmentBadge(alignment) {
    const align = cleanString(alignment).toLowerCase();
    if (align === "good") return `<span class="tag-badge tag-good">Good</span>`;
    if (align === "bad") return `<span class="tag-badge tag-bad">Bad</span>`;
    if (align === "neutral") return `<span class="tag-badge tag-neutral">Neutral</span>`;
    return `<span class="tag-badge tag-unknown">Unknown</span>`;
  }

  function generateDirective(hero, peakStat, peakVal) {
    const align = cleanString(hero.biography?.alignment).toLowerCase();
    if (align === "bad") {
      return "Syndicate Rival / Co-Belligerent: Subject already exhibits hostile tendencies toward established heroes. Assess territorial conflict risk or explore conditional non-aggression pacts.";
    }
    if (align === "neutral") {
      return "Independent Mercenary: No binding loyalty to superhero councils. Can be diverted or hired by exploiting specific personal or financial motives.";
    }
    if (peakStat === "Intelligence" && peakVal >= 80) {
      return "High Intellect Threat: Do not contest them in strategic preparation. Sever telemetry, avoid digital trace routes, and isolate their support personnel.";
    }
    if (peakStat === "Strength" && peakVal >= 80) {
      return "Heavy Kinetic Threat: Direct close-quarters engagement is counterproductive. Deploy area-denial traps, acoustic deterrents, or chemical pacifiers.";
    }
    if (peakStat === "Speed" && peakVal >= 80) {
      return "High Velocity Target: Rely on micro-explosive perimeters, gravitational anchors, or environmental surface nullification.";
    }
    return "Standard Superhero Asset: Vulnerable to collateral diversion. Strike logistics and auxiliary headquarters during routine patrol cycles.";
  }

  function updateUrlState(state) {
    try {
      const params = new URLSearchParams();
      if (state.searchQuery) params.set("q", state.searchQuery);
      if (state.searchField && state.searchField !== "all") params.set("field", state.searchField);
      if (state.searchOperator && state.searchOperator !== "include") params.set("op", state.searchOperator);
      if (state.sortColumn && state.sortColumn !== "name") params.set("sort", state.sortColumn);
      if (state.sortDirection && state.sortDirection !== "asc") params.set("dir", state.sortDirection);
      if (state.pageSize && state.pageSize !== 20) params.set("size", String(state.pageSize));
      if (state.currentPage && state.currentPage > 1) params.set("page", String(state.currentPage));
      if (state.activeHeroId) params.set("hero", String(state.activeHeroId));

      const queryStr = params.toString();
      const targetUrl = window.location.pathname + (queryStr ? "?" + queryStr : "");

      if (window.location.protocol !== "blob:" && window.location.origin !== "null") {
        window.history.replaceState(null, "", targetUrl);
      } else {
        window.location.hash = queryStr ? "#" + queryStr : "";
      }
    } catch (e) {
      console.warn("URL state sync skipped:", e);
    }
  }

  function restoreFromUrl(state) {
    try {
      let params = new URLSearchParams(window.location.search);
      if (!params.toString() && window.location.hash) {
        params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      }

      if (params.has("q")) state.searchQuery = params.get("q") || "";
      if (params.has("field")) state.searchField = params.get("field") || "all";
      if (params.has("op")) state.searchOperator = params.get("op") || "include";
      if (params.has("sort")) state.sortColumn = params.get("sort") || "name";
      if (params.has("dir")) state.sortDirection = params.get("dir") || "asc";
      if (params.has("size")) {
        const sz = params.get("size");
        state.pageSize = sz === "all" ? "all" : parseInt(sz, 10) || 20;
      }
      if (params.has("page")) state.currentPage = Math.max(1, parseInt(params.get("page"), 10) || 1);
      if (params.has("hero")) state.activeHeroId = parseInt(params.get("hero"), 10) || null;
    } catch (e) {
      console.warn("URL restoration failed:", e);
    }
  }

  function openHeroModal(heroId, allHeroes) {
    const hero = allHeroes.find(h => h.id === Number(heroId));
    if (!hero) return;

    const modalBackdrop = document.getElementById("heroModalBackdrop");
    const heroName = document.getElementById("dossierHeroName");
    const heroAlign = document.getElementById("dossierHeroAlignment");
    const portrait = document.getElementById("dossierPortrait");
    const idEl = document.getElementById("dossierId");
    const genderEl = document.getElementById("dossierGender");
    const raceEl = document.getElementById("dossierRace");
    const heightEl = document.getElementById("dossierHeight");
    const weightEl = document.getElementById("dossierWeight");
    const eyesHairEl = document.getElementById("dossierEyesHair");
    const fullNameEl = document.getElementById("dossierFullName");
    const alterEgosEl = document.getElementById("dossierAlterEgos");
    const birthEl = document.getElementById("dossierBirth");
    const firstAppEl = document.getElementById("dossierFirstApp");
    const pubEl = document.getElementById("dossierPublisher");
    const workEl = document.getElementById("dossierWork");
    const affilEl = document.getElementById("dossierAffiliations");
    const relEl = document.getElementById("dossierRelatives");
    const powerbars = document.getElementById("dossierPowerbars");
    const directiveEl = document.getElementById("dossierDirective");

    if (heroName) heroName.textContent = hero.name;
    if (heroAlign) heroAlign.innerHTML = formatAlignmentBadge(hero.biography?.alignment);

    // Large high-res image requirement (.images.lg)
    const fullImg = hero.images?.lg || hero.images?.md || hero.images?.sm || PLACEHOLDER_IMG;
    if (portrait) {
      portrait.src = fullImg;
      portrait.onerror = () => { portrait.src = PLACEHOLDER_IMG; };
    }

    if (idEl) idEl.textContent = `#${hero.id.toString().padStart(4, "0")}`;
    if (genderEl) genderEl.textContent = cleanString(hero.appearance?.gender) || "Unknown";
    if (raceEl) raceEl.textContent = cleanString(hero.appearance?.race) || "Unverified";
    if (heightEl) heightEl.textContent = formatHeight(hero);
    if (weightEl) weightEl.textContent = formatWeight(hero);

    const eyes = cleanString(hero.appearance?.eyeColor) || "-";
    const hair = cleanString(hero.appearance?.hairColor) || "-";
    if (eyesHairEl) eyesHairEl.textContent = `${eyes} / ${hair}`;

    if (fullNameEl) fullNameEl.textContent = cleanString(hero.biography?.fullName) || "Unknown";
    const alter = cleanString(hero.biography?.alterEgos);
    if (alterEgosEl) alterEgosEl.textContent = (alter && alter !== "No alter egos found.") ? alter : "None";

    if (birthEl) birthEl.textContent = cleanString(hero.biography?.placeOfBirth) || "Unknown";
    if (firstAppEl) firstAppEl.textContent = cleanString(hero.biography?.firstAppearance) || "Unrecorded";
    if (pubEl) pubEl.textContent = cleanString(hero.biography?.publisher) || "Independent";
    if (workEl) workEl.textContent = cleanString(hero.work?.occupation) || "Unknown";
    if (affilEl) affilEl.textContent = cleanString(hero.connections?.groupAffiliation) || "None";
    if (relEl) relEl.textContent = cleanString(hero.connections?.relatives) || "None tracked";

    const statsConfig = [
      { key: "intelligence", label: "Intelligence" },
      { key: "strength", label: "Strength" },
      { key: "speed", label: "Speed" },
      { key: "durability", label: "Durability" },
      { key: "power", label: "Power" },
      { key: "combat", label: "Combat Mastery" }
    ];

    let barsHtml = "";
    let maxStatVal = 0;
    let maxStatKey = "";

    statsConfig.forEach(stat => {
      const rawVal = hero.powerstats ? hero.powerstats[stat.key] : null;
      const valNum = (rawVal !== null && rawVal !== undefined) ? parseInt(rawVal, 10) : 0;
      const isKnown = !isNaN(valNum) && rawVal !== null;
      const displayVal = isKnown ? valNum : "N/A";
      const percent = isKnown ? Math.min(100, Math.max(0, valNum)) : 0;

      if (valNum > maxStatVal) {
        maxStatVal = valNum;
        maxStatKey = stat.label;
      }

      barsHtml += `
        <div class="progress-unit">
          <div class="progress-label-bar">
            <span>${stat.label}</span>
            <span style="font-weight: 600; color: #fff;">${displayVal}</span>
          </div>
          <div class="progress-rail">
            <div class="progress-fill" style="width: ${percent}%;"></div>
          </div>
        </div>
      `;
    });

    if (powerbars) powerbars.innerHTML = barsHtml;
    if (directiveEl) directiveEl.textContent = generateDirective(hero, maxStatKey, maxStatVal);

    if (modalBackdrop) modalBackdrop.classList.add("active");

    if (typeof AppState !== "undefined") {
      AppState.activeHeroId = hero.id;
      updateUrlState(AppState);
    }
  }

  function closeModal() {
    const modalBackdrop = document.getElementById("heroModalBackdrop");
    if (modalBackdrop) modalBackdrop.classList.remove("active");
    if (typeof AppState !== "undefined") {
      AppState.activeHeroId = null;
      updateUrlState(AppState);
    }
  }

  // Setup modal close listeners
  if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
      const btnClose = document.getElementById("btnCloseModal");
      const modalBackdrop = document.getElementById("heroModalBackdrop");

      if (btnClose) btnClose.addEventListener("click", closeModal);
      if (modalBackdrop) {
        modalBackdrop.addEventListener("click", (e) => {
          if (e.target === modalBackdrop) closeModal();
        });
      }

      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modalBackdrop && modalBackdrop.classList.contains("active")) {
          closeModal();
        }
      });
    });
  }

  return {
    updateUrlState: updateUrlState,
    restoreFromUrl: restoreFromUrl,
    openHeroModal: openHeroModal,
    closeModal: closeModal
  };
})();