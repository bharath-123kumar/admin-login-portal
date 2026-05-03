const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const captchas = { login: '', signup: '', forgot: '' };
let editingId = null;

// Helpers for JWT
const setToken = (token) => localStorage.setItem('token', token);
const getToken = () => localStorage.getItem('token');
const removeToken = () => localStorage.removeItem('token');
const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));
const getUser = () => JSON.parse(localStorage.getItem('user'));

function generateCaptcha(type) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    captchas[type] = code;
    const el = document.getElementById(type + 'CaptchaText');
    if (el) el.textContent = code;
}

generateCaptcha('login');
generateCaptcha('signup');
generateCaptcha('forgot');

// ===== PAGE NAVIGATION =====
window.showPage = function(pageId) {
    document.querySelectorAll('.form-page').forEach(p => p.classList.remove('active'));
    setTimeout(() => {
        const el = document.getElementById(pageId);
        if (el) el.classList.add('active');
    }, 50);
    document.querySelectorAll('.error-msg').forEach(e => e.classList.remove('show'));
    document.querySelectorAll('input').forEach(i => i.classList.remove('error'));
}

window.togglePass = function(inputId, btn) {
    const input = document.getElementById(inputId);
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.innerHTML = isPass
        ? '<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
}

// ===== HELPERS =====
function showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    if (msg) {
        const span = el.querySelector('span');
        if (span) span.textContent = msg;
    }
    el.classList.add('show');
}

function clearAllErrors(formId) {
    document.querySelectorAll('#' + formId + ' .error-msg').forEach(e => e.classList.remove('show'));
    document.querySelectorAll('#' + formId + ' input').forEach(i => i.classList.remove('error'));
}

function shakeForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 400);
}

function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

function showToast(msg) {
    const toastMsg = document.getElementById('toastMsg');
    const toast = document.getElementById('toast');
    if (toastMsg) toastMsg.textContent = msg;
    if (toast) toast.classList.add('show');
    setTimeout(() => { if (toast) toast.classList.remove('show'); }, 3000);
}

window.checkStrength = function(val) {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const labels = ['', 'Weak', 'Medium', 'Strong', 'Very Strong'];
    const classes = ['', 'weak', 'medium', 'strong', 'very-strong'];
    for (let i = 1; i <= 4; i++) {
        const bar = document.getElementById('str' + i);
        if (!bar) continue;
        bar.className = 'strength-bar';
        if (i <= score) bar.classList.add(classes[score]);
    }
    const label = document.getElementById('strengthLabel');
    if (label) label.textContent = val.length > 0 ? labels[score] : '';
}

// ===== AUTH HANDLERS =====

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearAllErrors('loginForm');
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const captchaInput = document.getElementById('loginCaptchaInput').value.trim();

    let valid = true;
    if (!email || !isValidEmail(email)) { showError('loginEmailErr'); document.getElementById('loginEmail').classList.add('error'); valid = false; }
    if (!password) { showError('loginPasswordErr', 'Please enter your password'); document.getElementById('loginPassword').classList.add('error'); valid = false; }
    if (!captchaInput) { showError('loginCaptchaErr', 'Please enter the captcha code'); valid = false; }
    else if (captchaInput !== captchas.login) { showError('loginCaptchaErr', 'Captcha does not match.'); valid = false; generateCaptcha('login'); }

    if (!valid) { shakeForm('loginForm'); return; }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            setToken(data.token);
            setUser(data.user);
            showToast('Login successful! Redirecting...');
            setTimeout(() => showDashboard(), 1200);
        } else {
            showToast(data.error || 'Invalid email or password');
            shakeForm('loginForm');
            generateCaptcha('login');
        }
    } catch (err) {
        showToast('Connection error. Please try again.');
    }
});

