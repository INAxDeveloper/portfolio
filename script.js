/* ================================================================
   script.js — Portfolio powered by profile.json
   Data source: local profile.json OR GitHub via Access Token
   ================================================================ */

// ===== PROFILE DATA (default fallback) =====
let PROFILE = null;

// ===== LOAD PROFILE =====
async function loadProfile() {
  // Check if preview mode is active from Admin Panel
  const previewData = localStorage.getItem('paresh_portfolio_preview');
  if (previewData) {
    try {
      PROFILE = JSON.parse(previewData);
      showPreviewBanner();
      renderAll();
      hideLoader();
      return;
    } catch (e) {
      console.warn('Failed to parse preview profile', e);
      localStorage.removeItem('paresh_portfolio_preview');
    }
  }

  try {
    const res = await fetch('profile.json?v=' + Date.now());
    if (!res.ok) throw new Error('Failed to fetch profile.json');
    PROFILE = await res.json();
  } catch (e) {
    console.warn('Could not load profile.json, using embedded defaults.', e);
    PROFILE = getDefaultProfile();
  }
  renderAll();
  hideLoader();
}

function showPreviewBanner() {
  const banner = document.getElementById('previewBanner');
  if (banner) {
    banner.style.display = 'block';
    document.body.style.paddingTop = '32px';
  }
}

function clearPreview() {
  localStorage.removeItem('paresh_portfolio_preview');
  location.reload();
}

// ===== RENDER ALL SECTIONS =====
function renderAll() {
  if (!PROFILE) return;
  updateMeta();
  renderHero();
  renderSkills();
  renderProjects();
  renderExperience();
  renderGitHubStats();
  renderSocialLinks();
  renderApps();
  renderContact();
  renderFooter();
  initAnimations();
}

function updateMeta() {
  document.title = `${PROFILE.name} | ${PROFILE.tagline}`;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', `${PROFILE.name} - ${PROFILE.tagline}. ${PROFILE.bio.slice(0, 100)}`);
}

// ===== HERO =====
function renderHero() {
  const p = PROFILE;
  setEl('heroName', `${p.name.split(' ')[0]} <span class="highlight">${p.name.split(' ').slice(1).join(' ')}</span>`);
  setEl('heroBio', p.bio);
  if (p.available === false) {
    const badge = document.getElementById('heroBadge');
    if (badge) badge.innerHTML = `<span class="badge-dot" style="background:#888"></span> Not available`;
  }

  // Stats
  const statsEl = document.getElementById('heroStats');
  if (statsEl && p.stats) {
    statsEl.innerHTML = `
      <div class="stat-item"><span class="stat-number" data-target="${p.stats.projects}">0</span>+<span class="stat-label">Projects</span></div>
      <div class="stat-divider"></div>
      <div class="stat-item"><span class="stat-number" data-target="${p.stats.years}">0</span>+<span class="stat-label">Years Coding</span></div>
      <div class="stat-divider"></div>
      <div class="stat-item"><span class="stat-number" data-target="${p.stats.apps}">0</span>+<span class="stat-label">Apps Built</span></div>
    `;
  }

  // GitHub button
  const ghBtn = document.getElementById('githubHeroBtn');
  if (ghBtn && p.githubUsername) ghBtn.href = `https://github.com/${p.githubUsername}`;
  const allProjBtn = document.getElementById('allProjectsBtn');
  if (allProjBtn && p.githubUsername) allProjBtn.href = `https://github.com/${p.githubUsername}`;
}

// ===== SKILLS =====
function renderSkills() {
  const grid = document.getElementById('skillsGrid');
  const pills = document.getElementById('techPills');
  if (!grid || !PROFILE.skills) return;

  grid.innerHTML = PROFILE.skills.map(cat => `
    <div class="skill-category fade-up">
      <h3 class="category-title">${cat.category}</h3>
      <div class="skill-items">
        ${cat.items.map(s => `
          <div class="skill-item" style="--level:${s.level}%">
            <span class="skill-name">${s.name}</span>
            <div class="skill-bar"><div class="skill-fill"></div></div>
            <span class="skill-pct">${s.level}%</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  if (pills && PROFILE.techPills) {
    pills.innerHTML = PROFILE.techPills.map(t => `<span class="pill">${t}</span>`).join('');
  }
}

// ===== PROJECTS =====
function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid || !PROFILE.projects) return;

  grid.innerHTML = PROFILE.projects.map(p => `
    <article class="project-card${p.featured ? ' featured' : ''} fade-up">
      ${p.featured ? '<div class="project-badge">⭐ Featured</div>' : ''}
      <div class="project-icon">${p.icon || '📱'}</div>
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <div class="project-tech">${(p.tech || []).map(t => `<span>${t}</span>`).join('')}</div>
      <div class="project-links">
        ${p.github ? `<a href="${p.github}" target="_blank" rel="noopener" class="project-link">⌥ View Code</a>` : ''}
        ${p.live ? `<a href="${p.live}" target="_blank" rel="noopener" class="project-link live">🔗 Live Demo</a>` : ''}
      </div>
    </article>
  `).join('');
}

