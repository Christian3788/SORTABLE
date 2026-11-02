# PROJECT NEMESIS // Superhero Surveillance & Intelligence Registry

An interactive, responsive surveillance console built strictly with **vanilla HTML5, CSS3, and JavaScript** (zero external frameworks or runtime dependencies). The application fetches confidential superhero data, normalizes biometrics, and presents an interactive, sortable, searchable, and paginated command interface with classified hero dossiers and deep-linking URL synchronization.

---

## 1. Project Overview & Architecture

To enable 4 developers to work concurrently without Git merge conflicts or code overlapping, the system is separated into **four decoupled layers**:

```
                              ┌────────────────────────────────────────┐
                              │       MEMBER 1: CORE ARCHITECT         │
                              │   member1_core.html (or index.html)    │
                              │  HTML Shell, CSS HUD & Event Dispatch  │
                              └──────────────────┬─────────────────────┘
                                                 │
                                                 │ provides raw heroes & dispatches state
                        ┌────────────────────────┴────────────────────────┐
                        ▼                                                 ▼
        ┌───────────────────────────────┐                 ┌───────────────────────────────┐
        │   MEMBER 2: FILTER ENGINE     │                 │   MEMBER 3: TABLE & SORTER    │
        │      member2_filter.js        │                 │    member3_table_sort.js      │
        │  Live Search, Fuzzy & Math Ops│                 │ Unit Sorter & Pagination DOM  │
        └───────────────┬───────────────┘                 └───────────────┬───────────────┘
                        │                                                 │
                        │ filtered records                                │ rendered table
                        └────────────────────────┬────────────────────────┘
                                                 │
                                                 │ triggers modal / reflects changes
                                                 ▼
                              ┌────────────────────────────────────────┐
                              │    MEMBER 4: DOSSIER & PERSISTENCE     │
                              │          member4_modal_url.js          │
                              │  Detail Modal View & URL History Sync  │
                              └────────────────────────────────────────┘
```

---

## 2. Team Member Division & Responsibilities

| Member | Assigned File | Key Responsibilities | Audit Deliverables |
| :--- | :--- | :--- | :--- |
| **Member 1** | `member1_core.html` (or `index.html`) | Semantic layout, Dark Industrial theme, `fetch()` ingestion, fallback backup dataset, global dispatch pipeline. | Native `fetch()`, zero libraries, table skeleton, default 20 rows, loading states. |
| **Member 2** | `member2_filter.js` | Live debounced search input, specific field targeting (vectors), search operators (`include`, `exclude`, `fuzzy`, `eq`, `neq`, `gt`, `lt`). | Search "Cat" yields "Catwoman", numerical metrics comparison, Levenshtein fuzzy matching. |
| **Member 3** | `member3_table_sort.js` | Table `<tbody>` DOM injection, metric natural sorting (`75 kg` before `100 kg`), missing-values-last rule, client-side pagination. | Required fields only, sort direction toggle, pagination capacity (`10`, `20`, `50`, `100`, `all`), missing items sorted last. |
| **Member 4** | `member4_modal_url.js` | Classified hero dossier modal with `.images.lg`, dynamic tactical assessment text, bidirectional URL query state synchronization. | Modal trigger on row click, `.images.lg` portrait, URL deep-linking (`?q=...&hero=...`), cross-tab persistence. |

---

## 3. Data Contracts & Shared State

All members communicate through a single, shared state object called `AppState`:

```javascript
const AppState = {
  allHeroes: [],          // Raw array from fetch API
  filteredHeroes: [],     // Output of Member 2's filter
  searchQuery: "",        // String typed in the search box
  searchField: "all",     // Target column or "all"
  searchOperator: "include", // include | exclude | fuzzy | eq | neq | gt | lt
  sortColumn: "name",     // Active sorted column key
  sortDirection: "asc",   // "asc" or "desc"
  currentPage: 1,         // Active page number (1-based)
  pageSize: 20,           // 10 | 20 | 50 | 100 | "all"
  activeHeroId: null      // Opened hero ID in modal or null
};
```

