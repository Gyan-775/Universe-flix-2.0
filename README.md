<div align="center">
  <svg width="100%" height="170" viewBox="0 0 1200 170" role="img" aria-label="Gyan-775 cinematic developer banner">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#070b17" />
        <stop offset="100%" stop-color="#120a24" />
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#37b9ff">
          <animate attributeName="stop-color" values="#37b9ff;#7f6bff;#37b9ff" dur="6s" repeatCount="indefinite" />
        </stop>
        <stop offset="100%" stop-color="#7f6bff">
          <animate attributeName="stop-color" values="#7f6bff;#37b9ff;#7f6bff" dur="6s" repeatCount="indefinite" />
        </stop>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="1200" height="170" fill="url(#bg)" rx="18" />
    <line x1="80" y1="128" x2="1120" y2="128" stroke="url(#glow)" stroke-width="3" opacity="0.85" />
    <circle cx="80" cy="128" r="4" fill="#37b9ff">
      <animate attributeName="cx" values="80;1120;80" dur="8s" repeatCount="indefinite" />
    </circle>
    <text x="50%" y="64" text-anchor="middle" fill="#f4f7ff" font-size="38" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Gyan-775</text>
    <text x="50%" y="94" text-anchor="middle" fill="#9fb5ff" font-size="16" font-family="Segoe UI, Arial, sans-serif">Developer • Builder • Learner</text>
    <text x="50%" y="118" text-anchor="middle" fill="#c7d4ff" font-size="14" font-family="Segoe UI, Arial, sans-serif">Building things, breaking things, and learning how they work.</text>
  </svg>
</div>

## 🎬 Featured Project — UNIVERSE-FLIX

**Universe-flix** is a cinematic movie discovery and recommendation platform built while learning full-stack development.  
It is API-first and designed for exploration of movies, franchises, universes, watch orders, and recommendations.

**Project stack (from this repo):**
- Frontend: React, Vite, React Router, Framer Motion
- Backend: Node.js, Express.js
- Data/API: PostgreSQL, Axios, TMDB API
- Personalization: Anonymous browser sessions (no signup/login required)

> Browsing does not require signup, login, email, or an account. No endpoint requires authentication.

---

## 🌌 Current Learning Journey

<p><em>These percentages are directional learning-progress indicators, not skill ratings or claims of mastery.</em></p>

<table>
  <tr><td><strong>JavaScript</strong></td><td><code>50%</code></td><td>Learning in active projects</td></tr>
  <tr><td><strong>React</strong></td><td><code>40%</code></td><td>Building UI and routing patterns</td></tr>
  <tr><td><strong>Node.js</strong></td><td><code>30%</code></td><td>Learning backend runtime and APIs</td></tr>
  <tr><td><strong>Express.js</strong></td><td><code>40%</code></td><td>Developing server routes and middleware</td></tr>
  <tr><td><strong>MongoDB</strong></td><td><code>30%</code></td><td>Learning database modeling concepts</td></tr>
  <tr><td><strong>Java</strong></td><td><code>70%</code></td><td>Continuing core programming practice</td></tr>
  <tr><td><strong>Python</strong></td><td><code>40%</code></td><td>Improving scripting/problem-solving flow</td></tr>
  <tr><td><strong>DSA</strong></td><td><code>45%</code></td><td>Consistent algorithm/data-structure practice</td></tr>
</table>

<p>
  Comfortable with <strong>HTML/CSS</strong>.<br/>
  <strong>Git/GitHub</strong>: basic/intermediate and improving.<br/>
  <strong>Full-stack development</strong>: actively learning.
</p>

---

## 🧩 Tech Stack Focus

| Track | Technologies |
|---|---|
| **Currently comfortable** | HTML, CSS, Git/GitHub |
| **Currently learning** | JavaScript, React, Node.js, Express.js, MongoDB, Java, Python, DSA |
| **Exploring** | MERN, MEAN, backend development, APIs, full-stack architecture |

---

## 🛠️ Setup & Run (Preserved Project Instructions)

### Backend setup
1. Create a PostgreSQL database named `universeflix`.
2. Copy `server/.env.example` to `server/.env`.
3. Set `DATABASE_URL` and `TMDB_READ_ACCESS_TOKEN`.
4. Install dependencies:

```powershell
npm.cmd --prefix server install
```

5. Apply the schema:

```powershell
npm.cmd --prefix server run migrate
```

6. Start the API:

```powershell
npm.cmd --prefix server run dev
```

The public catalog remains usable when PostgreSQL is not configured. Session persistence and recommendations require `DATABASE_URL`; the frontend keeps a local anonymous fallback for taste data.

### Frontend

```powershell
npm.cmd --prefix client install
npm.cmd --prefix client run dev
```

Open `http://localhost:5173/`. The Vite `/api` proxy targets `http://localhost:5000`.

### Public APIs

- `GET /api/health`
- `GET /api/movies`
- `GET /api/movies/:id`
- `GET /api/movies/:id/similar`
- `GET /api/universes`
- `GET /api/universes/:slug/movies`
- `GET /api/genres`
- `GET /api/session`
- `GET /api/session/profile`
- `POST /api/session/taste`
- `POST /api/session/interaction`
- `GET /api/recommendations`

No endpoint requires authentication.

---

## 🧭 Learning Timeline (Ongoing)

```text
Frontend
   ↓
JavaScript
   ↓
React
   ↓
Backend
   ↓
Node.js + Express
   ↓
Databases
   ↓
PostgreSQL / data persistence
   ↓
Full Stack
   ↓
Exploring MERN / MEAN
```

---

## 🔗 GitHub Activity

- Profile: https://github.com/Gyan-775
- Repository: https://github.com/Gyan-775/Universe-flix-2.0

---

## 🤝 Connect

GitHub is the primary public workspace right now:  
**https://github.com/Gyan-775**

---

<div align="center">
  <sub>Still learning. Still building. Still shipping.</sub><br/>
  <svg width="260" height="12" viewBox="0 0 260 12" role="img" aria-label="subtle animated divider">
    <line x1="0" y1="6" x2="260" y2="6" stroke="#6f8cff" stroke-width="1.5" opacity="0.5" />
    <circle cx="10" cy="6" r="2.5" fill="#8aa2ff">
      <animate attributeName="cx" values="10;250;10" dur="5s" repeatCount="indefinite" />
    </circle>
  </svg>
</div>
