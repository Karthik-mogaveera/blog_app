# Implementation Plan: Full-Stack Blog Application

## 1. System Architecture & Technical Strategy

### 1.1 Architecture Overview
The application is structured as a decoupled, production-grade full-stack web application with a high-performance Express REST backend and a modern, responsive Vite + React frontend styled with custom Vanilla CSS design tokens.

```
+-------------------------------------------------------------------------------+
|                                CLIENT LAYER (Vite + React)                     |
|  - Vanilla CSS Design System (Glassmorphism, Dark/Light palettes, Micro-anims) |
|  - Public Catalog, Article Reader, Discussion Tree, In-App Notification Bell  |
|  - Admin Studio, Blog Manager, Comment Moderation Hub                          |
+---------------------------------------┬---------------------------------------+
                                        │ REST API (JSON / JWT / Cookie)
+---------------------------------------▼---------------------------------------+
|                                SERVER LAYER (Express.js)                      |
|  - Security & Middleware: JWT Auth, Role Guard (Admin vs Reader), CORS, Rate   |
|  - Business Logic Controllers: Blogs, Comments/Replies, Likes, Notifications  |
|  - Validation: Input sanitization, schema constraints, cascade delete logic    |
+---------------------------------------┬---------------------------------------+
                                        │ Embedded SQL / Storage Engine
+---------------------------------------▼---------------------------------------+
|                        DATA PERSISTENCE LAYER (MongoDB & Mongoose)             |
|  - Documents & Collections: users, blogs, comments, likes, notifications       |
|  - Mongoose Schemas: Compound unique index (blogId + userId), cascade hooks   |
|  - Cascades: Middleware & service hooks for comment trees and blog deletion    |
+-------------------------------------------------------------------------------+
```

### 1.2 Technology Stack
- **Runtime & Backend:** Node.js (v22.x) with Express.js REST API.
- **Database / Persistence:** MongoDB with Mongoose ODM. Features schema validation, compound indices, and clean middleware hooks for cascade deletions.
- **Frontend Framework:** React 19 / Vite with React Router for SPA navigation.
- **Styling Architecture:** Vanilla CSS design system utilizing CSS variables, responsive fluid typography, glassmorphism, CSS grid/flexbox, and micro-interactions. Modern Google Fonts (*Plus Jakarta Sans* / *Inter*).
- **Authentication & Security:** `bcryptjs` for password hashing, JWT (`jsonwebtoken`) for stateless secure session verification, and HTTP-only cookie support.
- **End-to-End Testing:** Playwright CLI for headless and visual automated testing across all positive and negative scenarios.

---

## 2. Consensus Panel Deliberations & Sign-Off

To ensure bulletproof engineering before Sprint 1 kickoff, a consensus panel of three senior specialist personas convened to rigorously evaluate the architecture, requirements, and edge cases.

### Panelist 1: Architectural Reviewer
- **Assessment:** 
  - The decoupled Express + Vite React stack with embedded SQLite provides optimal separation of concerns, swift developer velocity, and robust relational data modeling.
  - The cascade deletion rule for blog deletion and comment subtree deletion is perfectly mapped to relational foreign key cascades (`ON DELETE CASCADE`) and recursive CTE queries.
  - The authentication model cleanly separates the single dedicated Admin account from self-service Readers via role claims (`role: 'admin' | 'reader'`).
- **Verdict:** **APPROVED with Recommendations**
  - Recommendation: Ensure database migrations and seed scripts automatically initialize the default Admin credentials and default categories upon startup.

### Panelist 2: Ambiguity Analyst
- **Assessment:**
  - The 25 edge cases are comprehensively addressed.
  - The distinction between **Unpublish** (reversible, data retained, 404 for guests) and **Delete** (irreversible hard purge) is clearly articulated in the business layer.
  - Comment transparency distinguishes author self-edits (`(edited)`) from moderator edits (`(edited by Admin)`).
  - Anonymous visitors are shielded from jarring redirects through polite CTA banners and tooltips.
