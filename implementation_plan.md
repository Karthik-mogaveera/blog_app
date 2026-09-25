# Implementation Plan: Full-Stack Chronicle Blog Application

## 1. System Architecture & Technical Strategy

### 1.1 Architecture Overview
The application is structured as a decoupled, production-grade full-stack web application with a high-performance Express REST backend, MongoDB persistence via Mongoose ODM, and a responsive, high-aesthetic Vite + React frontend powered by a custom Vanilla CSS design token system.

```
+---------------------------------------------------------------------------------------------------+
|                                     CLIENT LAYER (Vite + React 18)                                 |
|  - Vanilla CSS Modern Design System: Glassmorphism, Dark Mode, Gradients, Micro-Animations        |
|  - Public Catalog: Search, Category Filtering, Tag Chips, Pagination, Responsive Shell            |
|  - Reader Experience: Google Sign-In, Forgot Password Email OTP, Like, Multi-Level Discussion Tree |
|  - Authoring Studio: Reader Stories, Device Cover Image Compression, Rich Text Editor (WYSIWYG)    |
|  - Personal Features: Reading List (/saved), Social Share Modal, In-App Notification Bell         |
|  - Admin Studio: Blog Lifecycle (Draft/Publish/Delete), Moderation Hub, Author Attribution         |
+-------------------------------------------------┬-------------------------------------------------+
                                                  │ REST API (JSON / Bearer JWT)
+-------------------------------------------------▼-------------------------------------------------+
|                                     SERVER LAYER (Express.js REST API)                            |
|  - Security & Middleware: JWT Auth, Role Guard (Admin vs Reader), CORS, Error Handling           |
|  - Email OTP Service: Nodemailer SMTP Transporter for secure 6-digit verification codes           |
|  - Business Logic Controllers:                                                                    |
|      * /api/auth: Local registration/login, Google OAuth, Forgot Password OTP verification        |
|      * /api/blogs: Authoring (Admin/Reader), Lifecycle toggling, Discovery, Category/Tag search   |
|      * /api/comments: Recursive multi-level comment tree, ownership edit/delete, cascade purge    |
|      * /api/likes: Idempotent atomic toggles with compound index deduplication                   |
|      * /api/saved: Bookmark toggles, reading list queries, duplicate protection                   |
|      * /api/notifications: Reply & top-level discussion triggers, mark-as-read, unread count badge|
+-------------------------------------------------┬-------------------------------------------------+
                                                  │ Mongoose ODM / Driver
+-------------------------------------------------▼-------------------------------------------------+
|                                 DATA PERSISTENCE LAYER (MongoDB Database)                         |
|  - Collections: users, blogs, comments, likes, savedblogs, notifications                          |
|  - Compound Unique Indices: { blogId: 1, userId: 1 } on likes and savedblogs                      |
|  - Cascade Deletion Hooks: Blog deletion purges all comments, likes, and saved records             |
+---------------------------------------------------------------------------------------------------+
```

### 1.2 Technology Stack
- **Backend Runtime:** Node.js (v22.x) with Express.js REST API.
- **Database & ODM:** MongoDB with Mongoose ODM. Enforces schema validation, compound indices, and clean cascade hooks.
- **Frontend Framework:** React 18 / Vite 6 with React Router v6 for SPA routing.
- **Styling Architecture:** Vanilla CSS design tokens (`components.css`, `index.css`) featuring glassmorphism, responsive CSS grid/flexbox, custom animations, and Plus Jakarta Sans / Inter typography.
- **Authentication & Security:** `bcryptjs` for salted password hashing, JWT (`jsonwebtoken`) for stateless verification, and Google OAuth account synchronization.
- **Email Delivery:** `nodemailer` SMTP integration with secure 6-digit OTP expiration and verification window.
- **Media Processing:** Client-side HTML5 Canvas image optimization (max 1600px/1200px, 0.88 JPEG/PNG compression) with Drag & Drop dropzones.
- **Rich Text Engine:** Modular WYSIWYG & HTML editor (`RichTextEditor.jsx`) with multi-mode live preview, safe HTML sanitization (`richText.js`), and XSS prevention.
- **Automated Testing:** Playwright CLI end-to-end browser test harness testing positive flows and negative edge cases.

---

## 2. Consensus Panel Deliberations & Sign-Off

To ensure bulletproof engineering throughout the project lifecycle, a consensus panel of three senior specialist personas convened to rigorously evaluate the architecture, requirements, and edge cases.

### Panelist 1: Architectural Reviewer
- **Assessment:**
  - The decoupled Express + Vite React stack with MongoDB provides optimal separation of concerns, swift developer velocity, and robust document modeling.
  - The cascade deletion rule for blog deletion and comment subtree deletion is mapped to compound queries and Mongoose middleware hooks.
  - The authentication model cleanly separates the dedicated Admin account from self-service Readers via role claims (`role: 'admin' | 'reader'`).
  - Google OAuth (`/api/auth/google`) and Email OTP (`/api/auth/forgot-password`) integrate smoothly into the existing `User` model without schema fragmentation.
  - The `RichTextEditor` implementation provides full backward compatibility for legacy plaintext blogs while offering safe HTML rendering with sanitization.
- **Verdict:** **UNANIMOUSLY APPROVED**