// ===== EXPERIENCE & EDUCATION =====
function renderExperience() {
  const expEl = document.getElementById('experienceTimeline');
  const eduEl = document.getElementById('educationTimeline');

  if (expEl && PROFILE.experience) {
    expEl.innerHTML = PROFILE.experience.map(e => `
      <div class="timeline-item fade-up">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <span class="timeline-year">${e.year}</span>
          <h3>${e.role}</h3>
          <h4>${e.company}</h4>
          <p>${e.description}</p>
          <div class="timeline-tags">${(e.tags || []).map(t => `<span>${t}</span>`).join('')}</div>
        </div>
      </div>
    `).join('');
  }

  if (eduEl && PROFILE.education) {
    eduEl.innerHTML = PROFILE.education.map(e => `
      <div class="timeline-item fade-up">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <span class="timeline-year">${e.year}</span>
          <h3>${e.degree}</h3>
          <h4>${e.institution}</h4>
          <p>${e.description}</p>
          <div class="timeline-tags">${(e.tags || []).map(t => `<span>${t}</span>`).join('')}</div>
        </div>
      </div>
    `).join('');
  }
}

// ===== GITHUB STATS =====
function renderGitHubStats() {
  const grid = document.getElementById('githubStatsGrid');
  const user = PROFILE.githubUsername;
  if (!grid || !user) return;

  const theme = 'dark';
  const bg = '080600';
  const titleColor = 'FFD700';
  const textColor = 'C8A96A';
  const iconColor = 'FFD700';
  const ringColor = 'FFD700';
  const fireColor = 'FFC107';

  grid.innerHTML = `
    <div class="stat-card fade-up">
      <img src="https://github-readme-stats.vercel.app/api?username=${user}&show_icons=true&theme=${theme}&hide_border=true&bg_color=${bg}&title_color=${titleColor}&text_color=${textColor}&icon_color=${iconColor}" alt="GitHub Stats" loading="lazy" />
    </div>
    <div class="stat-card fade-up">
      <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=${user}&layout=compact&theme=${theme}&hide_border=true&bg_color=${bg}&title_color=${titleColor}&text_color=${textColor}" alt="Top Languages" loading="lazy" />
    </div>
    <div class="stat-card wide fade-up">
      <img src="https://github-readme-streak-stats.herokuapp.com/?user=${user}&theme=${theme}&hide_border=true&background=${bg}&ring=${ringColor}&fire=${fireColor}&currStreakLabel=${titleColor}&sideLabels=${textColor}&dates=${textColor}" alt="GitHub Streak" loading="lazy" />
    </div>
  `;
}

// ===== SOCIAL LINKS =====
function renderSocialLinks() {
  const container = document.getElementById('socialLinksContainer');
  if (!container || !PROFILE.socialLinks) return;

  const icons = { github: '🐙', linkedin: '💼', twitter: '🐦', email: '✉️', instagram: '📸', youtube: '▶️' };

  container.innerHTML = PROFILE.socialLinks.map(s => `
    <a href="${s.url}" target="${s.url.startsWith('mailto') ? '_self' : '_blank'}" rel="noopener" class="social-link">
      <div class="social-icon">${icons[s.icon] || '🔗'}</div>
      <div>
        <span class="social-platform">${s.platform}</span>
        <span class="social-handle">${s.handle}</span>
      </div>
    </a>
  `).join('');
}

