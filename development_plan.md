# Development Plan: Full-Stack Chronicle Blog Application

## Scrum Overview & Milestone Roadmap

- **Scrum Master & Architect:** Full-Stack Architect (25 Years Experience)
- **Methodology:** Agile / Issue-Driven Scrum with strict Playwright validation gates
- **Total Sprints & Tracks:** 4 Core Sprints + 1 Extended Features Track (25 Issues Total)
- **Total Story Points:** 98 Points
- **Status:** Issues #1 to #20 Closed (100% Verified); Issues #21 to #25 Pushed & Open

```
+---------------------------------------------------------------------------------------------------------+
|                                           PROJECT ROADMAP                                               |
+---------------------------------------------------------------------------------------------------------+
| SPRINT 1: Scaffolding, Design Tokens, Database Engine & Authentication (Issues #1 - #3)                 |
| SPRINT 2: Blog Management Studio, Public Discovery & Pagination Engine (Issues #4 - #6)                 |
| SPRINT 3: Engagement Engine (Likes, Multi-Level Comments, Moderation Hub) (Issues #7 - #9)               |
| SPRINT 4: In-App Notification Center, Edge-Case Hardening & Final Verification (Issues #10 - #11)       |
| EXTENDED TRACK: Reader Authoring & Editing, Profile Hub, Admin Controls, Reader Discovery, GIS OAuth,   |
|                 Rich Text, Social Actions & Lifecycle (Issues #12 - #25)                                |
+---------------------------------------------------------------------------------------------------------+
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
  - [x] All Mongoose models initialized with validation.

### Issue #2: Vanilla CSS Modern Design System & Responsive Shell
- **Summary:** Implement cohesive Vanilla CSS design system with CSS tokens, glassmorphism, responsive navigation shell, and theme variables.
- **Classification:** `frontend`, `enhancement`
- **Priority:** P0
- **Complexity:** Medium
- **Effort:** 3 Story Points
- **Status:** Completed (100% Verified via Playwright Test #2)
- **Background Context:** Design aesthetics must wow at first glance, featuring modern typography (*Plus Jakarta Sans* / *Inter*), glowing accents, card elevations, and responsive breakpoints.
- **Expected Result:** A reusable global design system (`index.css`, `components.css`) with tokens for colors, shadows, borders, transitions, container grids, responsive navigation header, notification bell anchor, and footer.
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
  - [x] Published blogs saved with `status = 'published'` and `publishedAt` timestamp.

### Issue #5: Blog Lifecycle Controls (Unpublish vs. Permanent Delete)
- **Classification:** `backend`, `frontend` | **Priority:** P0 | **Complexity:** Medium | **Effort:** 3 SP
- **Status:** Completed (100% Verified via Playwright Test #8)
- **Summary:** Implement exact lifecycle rules: Unpublish hides content and retains all comments/likes, while Delete permanently purges the blog and cascade-deletes all comments, replies, and likes.
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
  - [x] Pagination displays posts with Prev/Next and page numbers.
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

---

## Extended Track: Advanced Reader & Authoring Capabilities (Story Points: 26)

### Issue #12: Add Continue with Google for Reader Authentication
- **Classification:** `frontend`, `backend`, `enhancement` | **Priority:** P1 | **Complexity:** Medium | **Effort:** 4 SP
- **Status:** Completed (Branch `feature/issue-12-google-auth`, Commit `eb3570e`)
- **Summary:** Reader sign-in via Google OAuth with account linking, auto-registration for new Google accounts, and multi-colored Google SVG branding.
- **Acceptance Criteria:**
  - [x] Google sign-in buttons on Login and Register pages.
  - [x] Automatic user profile creation and JWT issuance on `POST /api/auth/google`.
  - [x] Cancellation safely closes modal without session disruption.

### Issue #13: Add Forgot Password with Email OTP
- **Classification:** `frontend`, `backend`, `enhancement` | **Priority:** P1 | **Complexity:** High | **Effort:** 5 SP
- **Status:** Completed (Branch `feature/issue-13-forgot-password-otp`, Commit `6e162f8`)
- **Summary:** Four-step forgot password workflow utilizing Nodemailer SMTP for secure 6-digit OTP delivery, manual OTP input, password reset, and login validation.
- **Acceptance Criteria:**
  - [x] `#link-forgot-password` on login routes to `/forgot-password`.
  - [x] 6-digit OTP generated with 10-minute expiry window and delivered via SMTP.
  - [x] Individual digit inputs with auto-advancing focus.
  - [x] New password hashed and stored with instant login capability.