document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearAllErrors('signupForm');

    const full_name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirm_password = document.getElementById('signupConfirmPassword').value.trim();
    const captchaInput = document.getElementById('signupCaptchaInput').value.trim();

    let valid = true;
    if (!full_name) { showError('signupNameErr'); document.getElementById('signupName').classList.add('error'); valid = false; }
    if (!email || !isValidEmail(email)) { showError('signupEmailErr'); document.getElementById('signupEmail').classList.add('error'); valid = false; }
    if (!password || password.length < 8) { showError('signupPasswordErr'); document.getElementById('signupPassword').classList.add('error'); valid = false; }
    if (!confirm_password || password !== confirm_password) { showError('signupConfirmPasswordErr'); document.getElementById('signupConfirmPassword').classList.add('error'); valid = false; }
    if (!captchaInput) { showError('signupCaptchaErr', 'Please enter the captcha code'); valid = false; }
    else if (captchaInput !== captchas.signup) { showError('signupCaptchaErr', 'Captcha does not match.'); valid = false; generateCaptcha('signup'); }

    if (!valid) { shakeForm('signupForm'); return; }

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name, email, password, confirm_password })
        });

        const data = await response.json();
        if (response.ok) {
            showToast('Account created successfully!');
            generateCaptcha('signup');
            this.reset();
            setTimeout(() => showPage('loginPage'), 1500);
        } else {
            showToast(data.error || 'Signup failed');
            shakeForm('signupForm');
        }
    } catch (err) {
        showToast('Connection error.');
    }
});

