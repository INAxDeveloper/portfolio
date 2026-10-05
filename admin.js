/* ================================================================
   admin.js — Paresh Chauhan Visual Admin Studio Controller
   Full Visual Editor & GitHub REST API Integration
   ================================================================ */

// ===== STATE =====
let profileData = null;
let currentSha = null;
let isDirty = false;

// Default empty schema in case of error
const DEFAULT_SCHEMA = {
  name: "Paresh Chauhan",
  tagline: "Android Developer",
  bio: "Passionate Android developer crafting smooth mobile experiences with Kotlin and Java.",
  available: true,
  address: "India",
  email: "pareshchauhan39500@gmail.com",
  phone: "+91-XXXXXXXXXX",
  stats: { projects: 15, years: 3, apps: 10 },
  skills: [],
  techPills: [],
  education: [],
  experience: [],
  projects: [],
  socialLinks: [],
  appLinks: [],
  githubUsername: "INAxDeveloper",
  footerText: "Built with ❤️ by <strong>Paresh Chauhan</strong> · Hosted on GitHub Pages"
};

// ===== UTF-8 SAFE BASE64 HELPERS =====
function utf8ToBase64(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
}

function base64ToUtf8(str) {
  return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initTabs();
  initPresets();
  loadLocalProfile();
});

// ===== GITHUB PRESETS & CONFIG =====
function initPresets() {
  const presets = {
    inax: {
      owner: 'INAxDeveloper',
      repo: 'INAxDeveloper/portfolio'
    },
    admin: {
      owner: 'inaxdevelopersAdmin',
      repo: 'inaxdevelopersAdmin/portfolio'
    }
  };

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.preset;
      if (presets[key]) {
        document.getElementById('ghRepo').value = presets[key].repo;
        markDirty();
      }
    });
  });
}

function initStorage() {
  const savedToken = localStorage.getItem('paresh_gh_token');
  const savedRepo = localStorage.getItem('paresh_gh_repo');
  const savedBranch = localStorage.getItem('paresh_gh_branch');
  const savedFile = localStorage.getItem('paresh_gh_file');

  if (savedToken) {
    document.getElementById('ghToken').value = savedToken;
    document.getElementById('rememberToken').checked = true;
  }
  if (savedRepo) document.getElementById('ghRepo').value = savedRepo;
  if (savedBranch) document.getElementById('ghBranch').value = savedBranch;
  if (savedFile) document.getElementById('ghFile').value = savedFile;
}

function saveConfigToStorage() {
  const remember = document.getElementById('rememberToken').checked;
  const token = document.getElementById('ghToken').value.trim();
  const repo = document.getElementById('ghRepo').value.trim();
  const branch = document.getElementById('ghBranch').value.trim();
  const file = document.getElementById('ghFile').value.trim();

  if (remember && token) {
    localStorage.setItem('paresh_gh_token', token);
  } else {
    localStorage.removeItem('paresh_gh_token');
  }
  localStorage.setItem('paresh_gh_repo', repo);
  localStorage.setItem('paresh_gh_branch', branch);
  localStorage.setItem('paresh_gh_file', file);
}

