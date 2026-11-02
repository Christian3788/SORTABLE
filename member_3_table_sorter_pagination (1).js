/**
 * MEMBER 3: TABLE RENDERER, NATURAL SORTER & PAGINATION
 * Focus: Required table columns, numerical unit parsing (75 kg < 100 kg),
 * missing-values-always-last sorting rule, and client-side pagination.
 */
const SortModule = (function () {
  "use strict";

  function cleanString(val) {
    if (val === null || val === undefined) return "";
    const str = String(val).trim();
    if (str === "-" || str === "null" || str === "undefined") return "";
    return str;
  }

  function parseWeightKg(hero) {
    if (!hero.appearance || !hero.appearance.weight) return null;
    for (const w of hero.appearance.weight) {
      if (!w) continue;
      const str = String(w).trim().toLowerCase();
      if (str === "-" || str === "0 kg" || str === "- lb") continue;

      const mKg = str.match(/([\d.,]+)\s*kg/i);
      if (mKg) {
        const n = parseFloat(mKg[1].replace(/,/g, ""));
        if (!isNaN(n) && n > 0) return n;
      }
      const mTons = str.match(/([\d.,]+)\s*tons?/i);
      if (mTons) {
        const n = parseFloat(mTons[1].replace(/,/g, ""));
        if (!isNaN(n) && n > 0) return n * 907.185;
      }
      const mLb = str.match(/([\d.,]+)\s*lb/i);
      if (mLb) {
        const n = parseFloat(mLb[1].replace(/,/g, ""));
        if (!isNaN(n) && n > 0) return n * 0.453592;
      }
    }
    return null;
  }

  function parseHeightCm(hero) {
    if (!hero.appearance || !hero.appearance.height) return null;
    for (const h of hero.appearance.height) {
      if (!h) continue;
      const str = String(h).trim().toLowerCase();
      if (str === "-" || str === "0 cm") continue;

      const mCm = str.match(/([\d.,]+)\s*cm/i);
      if (mCm) {
        const n = parseFloat(mCm[1].replace(/,/g, ""));
        if (!isNaN(n) && n > 0) return n;
      }
      const mMeters = str.match(/([\d.,]+)\s*m(eters)?$/i);
      if (mMeters) {
        const n = parseFloat(mMeters[1].replace(/,/g, ""));
        if (!isNaN(n) && n > 0) return n * 100;
      }
    }
    return null;
  }

  function calculatePowerSum(hero) {
    if (!hero.powerstats) return null;
    let sum = 0, valid = false;
    const stats = ["intelligence", "strength", "speed", "durability", "power", "combat"];
    for (const s of stats) {
      const val = parseInt(hero.powerstats[s], 10);
      if (!isNaN(val) && val > 0) {
        sum += val;
        valid = true;
      }
    }
    return valid ? sum : null;
  }

  function extractVal(hero, col) {
    switch (col) {
      case "icon": return hero.images?.xs || "";
      case "name": return cleanString(hero.name);
      case "fullName": return cleanString(hero.biography?.fullName);
      case "powerstats": return calculatePowerSum(hero);
      case "race": return cleanString(hero.appearance?.race);
      case "gender": return cleanString(hero.appearance?.gender);
      case "height": return parseHeightCm(hero);
      case "weight": return parseWeightKg(hero);
      case "placeOfBirth": return cleanString(hero.biography?.placeOfBirth);
      case "alignment": return cleanString(hero.biography?.alignment);
      default: return cleanString(hero.name);
    }
  }

  function isMissing(val) {
    if (val === null || val === undefined) return true;
    if (typeof val === "string") {
      const s = val.trim().toLowerCase();
      return s === "" || s === "-" || s === "null" || s === "undefined";
    }
    if (typeof val === "number") {
      return isNaN(val) || val <= 0;
    }
    return false;
  }

  return {
    sortHeroes: function (list, col, direction) {
      const isAsc = direction === "asc";
      return list.slice().sort((a, b) => {
        const valA = extractVal(a, col);
        const valB = extractVal(b, col);

        const missingA = isMissing(valA);
        const missingB = isMissing(valB);

        // MANDATORY AUDIT CRITERIA: Missing values always shown last, regardless of sort direction
        if (missingA && missingB) return 0;
        if (missingA) return 1;
        if (missingB) return -1;

        let comparison = 0;
        if (typeof valA === "number" && typeof valB === "number") {
          comparison = valA - valB;
        } else {
          comparison = String(valA).localeCompare(String(valB), undefined, {
            numeric: true,
            sensitivity: "base"
          });
        }
        return isAsc ? comparison : -comparison;
      });
    },
    parseWeightKg: parseWeightKg,
    parseHeightCm: parseHeightCm
  };
})();