// ===== APP LINKS =====
function renderApps() {
  const section = document.getElementById('apps');
  const grid = document.getElementById('appsGrid');
  if (!section || !grid || !PROFILE.appLinks || PROFILE.appLinks.length === 0) {
    if (section) section.style.display = 'none';
    return;
  }
  section.style.display = 'block';
  const storeIcons = { 'Play Store': '▶️', 'App Store': '🍎' };
  grid.innerHTML = PROFILE.appLinks.map(a => `
    <a href="${a.url}" target="_blank" rel="noopener" class="app-card fade-up">
      <div class="app-icon">${storeIcons[a.store] || '📱'}</div>
      <span class="app-name">${a.name}</span>
      <span class="app-store">${a.store}</span>
    </a>
  `).join('');
}

// ===== CONTACT INFO =====
function renderContact() {
  const addrEl = document.getElementById('addressText');
  const emailLink = document.getElementById('emailLink');
  const emailRow = document.getElementById('emailRow');
  const availCard = document.getElementById('availCard');

  if (addrEl && PROFILE.address) addrEl.textContent = PROFILE.address;
  if (emailLink && PROFILE.email) {
    emailLink.href = `mailto:${PROFILE.email}`;
    emailLink.textContent = PROFILE.email;
  }
  if (availCard) availCard.style.display = PROFILE.available ? 'flex' : 'none';
}

// ===== FOOTER =====
function renderFooter() {
  const el = document.getElementById('footerText');
  if (el && PROFILE.footerText) {
    el.innerHTML = PROFILE.footerText;
  }
}

// ===== HELPER =====
function setEl(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// ================================================================
// ADMIN PANEL — GitHub Integration
// ================================================================

function openAdminModal() {
  document.getElementById('adminModal').style.display = 'flex';
}

function closeAdminModal() {
  document.getElementById('adminModal').style.display = 'none';
}

document.getElementById('adminModal').addEventListener('click', function(e) {
  if (e.target === this) closeAdminModal();
});

async function loadFromGitHub() {
  const token = document.getElementById('ghToken').value.trim();
  const repo = document.getElementById('ghRepo').value.trim();
  const branch = document.getElementById('ghBranch').value.trim() || 'main';
  const filePath = document.getElementById('ghFile').value.trim() || 'profile.json';
  const statusEl = document.getElementById('adminStatus');
  const btn = document.getElementById('loadGhBtn');

  if (!token) { setAdminStatus('❌ Please enter your GitHub Personal Access Token.', 'error'); return; }
  if (!repo) { setAdminStatus('❌ Please enter your repository (owner/repo).', 'error'); return; }

  btn.textContent = 'Loading...'; btn.disabled = true;
  setAdminStatus('⏳ Fetching from GitHub...', '');

  try {
    const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const content = atob(data.content.replace(/\s/g, ''));
    const parsed = JSON.parse(content);
    PROFILE = parsed;
    renderAll();
    setAdminStatus('✅ Profile loaded from GitHub successfully!', 'success');
    setTimeout(closeAdminModal, 2000);

  } catch (e) {
    setAdminStatus(`❌ Error: ${e.message}`, 'error');
  } finally {
    btn.textContent = 'Load Profile from GitHub'; btn.disabled = false;
  }
}

function loadFromPaste() {
  const statusEl = document.getElementById('adminStatus');
  const raw = document.getElementById('jsonPaste').value.trim();
  if (!raw) { setAdminStatus('❌ Please paste JSON content.', 'error'); return; }
  try {
    const parsed = JSON.parse(raw);
    PROFILE = parsed;
    renderAll();
    setAdminStatus('✅ Profile applied from JSON!', 'success');
    setTimeout(closeAdminModal, 1500);
  } catch (e) {
    setAdminStatus(`❌ Invalid JSON: ${e.message}`, 'error');
  }
}

function setAdminStatus(msg, type) {
  const el = document.getElementById('adminStatus');
  el.textContent = msg;
  el.className = 'admin-status ' + type;
}

// ================================================================
// ANIMATIONS & INTERACTIONS
// ================================================================

function initAnimations() {
  // Intersection observer for fade-up
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add('visible');
        // Skill bars
        el.querySelectorAll('.skill-item').forEach(item => {
          item.classList.add('animated');
        });
        // Counters
        el.querySelectorAll('.stat-number').forEach(animateCounter);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
  document.querySelectorAll('.skill-category, .project-card, .timeline-item, .stat-card').forEach(el => {
    el.classList.add('fade-up');
    observer.observe(el);
  });

  // Hero stats counter
  setTimeout(() => {
    document.querySelectorAll('.stat-number').forEach(animateCounter);
  }, 800);
}

function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'));
  if (isNaN(target)) return;
  let current = 0;
  const step = Math.ceil(target / 30);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 60);
}

