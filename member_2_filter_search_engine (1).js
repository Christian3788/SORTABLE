/**
 * MEMBER 2: QUERY INTERCEPTOR & FILTER ENGINE
 * Focus: Live input filtering, field-specific vector search, Levenshtein fuzzy matching,
 * and numerical comparison operators (equal, not equal, greater than, less than).
 */
const FilterModule = (function () {
  "use strict";

  function cleanString(val) {
    if (val === null || val === undefined) return "";
    const str = String(val).trim();
    if (str === "-" || str === "null" || str === "undefined") return "";
    return str;
  }

  function levenshteinDistance(s1, s2) {
    const m = s1.length, n = s2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    return dp[m][n];
  }

  function fuzzyMatches(pattern, target) {
    if (!pattern) return true;
    if (!target) return false;
    pattern = pattern.toLowerCase();
    target = target.toLowerCase();

    // Check direct substring
    if (target.includes(pattern)) return true;

    // Check sub-sequence
    let pIdx = 0, tIdx = 0;
    while (pIdx < pattern.length && tIdx < target.length) {
      if (pattern[pIdx] === target[tIdx]) pIdx++;
      tIdx++;
    }
    if (pIdx === pattern.length) return true;

    // Check Levenshtein distance against words
    const words = target.split(/\s+/);
    for (const word of words) {
      if (word.length >= 3 && Math.abs(word.length - pattern.length) <= 2) {
        if (levenshteinDistance(pattern, word) <= 2) return true;
      }
    }
    return false;
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

  function getHeroFieldValue(hero, field) {
    switch (field) {
      case "name": return cleanString(hero.name);
      case "fullName": return cleanString(hero.biography?.fullName);
      case "race": return cleanString(hero.appearance?.race);
      case "gender": return cleanString(hero.appearance?.gender);
      case "alignment": return cleanString(hero.biography?.alignment);
      case "placeOfBirth": return cleanString(hero.biography?.placeOfBirth);
      case "powerstats": return calculatePowerSum(hero);
      case "intelligence": return hero.powerstats?.intelligence ?? null;
      case "strength": return hero.powerstats?.strength ?? null;
      case "speed": return hero.powerstats?.speed ?? null;
      case "durability": return hero.powerstats?.durability ?? null;
      case "power": return hero.powerstats?.power ?? null;
      case "combat": return hero.powerstats?.combat ?? null;
      default: return "";
    }
  }

  function getGlobalSearchText(hero) {
    const stats = hero.powerstats || {};
    return [
      hero.name || "",
      hero.biography?.fullName || "",
      hero.appearance?.race || "",
      hero.appearance?.gender || "",
      hero.biography?.alignment || "",
      hero.biography?.placeOfBirth || "",
      (hero.appearance?.height || []).join(" "),
      (hero.appearance?.weight || []).join(" "),
      stats.intelligence ?? "",
      stats.strength ?? "",
      stats.speed ?? "",
      stats.durability ?? "",
      stats.power ?? "",
      stats.combat ?? ""
    ].join(" ").toLowerCase();
  }

  function evaluateSingleHero(hero, query, field, op) {
    if (!query) return true;
    const normalizedQuery = query.toLowerCase().trim();

    // Numerical Operators
    if (["eq", "neq", "gt", "lt"].includes(op)) {
      const targetNum = parseFloat(normalizedQuery.replace(/[^0-9.-]/g, ""));
      if (isNaN(targetNum)) return true;

      let candidateNum = null;
      if (field === "weight") candidateNum = parseWeightKg(hero);
      else if (field === "height") candidateNum = parseHeightCm(hero);
      else if (["intelligence", "strength", "speed", "durability", "power", "combat"].includes(field)) {
        const stat = hero.powerstats ? hero.powerstats[field] : null;
        candidateNum = (stat !== null && stat !== undefined) ? parseFloat(stat) : null;
      } else {
        candidateNum = calculatePowerSum(hero);
      }

      if (candidateNum === null || isNaN(candidateNum)) return false;
      if (op === "eq") return Math.abs(candidateNum - targetNum) < 0.1;
      if (op === "neq") return Math.abs(candidateNum - targetNum) >= 0.1;
      if (op === "gt") return candidateNum > targetNum;
      if (op === "lt") return candidateNum < targetNum;
      return true;
    }

    // String & Fuzzy Operators
    let targetText = "";
    if (field === "all") {
      targetText = getGlobalSearchText(hero);
    } else {
      const val = getHeroFieldValue(hero, field);
      targetText = String(val !== null && val !== undefined ? val : "").toLowerCase();
    }

    if (op === "include") return targetText.includes(normalizedQuery);
    if (op === "exclude") return !targetText.includes(normalizedQuery);
    if (op === "fuzzy") return fuzzyMatches(normalizedQuery, targetText);

    return true;
  }

  return {
    filterHeroes: function (heroes, query, field, op) {
      if (!Array.isArray(heroes)) return [];
      return heroes.filter(h => evaluateSingleHero(h, query, field, op));
    },
    fuzzyMatches: fuzzyMatches,
    parseWeightKg: parseWeightKg,
    parseHeightCm: parseHeightCm
  };
})();