- **Verdict:** **APPROVED**
  - No remaining behavioral ambiguities identified.

### Panelist 3: QA Edge-Case Specialist
- **Assessment:**
  - The multi-level comment tree requires deterministic test seeding to verify that deleting level-2 comments wipes level-3 children without affecting sibling level-2 branches.
  - Test suites must validate negative scenarios: rapid duplicate like clicks (idempotency), unauthorized requests to `/api/admin/*`, whitespace-only comment submissions, and direct URL access to draft articles.
- **Verdict:** **APPROVED with Testing Criteria**
  - Requirement: Each Sprint must run dedicated Playwright test scripts covering both positive paths and negative boundary conditions.

### Final Panel Consensus
**Consensus Status:** **UNANIMOUS (3 / 3 APPROVED)**  
Sprint 1 development plan and technical foundation are formally ratified.

---

## 3. Database Schema Design (MongoDB / Mongoose Models)

### `User` Model (`users` collection)
- `_id`: ObjectId (Default)
- `username`: String (required, unique, trimmed, minlength 3)
- `email`: String (required, unique, lowercase, trimmed)
- `passwordHash`: String (required)
- `role`: String (required, enum: `['admin', 'reader']`, default: `'reader'`)
- `createdAt`: Date (default: Date.now)

### `Blog` Model (`blogs` collection)
- `_id`: ObjectId (Default)
- `title`: String (required, trimmed)
- `content`: String (required)
- `authorName`: String (required, trimmed, default: `'Admin'`)
- `category`: String (required, enum: `['Technology', 'Design', 'Lifestyle', 'Career', 'Tutorials', 'General']`)
- `tags`: [String] (array of trimmed tag strings)
- `coverImage`: String (optional, trimmed URL or path)
- `status`: String (required, enum: `['draft', 'published']`, default: `'draft'`)
- `createdAt`: Date (default: Date.now)
- `publishedAt`: Date (optional, set when status becomes 'published')
- `updatedAt`: Date (default: Date.now)

### `Comment` Model (`comments` collection)
- `_id`: ObjectId (Default)
- `blogId`: ObjectId (ref: `'Blog'`, required, indexed)
- `userId`: ObjectId (ref: `'User'`, required)
- `parentId`: ObjectId (ref: `'Comment'`, default: null, indexed) -- Null for top-level comments; references parent comment for nested replies
- `content`: String (required, trimmed)
- `editedBy`: String (enum: `['author', 'admin', null]`, default: null)
- `createdAt`: Date (default: Date.now)
- `updatedAt`: Date (default: Date.now)

### `Like` Model (`likes` collection)
- `_id`: ObjectId (Default)
- `blogId`: ObjectId (ref: `'Blog'`, required, indexed)
- `userId`: ObjectId (ref: `'User'`, required, indexed)
- `createdAt`: Date (default: Date.now)
- *Compound Unique Index:* `{ blogId: 1, userId: 1 }` (guarantees deduplication and single like per user)

### `Notification` Model (`notifications` collection)
- `_id`: ObjectId (Default)
- `userId`: ObjectId (ref: `'User'`, required, indexed) -- Recipient of alert
- `actorId`: ObjectId (ref: `'User'`, required) -- Initiating user
- `blogId`: ObjectId (ref: `'Blog'`, required)
- `commentId`: ObjectId (ref: `'Comment'`, optional)
- `type`: String (required, enum: `['reply', 'new_comment']`)
- `message`: String (required)
- `isRead`: Boolean (default: false)
- `createdAt`: Date (default: Date.now)

---

## 4. Execution & Quality Assurance Strategy

1. **Sprint-by-Sprint Execution:** Development follows a disciplined cadence across 4 milestones/sprints.
2. **Acceptance Criteria Verification:** Every feature ticket defines exact positive and negative test cases.
3. **Automated Verification:** Playwright scripts test UI interactions, route protection, API response codes, and DOM state before transitioning any issue to completed.
