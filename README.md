# ✨ Full-Stack Blog Application

A modern, production-grade Full-Stack Blog Platform built with **React 19**, **Vite**, **Express.js**, **MongoDB / Mongoose ODM**, and a handcrafted **Vanilla CSS Glassmorphic Design System**.

---

## 🚀 Key Features

### 🛡️ Role-Based Access Control (RBAC) & Authentication
- **Admin & Reader Roles**: Pre-seeded Admin account for editorial oversight and self-service registration for readers.
- **JWT & Stateless Auth**: Secure token-based session handling with `bcryptjs` password hashing.
- **Dynamic User Profiles**: Automated initials avatars and personalized dashboards.

### ✍️ Admin Blog Management Studio
- **Editorial Studio**: Rich authoring interface with Title, Content, Author, Category dropdown, and Tags.
- **Lifecycle Controls**:
  - **Draft vs. Published**: Draft articles remain strictly concealed from non-admin visitors.
  - **Unpublish**: Instantly hides published articles while preserving community comments, likes, and engagement metrics.
  - **Permanent Delete**: Permanently removes an article and triggers deep cascade deletion across all comments, nested replies, and likes.

### 🔍 Discovery Engine & Reader Experience
- **Adaptive Typography Layout**: Articles without a cover image render a polished typography-first card layout.
- **Live Search & Category Filtering**: Instant client-side search across titles and content, combined with category and tag filters.
- **Paginated Grid**: Configurable 6/9 items per page with page navigation.

### 💬 Threaded Discussion & Engagement
- **Deduplicated Likes**: Idempotent toggle-like system for registered readers, accompanied by guest login prompt tooltips.
- **Multi-Level Recursive Discussions**: Nested comment and reply trees with timestamps and user badges.
- **Comment Transparency & Moderation**: Author edits indicate `(edited)` while moderator edits indicate `(edited by Admin)`. Deleting a parent comment cascades down its discussion branch.

### 🔔 In-App Notification Center
- **Interactive Notification Bell**: Real-time unread badge alerting readers upon receiving comment replies, and notifying the Admin of newly posted comments.
- **Deep-linking**: Clicking a notification marks it as read and navigates directly to the relevant discussion thread.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, React Router v6, Lucide Icons |
| **Styling** | Vanilla CSS Design System, Custom Tokens, Glassmorphism |
| **Backend** | Node.js, Express.js REST API |
| **Database** | MongoDB with Mongoose ODM |
| **Security** | JWT (`jsonwebtoken`), `bcryptjs`, CORS middleware |
| **Testing** | Playwright End-to-End Test Suite |

---

## 📋 Scrum Roadmap & Sprints

The application was built adhering to an Agile / Issue-Driven Scrum methodology across 4 milestones:

- **Sprint 1: Scaffolding, Design Tokens & Auth**
  - `#1` Project Scaffolding & Express-MongoDB Backend Core
  - `#2` Vanilla CSS Modern Design System & Responsive Shell
  - `#3` Authentication & Role-Based Access Control (Admin & Reader)
- **Sprint 2: Blog Management Studio & Discovery**
  - `#4` Admin Blog Management Studio (Create, Edit, Draft/Publish)
  - `#5` Blog Lifecycle Controls (Unpublish vs. Permanent Delete)
  - `#6` Public Catalog, Search, Filtering & Pagination Engine
- **Sprint 3: Engagement Engine & Moderation**
  - `#7` Deduplicated Like & Appreciation System
  - `#8` Multi-Level Threaded Comment & Reply System
  - `#9` Comment Ownership, Transparency & Cascade Deletion
- **Sprint 4: Notification Center & Hardening**
  - `#10` In-App Notification Center
  - `#11` End-to-End System Hardening & Playwright Verification

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas connection URI

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Karthik-mogaveera/blog_app.git
cd blog_app
npm install
npm --prefix client install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Update `.env` with your credentials:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/blog_application
JWT_SECRET=your_jwt_secret_key_here
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@blogapp.com
ADMIN_PASSWORD=Admin@123456
CLIENT_URL=http://localhost:5173
```

### 3. Launch Development Server
```bash
npm run dev
```
- Client runs at: `http://localhost:5173`
- Backend API runs at: `http://localhost:5000`

---

## 🧪 Testing

Run the full end-to-end automated test suite:
```bash
npm run test:e2e
```

---

## 📄 License
ISC License. Built by [Karthik Mogaveera](https://github.com/Karthik-mogaveera).