### Issue #14: Allow Readers to Post Blogs & Device Cover Photo Upload
- **Classification:** `frontend`, `backend`, `enhancement` | **Priority:** P0 | **Complexity:** High | **Effort:** 5 SP
- **Status:** Completed (Branch `feature/issue-14-reader-blog-posting`, Commit `0c2221f` & `561c62a`)
- **Summary:** Empower authenticated readers to author, publish, save drafts, and upload cover photos directly from device storage using client-side canvas compression.
- **Acceptance Criteria:**
  - [x] Desktop "Write" nav link and mobile drawer link for authenticated readers.
  - [x] `CreateBlogPage.jsx` with device drag-and-drop dropzone and canvas optimization.
  - [x] `MyStoriesPage.jsx` managing author's stories and drafts.
  - [x] Authorization guards restricting editing/deletion strictly to authors and admins.

### Issue #15: Add Save and Share Actions to Blogs
- **Classification:** `frontend`, `backend`, `enhancement` | **Priority:** P1 | **Complexity:** Medium | **Effort:** 4 SP
- **Status:** Completed (Branch `feature/issue-15-save-and-share-actions`, Commit `36fed3a`)
- **Summary:** Bookmark articles to private Reading List (`/saved`) and share articles via social dialog (Twitter/X, LinkedIn, Facebook, Email, and clipboard copy).
- **Acceptance Criteria:**
  - [x] `#btn-save-blog` toggles save state with active styling (`.save-btn.saved`).
  - [x] `/saved` reading list with quick unsave actions.
  - [x] `ShareModal.jsx` with one-click direct URL copy and social sharing channels.
  - [x] Unique compound index `{ blogId: 1, userId: 1 }` preventing duplicate saves.

### Issue #16: Add Save and Share Actions to Blogs (Companion / Duplicate)
- **Classification:** `task`, `enhancement` | **Priority:** P1 | **Complexity:** Low | **Effort:** 3 SP
- **Status:** Completed (Verified & Closed under Commit `36fed3a`)
- **Summary:** Companion ticket for Save & Share capabilities, verified and closed with full test reporting.
- **Acceptance Criteria:**
  - [x] Verified full compliance with Issue #15 deliverables.
  - [x] Closed with resolution audit report on GitHub.

### Issue #17: Add Rich Text Editor for Blog Content
- **Classification:** `frontend`, `backend`, `enhancement` | **Priority:** P0 | **Complexity:** High | **Effort:** 5 SP
- **Status:** Completed (Branch `feature/issue-17-rich-text-editor`, Commit `ae5dfaa`)
- **Summary:** WYSIWYG & HTML authoring toolbar supporting Bold, Italic, Headings, Ordered/Unordered Lists, Blockquotes, Code, and Hyperlinks with XSS sanitization and live preview.
- **Acceptance Criteria:**
  - [x] `RichTextEditor.jsx` with formatting toolbar buttons (`#btn-format-bold`, `#btn-format-italic`, etc.).
  - [x] Safe HTML sanitization engine (`richText.js`) preventing XSS attacks.
  - [x] Backward compatibility for legacy plaintext articles.
  - [x] Integrated across reader authoring, admin studio, and article reading view.
  - [x] 100% passing Playwright E2E tests covering positive and negative edge cases.

