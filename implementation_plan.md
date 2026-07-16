
# Frontend UI & Responsive Bug Fix Plan

## Files Being Fixed

### 1. `globals.css` — Load Inter Font
- Inter is declared as the font but never actually loaded (no Google Fonts `@import`).
- Adds `@import url(...)` for Inter at the top.

---

### 2. `layout.tsx` (root) — Add `react-hot-toast` Toaster
- `settings/page.tsx` imports `react-hot-toast` but the `<Toaster />` provider is never mounted.
- Causes toasts from settings page to silently fail.

---

### 3. All pages with `sm:grid-cols-2 sm:grid-cols-4` — Fix duplicate breakpoint
**Affected files:**
- `members/page.tsx` (3 grids)
- `finance/page.tsx` (2 grids)
- `hr/page.tsx` (1 grid)
- `inquiries/page.tsx` (1 grid)

**Fix:** Change `sm:grid-cols-2 sm:grid-cols-4` → `grid-cols-2 lg:grid-cols-4`

---

### 4. `members/page.tsx` — Fix `attPct` NaN bug
- Division by zero when attendance array is empty → `NaN%`

---

### 5. `Header.tsx` — Disable dead search, fix notifications, use real user name

---

### 6. `dashboard/page.tsx` — Use real user name in greeting

---

### 7. `attendance/page.tsx` — Toolbar overflow on mobile

---

### 8. `settings/page.tsx` — Replace `react-hot-toast` with own `Toast` component

---

### 9. `Sidebar.tsx` — Fix broken `logo.png` with inline SVG fallback

---

### 10. `Toast.tsx` — Fix position on mobile (left+right instead of right-only)

---

### 11. `finance/page.tsx` — Guard bar chart label overflow

---

### 12. Member profile grid — Fix `sm:grid-cols-2 sm:grid-cols-4` for 8 items
