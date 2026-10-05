# Paresh Chauhan — Android Developer Portfolio & Visual Admin Studio

A luxury, data-driven personal portfolio and visual administration studio with direct GitHub REST API synchronization.

---

## Theme & Design
- **Theme**: Luxury Dark & Gold/Yellow (`#080600`, `#FFD700`, `#FFC107`, `#C8A96A`)
- **Typography**: Outfit & JetBrains Mono (Google Fonts)
- **Tech Stack**: Vanilla HTML5, CSS3, JavaScript (ES6+) — Zero frameworks, blazing-fast performance
- **Data Engine**: All content is dynamically loaded from `profile.json`
- **Visual Admin Studio**: Dedicated `admin.html` with form fields for every section + 1-click push to GitHub via Personal Access Token (PAT)

---

## Quick Start (Running Locally)

1. Open `index.html` in any web browser to view your public portfolio.
2. Open `admin.html` in your web browser to access the **Visual Admin Studio**.

---

## How the Visual Admin Studio Works (`admin.html`)

Instead of editing code or manual JSON:
1. **Open `admin.html`** in your browser.
2. Choose your account preset:
   - **`INAxDeveloper`** (Main account where the portfolio is hosted)
   - **`inaxdevelopersAdmin`** (Admin account)
3. Enter your **GitHub Personal Access Token (PAT)**.
4. Edit any field visually:
   - Profile & Bio: Name, tagline, summary, location, email, phone, availability toggle, hero highlight numbers.
   - Skills & Tech Stack: Categorized skill bars with live sliders (0–100%), add/delete categories, technology pill badges.
   - Work Experience: Job titles, companies, dates, responsibilities, tech tags, reorder.
   - Education: Degrees, institutions, years, descriptions, reorder.
   - Projects: Project names, descriptions, tech stack, GitHub links, live demo links, emoji icons, featured badge.
   - Social Links: GitHub, LinkedIn, Email, Twitter/X, etc.
   - App Store Links: Play Store and App Store download links.
5. Click **"Push to GitHub"**:
   - The admin studio encodes your changes, fetches the latest file SHA, and pushes an updated commit to your GitHub repository automatically.
6. Click **"Preview Live"**:
   - Test your draft edits on your local portfolio before pushing.
7. Click **"Download JSON"**:
   - Save a local backup copy of `profile.json` anytime.

---

## How to Create a GitHub Personal Access Token (PAT)

To allow the Admin Studio to update `profile.json` on GitHub:
1. Go to [GitHub Token Settings](https://github.com/settings/tokens/new).
2. Set **Note**: `Portfolio-Admin-Studio`.
3. Choose **Expiration**: 90 days or No expiration.
4. Check the **`repo`** scope (Full control of private repositories & commit access).
5. Click **Generate token** and copy it (starts with `ghp_`).
6. Paste the token into `admin.html`. Check "Remember token in this browser" so you do not have to re-enter it.

---

## Deploying to GitHub Pages

1. Push all files to a GitHub repository under `INAxDeveloper` (e.g. `INAxDeveloper/portfolio`):
   ```bash
   git init
   git add .
   git commit -m "Initial commit of luxury portfolio & admin studio"
   git branch -M main
   git remote add origin https://github.com/INAxDeveloper/portfolio.git
   git push -u origin main
   ```
2. In your repository on GitHub, go to **Settings** -> **Pages**.
3. Under **Branch**, select `main` and `/ (root)`, then click **Save**.
4. Your website will be live at `https://inaxdeveloper.github.io/portfolio/`!

---

## File Structure
- `index.html` — Public portfolio page with interactive animations, particles, and modals
- `style.css` — Gold/Black luxury theme stylesheet
- `script.js` — Dynamic rendering engine, particle system, typewriter, counter animations
- `profile.json` — Core database file containing all your information
- `admin.html` — Visual Admin Studio interface
- `admin.css` — Admin Studio stylesheet
- `admin.js` — Admin Studio controller with GitHub REST API integration
- `Paresh_AndroidDeveoper.pdf` — Downloadable CV / Resume
- `avatar.jpg` — Profile picture