### Issue #18: Restrict Reader Draft Posts from Admin Blog Studio
- **Classification:** `backend`, `frontend`, `enhancement` | **Priority:** P1 | **Complexity:** Medium | **Effort:** 3 SP
- **Status:** Completed (Branch `feature/issue-18-restrict-reader-drafts`) | **GitHub Issue:** [#18](https://github.com/Karthik-mogaveera/blog_app/issues/18)
- **Summary:** Ensure that posts authored by readers that are currently in draft status (`status: 'draft'`) are strictly hidden from the Admin Blog Management Studio (`/admin/blogs`).
- **Acceptance Criteria:**
  - [x] `GET /api/blogs/admin/all` excludes reader draft posts from the query response when accessed by an Admin.
  - [x] Admin Blog Management Studio table only renders Admin-authored posts (all statuses) and Reader-authored posts that have achieved `published` status.
  - [x] Direct inspection or manipulation of `/admin/blogs` or `/api/blogs/:id` cannot expose or leak reader draft content to Admin.
  - [x] Readers continue to view and edit their own drafts in `/my-stories`.
  - [x] 100% verified via automated Playwright E2E testing suite covering positive paths and direct access edge cases.

### Issue #19: Allow Readers to Change Blog Status (Publish and Unpublish) in My Stories
- **Classification:** `frontend`, `backend`, `enhancement` | **Priority:** P0 | **Complexity:** Medium | **Effort:** 4 SP
- **Status:** Completed (Branch `feature/issue-19-reader-publish-toggle`) | **GitHub Issue:** [#19](https://github.com/Karthik-mogaveera/blog_app/issues/19)
- **Summary:** Empower authenticated readers to change the status of their created articles between `draft` and `published` (and conversely `published` to unpublish) directly from the "My Stories" dashboard (`/my-stories`).
- **Acceptance Criteria:**
  - [x] `PATCH /api/blogs/:id/publish` allows authorization if the requester is an admin OR the authenticated author of the blog (`authorId.equals(req.user._id)`).
  - [x] Non-owners attempting to toggle status receive strict `403 Forbidden`.
  - [x] "My Stories" card UI includes prominent Status Badge (`Draft` / `Published`) and dynamic status action button (`Publish` for drafts, `Unpublish` for published blogs).
  - [x] Toggling status updates the state synchronously with immediate user feedback.
  - [x] When unpublished, the article is immediately hidden from the public catalog (`/`) and returns 404 to anonymous visitors.
  - [x] 100% verified via automated Playwright E2E test suite covering publication toggle, public catalog synchronization, and non-owner access protection.

### Issue #20: Replace Browser Default Confirm with Custom Confirmation Modal for Delete Actions
- **Classification:** `frontend`, `enhancement`, `ui/ux` | **Priority:** P1 | **Complexity:** Medium | **Effort:** 3 SP
- **Status:** Completed (Branch `feature/issue-20-confirmation-modal`, Commit `598ceeb`) | **GitHub Issue:** [#20](https://github.com/Karthik-mogaveera/blog_app/issues/20)
- **Summary:** Replace native browser `window.confirm()` popups with an accessible, high-aesthetic custom confirmation modal whenever a user or admin triggers a delete action for articles or comments.
- **Acceptance Criteria:**
  - [x] Create reusable `ConfirmationModal.jsx` (or `DeleteModal.jsx`) styled with glassmorphism tokens, backdrop blur, warning icon, and danger actions.
  - [x] Replace `window.confirm()` in `AdminDashboardPage.jsx` (`/admin/blogs`).
  - [x] Replace `window.confirm()` in `MyStoriesPage.jsx` (`/my-stories`).
  - [x] Replace `window.confirm()` in `CommentTree.jsx` (discussions on `/blog/:id`).
  - [x] Replace `window.confirm()` in `AdminModerationPage.jsx` (`/admin/comments`).
  - [x] Implement accessible keyboard controls (`Escape` to close) and backdrop click dismiss.
  - [x] Write and verify automated Playwright E2E tests validating the custom confirmation modal and zero usage of native dialogs.

### Issue #21: Replace Dummy Google Sign-In Modal with Real Google OAuth (GIS) in Production
- **Classification:** `frontend`, `backend`, `enhancement`, `authentication` | **Priority:** P0 | **Complexity:** Medium | **Effort:** 4 SP
- **Status:** Open (Pushed to GitHub) | **GitHub Issue:** [#21](https://github.com/Karthik-mogaveera/blog_app/issues/21)
- **Summary:** In production deployment (https://blog-app-ashy-xi-19.vercel.app/), clicking the "Continue with Google" button on both Login and Register pages opens a dummy simulation modal (`GoogleAuthModal.jsx`) with mock accounts rather than launching the authentic Google OAuth 2.0 Identity Services (GIS) account picker popup.
- **Acceptance Criteria:**
  - [ ] Configure `VITE_GOOGLE_CLIENT_ID` in the Vite client build, `.env.example`, and Vercel Project Environment Variables.
  - [ ] Update `LoginPage.jsx` and `RegisterPage.jsx` to invoke real Google Identity Services (`window.google.accounts.oauth2.initTokenClient`) when clicking "Continue with Google".
  - [ ] Restrict the dummy simulation modal (`GoogleAuthModal.jsx`) strictly to automated Playwright test environments (`navigator.webdriver`).
  - [ ] Ensure authentic Google sign-in completes token exchange via `POST /api/auth/google`, creates/links user account in MongoDB, issues JWT, and redirects smoothly.
  - [ ] Verify that canceling or closing the Google popup gracefully surfaces error/cancellation feedback without opening dummy accounts.
  - [ ] Ensure Google Cloud Console OAuth 2.0 Client ID Authorized JavaScript Origins include `https://blog-app-ashy-xi-19.vercel.app`.

### Issue #22: Allow Readers to Edit Their Own Authored Blog Posts
- **Classification:** `frontend`, `backend`, `enhancement` | **Priority:** P0 | **Complexity:** Medium | **Effort:** 3 SP
- **Status:** Open (Pushed to GitHub) | **GitHub Issue:** [#22](https://github.com/Karthik-mogaveera/blog_app/issues/22)
- **Summary:** Empower authenticated readers to edit their existing authored blog posts, modifying title, category, tags, cover image, and content.
- **Acceptance Criteria:**
  - [ ] `PUT /api/blogs/:id` permits updates if requester is the original author (`blog.authorId.equals(req.user._id)`) or an admin.
  - [ ] Provide an "Edit" action on author story cards in dashboard and on article view for the post owner.
  - [ ] Support loading existing blog data into editor interface with pre-populated fields.
  - [ ] Restrict non-owners attempting to edit other users' blogs with strict `403 Forbidden`.
  - [ ] 100% verified via automated Playwright test suite.

### Issue #23: User Profile Hub (Photo, Bio, Integrated Stories & Navigation Streamlining)
- **Classification:** `frontend`, `backend`, `enhancement`, `ui/ux` | **Priority:** P0 | **Complexity:** High | **Effort:** 5 SP
- **Status:** Open (Pushed to GitHub) | **GitHub Issue:** [#23](https://github.com/Karthik-mogaveera/blog_app/issues/23)
- **Summary:** Create a comprehensive user profile section allowing users to customize their profile photo, display name, and bio. Below the profile details, integrate the "My Stories" section directly so users have a unified dashboard, and remove the standalone "My Stories" tab from the navigation bar.
- **Acceptance Criteria:**
  - [ ] Extend User schema in `server/models/User.js` with `bio`, `profilePicture`, and social/portfolio links.
  - [ ] Implement `GET /api/users/profile` and `PATCH /api/users/profile` endpoints.
  - [ ] Build unified `ProfilePage.jsx` (`/profile`) featuring profile header (photo, bio, info) and integrated authored stories list.
  - [ ] Remove standalone "My Stories" navigation link from desktop header and mobile drawer, routing to `/profile`.
  - [ ] Persist updates to MongoDB and synchronize user session context.

### Issue #24: Admin Reader User Management & Moderation Controls (View, Suspend, Delete Users)
- **Classification:** `admin`, `frontend`, `backend`, `enhancement` | **Priority:** P1 | **Complexity:** Medium | **Effort:** 4 SP
- **Status:** Open (Pushed to GitHub) | **GitHub Issue:** [#24](https://github.com/Karthik-mogaveera/blog_app/issues/24)
- **Summary:** Provide administrators with a dedicated portal (`/admin/users`) to oversee all registered readers, search by username/email, view user activity, suspend accounts, and delete abusive readers.
- **Acceptance Criteria:**
  - [ ] Implement `GET /api/users/admin/all` to retrieve paginated list of registered users with activity stats.
  - [ ] Implement `PATCH /api/users/admin/:id/status` to suspend or re-activate reader accounts.
  - [ ] Implement `DELETE /api/users/admin/:id` to delete a user account with safe content handling.
  - [ ] Build `AdminUsersPage.jsx` (`/admin/users`) with search, filter, status toggles, and delete actions with confirmation modals.
  - [ ] Protect administrative user routes with `auth` and `adminOnly` middleware guards.

### Issue #25: Reader Discovery & Public Profile Search Engine
- **Classification:** `frontend`, `backend`, `enhancement`, `search` | **Priority:** P1 | **Complexity:** Medium | **Effort:** 4 SP
- **Status:** Open (Pushed to GitHub) | **GitHub Issue:** [#25](https://github.com/Karthik-mogaveera/blog_app/issues/25)
- **Summary:** Allow readers and visitors to discover and search for other readers/authors on the platform, view their public profiles (avatar, bio, member since), and browse their published blog catalog.
- **Acceptance Criteria:**
  - [ ] Implement `GET /api/users/search?q=:query` returning public reader summaries.
  - [ ] Implement `GET /api/users/:id/public` returning author public metadata and strictly their **published** articles.
  - [ ] Create public author profile view (`/author/:id` or `/user/:id`) displaying author bio, avatar, and catalog of published blogs.
  - [ ] Add an author search bar or discovery section in the catalog/header for finding fellow community writers.
  - [ ] Ensure sensitive data (`passwordHash`, email, OTP, drafts) is never exposed in public endpoints.

---

## Final Project Status Summary
- **Total Issues:** 25
- **Total Sprints:** 4 Core Sprints + Extended Track (Issues #12 - #25)
- **Story Points:** 98 Points Total (78 Completed, 20 Open)
- **Issues #1 to #20:** **CLOSED (`completed`)**
- **Issues #21 to #25:** **OPEN (Active on GitHub)**