document.getElementById('forgotForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearAllErrors('forgotForm');

    const email = document.getElementById('forgotEmail').value.trim();
    const captchaInput = document.getElementById('forgotCaptchaInput').value.trim();

    if (!email || !isValidEmail(email)) { showError('forgotEmailErr'); document.getElementById('forgotEmail').classList.add('error'); return; }
    if (!captchaInput) { showError('forgotCaptchaErr', 'Please enter captcha'); return; }
    if (captchaInput !== captchas.forgot) { showError('forgotCaptchaErr', 'Captcha error'); generateCaptcha('forgot'); return; }

    try {
        const response = await fetch(`${API_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (response.ok) {
            showToast('Reset link generated (Check backend console)');
            this.reset();
            generateCaptcha('forgot');
        }
    } catch (err) {
        showToast('Error sending reset request');
    }
});

// ===== DASHBOARD =====

function showDashboard() {
    const user = getUser();
    if (!user) return showPage('loginPage');

    document.getElementById('authWrapper').style.display = 'none';
    document.getElementById('dashboardWrapper').classList.add('active');
    document.body.style.alignItems = 'stretch';

    document.getElementById('dashName').textContent = user.full_name;
    document.getElementById('dashAvatar').textContent = user.full_name.substring(0, 2).toUpperCase();

    loadOpportunities();
}

window.handleLogout = function() {
    removeToken();
    localStorage.removeItem('user');
    location.reload();
}

// ===== OPPORTUNITIES =====

async function loadOpportunities() {
    const grid = document.getElementById('opportunitiesGrid');
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/opportunities`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (response.status === 401) return handleLogout();
        
        const opportunities = await response.json();
        
        // Clear except empty state
        const emptyState = document.getElementById('emptyState');
        grid.innerHTML = '';
        if (emptyState) grid.appendChild(emptyState);

        if (opportunities.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            opportunities.forEach(op => {
                grid.appendChild(createOpportunityCard(op));
            });
        }
    } catch (err) {
        console.error('Failed to load opportunities');
    }
}

function createOpportunityCard(op) {
    const card = document.createElement('div');
    card.className = 'opportunity-card';
    const skills = op.skills.split(',').map(s => s.trim()).filter(Boolean);

    card.innerHTML = `
        <div class="opportunity-card-header">
            <h5>${escapeHtml(op.name)}</h5>
            <div class="opportunity-meta">
                <span><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${escapeHtml(op.duration)}</span>
                <span><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${escapeHtml(op.start_date)}</span>
            </div>
        </div>
        <p class="opportunity-description">${escapeHtml(op.description)}</p>
        <div class="opportunity-skills">
            <div class="opportunity-skills-label">Skills You'll Gain</div>
            <div class="skills-tags">
                ${skills.map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}
            </div>
        </div>
        <div class="opportunity-footer">
            <span class="applicants-count">${op.max_applicants ? op.max_applicants + ' max' : 'Unlimited'} applicants</span>
            <div style="display: flex; gap: 8px;">
                <button class="view-course-btn" style="width: auto; padding: 8px 12px;" onclick="openOpportunityDetailsById(${op.id})">View</button>
                <button class="view-course-btn" style="width: auto; padding: 8px 12px; background: var(--qf-blue);" onclick="editOpportunity(${op.id})">Edit</button>
                <button class="view-course-btn" style="width: auto; padding: 8px 12px; background: #e74c3c;" onclick="deleteOpportunity(${op.id})">Delete</button>
            </div>
        </div>
    `;
    return card;
}

window.openOpportunityDetailsById = async function(id) {
    const response = await fetch(`${API_URL}/opportunities/${id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const op = await response.json();
    openOpportunityDetails(op.name, {
        duration: op.duration,
        startDate: op.start_date,
        description: op.description,
        skills: op.skills.split(','),
        applicants: op.max_applicants || 'Unlimited',
        futureOpportunities: op.future_opportunities,
        prerequisites: 'N/A'
    });
}

window.editOpportunity = async function(id) {
    const response = await fetch(`${API_URL}/opportunities/${id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const op = await response.json();
    
    editingId = id;
    document.getElementById('oppName').value = op.name;
    document.getElementById('oppDuration').value = op.duration;
    document.getElementById('oppStartDate').value = op.start_date;
    document.getElementById('oppDescription').value = op.description;
    document.getElementById('oppSkills').value = op.skills;
    document.getElementById('oppCategory').value = op.category;
    document.getElementById('oppFuture').value = op.future_opportunities;
    document.getElementById('oppMaxApplicants').value = op.max_applicants || '';
    
    openOpportunityModal();
}

window.deleteOpportunity = async function(id) {
    if (!confirm('Are you sure?')) return;
    await fetch(`${API_URL}/opportunities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    showToast('Deleted successfully');
    loadOpportunities();
}

document.getElementById('opportunityForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('oppName').value,
        duration: document.getElementById('oppDuration').value,
        start_date: document.getElementById('oppStartDate').value,
        description: document.getElementById('oppDescription').value,
        skills: document.getElementById('oppSkills').value,
        category: document.getElementById('oppCategory').value,
        future_opportunities: document.getElementById('oppFuture').value,
        max_applicants: document.getElementById('oppMaxApplicants').value || null
    };

    const url = editingId ? `${API_URL}/opportunities/${editingId}` : `${API_URL}/opportunities`;
    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method: method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        showToast(editingId ? 'Updated!' : 'Created!');
        closeOpportunityModal();
        this.reset();
        editingId = null;
        loadOpportunities();
    }
});

// ===== UI STUFF (TABS, MODALS ETC) =====

window.openOpportunityModal = function() { document.getElementById('opportunityModal').classList.add('active'); }
window.closeOpportunityModal = function() { 
    document.getElementById('opportunityModal').classList.remove('active'); 
    editingId = null;
}

window.openOpportunityDetails = function(title, details) {
    document.getElementById('opportunityDetailTitle').textContent = title;
    document.getElementById('opportunityDetailDuration').textContent = details.duration;
    document.getElementById('opportunityDetailStartDate').textContent = details.startDate;
    document.getElementById('opportunityDetailApplicants').textContent = details.applicants;
    document.getElementById('opportunityDetailDescription').textContent = details.description;
    document.getElementById('opportunityDetailFuture').textContent = details.futureOpportunities;
    const skillsContainer = document.getElementById('opportunityDetailSkills');
    skillsContainer.innerHTML = '';
    details.skills.forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.textContent = skill;
        skillsContainer.appendChild(tag);
    });
    document.getElementById('opportunityDetailsModal').classList.add('active');
}

window.closeOpportunityDetailsModal = function() { document.getElementById('opportunityDetailsModal').classList.remove('active'); }

// Sidebar nav
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', function() {
        const page = this.getAttribute('data-page');
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
        const section = document.getElementById(page + 'Section');
        if (section) section.classList.add('active');
        document.getElementById('pageTitle').textContent = this.textContent.trim();
        if (page === 'opportunity') loadOpportunities();
    });
});

// Initial check
if (getToken()) showDashboard();

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ... other UI handlers (notifications, theme, search) omitted for brevity but they follow the same patterns ...
window.toggleTheme = function() { document.documentElement.getAttribute('data-theme') === 'dark' ? document.documentElement.setAttribute('data-theme', 'light') : document.documentElement.setAttribute('data-theme', 'dark'); }
window.openSearch = function() { document.getElementById('searchContainer').classList.add('active'); }
window.closeSearch = function() { document.getElementById('searchContainer').classList.remove('active'); }
window.toggleNotifications = function() { document.getElementById('notificationDropdown').classList.toggle('active'); }
