# GymSmart ERP — Deep Bug Analysis Report
**Full-Stack Audit | July 2026 | Covers: Backend (NestJS/Prisma) + Frontend (Next.js/React)**

---

## 📊 Executive Summary

| Category | Bugs Found | Severity |
|---|---|---|
| Security Vulnerabilities | 6 | 🔴 Critical |
| Backend Logic & Data Bugs | 11 | 🔴 Critical / 🟠 High |
| Frontend UI & UX Bugs | 14 | 🟠 High / 🟡 Medium |
| Responsive / Mobile Bugs | 9 | 🟠 High / 🟡 Medium |
| Incomplete / Fake Features | 7 | 🟠 High |
| Architecture Issues | 5 | 🟡 Medium |
| **TOTAL** | **42** | — |

---

## 🔴 SECTION 1: CRITICAL SECURITY VULNERABILITIES

---

### BUG-S01 — CORS Wildcard Open to All Origins
**File:** [main.ts L16](file:///home/pawan/Desktop/gym_ERP/backend/src/main.ts#L16)
**Severity:** 🔴 Critical — Security

**Root Cause:**
```typescript
app.enableCors({
  origin: true, // Allow all origins for now to prevent CORS issues
```
`origin: true` is a special value in the NestJS CORS middleware that reflects back whatever Origin header the browser sends — effectively whitelisting every domain in the world.

**Impact:** Any malicious website can make authenticated API calls on behalf of a logged-in user (CSRF-like attack). This completely bypasses Same-Origin Policy protections in the browser.

**Fix:**
```typescript
origin: process.env.FRONTEND_URL || 'http://localhost:3000',
credentials: true,
```

---

### BUG-S02 — JWT Secret Hardcoded as Fallback in TWO Places
**Files:**
- [auth.module.ts L15](file:///home/pawan/Desktop/gym_ERP/backend/src/modules/auth/auth.module.ts#L15)
- [auth.strategy.ts ~L22](file:///home/pawan/Desktop/gym_ERP/backend/src/modules/auth/auth.strategy.ts#L22)

**Root Cause:**
```typescript
// auth.module.ts
secret: configService.get<string>('JWT_SECRET') || 'gymsmart_secret',

// auth.strategy.ts  
secretOrKey: process.env.JWT_SECRET || 'gymsmart_secret',
```
Two different hardcoded fallback secrets. If `JWT_SECRET` env var is missing from deployment, the app silently uses `'gymsmart_secret'` — a publicly known string that any attacker can find in the source code.

**Secondary Problem:** The `.env` file itself uses `JWT_SECRET="gymsmart_super_secret"` — an extremely weak, dictionary-guessable 20-character string.

**Impact:** Any attacker who reads the source code (or guesses the secret) can forge valid JWT tokens and impersonate any user, including admin.

**Fix:** Generate a cryptographically secure 64-byte random secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Remove ALL hardcoded fallbacks. Let the app crash at startup if `JWT_SECRET` is missing.

---

### BUG-S03 — Raw JWT Token Exposed to Browser JavaScript
**File:** [frontend/src/app/api/auth/token/route.ts](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/api/auth/token/route.ts)

**Root Cause:**
```typescript
// This Next.js API route reads the HttpOnly cookie server-side...
const token = request.cookies.get('gymsmart_token')?.value;
// ...and then returns it in the JSON body to the browser JS
return NextResponse.json({ token });
```
HttpOnly cookies are specifically designed to be unreadable by JavaScript (preventing XSS token theft). This route completely defeats that protection by reading the cookie server-side and handing the raw token to the browser.

**Impact:** If any XSS vulnerability exists anywhere in the app (even a third-party dependency), an attacker can call `/api/auth/token` via JS and steal the JWT.

**Fix:** Remove this route entirely. The proxy route approach should attach the Bearer token server-side to backend requests, never return it to the client.

---

### BUG-S04 — Database Credentials in Version Control
**File:** [backend/.env](file:///home/pawan/Desktop/gym_ERP/backend/.env)

**Root Cause:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gymsmart?schema=public"
JWT_SECRET="gymsmart_super_secret"
```
- Default `postgres:postgres` credentials
- Weak JWT secret
- `.env` file is likely committed to git (no evidence of `.gitignore` exclusion observed)

**Impact:** Anyone with repository access (now or in the future via git history) has complete database access credentials.

**Fix:** 
1. Add `.env` to `.gitignore` immediately
2. Rotate the database password
3. Use `git filter-repo` to purge `.env` from all git history

---

### BUG-S05 — JWT Token Committed to Repository Root
**File:** [/token.txt](file:///home/pawan/Desktop/gym_ERP/token.txt)

**Root Cause:** A file named `token.txt` containing what appears to be a real JWT token exists in the project root directory.

**Impact:** Anyone who ever clones/forks this repository has a valid JWT token they can use to authenticate as a real user. This token may still be valid if the JWT secret hasn't changed.

**Fix:**
1. Revoke/invalidate this token immediately (change the JWT secret)
2. Delete `token.txt` 
3. Add `*.txt` and `token.txt` to `.gitignore`
4. Purge from git history

---

### BUG-S06 — No Rate Limiting on Authentication Endpoint
**File:** [auth.controller.ts](file:///home/pawan/Desktop/gym_ERP/backend/src/modules/auth/auth.controller.ts), [main.ts](file:///home/pawan/Desktop/gym_ERP/backend/src/main.ts)

**Root Cause:** No rate limiting (`@nestjs/throttler` or any middleware) applied to login endpoint.

**Impact:** Unlimited brute-force password attempts. Combined with the weak JWT secret (BUG-S02), this creates two attack vectors to gain unauthorized access.

**Fix:** Install `@nestjs/throttler` and apply:
```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('login')
login(@Body() dto: LoginDto) { ... }
```

---

## 🔴 SECTION 2: BACKEND LOGIC & DATA BUGS

---

### BUG-B01 — Member Hard Delete Cascades Payment History
**File:** [members.service.ts L66-L70](file:///home/pawan/Desktop/gym_ERP/backend/src/modules/members/members.service.ts#L66)

**Root Cause:**
```typescript
async remove(id: number) {
  const existing = await this.prisma.member.findUnique({ where: { id } });
  if (!existing) throw new NotFoundException(`Member #${id} not found`);
  const data = await this.prisma.member.delete({ where: { id } }); // Hard delete!
  return { success: true, data };
}
```
The Prisma schema has `onDelete: Cascade` on the `Payment` → `Member` relation. Deleting a member permanently destroys ALL their payment records and attendance records.

**Impact:** Catastrophic data loss. Financial records are irreversibly destroyed when a member is removed. Revenue figures, historical data, and audit trails are permanently gone.

**Contrast:** Staff and Products use soft-delete (`isActive: false`). Members don't — this is inconsistent and dangerous.

**Fix:**
```typescript
// Add isActive field to Member schema
async remove(id: number) {
  return this.prisma.member.update({ 
    where: { id }, 
    data: { isActive: false } 
  });
}
```

---

### BUG-B02 — Finance Payment Creation Has No Database Transaction
**File:** [finance.service.ts L25-L43](file:///home/pawan/Desktop/gym_ERP/backend/src/modules/finance/finance.service.ts#L25)

**Root Cause:**
```typescript
// Step 1: Create payment record
const payment = await this.prisma.payment.create({ data: { ... } });

// Step 2: Update member balance (SEPARATE non-atomic write)
await this.prisma.member.update({
  where: { id: dto.memberId },
  data: {
    paidAmount: { increment: dto.amount },
    pendingAmount: { decrement: dto.amount },
  },
});
```
These are TWO separate database writes with no transaction wrapper. If the server crashes, network drops, or DB throws between step 1 and 2, you'll have:
- A payment record that shows money was paid ✅
- But the member's balance NOT updated ❌

**Impact:** Data inconsistency — member appears to have an unpaid balance even after payment is recorded.

**Fix:**
```typescript
const [payment] = await this.prisma.$transaction([
  this.prisma.payment.create({ data: { ... } }),
  this.prisma.member.update({ where: { id: dto.memberId }, data: { paidAmount: { increment: dto.amount }, pendingAmount: { decrement: dto.amount } } }),
]);
```

---

### BUG-B03 — Store Order Stock Decrement Has No Transaction
**File:** [store.service.ts L88-L101](file:///home/pawan/Desktop/gym_ERP/backend/src/modules/store/store.service.ts#L88)

**Root Cause:**
```typescript
for (const item of resolvedItems) {
  await this.prisma.orderItem.create({ data: { orderId: order.id, ... } });
  await this.prisma.product.update({
    where: { id: item.productId },
    data: { stock: { decrement: item.qty } }, // Non-atomic with the loop above
  });
}
```
The order is created first, then each item and stock decrement happens sequentially. If the server crashes mid-loop (e.g., after 2 of 4 items), the order exists but only 2 items are recorded and only 2 products have stock decremented — producing phantom inventory.

**Impact:** Inventory counts become inaccurate. Orders show incomplete items.

**Fix:** Use `prisma.$transaction` with all operations as a single array.

---

### BUG-B04 — `pendingAmount` Always Starts at 0 for New Members
**File:** [members.service.ts L30](file:///home/pawan/Desktop/gym_ERP/backend/src/modules/members/members.service.ts#L30)

**Root Cause:**
```typescript
const data = await this.prisma.member.create({
  data: { ...dto, joinDate, expiryDate, status: 'ACTIVE', paidAmount, pendingAmount: 0 }, // Always 0!
});
```
`pendingAmount` is hardcoded to `0` at creation time, regardless of plan price or actual amount paid.

**Consequence Chain:**
1. Member joins with `Gold Plan` at ₹1,800/month — `pendingAmount: 0`
2. Finance clerk records a payment of ₹1,800 → `pendingAmount: 0 - 1,800 = -1,800`
3. Member now shows **negative pending amount** — a logically impossible value

**Fix:** At creation, compute `pendingAmount = planPrice - paidAmount`:
```typescript
const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
const planPrice = plan?.price1Month || 0; // based on billingCycle
const pendingAmount = Math.max(0, planPrice - paidAmount);
```

---

### BUG-B05 — Payroll Month Matching is Locale-Dependent String
**File:** [hr.service.ts L41-L50](file:///home/pawan/Desktop/gym_ERP/backend/src/modules/hr/hr.service.ts#L43)

**Root Cause:**
```typescript
const currentMonth = now.toLocaleString('en-US', {
  month: 'long',
  year: 'numeric',
}); // e.g. "July 2026"

const payrolls = await this.prisma.payroll.findMany({
  where: { month: currentMonth }, // Exact string match!
});
```
The `month` field in payrolls is stored as a free-text string. The query matches by exact string equality. If:
- Any payroll was created with `"Jul 2026"` instead of `"July 2026"`
- Server locale is different from `en-US`
- Someone typed `"july 2026"` (lowercase)
- Future developer uses `"2026-07"` format

The payroll will silently be excluded from the monthly summary, showing 0 payroll for the month even though records exist.

**Fix:** Use a proper date range query instead of string matching:
```typescript
where: { createdAt: { gte: firstOfMonth, lt: firstOfNextMonth } }
```

---

### BUG-B06 — `findOneStaff` Returns `null` with HTTP 200
**File:** [hr.service.ts L14-L16](file:///home/pawan/Desktop/gym_ERP/backend/src/modules/hr/hr.service.ts#L14)

**Root Cause:**
```typescript
findOneStaff(id: number) {
  return this.prisma.staff.findUnique({ where: { id } })
    .then(data => ({ success: true, data })); // data could be null!
}
```
When staff is not found, `data` is `null`. Response is `{ success: true, data: null }` with HTTP 200 OK. The caller cannot distinguish "staff found (null data)" from "success, but staff doesn't exist."

**Fix:**
```typescript
async findOneStaff(id: number) {
  const data = await this.prisma.staff.findUnique({ where: { id } });
  if (!data) throw new NotFoundException(`Staff #${id} not found`);
  return { success: true, data };
}
```

---

### BUG-B07 — Dashboard Runs 14+ Sequential DB Queries on Every Load
**File:** [dashboard.service.ts](file:///home/pawan/Desktop/gym_ERP/backend/src/modules/dashboard/dashboard.service.ts)

**Root Cause:** The `getStats()` method fires:
- `member.count()` × 5 (total, active, pending, expired, new-this-month)
- `payment.aggregate()` × 2 (monthly revenue, pending amount)
- `member.findMany()` with no `select` optimization (fetches ALL columns for plan grouping)
- `staff.count()` × 1
- `product.count()` × 1, `product.findMany()` × 1
- `order.aggregate()` × 1
- `inquiry.count()` × 2
- `member.findMany({ take: 5 })` × 1 (recent members)

All 14+ queries run on EVERY dashboard page load. No caching.

**Impact:** At 1000+ members, this is extremely slow. Multiple `findMany` without `select` will fetch enormous amounts of data from PostgreSQL just to be discarded in JavaScript.

**Fix:**
1. Use `Promise.all([])` for independent queries (some already are, but optimize rest)
2. Add `select` to limit fields fetched
3. Add Redis caching with 30-second TTL for dashboard stats
4. Add DB indexes on frequently queried columns (`status`, `paidAt`, `createdAt`)

---

### BUG-B08 — `ValidationPipe` Set to `forbidNonWhitelisted` But DTOs Use `any`
**Files:** [members.service.ts](file:///home/pawan/Desktop/gym_ERP/backend/src/modules/members/members.service.ts), [hr.service.ts](file:///home/pawan/Desktop/gym_ERP/backend/src/modules/hr/hr.service.ts), [store.service.ts](file:///home/pawan/Desktop/gym_ERP/backend/src/modules/store/store.service.ts)

**Root Cause:**
```typescript
// main.ts - strict validation configured
new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })

// But services accept untyped DTOs:
async createStaff(dto: any) {
  return this.prisma.staff.create({ data: dto }); // Raw user input → DB
}
async update(id: number, dto: any) {
  const data = await this.prisma.member.update({ where: { id }, data: dto });
```
`ValidationPipe` only validates if a typed DTO class with decorators (`@IsString()`, `@IsNumber()`) is used. Using `any` bypasses all validation — any fields the user sends go directly to the database.

**Impact:** Users can send arbitrary fields (e.g., `isActive: false` on themselves, `role: "SUPER_ADMIN"` etc.) that get passed directly to Prisma without any validation.

**Fix:** Create proper typed DTO classes with `class-validator` decorators for every endpoint.

---

### BUG-B09 — `pendingAmount` Can Go Negative (No Floor Guard)
**File:** [finance.service.ts L36-L42](file:///home/pawan/Desktop/gym_ERP/backend/src/modules/finance/finance.service.ts#L36)

**Root Cause:**
```typescript
await this.prisma.member.update({
  where: { id: dto.memberId },
  data: {
    paidAmount: { increment: dto.amount },
    pendingAmount: { decrement: dto.amount }, // No floor check!
  },
});
```
There is no check to prevent `pendingAmount` from going below 0. If a member who already has `pendingAmount: 0` gets another payment recorded, `pendingAmount` becomes `-1800`.

**Fix:**
```typescript
const newPending = Math.max(0, member.pendingAmount - dto.amount);
data: { paidAmount: { increment: dto.amount }, pendingAmount: newPending }
```

---

### BUG-B10 — Prisma Schema Missing `url` in Datasource
**File:** [schema.prisma](file:///home/pawan/Desktop/gym_ERP/backend/prisma/schema.prisma#L8)

**Root Cause:**
```prisma
datasource db {
  provider = "postgresql"
  // url field MISSING
}
```
Prisma auto-reads `DATABASE_URL` from `.env` when `url` is omitted, but this relies on `.env` file being present and loaded. In Docker containers, CI/CD pipelines, or cloud deployments that inject environment variables directly (not via `.env`), this may fail silently.

**Fix:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

### BUG-B11 — No Refresh Token / Token Revocation
**File:** [auth.module.ts](file:///home/pawan/Desktop/gym_ERP/backend/src/modules/auth/auth.module.ts#L17)

**Root Cause:**
```typescript
expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '7d')
```
JWT tokens are valid for 7 days with NO way to invalidate them early. There is no token blacklist, no refresh token flow, and no logout endpoint that actually invalidates the token.

**Impact:** If a token is stolen (from `token.txt` in the repo or via XSS), it remains valid for 7 full days. Changing the user's password does NOT invalidate existing tokens.

---

## 🟠 SECTION 3: FRONTEND UI & UX BUGS

---

### BUG-F01 — `attPct` Division by Zero Produces NaN
**File:** [members/page.tsx L213](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/members/page.tsx#L213)

**Root Cause:**
```typescript
const att = getAtt(selectedMember.id); // Returns [] when attendance not loaded
const presentDays = att.filter(a => a.status === 'P').length;
const attPct = Math.round((presentDays / att.length) * 100); // 0 / 0 = NaN!
```
When `att.length === 0` (which it always is initially, since attendance is fake local state), `presentDays / att.length` = `0 / 0` = `NaN`.

**Visible Effect:** The attendance stats card shows `NaN%` instead of `0%`. The comparison `attPct >= 75` also evaluates to `false` for NaN, silently affecting color logic.

**Fix:**
```typescript
const attPct = att.length > 0 ? Math.round((presentDays / att.length) * 100) : 0;
```

---

### BUG-F02 — Attendance Toggle Only Updates Local State (Not Saved to DB)
**File:** [members/page.tsx L177-L182](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/members/page.tsx#L177)

**Root Cause:**
```typescript
const toggleAtt = (memberId: number, day: number) => {
  // ONLY local state — no API call, no persistence
  setAttMap(prev => {
    const att = [...(prev[memberId] || initAtt())];
    // cycles P → A → L → P
    att[day - 1] = { day, status: next };
    return { ...prev, [memberId]: att };
  });
};
```
The attendance grid in member profile is purely decorative/demo. Clicking days cycles through Present/Absent/Leave states visually, but nothing is saved to the backend. On page refresh, all toggles reset to the initial state.

**Impact:** Gym staff believe they are marking attendance, but data is lost on every page reload. This is a completely non-functional feature being presented as working.

---

### BUG-F03 — `react-hot-toast` Used but `<Toaster>` Provider Never Mounted
**File:** [settings/page.tsx L7](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/settings/page.tsx#L7), [frontend/src/app/layout.tsx](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/layout.tsx)

**Root Cause:**
```typescript
// settings/page.tsx
import toast from 'react-hot-toast';
// ...
toast.success('Settings saved successfully!');
toast.error('Failed to load settings');
```
`react-hot-toast` requires a `<Toaster />` component to be mounted in the component tree to render toasts. This is never added to the root layout.

**Visible Effect:** All toast notifications in the Settings page **silently fail** — users get no feedback when they save settings (success or failure). They don't know if the save worked.

**Fix:** Add `<Toaster position="bottom-right" />` to the root `layout.tsx`, OR (better) replace `react-hot-toast` in settings with the existing custom `Toast` component already used everywhere else.

---

### BUG-F04 — `logo.png` Missing from `/public` Directory
**File:** [Sidebar.tsx L75](file:///home/pawan/Desktop/gym_ERP/frontend/src/components/Sidebar.tsx#L75)

**Root Cause:**
```tsx
<Image src="/logo.png" alt="GymSmart ERP" width={44} height={44} />
```
The file `/public/logo.png` does not exist. `/public/` only contains `icon.png` inside the app folder.

**Visible Effect:** The sidebar logo shows a **broken image** on every page of the application. First visible element users see when they open the app.

**Fix:** Add a `logo.png` file to `/frontend/public/`, or change the `src` to the existing icon:
```tsx
<Image src="/icon.png" alt="GymSmart ERP" width={44} height={44} />
```

---

### BUG-F05 — Inter Font Declared but Never Loaded
**File:** [globals.css L99](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/globals.css#L99)

**Root Cause:**
```css
--app-font-sans: 'Inter', system-ui, -apple-system, sans-serif;
```
Inter is set as the primary font in CSS variables, but there is no `@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap")` in `globals.css` or anywhere else.

**Visible Effect:** The entire application renders in `system-ui` / system default font (usually `-apple-system` on Mac, `Segoe UI` on Windows) rather than Inter. The design looks inconsistent across different operating systems.

---

### BUG-F06 — Global Header Search Bar Is Completely Dead
**File:** [Header.tsx L57-L62](file:///home/pawan/Desktop/gym_ERP/frontend/src/components/Header.tsx#L57)

**Root Cause:**
```tsx
<input
  type="text"
  placeholder="Search..."
  className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg ..."
  // NO onChange, NO value, NO onSubmit, NO onKeyDown
/>
```
The search input has no event handlers whatsoever. Typing in it does absolutely nothing. It is purely cosmetic decoration.

**Impact:** Users naturally try to use the global search bar and get no results or feedback. This creates confusion and erodes trust.

---

### BUG-F07 — Header Notifications Are Hardcoded Fake Data
**File:** [Header.tsx L20-L24](file:///home/pawan/Desktop/gym_ERP/frontend/src/components/Header.tsx#L20)

**Root Cause:**
```typescript
const notifications = [
  { id: 1, text: 'New member Amit registered', time: '5m ago', unread: true },
  { id: 2, text: 'Payment received from Rahul', time: '1h ago', unread: false },
  { id: 3, text: 'Pooja requested a trial session', time: '2h ago', unread: false },
];
```
These are hardcoded strings baked into the component. They never change. "Amit" and "Rahul" always appear regardless of actual gym activity.

**Secondary Bug:** The "View All Notifications" button has no `onClick` handler.

**Impact:** Completely misleading UI. Gym owners see fake notifications and may believe real members named "Amit" and "Rahul" took actions.

---

### BUG-F08 — Dashboard Welcome Greeting Hardcoded as "Admin"
**File:** [dashboard/page.tsx L57](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/dashboard/page.tsx#L57)

**Root Cause:**
```tsx
<Header title="Dashboard" subtitle="Welcome back, Admin! Here's your gym overview." />
```
Even though the auth system stores the logged-in user's name (`getUser()` is available via `api.ts`), the dashboard always says "Admin" regardless of who is logged in.

**Fix:**
```tsx
const user = getUser();
// ...
<Header title="Dashboard" subtitle={`Welcome back, ${user?.name || 'Admin'}! Here's your gym overview.`} />
```

---

### BUG-F09 — Finance "Add Payment" Modal Requires Raw Member ID
**File:** [finance/page.tsx L171-L173](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/finance/page.tsx#L171)

**Root Cause:**
```tsx
<label>Member ID</label>
<input required type="number" placeholder="Enter Member ID" 
  value={form.memberId} onChange={e => setForm({...form, memberId: e.target.value})} />
```
Staff must know the member's numeric database ID (e.g., `42`) to record a payment. There is no name search, no autocomplete, and no dropdown. Finding a member's ID requires going to the Members page, opening their profile, and noting the ID.

**Impact:** Extremely error-prone in real usage. Wrong IDs will be entered, creating payments for the wrong members. If the ID doesn't exist, the backend throws a 404, but the error message just says "Member #X not found" — not helpful.

---

### BUG-F10 — Sales & Reports Page Uses 100% Hardcoded Data
**File:** [sales/page.tsx L10-L38](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/sales/page.tsx#L10)

**Root Cause:**
```typescript
const monthlyData = [
  { month: 'Jan', revenue: 280000, members: 52 },
  { month: 'Feb', revenue: 295000, members: 48 },
  // ... (all hardcoded)
];

const membershipReport = [
  { plan: 'Basic', receivable: 120000, received: 114000, ... },
  // ... (all hardcoded)
];

const pendingReport = [
  { name: 'Amit Kumar', plan: 'Gold', amount: '₹900', overdue: 5 },
  // ... (all hardcoded)
];
```
The entire "Sales & Reports" section — charts, membership report table, pending payments, all memberships — is dummy data. None of it connects to the database.

**Filter/Export Buttons:** The date filter buttons (`Today`, `This Week`, `This Month`, `This Year`) change the active state visually but do nothing to the data. "Filter by Name" and "Export" buttons also have no functionality.

**Impact:** Gym owners make business decisions based on fake revenue numbers. This is the single most misleading part of the entire application.

---

### BUG-F11 — Workout Library Page Uses Only Local State (Not Persisted)
**File:** [workout/page.tsx L38-L78](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/workout/page.tsx#L38)

**Root Cause:**
```typescript
const [workouts, setWorkouts] = useState<Workout[]>(initWorkouts); // Local!
const [exercises, setExercises] = useState<Exercise[]>(initExercises); // Local!

const saveWk = (e: React.FormEvent) => {
  // Updates setWorkouts — local state only, NO API call
  setWorkouts([...workouts, { id: Date.now(), ...data }]);
};
```
The Workout Library page uses initializer constants (`initWorkouts`, `initExercises`) as default state. Adding/editing/deleting workout plans and exercises only updates component state — nothing is persisted to the backend.

**Note:** A separate `library/page.tsx` (`Diet Library`) DOES connect to the real `workoutApi` backend. This `workout/page.tsx` is a completely disconnected local-state version that duplicates the exercise concept — creating confusion.

**Fix:** Replace local state with API calls, or remove this page and redirect to `library/` which already has real CRUD.

---

### BUG-F12 — `settings/page.tsx` Mixed Toast Libraries
**File:** [settings/page.tsx](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/settings/page.tsx)

**Root Cause:**
- All other pages use the custom `Toast` component from `@/components/Toast`
- Settings page is the ONLY page that imports `react-hot-toast` (an external npm package)
- `react-hot-toast` is a heavier dependency not needed if the custom Toast is used consistently

**Impact:** Inconsistent UX (different toast styles/positions in Settings vs. rest of app), and `react-hot-toast` toasts are invisible due to missing `<Toaster>` (BUG-F03).

---

### BUG-F13 — `toast` from `react-hot-toast` vs. Custom `Toast`: Both in `package.json`
**File:** [frontend/package.json](file:///home/pawan/Desktop/gym_ERP/frontend/package.json)

**Root Cause:** `react-hot-toast` is listed as a dependency but only used in one file (`settings/page.tsx`), while a custom `Toast` component handles everything else. Unnecessary dependency bundle size.

---

### BUG-F14 — Finance Bar Chart Label Overflow
**File:** [finance/page.tsx L147-L149](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/finance/page.tsx#L147)

**Root Cause:**
```tsx
<div className="h-full rounded-full flex items-center pl-3"
  style={{ width: `${(d.revenue / max) * 100}%` }}>
  {d.revenue > 0 && <span className="text-xs text-white font-medium">{fmt(d.revenue)}</span>}
</div>
```
When a month has very low revenue (e.g., 1% of max), the bar width is ~1% of the container. The `₹2,500` text inside is wider than the 1% bar, so it visibly overflows outside the bar and on top of the next element.

---

## 🟠 SECTION 4: MOBILE RESPONSIVENESS BUGS

---

### BUG-R01 — CSS Grid Double `sm:` Breakpoint Conflict (7 Occurrences)
**Files:**
- [members/page.tsx L245](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/members/page.tsx#L245): `sm:grid-cols-2 sm:grid-cols-4`
- [members/page.tsx L298](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/members/page.tsx#L298): `sm:grid-cols-2 sm:grid-cols-4`
- [members/page.tsx L368](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/members/page.tsx#L368): `sm:grid-cols-2 sm:grid-cols-4`
- [finance/page.tsx L76](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/finance/page.tsx#L76): `sm:grid-cols-2 sm:grid-cols-4`
- [finance/page.tsx L87](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/finance/page.tsx#L87): `sm:grid-cols-2 sm:grid-cols-4`
- [hr/page.tsx L83](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/hr/page.tsx#L83): `sm:grid-cols-2 sm:grid-cols-4`
- [inquiries/page.tsx L101](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/inquiries/page.tsx#L101): `sm:grid-cols-2 sm:grid-cols-4`

**Root Cause:** Tailwind CSS doesn't merge conflicting classes at the same breakpoint — the LAST one in the class list wins. `sm:grid-cols-4` always overrides `sm:grid-cols-2` since both apply at ≥640px. The `sm:grid-cols-2` class does absolutely nothing.

**Visible Effect:** On a 640px-768px screen (small tablets, large phones), KPI cards jump from 1-column directly to 4-column. Cards become very narrow and unreadable.

**Fix:** Use graduated breakpoints:
```tsx
className="grid grid-cols-2 lg:grid-cols-4 gap-4"
```

---

### BUG-R02 — Attendance Page Toolbar Wraps on Small Screens
**File:** [attendance/page.tsx L86-L97](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/attendance/page.tsx#L86)

**Root Cause:**
```tsx
<div className="border-b border-gray-100 flex justify-between items-center">
  <div className="flex"> {/* Tabs */} </div>
  <div className="px-4 flex gap-2">
    <button>Refresh</button>
    <button>Mark Attendance</button> {/* Long button text */}
  </div>
</div>
```
On screens < 480px, "Mark Attendance" text causes the button bar to push beyond the container width. The `flex justify-between` container doesn't wrap, causing overflow.

**Fix:** Add `flex-wrap` and make the toolbar `flex-col sm:flex-row` or shorten button text on mobile:
```tsx
<button>
  <span className="hidden sm:inline">Mark </span>Attendance
</button>
```

---

### BUG-R03 — Sales Page Tab Bar Overflows on Mobile
**File:** [sales/page.tsx L65-L73](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/sales/page.tsx#L65)

**Root Cause:**
```tsx
<div className="border-b border-gray-100 flex overflow-x-auto">
  {['Overview', 'Membership Report', 'Pending Payments', 'All Memberships'].map(t => (
    <button className="... whitespace-nowrap">{t}</button>
  ))}
</div>
```
While `overflow-x-auto` is set, there's no `scrollbar-hide` or `pb-px` to hide the scrollbar on mobile. On iOS Safari, the horizontal scrollbar appears prominently below the tabs. On Android, it's also visible.

**Fix:** Add `-webkit-overflow-scrolling: touch` and hide scrollbar:
```css
.no-scrollbar::-webkit-scrollbar { display: none; }
```

---

### BUG-R04 — Member Profile Header Breaks on 375px Screens
**File:** [members/page.tsx L225-L243](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/members/page.tsx#L225)

**Root Cause:**
```tsx
<div className="flex flex-wrap items-center justify-between gap-5 mb-6">
  <div className="flex items-center gap-5"> {/* Avatar + Name */}
    <div className="w-20 h-20 rounded-full ..."> {/* 80px circle */}
```
On 375px (iPhone SE, many Android budget phones), the `flex items-center gap-5` inner div is `80px (avatar) + 20px (gap) + text`. Member name like "Rajasekaran Subramaniam" wraps awkwardly. The action buttons row (`Edit`, `WhatsApp`, `Email`) also stacks oddly.

---

### BUG-R05 — Inquiry Toolbar Search Input Fixed `w-64` on Mobile
**File:** [inquiries/page.tsx L112](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/inquiries/page.tsx#L112)

**Root Cause:**
```tsx
<input placeholder="Search name or phone..." 
  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm ... w-64" />
```
`w-64` = 256px fixed width. On screens < 400px (very common on Android), the input plus the filter/button group exceeds the container width, causing horizontal overflow of the page.

---

### BUG-R06 — Toast Notification Overflows on Small Screens
**File:** [Toast.tsx L31](file:///home/pawan/Desktop/gym_ERP/frontend/src/components/Toast.tsx#L31)

**Root Cause:**
```tsx
className="fixed bottom-6 right-6 z-[9999] ... max-w-sm"
```
`right-6` = 24px from right edge. `max-w-sm` = 384px. On a 390px screen, available width is `390 - 24 = 366px`. Max-w-sm (384px) > 366px, so the toast extends 18px beyond the left edge of the screen.

**Fix:**
```tsx
className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[9999]"
```

---

### BUG-R07 — HR Page Action Buttons Visible on `Payroll` Tab Only via Table Scroll
**File:** [hr/page.tsx L149-L170](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/hr/page.tsx#L149)

**Root Cause:** The Payroll table has 6 columns. On mobile, the "Mark Paid" button is in the last column and requires horizontal scrolling to reach. However, `overflow-x-auto` is applied but no sticky last column exists.

---

### BUG-R08 — Finance Summary Bar Chart Text Invisible on Dark Bars
**File:** [finance/page.tsx L147-L149](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/finance/page.tsx#L147)

**Root Cause:** White text on orange bar. When the bar is > 40% width this is fine, but for months with very low revenue the contrast is invisible against the thin orange bar on white `bg-gray-100` background.

---

### BUG-R09 — `<table>` Inside Mobile View with No `min-width`
**Files:** attendance/page.tsx, hr/page.tsx, finance/page.tsx, inquiries/page.tsx, members/page.tsx

**Root Cause:** All data tables use `<table className="w-full">` with `overflow-x-auto` wrapper. However, no `min-width` is set on the table. On narrow screens, Tailwind's `w-full` makes columns extremely narrow (as little as 40px), making cell content unreadable rather than scrollable.

**Fix:**
```tsx
<table className="w-full min-w-[600px]">
```
Forces horizontal scroll rather than crushing columns.

---

## 🟡 SECTION 5: INCOMPLETE / FAKE FEATURES

---

### BUG-I01 — Attendance in Member Profile Has No Backend
Already documented in BUG-F02. The visual toggle grid is not connected to any API.

---

### BUG-I02 — Sales & Reports Has No Real Data Connection
Already documented in BUG-F10. All charts and tables show hardcoded sample data.

---

### BUG-I03 — Workout Library (workout/page.tsx) Has No Backend Connection
Already documented in BUG-F11. Entirely local state.

---

### BUG-I04 — Settings Page: 4 of 5 Tabs Show "Under Development"
**File:** [settings/page.tsx L112-L117](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/settings/page.tsx#L112)

```tsx
{activeTab !== 'Gym Profile' && (
  <div className="text-center py-10 text-gray-500">
    <Settings size={48} className="mx-auto mb-3 text-gray-300" />
    <p>Settings for <strong>{activeTab}</strong> are currently under development.</p>
  </div>
)}
```
Notifications, Roles & Permissions, App Integration, and General Settings tabs all show a placeholder. Only "Gym Profile" works. Yet all 5 tabs appear as fully styled navigation cards, implying functionality.

---

### BUG-I05 — "WhatsApp Demo" and "Call Now" Buttons in Settings Have No Action
**File:** [settings/page.tsx L131-L133](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/settings/page.tsx#L131)

```tsx
<button className="bg-white text-orange-600 ...">WhatsApp Demo</button>
<button className="border-2 border-white ...">Call Now</button>
```
No `onClick`, no `href`, no `tel:` link. Purely decorative promotional buttons.

---

### BUG-I06 — "Send Reminder" in Sales Pending Payments Has No Action
**File:** [sales/page.tsx L183](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/sales/page.tsx#L183)

```tsx
<button className="px-3 py-1.5 text-xs text-white rounded-lg font-medium" 
  style={{ background: 'hsl(24 95% 53%)' }}>
  Send Reminder
</button>
```
No `onClick`. Button does nothing.

---

### BUG-I07 — Export and Filter Buttons in Sales Page Do Nothing
**File:** [sales/page.tsx L59-L61](file:///home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)/sales/page.tsx#L59)

```tsx
<button>Filter by Name</button>  {/* No onClick */}
<button>Export</button>          {/* No onClick */}
```

---

## 🟡 SECTION 6: ARCHITECTURE & CODE QUALITY

---

### BUG-A01 — `proxy.ts.bak` Backup File Committed to Source Control
**File:** [/frontend/src/proxy.ts.bak](file:///home/pawan/Desktop/gym_ERP/frontend/src/proxy.ts.bak)

Developer backup file left in the repository. Should be deleted and `.bak` added to `.gitignore`.

---

### BUG-A02 — `temp_sales.txt` Test Data File in Repository Root
**File:** [/temp_sales.txt](file:///home/pawan/Desktop/gym_ERP/temp_sales.txt)

Temporary test file checked into the repository. Should be deleted.

---

### BUG-A03 — No Environment Validation at Startup
**File:** [main.ts](file:///home/pawan/Desktop/gym_ERP/backend/src/main.ts), [app.module.ts](file:///home/pawan/Desktop/gym_ERP/backend/src/app.module.ts)

No validation that required environment variables (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`) exist at startup. The app silently starts with fallback values or crashes mid-request if env vars are missing.

**Fix:** Use `@nestjs/config` with Joi schema validation in `ConfigModule.forRoot()`:
```typescript
validationSchema: Joi.object({
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  PORT: Joi.number().default(5000),
})
```

---

### BUG-A04 — No Logging System in Production
**File:** [main.ts](file:///home/pawan/Desktop/gym_ERP/backend/src/main.ts)

The NestJS app uses the default `console.log` logger. No structured logging (JSON format), no log levels per environment, no log aggregation. In production, debugging issues is nearly impossible without proper logs.

**Fix:** Use `@nestjs/common`'s `Logger` class or integrate Winston/Pino.

---

### BUG-A05 — No Docker / Production Deployment Configuration
**Directory:** [/gym_ERP/](file:///home/pawan/Desktop/gym_ERP/)

No `Dockerfile`, no `docker-compose.yml`, no CI/CD pipeline (`.github/workflows/`), no `nginx.conf`, no PM2 ecosystem file. The app has no documented or automated path to production.

---

## 📋 Complete Bug Index

| ID | Severity | Category | Summary |
|---|---|---|---|
| S01 | 🔴 Critical | Security | CORS wildcard allows all origins |
| S02 | 🔴 Critical | Security | JWT secret hardcoded in 2 places |
| S03 | 🔴 Critical | Security | JWT token exposed via Next.js API route |
| S04 | 🔴 Critical | Security | DB credentials in version control |
| S05 | 🔴 Critical | Security | Real JWT token committed to repo root |
| S06 | 🔴 Critical | Security | No rate limiting on login endpoint |
| B01 | 🔴 Critical | Backend | Member hard-delete destroys payment history |
| B02 | 🔴 Critical | Backend | Finance payment creation has no transaction |
| B03 | 🔴 Critical | Backend | Store order stock decrement has no transaction |
| B04 | 🟠 High | Backend | `pendingAmount` always 0 at member creation |
| B05 | 🟠 High | Backend | Payroll month matching by locale string |
| B06 | 🟠 High | Backend | `findOneStaff` returns null as HTTP 200 |
| B07 | 🟠 High | Backend | Dashboard fires 14+ DB queries per load |
| B08 | 🟠 High | Backend | `ValidationPipe` bypassed by `dto: any` everywhere |
| B09 | 🟡 Medium | Backend | `pendingAmount` can go negative (no floor) |
| B10 | 🟡 Medium | Backend | Prisma datasource missing `url` field |
| B11 | 🟡 Medium | Backend | No refresh token or token revocation |
| F01 | 🔴 Critical | Frontend | `attPct` division by zero → NaN% displayed |
| F02 | 🔴 Critical | Frontend | Attendance toggle never persisted to DB |
| F03 | 🟠 High | Frontend | `react-hot-toast` Toaster never mounted |
| F04 | 🟠 High | Frontend | `logo.png` missing — broken image in sidebar |
| F05 | 🟡 Medium | Frontend | Inter font declared but never loaded |
| F06 | 🟠 High | Frontend | Global search bar is dead (no handlers) |
| F07 | 🟠 High | Frontend | Header notifications are hardcoded fake data |
| F08 | 🟡 Medium | Frontend | Dashboard greeting hardcoded "Admin" |
| F09 | 🟠 High | Frontend | Finance payment requires typing raw Member ID |
| F10 | 🔴 Critical | Frontend | Sales & Reports entirely hardcoded dummy data |
| F11 | 🟠 High | Frontend | Workout Library uses local state only |
| F12 | 🟡 Medium | Frontend | Settings uses different toast library than rest |
| F13 | 🟡 Medium | Frontend | `react-hot-toast` is unused dependency |
| F14 | 🟡 Medium | Frontend | Finance bar chart label overflows narrow bars |
| R01 | 🟠 High | Responsive | `sm:grid-cols-2 sm:grid-cols-4` conflict (7 places) |
| R02 | 🟠 High | Responsive | Attendance toolbar overflows on mobile |
| R03 | 🟡 Medium | Responsive | Sales tab bar shows scrollbar on iOS |
| R04 | 🟡 Medium | Responsive | Member profile header breaks on 375px |
| R05 | 🟠 High | Responsive | Inquiry search input fixed 256px → overflows |
| R06 | 🟠 High | Responsive | Toast notification overflows left on mobile |
| R07 | 🟡 Medium | Responsive | Payroll "Mark Paid" button hidden behind scroll |
| R08 | 🟡 Medium | Responsive | Finance bar chart text invisible at narrow widths |
| R09 | 🟡 Medium | Responsive | Tables lack `min-width` — columns crush instead of scroll |
| I01–I07 | 🟠 High | Incomplete | 7 features are fake/empty/non-functional |
| A01–A05 | 🟡 Medium | Architecture | 5 structural/devops issues |

---

## 🛠️ Recommended Fix Priority

### Phase 1 — Before Any User Testing (Critical)
1. Fix CORS (S01)
2. Rotate JWT secret, remove hardcoded fallbacks (S02)
3. Remove `/api/auth/token` route (S03)
4. Add `.env` to `.gitignore`, rotate DB credentials (S04)
5. Delete `token.txt`, rotate JWT (S05)
6. Wrap finance payment in DB transaction (B02)
7. Wrap store order in DB transaction (B03)
8. Soft-delete members instead of hard-delete (B01)
9. Fix `attPct` NaN bug (F01)

### Phase 2 — Before Beta Testing
10. Fix `pendingAmount` initialization (B04)
11. Add rate limiting to auth (S06)
12. Fix all `sm:grid-cols-2 sm:grid-cols-4` (R01 — 7 places)
13. Fix Toast mobile overflow (R06)
14. Fix logo.png (F04)
15. Load Inter font (F05)
16. Replace `react-hot-toast` with custom Toast in Settings (F03/F12)
17. Connect attendance to real API (F02)
18. Replace hardcoded Sales data with real API (F10)
19. Add `min-width` to all tables (R09)

### Phase 3 — Polish Before Production
20. Member name search in Finance payment modal (F09)
21. Fix inquiry search overflow (R05)
22. Wire up global search bar (F06)
23. Replace fake notifications (F07)
24. Fix dashboard greeting (F08)
25. Fix bar chart overflow (F14)
26. Add environment validation (A03)
27. Add proper logging (A04)
28. Add Docker/deployment config (A05)
29. Fix workout library to use API (F11)
30. Add token refresh flow (B11)