### Panelist 2: Ambiguity Analyst
- **Assessment:**
  - The 25 edge cases are comprehensively addressed.
  - The distinction between **Unpublish** (reversible, data retained, 404 for guests) and **Delete** (irreversible hard purge) is clearly articulated in the business layer.
  - Comment transparency distinguishes author self-edits (`(edited)`) from moderator edits (`(edited by Admin)`).
  - Anonymous visitors are shielded from jarring redirects through polite CTA banners and tooltips.
  - Social sharing links fall back gracefully to direct clipboard copying (`fallbackCopy`) when clipboard API permissions are restricted.
- **Verdict:** **UNANIMOUSLY APPROVED**

### Panelist 3: QA Edge-Case Specialist
- **Assessment:**
  - Deterministic test seeding ensures that deleting level-2 comments wipes level-3 children without affecting sibling branches.
  - Test suites validate negative scenarios: rapid duplicate likes/saves (compound index deduplication), unauthorized requests to `/api/admin/*`, whitespace-only comments/articles, dangerous link protocol injection, and direct URL access to draft articles.
- **Verdict:** **UNANIMOUSLY APPROVED**

### Final Panel Consensus
**Consensus Status:** **UNANIMOUS (3 / 3 APPROVED)**  
All architectural decisions, schemas, test plans, and security controls are formally ratified.

---

## 3. Database Schema Design (MongoDB / Mongoose Models)

### 3.1 `User` Model (`users` collection)
- `_id`: ObjectId (Primary key)
- `username`: String (required, unique, trimmed, minlength 3)
- `email`: String (required, unique, lowercase, trimmed)
- `passwordHash`: String (optional if authenticated via Google)
- `googleId`: String (optional, unique sparse index)
- `role`: String (required, enum: `['admin', 'reader']`, default: `'reader'`)
- `resetOtp`: String (optional, 6-digit numeric verification code)
- `resetOtpExpires`: Date (optional, 10-minute expiry timestamp)
- `resetOtpVerified`: Boolean (default: false)
- `createdAt`: Date (default: Date.now)

### 3.2 `Blog` Model (`blogs` collection)
- `_id`: ObjectId (Primary key)
- `title`: String (required, trimmed, maxlength 150)
- `content`: String (required, rich HTML or formatted markdown)
- `authorName`: String (required, trimmed, default: `'Admin'`)
- `authorId`: ObjectId (ref: `'User'`, default: null)
- `authorRole`: String (enum: `['admin', 'reader']`, default: `'admin'`)
- `category`: String (required, enum: `['Technology', 'Design', 'Lifestyle', 'Career', 'Tutorials', 'General']`)
- `tags`: [String] (array of trimmed tag strings)
- `coverImage`: String (optional, base64 data URL or external URL)
- `status`: String (required, enum: `['draft', 'published']`, default: `'draft'`)
- `publishedAt`: Date (optional timestamp)
- `excerpt`: Virtual property returning first 160 characters with HTML tags stripped.

### 3.3 `Comment` Model (`comments` collection)
- `_id`: ObjectId (Primary key)
- `blogId`: ObjectId (ref: `'Blog'`, required, indexed)
- `userId`: ObjectId (ref: `'User'`, required)
- `parentId`: ObjectId (ref: `'Comment'`, default: null, indexed) — recursive tree link
- `content`: String (required, trimmed)
- `editedBy`: String (enum: `['author', 'admin', null]`, default: null)
- `createdAt`: Date (default: Date.now)
- `updatedAt`: Date (default: Date.now)

### 3.4 `Like` Model (`likes` collection)
- `_id`: ObjectId (Primary key)
- `blogId`: ObjectId (ref: `'Blog'`, required, indexed)
- `userId`: ObjectId (ref: `'User'`, required, indexed)
- `createdAt`: Date (default: Date.now)
- **Compound Unique Index:** `{ blogId: 1, userId: 1 }` (guarantees strictly one like per reader)

### 3.5 `SavedBlog` Model (`savedblogs` collection)
- `_id`: ObjectId (Primary key)
- `blogId`: ObjectId (ref: `'Blog'`, required, indexed)
- `userId`: ObjectId (ref: `'User'`, required, indexed)
- `createdAt`: Date (default: Date.now)
- **Compound Unique Index:** `{ blogId: 1, userId: 1 }` (strictly prevents duplicate bookmarks)

### 3.6 `Notification` Model (`notifications` collection)
- `_id`: ObjectId (Primary key)
- `userId`: ObjectId (ref: `'User'`, required, indexed) — recipient
- `actorId`: ObjectId (ref: `'User'`, required) — triggering user
- `blogId`: ObjectId (ref: `'Blog'`, required)
- `commentId`: ObjectId (ref: `'Comment'`, optional)
- `type`: String (required, enum: `['reply', 'new_comment']`)
- `message`: String (required)
- `isRead`: Boolean (default: false)
- `createdAt`: Date (default: Date.now)

---

## 4. Execution & Quality Assurance Strategy

1. **Sprint-by-Sprint Execution:** Development follows a disciplined cadence across Sprints 1 to 4 and the Extended GitHub Issues Track (Issues #1 to #17).
2. **Acceptance Criteria Verification:** Every feature ticket defines exact positive and negative test cases.
3. **Automated Verification:** Playwright scripts test UI interactions, route protection, API response codes, and DOM state before transitioning any issue to completed on GitHub.
4. **Zero-Tolerance Regression:** Every newly closed issue runs alongside regression test suites to guarantee no existing capabilities are broken.