### Module Interfaces

#### Member 2 Interface (`FilterModule`)
```javascript
FilterModule.filterHeroes(heroesList, searchQuery, searchField, searchOperator);
// Returns: Array of hero objects matching criteria
```

#### Member 3 Interface (`SortModule` & `TablePaginationModule`)
```javascript
SortModule.sortHeroes(filteredList, sortColumn, sortDirection);
// Returns: Array of hero objects sorted (missing values placed at the very end in both asc and desc)

TablePaginationModule.render(appState);
// Injects the current page's rows into document.getElementById("tableBody")
```

#### Member 4 Interface (`UrlModalModule`)
```javascript
UrlModalModule.openHeroModal(heroId, allHeroes); // Displays modal with .images.lg
UrlModalModule.closeModal();                    // Hides modal
UrlModalModule.updateUrlState(appState);         // Serializes state to ?q=...&hero=...
UrlModalModule.restoreFromUrl(appState);         // Populates state from location search/hash
```

---

## 4. Step-by-Step Member Guides

### Member 1: Core Shell, Architecture & Data Fetching
* **File:** `member1_core.html`
1. Open `member1_core.html` directly in any web browser.
2. Verify that `fetch("https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json")` resolves cleanly.
3. Check that the UI contains the semantic `<table>` element and the required headers:
   * `Icon`, `Name`, `Full Name`, `Powerstats`, `Race`, `Gender`, `Height`, `Weight`, `Place of Birth`, `Alignment`.
4. Ensure `member1_core.html` includes internal fallback engines for filtering, sorting, and pagination so it can be previewed even before your teammates submit their scripts.
5. In the `<head>` or bottom of `<body>`, ensure the scripts are loaded in the following order:
   ```html
   <script src="member2_filter.js"></script>
   <script src="member3_table_sort.js"></script>
   <script src="member4_modal_url.js"></script>
   ```

### Member 2: Search, Vector Filter & Operators
* **File:** `member2_filter.js`
1. Your code exposes the global `FilterModule` object.
2. Test the **Live Search**:
   * Type `"Cat"` into `#searchInput`.
   * Ensure `"Catwoman"` appears in the filtered list instantly.
3. Test **Field Vectors**:
   * Change `#fieldSelect` to `"alignment"`, type `"bad"`. Only villains should remain.
4. Test **Operators**:
   * `include`: Default substring match.
   * `exclude`: Inverted match.
   * `fuzzy`: Matches `"spdr"` to `"Spider-Man"` and `"btmn"` to `"Batman"`.
   * Numerical operators (`eq`, `neq`, `gt`, `lt`): Test searching `#fieldSelect = "weight"` with operator `>` and value `100`. Only heroes over 100 kg should be returned.

### Member 3: Table Renderer, Natural Sorter & Pagination
* **File:** `member3_table_sort.js`
1. Your code exposes `SortModule` and `TablePaginationModule`.
2. Test **Required Columns**:
   * Verify that rows present *only* the mandated fields.
   * Confirm that `.images.xs` is rendered as an `<img>` tag and not plain text.
   * Verify all 6 powerstats (`intelligence`, `strength`, `speed`, `durability`, `power`, `combat`) are rendered inside each row.
3. Test **Natural Metric Sorting**:
   * Click the `Weight` column header once.
   * Confirm that numeric parsing works: **`75 kg` appears before `100 kg`** (alphabetical string comparison would incorrectly place `"100 kg"` before `"75 kg"`).
4. Test **Missing-Values-Last Rule (Audit Critical)**:
   * Click `Weight` ascending: Heroes with `"-"` or `"0 kg"` must be placed at the **bottom**.
   * Click `Weight` descending: Heroes with `"-"` or `"0 kg"` must **still be placed at the bottom**.