// ================================================================
// PARTICLE BACKGROUND (Gold Dots)
// ================================================================
(function() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function rand(min, max) { return Math.random() * (max - min) + min; }

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: rand(0, window.innerWidth), y: rand(0, window.innerHeight),
      r: rand(0.5, 2), vx: rand(-0.2, 0.2), vy: rand(-0.2, 0.2),
      alpha: rand(0.1, 0.5)
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,215,0,${p.alpha})`;
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ================================================================
// NAVBAR
// ================================================================
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  updateActiveNav();
});

const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle) {
  menuToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const anchors = document.querySelectorAll('.nav-links a');
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 150) current = sec.id;
  });
  anchors.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}

// ================================================================
// TYPEWRITER
// ================================================================
const typewords = [
  'Android Apps 📱',
  'Kotlin Magic ✨',
  'Mobile UIs 🎨',
  'Firebase Apps 🔥',
  'MVVM Apps 🏗️',
  'Java Solutions ☕'
];
let wordIndex = 0, charIndex = 0, isDeleting = false;
const typeEl = document.getElementById('typewriter');

function type() {
  const word = typewords[wordIndex];
  if (!isDeleting) {
    if (typeEl) typeEl.textContent = word.slice(0, ++charIndex);
    if (charIndex === word.length) { isDeleting = true; setTimeout(type, 2000); return; }
  } else {
    if (typeEl) typeEl.textContent = word.slice(0, --charIndex);
    if (charIndex === 0) { isDeleting = false; wordIndex = (wordIndex + 1) % typewords.length; }
  }
  setTimeout(type, isDeleting ? 60 : 100);
}
type();

// ================================================================
// CONTACT FORM
// ================================================================
function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  btn.textContent = 'Sending...'; btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Send Message'; btn.disabled = false;
    const success = document.getElementById('formSuccess');
    if (success) { success.classList.add('show'); e.target.reset(); }
    setTimeout(() => { if (success) success.classList.remove('show'); }, 5000);
  }, 1500);
}

// ================================================================
// LOADER
// ================================================================
function hideLoader() {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }, 1800);
}

// ================================================================
// DEFAULT PROFILE FALLBACK
// ================================================================
function getDefaultProfile() {
  return {
    name: "Paresh Chauhan",
    tagline: "Android Developer",
    bio: "Passionate Android developer crafting smooth mobile experiences with Kotlin and Java.",
    available: true,
    address: "India",
    email: "pareshchauhan39500@gmail.com",
    stats: { projects: 15, years: 3, apps: 10 },
    skills: [
      { category: "Android Development", items: [{ name: "Kotlin", level: 90 }, { name: "Java", level: 85 }] }
    ],
    techPills: ["Kotlin", "Java", "Firebase", "Android SDK"],
    education: [{ year: "2019 - 2023", degree: "BCA", institution: "Gujarat University", description: "Computer Science.", tags: ["BCA"] }],
    experience: [{ year: "2022 - Present", role: "Android Developer", company: "Freelance", description: "Building Android apps.", tags: ["Kotlin"] }],
    projects: [{ icon: "📱", name: "Android App", description: "A mobile application.", tech: ["Kotlin", "Firebase"], github: "https://github.com/INAxDeveloper", featured: true }],
    socialLinks: [{ platform: "GitHub", handle: "@INAxDeveloper", url: "https://github.com/INAxDeveloper", icon: "github" }],
    appLinks: [],
    githubUsername: "INAxDeveloper",
    footerText: "Built with ❤️ by <strong>Paresh Chauhan</strong> · Hosted on GitHub Pages"
  };
}

// ================================================================
// INIT
// ================================================================
loadProfile();

// ================================================================
// SECRET ADMIN ACCESS (Private Gate)
// Press: Ctrl + Shift + A (or triple-click footer logo)
// ================================================================
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
    e.preventDefault();
    window.location.href = 'admin.html';
  }
});

(function initSecretLogoClick() {
  let clicks = 0;
  let timer = null;
  const logo = document.querySelector('.footer-logo');
  if (logo) {
    logo.style.cursor = 'pointer';
    logo.title = 'Paresh Chauhan';
    logo.addEventListener('click', () => {
      clicks++;
      clearTimeout(timer);
      if (clicks >= 3) {
        window.location.href = 'admin.html';
      }
      timer = setTimeout(() => { clicks = 0; }, 1200);
    });
  }
})();