const TablePaginationModule = (function () {
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

  function statTier(val) {
    if (val === "-" || val === null || val === undefined) return "";
    const num = parseInt(val, 10);
    if (num >= 80) return "tier-high";
    if (num >= 50) return "tier-mid";
    return "tier-low";
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function updateHeaderSortIndicators(sortColumn, sortDirection) {
    const headers = document.querySelectorAll("th.sortable");
    headers.forEach(th => {
      const col = th.getAttribute("data-col");
      th.classList.remove("sorted-asc", "sorted-desc");
      const icon = th.querySelector(".sort-indicator");
      if (col === sortColumn) {
        if (sortDirection === "asc") {
          th.classList.add("sorted-asc");
          if (icon) icon.textContent = "↑";
        } else {
          th.classList.add("sorted-desc");
          if (icon) icon.textContent = "↓";
        }
      } else {
        if (icon) icon.textContent = "↕";
      }
    });
  }

  return {
    render: function (state) {
      const tbody = document.getElementById("tableBody");
      const emptyBanner = document.getElementById("emptyBanner");
      const list = state.filteredHeroes || [];

      document.getElementById("filterMatchCount").textContent = list.length;
      document.getElementById("totalRecordCount").textContent = state.allHeroes.length;

      if (list.length === 0) {
        tbody.innerHTML = "";
        if (emptyBanner) emptyBanner.style.display = "block";
        return;
      }
      if (emptyBanner) emptyBanner.style.display = "none";

      let totalPages = 1;
      let pSize = list.length;

      if (state.pageSize !== "all") {
        pSize = parseInt(state.pageSize, 10);
        totalPages = Math.max(1, Math.ceil(list.length / pSize));
      }

      if (state.currentPage > totalPages) state.currentPage = totalPages;

      const start = state.pageSize === "all" ? 0 : (state.currentPage - 1) * pSize;
      const end = state.pageSize === "all" ? list.length : start + pSize;
      const pageItems = list.slice(start, end);

      updateHeaderSortIndicators(state.sortColumn, state.sortDirection);

      const btnFirst = document.getElementById("btnFirst");
      const btnPrev = document.getElementById("btnPrev");
      const btnNext = document.getElementById("btnNext");
      const btnLast = document.getElementById("btnLast");
      const indicator = document.getElementById("pageIndicator");

      if (btnFirst) btnFirst.disabled = state.currentPage <= 1;
      if (btnPrev) btnPrev.disabled = state.currentPage <= 1;
      if (btnNext) btnNext.disabled = state.currentPage >= totalPages || state.pageSize === "all";
      if (btnLast) btnLast.disabled = state.currentPage >= totalPages || state.pageSize === "all";
      if (indicator) {
        indicator.textContent = state.pageSize === "all"
          ? "Page 1 of 1 (All)"
          : `Page ${state.currentPage} of ${totalPages}`;
      }

      let rows = "";
      for (let i = 0; i < pageItems.length; i++) {
        const h = pageItems[i];
        const imgUrl = (h.images && h.images.xs) ? h.images.xs : PLACEHOLDER_IMG;
        const fullName = cleanString(h.biography?.fullName) || "-";
        const race = cleanString(h.appearance?.race) || "-";
        const gender = cleanString(h.appearance?.gender) || "-";
        const height = formatHeight(h);
        const weight = formatWeight(h);
        const birth = cleanString(h.biography?.placeOfBirth) || "-";
        const alignmentBadge = formatAlignmentBadge(h.biography?.alignment);

        const stats = h.powerstats || {};
        const intVal = stats.intelligence !== null && stats.intelligence !== undefined ? stats.intelligence : "-";
        const strVal = stats.strength !== null && stats.strength !== undefined ? stats.strength : "-";
        const spdVal = stats.speed !== null && stats.speed !== undefined ? stats.speed : "-";
        const durVal = stats.durability !== null && stats.durability !== undefined ? stats.durability : "-";
        const powVal = stats.power !== null && stats.power !== undefined ? stats.power : "-";
        const comVal = stats.combat !== null && stats.combat !== undefined ? stats.combat : "-";

        rows += `
          <tr data-hero-id="${h.id}">
            <td class="avatar-cell">
              <img 
                class="hero-avatar" 
                src="${escapeHtml(imgUrl)}" 
                alt="${escapeHtml(h.name)}" 
                loading="lazy" 
                onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'"
              />
            </td>
            <td class="hero-primary-name">${escapeHtml(h.name)}</td>
            <td class="hero-secondary-name">${escapeHtml(fullName)}</td>
            <td>
              <div class="stat-matrix" title="Intelligence, Strength, Speed, Durability, Power, Combat">
                <div class="matrix-item"><span class="m-label">INT</span><span class="m-val ${statTier(intVal)}">${intVal}</span></div>
                <div class="matrix-item"><span class="m-label">STR</span><span class="m-val ${statTier(strVal)}">${strVal}</span></div>
                <div class="matrix-item"><span class="m-label">SPD</span><span class="m-val ${statTier(spdVal)}">${spdVal}</span></div>
                <div class="matrix-item"><span class="m-label">DUR</span><span class="m-val ${statTier(durVal)}">${durVal}</span></div>
                <div class="matrix-item"><span class="m-label">POW</span><span class="m-val ${statTier(powVal)}">${powVal}</span></div>
                <div class="matrix-item"><span class="m-label">COM</span><span class="m-val ${statTier(comVal)}">${comVal}</span></div>
              </div>
            </td>
            <td>${escapeHtml(race)}</td>
            <td>${escapeHtml(gender)}</td>
            <td style="font-family: var(--font-stack-mono); font-size: 11.5px;">${escapeHtml(height)}</td>
            <td style="font-family: var(--font-stack-mono); font-size: 11.5px;">${escapeHtml(weight)}</td>
            <td style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(birth)}">${escapeHtml(birth)}</td>
            <td>${alignmentBadge}</td>
          </tr>
        `;
      }
      tbody.innerHTML = rows;
    }
  };
})();