// ===== TABS SYSTEM =====
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      switchTab(target);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tabId}`));
  
  if (tabId === 'raw') {
    updateRawJsonView();
  }
}

// ===== LOAD PROFILE DATA =====
async function loadLocalProfile() {
  setLoadingState(true, 'Loading local profile.json...');
  try {
    const res = await fetch('profile.json?v=' + Date.now());
    if (!res.ok) throw new Error('Could not fetch local profile.json');
    profileData = await res.json();
    populateForm(profileData);
    setStatus('Synced with local profile.json', 'synced');
    showToast('Loaded local profile.json successfully', 'info');
  } catch (err) {
    console.warn('Fallback to default schema', err);
    profileData = JSON.parse(JSON.stringify(DEFAULT_SCHEMA));
    populateForm(profileData);
    setStatus('Using default schema template', 'unsaved');
  } finally {
    setLoadingState(false);
  }
}

async function loadFromGitHub() {
  const token = document.getElementById('ghToken').value.trim();
  const repo = document.getElementById('ghRepo').value.trim();
  const branch = document.getElementById('ghBranch').value.trim() || 'main';
  const filePath = document.getElementById('ghFile').value.trim() || 'profile.json';

  if (!token) {
    showToast('Please enter your GitHub Personal Access Token', 'error');
    document.getElementById('ghToken').focus();
    return;
  }
  if (!repo || !repo.includes('/')) {
    showToast('Please specify repo in owner/repo format (e.g. INAxDeveloper/portfolio)', 'error');
    document.getElementById('ghRepo').focus();
    return;
  }

  saveConfigToStorage();
  setLoadingState(true, 'Fetching profile from GitHub repository...');

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
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.message || `GitHub HTTP ${res.status}`);
    }

    const data = await res.json();
    currentSha = data.sha;
    const decodedJson = base64ToUtf8(data.content.replace(/\s/g, ''));
    profileData = JSON.parse(decodedJson);
    populateForm(profileData);

    setStatus(`Synced with GitHub (${repo}@${branch})`, 'synced');
    showToast(`✅ Successfully pulled from GitHub! (SHA: ${currentSha.slice(0, 7)})`, 'success');
  } catch (err) {
    console.error('GitHub Load Error:', err);
    setStatus(`GitHub error: ${err.message}`, 'error');
    showToast(`❌ Failed to load from GitHub: ${err.message}`, 'error');
  } finally {
    setLoadingState(false);
  }
}

// ===== POPULATE FORM =====
function populateForm(data) {
  if (!data) return;

  // Tab 1: Profile & Bio
  document.getElementById('f_name').value = data.name || '';
  document.getElementById('f_tagline').value = data.tagline || '';
  document.getElementById('f_bio').value = data.bio || '';
  document.getElementById('f_available').checked = data.available !== false;
  document.getElementById('f_address').value = data.address || '';
  document.getElementById('f_email').value = data.email || '';
  document.getElementById('f_phone').value = data.phone || '';
  document.getElementById('f_githubUsername').value = data.githubUsername || '';
  document.getElementById('f_footerText').value = data.footerText || '';

  // Stats
  const stats = data.stats || { projects: 15, years: 3, apps: 10 };
  document.getElementById('f_stat_projects').value = stats.projects ?? 15;
  document.getElementById('f_stat_years').value = stats.years ?? 3;
  document.getElementById('f_stat_apps').value = stats.apps ?? 10;

  // Tech Pills
  renderTechPills(data.techPills || []);

  // Skills
  renderSkillsEditor(data.skills || []);

  // Experience
  renderExperienceEditor(data.experience || []);

  // Education
  renderEducationEditor(data.education || []);

  // Projects
  renderProjectsEditor(data.projects || []);

  // Socials
  renderSocialsEditor(data.socialLinks || []);

  // Apps
  renderAppsEditor(data.appLinks || []);

  isDirty = false;
  updateDirtyState();
}

// ===== COLLECT DATA FROM FORM =====
function collectFormData() {
  const data = {
    name: document.getElementById('f_name').value.trim(),
    tagline: document.getElementById('f_tagline').value.trim(),
    bio: document.getElementById('f_bio').value.trim(),
    available: document.getElementById('f_available').checked,
    address: document.getElementById('f_address').value.trim(),
    email: document.getElementById('f_email').value.trim(),
    phone: document.getElementById('f_phone').value.trim(),
    stats: {
      projects: parseInt(document.getElementById('f_stat_projects').value, 10) || 0,
      years: parseInt(document.getElementById('f_stat_years').value, 10) || 0,
      apps: parseInt(document.getElementById('f_stat_apps').value, 10) || 0
    },
    skills: collectSkillsData(),
    techPills: collectTechPillsData(),
    education: collectEducationData(),
    experience: collectExperienceData(),
    projects: collectProjectsData(),
    socialLinks: collectSocialsData(),
    appLinks: collectAppsData(),
    githubUsername: document.getElementById('f_githubUsername').value.trim(),
    footerText: document.getElementById('f_footerText').value.trim()
  };
  return data;
}

// ===== SKILLS EDITOR =====
function renderSkillsEditor(skills) {
  const container = document.getElementById('skillsCategoriesContainer');
  container.innerHTML = '';

  skills.forEach((cat, catIdx) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.catIdx = catIdx;

    card.innerHTML = `
      <div class="item-card-header">
        <div class="item-card-title">
          <span>📁</span>
          <input type="text" class="form-control cat-title-input" value="${escapeHtml(cat.category)}" placeholder="Category Name (e.g. Android Development)" style="width: auto; min-width: 250px; font-weight:700;">
        </div>
        <div class="item-card-tools">
          <button type="button" class="btn btn-secondary btn-sm" onclick="addSkillItem(${catIdx})">+ Add Skill</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="removeSkillCategory(${catIdx})">Delete Category</button>
        </div>
      </div>
      <div class="skills-list" id="skillsList-${catIdx}">
        ${(cat.items || []).map((item, itemIdx) => `
          <div class="skill-row" data-item-idx="${itemIdx}">
            <input type="text" class="form-control skill-name-input" value="${escapeHtml(item.name)}" placeholder="Skill (e.g. Kotlin)">
            <div class="skill-range-wrap">
              <input type="range" min="10" max="100" value="${item.level}" step="1" oninput="updateSkillBadge(this)">
              <span class="skill-level-badge">${item.level}%</span>
            </div>
            <button type="button" class="btn btn-danger btn-sm btn-icon" onclick="removeSkillItem(${catIdx}, ${itemIdx})" title="Remove skill">✕</button>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(card);
  });
}

function updateSkillBadge(slider) {
  const badge = slider.nextElementSibling;
  badge.textContent = slider.value + '%';
  markDirty();
}

function addSkillCategory() {
  const current = collectSkillsData();
  current.push({
    category: "New Category",
    items: [{ name: "Skill Name", level: 80 }]
  });
  renderSkillsEditor(current);
  markDirty();
}

function removeSkillCategory(catIdx) {
  const current = collectSkillsData();
  current.splice(catIdx, 1);
  renderSkillsEditor(current);
  markDirty();
}

function addSkillItem(catIdx) {
  const current = collectSkillsData();
  if (current[catIdx]) {
    current[catIdx].items.push({ name: "", level: 80 });
    renderSkillsEditor(current);
    markDirty();
  }
}

function removeSkillItem(catIdx, itemIdx) {
  const current = collectSkillsData();
  if (current[catIdx] && current[catIdx].items) {
    current[catIdx].items.splice(itemIdx, 1);
    renderSkillsEditor(current);
    markDirty();
  }
}

function collectSkillsData() {
  const categories = [];
  const container = document.getElementById('skillsCategoriesContainer');
  container.querySelectorAll('.item-card').forEach(card => {
    const titleInput = card.querySelector('.cat-title-input');
    const catName = titleInput ? titleInput.value.trim() : 'Category';
    const items = [];
    card.querySelectorAll('.skill-row').forEach(row => {
      const nameInput = row.querySelector('.skill-name-input');
      const rangeInput = row.querySelector('input[type="range"]');
      if (nameInput && nameInput.value.trim()) {
        items.push({
          name: nameInput.value.trim(),
          level: parseInt(rangeInput.value, 10) || 80
        });
      }
    });
    categories.push({ category: catName, items });
  });
  return categories;
}

// ===== TECH PILLS MANAGER =====
let currentTechPills = [];

function renderTechPills(pills) {
  currentTechPills = [...pills];
  const container = document.getElementById('techPillsContainer');
  container.innerHTML = '';

  currentTechPills.forEach((pill, idx) => {
    const el = document.createElement('span');
    el.className = 'tag-pill';
    el.innerHTML = `
      ${escapeHtml(pill)}
      <button type="button" class="tag-pill-remove" onclick="removeTechPill(${idx})" title="Remove">✕</button>
    `;
    container.appendChild(el);
  });
}

function addTechPill() {
  const input = document.getElementById('newTechPillInput');
  const val = input.value.trim();
  if (!val) return;
  if (!currentTechPills.includes(val)) {
    currentTechPills.push(val);
    renderTechPills(currentTechPills);
    markDirty();
  }
  input.value = '';
}

function removeTechPill(idx) {
  currentTechPills.splice(idx, 1);
  renderTechPills(currentTechPills);
  markDirty();
}

function collectTechPillsData() {
  return currentTechPills;
}

// ===== EXPERIENCE EDITOR =====
function renderExperienceEditor(experiences) {
  const container = document.getElementById('experienceContainer');
  container.innerHTML = '';

  experiences.forEach((exp, idx) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.idx = idx;

    card.innerHTML = `
      <div class="item-card-header">
        <div class="item-card-title">
          <span>💼</span> <span>${escapeHtml(exp.role || 'Job Role')}</span>
        </div>
        <div class="item-card-tools">
          <button type="button" class="btn btn-secondary btn-sm" onclick="moveItem('exp', ${idx}, -1)" ${idx === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="moveItem('exp', ${idx}, 1)" ${idx === experiences.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="removeExperience(${idx})">Delete</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Period / Year</label>
          <input type="text" class="form-control exp-year" value="${escapeHtml(exp.year || '')}" placeholder="Jan 2024 - May 2025" onchange="markDirty()">
        </div>
        <div class="form-group">
          <label>Job Title / Role</label>
          <input type="text" class="form-control exp-role" value="${escapeHtml(exp.role || '')}" placeholder="Freelance Android Developer" onchange="markDirty()">
        </div>
        <div class="form-group">
          <label>Company / Organization</label>
          <input type="text" class="form-control exp-company" value="${escapeHtml(exp.company || '')}" placeholder="Self-Employed / Remote" onchange="markDirty()">
        </div>
      </div>
      <div class="form-group">
        <label>Description & Responsibilities</label>
        <textarea class="form-control exp-desc" rows="3" placeholder="Describe achievements, architecture, technologies used..." onchange="markDirty()">${escapeHtml(exp.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Tags / Tech Used (comma separated)</label>
        <input type="text" class="form-control exp-tags" value="${escapeHtml((exp.tags || []).join(', '))}" placeholder="Kotlin, Firebase, MVVM, Retrofit" onchange="markDirty()">
      </div>
    `;
    container.appendChild(card);
  });
}

function addExperience() {
  const current = collectExperienceData();
  current.unshift({
    year: "2024 - Present",
    role: "Android Developer",
    company: "Company Name",
    description: "Built scalable Android applications using Kotlin, MVVM, and REST APIs.",
    tags: ["Kotlin", "Android SDK", "MVVM"]
  });
  renderExperienceEditor(current);
  markDirty();
}

function removeExperience(idx) {
  const current = collectExperienceData();
  current.splice(idx, 1);
  renderExperienceEditor(current);
  markDirty();
}

function collectExperienceData() {
  const list = [];
  document.querySelectorAll('#experienceContainer .item-card').forEach(card => {
    list.push({
      year: card.querySelector('.exp-year').value.trim(),
      role: card.querySelector('.exp-role').value.trim(),
      company: card.querySelector('.exp-company').value.trim(),
      description: card.querySelector('.exp-desc').value.trim(),
      tags: card.querySelector('.exp-tags').value.split(',').map(s => s.trim()).filter(Boolean)
    });
  });
  return list;
}

// ===== EDUCATION EDITOR =====
function renderEducationEditor(educationList) {
  const container = document.getElementById('educationContainer');
  container.innerHTML = '';

  educationList.forEach((edu, idx) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.idx = idx;

    card.innerHTML = `
      <div class="item-card-header">
        <div class="item-card-title">
          <span>🎓</span> <span>${escapeHtml(edu.degree || 'Degree / Certificate')}</span>
        </div>
        <div class="item-card-tools">
          <button type="button" class="btn btn-secondary btn-sm" onclick="moveItem('edu', ${idx}, -1)" ${idx === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="moveItem('edu', ${idx}, 1)" ${idx === educationList.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="removeEducation(${idx})">Delete</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Years</label>
          <input type="text" class="form-control edu-year" value="${escapeHtml(edu.year || '')}" placeholder="2019 - 2023" onchange="markDirty()">
        </div>
        <div class="form-group">
          <label>Degree / Qualification</label>
          <input type="text" class="form-control edu-degree" value="${escapeHtml(edu.degree || '')}" placeholder="Bachelor of Computer Application (BCA)" onchange="markDirty()">
        </div>
        <div class="form-group">
          <label>Institution / University</label>
          <input type="text" class="form-control edu-institution" value="${escapeHtml(edu.institution || '')}" placeholder="Gujarat University" onchange="markDirty()">
        </div>
      </div>
      <div class="form-group">
        <label>Description & Studies</label>
        <textarea class="form-control edu-desc" rows="2" placeholder="Studied computer science, data structures, mobile dev..." onchange="markDirty()">${escapeHtml(edu.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Tags (comma separated)</label>
        <input type="text" class="form-control edu-tags" value="${escapeHtml((edu.tags || []).join(', '))}" placeholder="BCA, Computer Science" onchange="markDirty()">
      </div>
    `;
    container.appendChild(card);
  });
}

function addEducation() {
  const current = collectEducationData();
  current.push({
    year: "2019 - 2023",
    degree: "Degree / Course Name",
    institution: "University / Institute Name",
    description: "Key studies, projects, and specializations.",
    tags: ["BCA", "Computer Science"]
  });
  renderEducationEditor(current);
  markDirty();
}

function removeEducation(idx) {
  const current = collectEducationData();
  current.splice(idx, 1);
  renderEducationEditor(current);
  markDirty();
}

function collectEducationData() {
  const list = [];
  document.querySelectorAll('#educationContainer .item-card').forEach(card => {
    list.push({
      year: card.querySelector('.edu-year').value.trim(),
      degree: card.querySelector('.edu-degree').value.trim(),
      institution: card.querySelector('.edu-institution').value.trim(),
      description: card.querySelector('.edu-desc').value.trim(),
      tags: card.querySelector('.edu-tags').value.split(',').map(s => s.trim()).filter(Boolean)
    });
  });
  return list;
}

// ===== PROJECTS EDITOR =====
const QUICK_EMOJIS = ['📱', '💬', '🛒', '📰', '⚡', '🤖', '🎮', '📊', '🛠️', '🔒', '🌐', '🎵'];

function renderProjectsEditor(projects) {
  const container = document.getElementById('projectsContainer');
  container.innerHTML = '';

  projects.forEach((proj, idx) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.idx = idx;

    card.innerHTML = `
      <div class="item-card-header">
        <div class="item-card-title">
          <span class="proj-header-icon">${proj.icon || '📱'}</span>
          <span>${escapeHtml(proj.name || 'Project Name')}</span>
          ${proj.featured ? '<span class="status-pill" style="color:var(--gold-bright);border-color:var(--gold-bright);font-size:0.75rem;">⭐ Featured</span>' : ''}
        </div>
        <div class="item-card-tools">
          <button type="button" class="btn btn-secondary btn-sm" onclick="moveItem('proj', ${idx}, -1)" ${idx === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="moveItem('proj', ${idx}, 1)" ${idx === projects.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="removeProject(${idx})">Delete</button>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group" style="max-width: 140px;">
          <label>Icon / Emoji</label>
          <input type="text" class="form-control proj-icon" value="${escapeHtml(proj.icon || '📱')}" style="font-size:1.3rem; text-align:center;" oninput="updateProjCardIcon(this); markDirty()">
          <div class="emoji-picker-row">
            ${QUICK_EMOJIS.slice(0, 5).map(e => `
              <button type="button" class="emoji-btn" onclick="setProjectEmoji(this, '${e}')">${e}</button>
            `).join('')}
          </div>
        </div>
        <div class="form-group" style="flex: 2;">
          <label>Project Name</label>
          <input type="text" class="form-control proj-name" value="${escapeHtml(proj.name || '')}" placeholder="Smart Expense Tracker" onchange="markDirty()">
        </div>
        <div class="form-group" style="display:flex; align-items:flex-end;">
          <div class="switch-group" style="width:100%;">
            <div class="switch-label-group">
              <strong>Featured Project</strong>
              <span>Highlight on portfolio</span>
            </div>
            <label class="switch">
              <input type="checkbox" class="proj-featured" ${proj.featured ? 'checked' : ''} onchange="markDirty()">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea class="form-control proj-desc" rows="2" placeholder="Explain the key features, architecture, and problem solved..." onchange="markDirty()">${escapeHtml(proj.description || '')}</textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Tech Stack Tags (comma separated)</label>
          <input type="text" class="form-control proj-tech" value="${escapeHtml((proj.tech || []).join(', '))}" placeholder="Kotlin, Firebase, MVVM, Room DB" onchange="markDirty()">
        </div>
        <div class="form-group">
          <label>GitHub Repository URL</label>
          <input type="url" class="form-control proj-github" value="${escapeHtml(proj.github || '')}" placeholder="https://github.com/INAxDeveloper/my-app" onchange="markDirty()">
        </div>
        <div class="form-group">
          <label>Live Demo / Play Store URL (optional)</label>
          <input type="url" class="form-control proj-live" value="${escapeHtml(proj.live || '')}" placeholder="https://play.google.com/store/apps/details?id=..." onchange="markDirty()">
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function setProjectEmoji(btn, emoji) {
  const card = btn.closest('.item-card');
  const input = card.querySelector('.proj-icon');
  input.value = emoji;
  updateProjCardIcon(input);
  markDirty();
}

function updateProjCardIcon(input) {
  const card = input.closest('.item-card');
  const headerIcon = card.querySelector('.proj-header-icon');
  if (headerIcon) headerIcon.textContent = input.value || '📱';
}

function addProject() {
  const current = collectProjectsData();
  current.unshift({
    icon: "📱",
    name: "New Android Project",
    description: "An innovative Android mobile app built with Kotlin, MVVM architecture, and Firebase backend.",
    tech: ["Kotlin", "Firebase", "MVVM"],
    github: "https://github.com/INAxDeveloper",
    live: "",
    featured: false
  });
  renderProjectsEditor(current);
  markDirty();
}

function removeProject(idx) {
  const current = collectProjectsData();
  current.splice(idx, 1);
  renderProjectsEditor(current);
  markDirty();
}

function collectProjectsData() {
  const list = [];
  document.querySelectorAll('#projectsContainer .item-card').forEach(card => {
    list.push({
      icon: card.querySelector('.proj-icon').value.trim() || '📱',
      name: card.querySelector('.proj-name').value.trim(),
      description: card.querySelector('.proj-desc').value.trim(),
      tech: card.querySelector('.proj-tech').value.split(',').map(s => s.trim()).filter(Boolean),
      github: card.querySelector('.proj-github').value.trim(),
      live: card.querySelector('.proj-live').value.trim(),
      featured: card.querySelector('.proj-featured').checked
    });
  });
  return list;
}

// ===== SOCIAL LINKS EDITOR =====
const PLATFORM_ICONS = {
  GitHub: 'github',
  LinkedIn: 'linkedin',
  Email: 'email',
  Twitter: 'twitter',
  Instagram: 'instagram',
  YouTube: 'youtube'
};

function renderSocialsEditor(socials) {
  const container = document.getElementById('socialsContainer');
  container.innerHTML = '';

  socials.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.idx = idx;

    card.innerHTML = `
      <div class="item-card-header">
        <div class="item-card-title">
          <span>🌐</span> <span>${escapeHtml(item.platform || 'Social Platform')}</span>
        </div>
        <div class="item-card-tools">
          <button type="button" class="btn btn-danger btn-sm" onclick="removeSocial(${idx})">Delete</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Platform Name</label>
          <input type="text" class="form-control soc-platform" value="${escapeHtml(item.platform || '')}" placeholder="GitHub" onchange="autoFillIcon(this); markDirty()">
        </div>
        <div class="form-group">
          <label>Handle / Display Text</label>
          <input type="text" class="form-control soc-handle" value="${escapeHtml(item.handle || '')}" placeholder="@INAxDeveloper" onchange="markDirty()">
        </div>
        <div class="form-group">
          <label>Full Profile / Contact URL</label>
          <input type="text" class="form-control soc-url" value="${escapeHtml(item.url || '')}" placeholder="https://github.com/INAxDeveloper" onchange="markDirty()">
        </div>
        <div class="form-group" style="max-width: 130px;">
          <label>Icon Key</label>
          <input type="text" class="form-control soc-icon" value="${escapeHtml(item.icon || 'github')}" placeholder="github" onchange="markDirty()">
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function autoFillIcon(input) {
  const card = input.closest('.item-card');
  const iconInput = card.querySelector('.soc-icon');
  const val = input.value.trim();
  if (PLATFORM_ICONS[val]) {
    iconInput.value = PLATFORM_ICONS[val];
  } else {
    iconInput.value = val.toLowerCase();
  }
}

function addSocial() {
  const current = collectSocialsData();
  current.push({
    platform: "GitHub",
    handle: "@INAxDeveloper",
    url: "https://github.com/INAxDeveloper",
    icon: "github"
  });
  renderSocialsEditor(current);
  markDirty();
}

function removeSocial(idx) {
  const current = collectSocialsData();
  current.splice(idx, 1);
  renderSocialsEditor(current);
  markDirty();
}

function collectSocialsData() {
  const list = [];
  document.querySelectorAll('#socialsContainer .item-card').forEach(card => {
    list.push({
      platform: card.querySelector('.soc-platform').value.trim(),
      handle: card.querySelector('.soc-handle').value.trim(),
      url: card.querySelector('.soc-url').value.trim(),
      icon: card.querySelector('.soc-icon').value.trim()
    });
  });
  return list;
}

// ===== APP LINKS EDITOR =====
function renderAppsEditor(apps) {
  const container = document.getElementById('appsContainer');
  container.innerHTML = '';

  apps.forEach((app, idx) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.idx = idx;

    card.innerHTML = `
      <div class="item-card-header">
        <div class="item-card-title">
          <span>📱</span> <span>${escapeHtml(app.name || 'App Link')}</span>
        </div>
        <div class="item-card-tools">
          <button type="button" class="btn btn-danger btn-sm" onclick="removeApp(${idx})">Delete</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>App Name</label>
          <input type="text" class="form-control app-name" value="${escapeHtml(app.name || '')}" placeholder="Expense Tracker" onchange="markDirty()">
        </div>
        <div class="form-group">
          <label>Store Name</label>
          <select class="form-control app-store" onchange="markDirty()">
            <option value="Play Store" ${app.store === 'Play Store' ? 'selected' : ''}>Google Play Store</option>
            <option value="App Store" ${app.store === 'App Store' ? 'selected' : ''}>Apple App Store</option>
            <option value="Direct APK" ${app.store === 'Direct APK' ? 'selected' : ''}>Direct APK Download</option>
          </select>
        </div>
        <div class="form-group" style="flex:2;">
          <label>Store URL</label>
          <input type="url" class="form-control app-url" value="${escapeHtml(app.url || '')}" placeholder="https://play.google.com/store/apps/details?id=..." onchange="markDirty()">
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function addApp() {
  const current = collectAppsData();
  current.push({
    name: "My Android App",
    store: "Play Store",
    url: "https://play.google.com/store"
  });
  renderAppsEditor(current);
  markDirty();
}

function removeApp(idx) {
  const current = collectAppsData();
  current.splice(idx, 1);
  renderAppsEditor(current);
  markDirty();
}

function collectAppsData() {
  const list = [];
  document.querySelectorAll('#appsContainer .item-card').forEach(card => {
    list.push({
      name: card.querySelector('.app-name').value.trim(),
      store: card.querySelector('.app-store').value.trim(),
      url: card.querySelector('.app-url').value.trim()
    });
  });
  return list;
}

// ===== REORDER HELPER =====
function moveItem(type, idx, direction) {
  let list = [];
  let renderer = null;

  if (type === 'exp') {
    list = collectExperienceData();
    renderer = renderExperienceEditor;
  } else if (type === 'edu') {
    list = collectEducationData();
    renderer = renderEducationEditor;
  } else if (type === 'proj') {
    list = collectProjectsData();
    renderer = renderProjectsEditor;
  }

  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= list.length) return;

  const temp = list[idx];
  list[idx] = list[targetIdx];
  list[targetIdx] = temp;

  renderer(list);
  markDirty();
}

// ===== RAW JSON TAB =====
function updateRawJsonView() {
  const data = collectFormData();
  const editor = document.getElementById('rawJsonEditor');
  editor.value = JSON.stringify(data, null, 2);
}

function copyRawJson() {
  const editor = document.getElementById('rawJsonEditor');
  navigator.clipboard.writeText(editor.value).then(() => {
    showToast('Copied JSON to clipboard! 📋', 'success');
  }).catch(() => {
    editor.select();
    document.execCommand('copy');
    showToast('Copied JSON to clipboard! 📋', 'success');
  });
}

function applyRawJson() {
  const raw = document.getElementById('rawJsonEditor').value.trim();
  try {
    const parsed = JSON.parse(raw);
    populateForm(parsed);
    showToast('Applied raw JSON to form controls!', 'success');
    switchTab('profile');
    markDirty();
  } catch (err) {
    showToast(`Invalid JSON: ${err.message}`, 'error');
  }
}

// ===== DOWNLOAD JSON =====
function downloadJson() {
  const data = collectFormData();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'profile.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Downloaded profile.json!', 'info');
}

// ===== PREVIEW IN PORTFOLIO =====
function previewPortfolio() {
  const data = collectFormData();
  localStorage.setItem('paresh_portfolio_preview', JSON.stringify(data));
  showToast('Draft saved to preview! Opening portfolio in new tab...', 'info');
  window.open('index.html', '_blank');
}

// ===== PUSH TO GITHUB MODAL & EXECUTION =====
function openPushModal() {
  const token = document.getElementById('ghToken').value.trim();
  const repo = document.getElementById('ghRepo').value.trim();

  if (!token) {
    showToast('Please enter your GitHub Access Token first', 'error');
    document.getElementById('ghToken').focus();
    return;
  }
  if (!repo || !repo.includes('/')) {
    showToast('Please enter a valid GitHub repository (e.g. INAxDeveloper/portfolio)', 'error');
    document.getElementById('ghRepo').focus();
    return;
  }

  saveConfigToStorage();
  const commitMsgInput = document.getElementById('commitMsgInput');
  commitMsgInput.value = `Update profile.json via Visual Admin Studio [${new Date().toLocaleDateString()}]`;

  document.getElementById('pushConfirmRepo').textContent = repo;
  document.getElementById('pushConfirmBranch').textContent = document.getElementById('ghBranch').value.trim() || 'main';
  document.getElementById('pushModal').classList.add('active');
}

function closePushModal() {
  document.getElementById('pushModal').classList.remove('active');
}

async function executePushToGitHub() {
  const token = document.getElementById('ghToken').value.trim();
  const repo = document.getElementById('ghRepo').value.trim();
  const branch = document.getElementById('ghBranch').value.trim() || 'main';
  const filePath = document.getElementById('ghFile').value.trim() || 'profile.json';
  const commitMsg = document.getElementById('commitMsgInput').value.trim() || 'Update profile.json via Admin Studio';

  const btn = document.getElementById('confirmPushBtn');
  btn.disabled = true;
  btn.textContent = 'Pushing to GitHub... ⏳';

  try {
    const freshData = collectFormData();
    const formattedJson = JSON.stringify(freshData, null, 2);
    const base64Content = utf8ToBase64(formattedJson);

    // Step 1: Ensure we have the latest SHA from the branch
    let sha = currentSha;
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (getRes.ok) {
      const existingFile = await getRes.json();
      sha = existingFile.sha;
    }

    // Step 2: PUT updated file to GitHub
    const putBody = {
      message: commitMsg,
      content: base64Content,
      branch: branch
    };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      throw new Error(errData.message || `GitHub error ${putRes.status}`);
    }

    const result = await putRes.json();
    currentSha = result.content ? result.content.sha : (result.commit ? result.commit.sha : null);
    isDirty = false;
    updateDirtyState();

    closePushModal();
    setStatus(`Pushed to ${repo}@${branch}`, 'synced');
    showToast(`🎉 Changes successfully pushed to GitHub repository!`, 'success');

  } catch (err) {
    console.error('Push Error:', err);
    showToast(`❌ Push failed: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirm & Push to GitHub 🚀';
  }
}

// ===== DIRTY & STATUS MANAGERS =====
function markDirty() {
  isDirty = true;
  updateDirtyState();
}

function updateDirtyState() {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  if (isDirty) {
    dot.className = 'status-dot unsaved';
    text.textContent = 'Unsaved changes';
  }
}

function setStatus(text, type = 'synced') {
  const dot = document.getElementById('statusDot');
  const textEl = document.getElementById('statusText');
  dot.className = `status-dot ${type}`;
  textEl.textContent = text;
}

function setLoadingState(loading, message = 'Loading...') {
  const overlay = document.getElementById('loadingOverlay');
  const text = document.getElementById('loadingText');
  if (overlay) {
    overlay.style.display = loading ? 'flex' : 'none';
    if (text) text.textContent = message;
  }
}

// ===== TOKEN VISIBILITY & HELP =====
function toggleTokenVisibility() {
  const input = document.getElementById('ghToken');
  const btn = document.getElementById('tokenToggleBtn');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

function toggleTokenHelp() {
  const box = document.getElementById('tokenHelpBox');
  box.classList.toggle('show');
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><div>${escapeHtml(message)}</div>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ===== UTILS =====
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}
