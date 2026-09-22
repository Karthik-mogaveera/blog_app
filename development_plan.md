# Development Plan: Full-Stack Blog Application

## Scrum Overview & Milestone Roadmap

- **Scrum Master & Architect:** Full-Stack Architect (25 Years Experience)
- **Methodology:** Agile / Issue-Driven Scrum with strict Playwright validation gates
- **Total Story Points:** 42 Points across 4 Sprints
- **Sprint Duration:** 1 Milestone per Sprint

```
+-----------------------------------------------------------------------------------------+
|                                    PROJECT ROADMAP                                      |
+-----------------------------------------------------------------------------------------+
| SPRINT 1: Scaffolding, Design Tokens, Database Engine & Authentication                  |
| SPRINT 2: Blog Management Studio, Public Discovery & Pagination Engine                  |
| SPRINT 3: Engagement Engine (Likes, Multi-Level Comments, Moderation Hub)               |
| SPRINT 4: In-App Notification Center, Edge-Case Hardening & Final System Acceptance    |
+-----------------------------------------------------------------------------------------+
```

---

## Sprint 1: Scaffolding, Design System & Authentication (Story Points: 10)

### Issue #1: Project Scaffolding & Express-MongoDB Backend Core
- **Summary:** Initialize unified repository with Express backend, MongoDB / Mongoose ODM database connection, and Vite + React client.
- **Classification:** `task`, `backend`
- **Priority:** P0 (Blocker)
- **Complexity:** Medium
- **Effort:** 3 Story Points
- **Status:** Completed (100% Verified via Playwright Test #1)
- **Background Context:** The system requires a solid, decoupled architecture with MongoDB persistence, Mongoose schemas, and clean cascade hooks.
- **Expected Result:** Backend runs on port 5000 with CORS and JSON middleware. Mongoose connects to MongoDB (`mongodb://127.0.0.1:27017/blog_application` or `MONGODB_URI` env var) and initializes models (`User`, `Blog`, `Comment`, `Like`, `Notification`) with indices and seeds default Admin credentials and categories.
- **Positive Test Cases:**
  - `GET /api/health` returns `200 OK` with database status `connected`.
  - Mongoose models compile with schemas and compound indices.
- **Negative Test Cases:**
  - Corrupted or invalid JSON payloads return `400 Bad Request`.
- **Acceptance Criteria:**
  - [x] Express server starts with clean logging.
  - [x] MongoDB connection succeeds with Mongoose.
  - [x] All 5 Mongoose models initialized with validation.

### Issue #2: Vanilla CSS Modern Design System & Responsive Shell
- **Summary:** Implement cohesive Vanilla CSS design system with CSS tokens, glassmorphism, responsive navigation shell, and theme variables.
- **Classification:** `frontend`, `enhancement`
- **Priority:** P0
- **Complexity:** Medium
- **Effort:** 3 Story Points
- **Status:** Completed (100% Verified via Playwright Test #2)
- **Background Context:** Design aesthetics must wow at first glance, featuring modern typography (*Plus Jakarta Sans* / *Inter*), glowing accents, card elevations, and responsive breakpoints.
- **Expected Result:** A reusable global design system (`index.css`) with tokens for colors, shadows, borders, transitions, container grids, responsive navigation header, notification bell anchor, and footer.
- **Positive Test Cases:**
  - Layout adapts smoothly across Desktop (1200px+), Tablet (768px-1199px), and Mobile (<768px).
  - Navigation bar displays branding, navigation links, and dynamic auth state.
- **Negative Test Cases:**
  - Missing route renders clean 404 layout matching the design aesthetic.
- **Acceptance Criteria:**
  - [x] CSS token variables defined (`--primary`, `--bg-dark`, `--card-bg`, etc.).
  - [x] Header includes navigation, auth state actions, and notification bell slot.
  - [x] Responsive navigation drawer/menu works on mobile screens.

### Issue #3: Authentication & Role-Based Access Control (Admin & Reader)
- **Summary:** Complete authentication API and UI with JWT tokens, password hashing, and route protection.
- **Classification:** `backend`, `frontend`
- **Priority:** P0
- **Complexity:** High
- **Effort:** 4 Story Points
- **Status:** Completed (100% Verified via Playwright Tests #3, #4, #5, #6)
- **Background Context:** Strict role separation is required: single pre-configured Admin account, and self-service Reader registration with automated initials avatars.
- **Expected Result:** Readers can register and log in; Admin can log in via dedicated credentials. Protected routes and token middleware enforce role boundaries.
- **Positive Test Cases:**
  - Reader registers with valid Username, Email, and Password -> receives token + user object with initials avatar.
  - Reader logs in with valid credentials -> session created.
  - Admin logs in with pre-seeded credentials -> granted `role: 'admin'`.
- **Negative Test Cases:**
  - Registration with duplicate email/username returns `409 Conflict` with clear validation message.
  - Login with incorrect password returns `401 Unauthorized`.
  - Reader attempting to access `/api/admin/*` receives `403 Forbidden`.
- **Acceptance Criteria:**
  - [x] `POST /api/auth/register` validates inputs and hashes password with `bcryptjs`.
  - [x] `POST /api/auth/login` verifies credentials and issues JWT.
  - [x] `GET /api/auth/me` returns current authenticated session user.
  - [x] Non-admin redirected away when attempting to access `/admin`.

---

## Sprint 2: Blog Management Studio & Public Discovery Engine (Story Points: 11)

### Issue #4: Admin Blog Management Studio (Create, Edit, Draft/Publish)
- **Classification:** `frontend`, `backend` | **Priority:** P0 | **Complexity:** High | **Effort:** 4 SP
- **Status:** Completed (100% Verified via Playwright Test #7)
- **Summary:** Admin interface to create and edit articles with title, body, custom author, predefined category, freeform tags, optional cover image, and status toggle.
- **Acceptance Criteria:**
  - [x] Predefined categories dropdown populated.
  - [x] Custom author field defaults to Admin but is editable.
  - [x] Draft blogs saved with `status = 'draft'` and hidden from public.
  - [x] Published blogs saved with `status = 'published'` and `published_at` timestamp.

### Issue #5: Blog Lifecycle Controls (Unpublish vs. Permanent Delete)
- **Classification:** `backend`, `frontend` | **Priority:** P0 | **Complexity:** Medium | **Effort:** 3 SP
- **Status:** Completed (100% Verified via Playwright Test #8)
- **Summary:** Implement the exact lifecycle rules: Unpublish hides content and retains all comments/likes, while Delete permanently purges the blog and cascade-deletes all comments, replies, and likes.
- **Acceptance Criteria:**
  - [x] `PATCH /api/blogs/:id/publish` toggles status between published and draft.
  - [x] `DELETE /api/blogs/:id` permanently removes blog and cascades to delete all comments, replies, and likes.
  - [x] Direct URL to unpublished blog returns strict `404` for non-admins.

### Issue #6: Public Catalog, Search, Filtering & Pagination Engine
- **Classification:** `frontend`, `backend` | **Priority:** P0 | **Complexity:** High | **Effort:** 4 SP
- **Status:** Completed (100% Verified via Playwright Test #9)
- **Summary:** Public home/catalog page with adaptive typography card layout (for posts without cover image), keyword search across title/body, category dropdown/chips, tag chips, and standard pagination.
- **Acceptance Criteria:**
  - [x] Posts without cover image render elegant typography-first layout.
  - [x] Keyword search filters published posts.
  - [x] Category chips filter posts by category.
  - [x] Pagination displays 6/9 posts per page with Prev/Next and page numbers.
  - [x] Changing search/filter resets view to Page 1.

---

## Sprint 3: Engagement Engine — Likes, Multi-Level Comments & Moderation (Story Points: 12)

### Issue #7: Deduplicated Like & Appreciation System
- **Classification:** `frontend`, `backend` | **Priority:** P0 | **Complexity:** Medium | **Effort:** 3 SP
- **Status:** Completed (100% Verified via Playwright Test #10)
- **Summary:** Single toggle like/unlike system for blogs only, deduplicated per registered reader, with public like count and guest tooltip.
- **Acceptance Criteria:**
  - [x] Logged-in reader clicking like increments count and toggles state.
  - [x] Second click unlikes and decrements count (idempotent).
  - [x] Unregistered visitors see like count and a tooltip to log in.

### Issue #8: Multi-Level Threaded Comment & Reply System
- **Classification:** `frontend`, `backend` | **Priority:** P0 | **Complexity:** High | **Effort:** 5 SP
- **Status:** Completed (100% Verified via Playwright Test #11)
- **Summary:** Recursive discussion tree allowing comments on blogs and replies to comments or replies, with author initials avatars, timestamps, and guest CTA banner.
- **Acceptance Criteria:**
  - [x] Registered readers can post top-level comments and nested replies.
  - [x] Unregistered visitors see CTA banner *"Log in or Register to like and comment"*.
  - [x] Threading renders clean hierarchical indentation.
  - [x] Empty or whitespace-only comments are blocked by validation.

### Issue #9: Comment Ownership, Transparency & Cascade Deletion
- **Classification:** `frontend`, `backend` | **Priority:** P0 | **Complexity:** High | **Effort:** 4 SP
- **Status:** Completed (100% Verified via Playwright Tests #11 & #12)
- **Summary:** Author can edit/delete own comments; Admin can edit/delete any comment; author edit shows `(edited)`; admin edit shows `(edited by Admin)`; deleting a comment cascades to delete all child replies.
- **Acceptance Criteria:**
  - [x] Author edit displays `(edited)`.
  - [x] Admin edit displays `(edited by Admin)`.
  - [x] Deleting a comment removes that comment and all subordinate child replies.
  - [x] Non-owners cannot edit or delete someone else's comment.

---

## Sprint 4: Notification Center, Edge-Case Hardening & Final Verification (Story Points: 9)

### Issue #10: In-App Notification Center
- **Classification:** `frontend`, `backend` | **Priority:** P1 | **Complexity:** Medium | **Effort:** 4 SP
- **Status:** Completed (100% Verified via Playwright Test #13)
- **Summary:** Navbar notification bell with unread badge alerting readers when someone replies to their comment and alerting Admin when a reader leaves a top-level comment.
- **Acceptance Criteria:**
  - [x] Reader gets notified upon receiving a reply.
  - [x] Admin gets notified upon new top-level comment.
  - [x] Clicking notification marks it as read and jumps to the article/thread.

### Issue #11: End-to-End System Hardening & Playwright Verification
- **Classification:** `task`, `enhancement` | **Priority:** P0 | **Complexity:** High | **Effort:** 5 SP
- **Status:** Completed (100% Passing Test Suite)
- **Summary:** Comprehensive Playwright test suite validating all 25 edge cases, responsive viewports, and security guards.
- **Acceptance Criteria:**
  - [x] Playwright tests pass 100% across positive and negative paths.
  - [x] Zero unhandled errors or console warnings.