5. Test **Pagination**:
   * Verify default displays 20 heroes.
   * Change page size dropdown to `10`, `20`, `50`, `100`, and `all`.
   * Verify `«`, `‹`, `›`, and `»` buttons disable appropriately at boundaries.

### Member 4: Dossier Modal & URL State Persistence
* **File:** `member4_modal_url.js`
1. Your code exposes `UrlModalModule`.
2. Test **Dossier Detail Modal**:
   * Click any row in the table.
   * Verify the modal opens and displays the large high-resolution image (`.images.lg`).
   * Verify biographical details, aliases, and animated powerstat bars load.
   * Ensure the modal closes on `Esc` key press, clicking `&times;`, or clicking the backdrop.
3. Test **URL Synchronization**:
   * Type `"Batman"` in search and switch page size to `10`. Notice the URL updates to:
     `?q=Batman&size=10`
   * Open Batman's dossier modal. Notice the URL appends:
     `&hero=70`
   * Copy the full URL from the browser address bar, open a brand-new tab, and paste it.
   * Verify the new tab initializes on the exact same search term, page size, and opens the Batman dossier automatically.
   * Test browser `Back` and `Forward` buttons.

---

## 5. Audit Compliance Checklist

Before submitting your final project, run through this checklist to ensure all audit points pass:

- [x] **Semantic Table**: Data appears inside a semantic `<table>` element.
- [x] **Required Data Only**: Displays only Icon, Name, Full Name, Powerstats, Race, Gender, Height, Weight, Place of Birth, and Alignment.
- [x] **Client-Side Pagination**: Functional navigation with options for `10`, `20`, `50`, `100`, and `all` results.
- [x] **Default 20 Results**: Initial load shows exactly 20 rows.
- [x] **Initial Sort**: Table is sorted by `name` ascending on launch.
- [x] **Column Sorting**: All table headers are clickable and toggle between `ascending` and `descending`.
- [x] **Numerical Weight Sort**: Metric conversion ensures `75 kg` is sorted before `100 kg`.
- [x] **Missing Values Last**: Unrecorded, null, or `"-"` attributes always appear at the end of the table regardless of sort order.
- [x] **Instant Live Search**: Typing `"Cat"` instantly filters the view and includes Catwoman without requiring a submit button.
- [x] **Native Fetch API**: Uses browser-native `fetch()` with Promises.
- [x] **Zero Frameworks/Libraries**: Free of React, Vue, Svelte, Angular, jQuery, Tailwind CDN, or Lodash.
- [x] **Bonus — Specific Search Fields**: Capable of targeting search queries to specific fields (Race, Alignment, etc.).
- [x] **Bonus — Search Operators**: Supports `include`, `exclude`, `fuzzy`, `=`, `!=`, `>`, and `<`.
- [x] **Bonus — Hero Detail Modal**: Clicking a row opens a classified dossier featuring `.images.lg`.
- [x] **Bonus — URL Persistence**: Search terms, sort columns, pagination, and open dossiers serialize to URL query parameters and restore across tabs.

---

## 6. How to Run & Collaborate

### Option A: Local File System
Clone the repository and open `index.html` (or `member1_core.html`) directly in Google Chrome, Firefox, Safari, or Edge.

### Option B: Local Web Server (Recommended)
Running through a local web server allows full browser history API testing:
```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (npx)
npx serve .
```
Navigate to `http://localhost:8000` in your browser.

### Option C: Git Branching Workflow
```bash
# Create and switch to your feature branch
git checkout -b feature/member-2-filters

# Work only inside your assigned file:
# Member 1 -> member1_core.html (or index.html)
# Member 2 -> member2_filter.js
# Member 3 -> member3_table_sort.js
# Member 4 -> member4_modal_url.js

# Commit and push your changes
git add .
git commit -m "Implement search operators and fuzzy matching"
git push origin feature/member-2-filters
```