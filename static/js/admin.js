const captchas = { login: '', signup: '', forgot: '' };
let editingId = null;

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
function showPage(pageId) {
    document.querySelectorAll('.form-page').forEach(p => p.classList.remove('active'));
    setTimeout(() => {
        const el = document.getElementById(pageId);
        if (el) el.classList.add('active');
    }, 50);
    document.querySelectorAll('.error-msg').forEach(e => e.classList.remove('show'));
    document.querySelectorAll('input').forEach(i => i.classList.remove('error'));
}

function togglePass(inputId, btn) {
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

function checkStrength(val) {
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

// ===== SHOW DASHBOARD =====
function showDashboard(user) {
    document.getElementById('authWrapper').style.display = 'none';
    document.getElementById('dashboardWrapper').classList.add('active');
    document.body.style.alignItems = 'stretch';

    // Personalize
    const displayName = user.full_name;
    document.getElementById('dashName').textContent = displayName;
    document.getElementById('dashAvatar').textContent = displayName.substring(0, 2).toUpperCase();

    // Show menu toggle on mobile
    if (window.innerWidth <= 768) {
        document.getElementById('menuToggle').style.display = 'flex';
    }

    // Load opportunities
    loadOpportunities();
}

async function handleLogout() {
    try {
        const response = await fetch('/api/logout');
        if (response.ok) {
            document.getElementById('dashboardWrapper').classList.remove('active');
            document.getElementById('authWrapper').style.display = 'flex';
            document.body.style.alignItems = '';
            showToast('Signed out successfully');
            showPage('loginPage');
        }
    } catch (err) {
        console.error('Logout failed', err);
    }
}

// ===== NAV ITEMS =====
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', function() {
        const page = this.getAttribute('data-page');
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');

        // Hide all sections
        document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));

        // Show selected section
        const sectionId = page + 'Section';
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
            const titles = {
                'dashboard': 'Dashboard',
                'learner': 'Learner Management',
                'verifier': 'Verifier Management',
                'collaborator': 'Collaborator Management',
                'opportunity': 'Opportunity Management',
                'reports': 'Reports and Analytics'
            };
            document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
            
            if (page === 'opportunity') {
                loadOpportunities();
            }
        }
    });
});

// ===== OPPORTUNITY MANAGEMENT =====

async function loadOpportunities() {
    const grid = document.getElementById('opportunitiesGrid');
    const emptyState = document.getElementById('emptyState');
    if (!grid) return;

    try {
        const response = await fetch('/api/opportunities');
        const opportunities = await response.json();

        // Clear existing cards (except empty state)
        Array.from(grid.children).forEach(child => {
            if (child.id !== 'emptyState') child.remove();
        });

        if (opportunities.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            opportunities.forEach(op => {
                const card = createOpportunityCard(op);
                grid.appendChild(card);
            });
        }
    } catch (err) {
        console.error('Failed to load opportunities', err);
    }
}

function createOpportunityCard(op) {
    const card = document.createElement('div');
    card.className = 'opportunity-card';
    card.dataset.id = op.id;

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
            <span class="applicants-count">${op.max_applicants ? op.max_applicants + ' max applicants' : 'Unlimited applicants'}</span>
            <div style="display: flex; gap: 8px;">
                <button class="view-course-btn" style="width: auto; padding: 8px 12px;" onclick="openOpportunityDetailsById(${op.id})">View</button>
                <button class="view-course-btn" style="width: auto; padding: 8px 12px; background: var(--qf-blue);" onclick="editOpportunity(${op.id})">Edit</button>
                <button class="view-course-btn" style="width: auto; padding: 8px 12px; background: #e74c3c;" onclick="deleteOpportunity(${op.id})">Delete</button>
            </div>
        </div>
    `;
    return card;
}

async function openOpportunityDetailsById(id) {
    try {
        const response = await fetch('/api/opportunities/' + id);
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
    } catch (err) {
        console.error('Failed to load details', err);
    }
}

async function editOpportunity(id) {
    try {
        const response = await fetch('/api/opportunities/' + id);
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
    } catch (err) {
        console.error('Failed to load opportunity for edit', err);
    }
}

async function deleteOpportunity(id) {
    if (!confirm('Are you sure you want to delete this opportunity? This action cannot be undone.')) return;

    try {
        const response = await fetch('/api/opportunities/' + id, { method: 'DELETE' });
        if (response.ok) {
            showToast('Opportunity deleted successfully');
            loadOpportunities();
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to delete');
        }
    } catch (err) {
        console.error('Delete failed', err);
    }
}

// Handle opportunity form submission
document.getElementById('opportunityForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const data = {
        name: document.getElementById('oppName').value.trim(),
        duration: document.getElementById('oppDuration').value.trim(),
        start_date: document.getElementById('oppStartDate').value,
        description: document.getElementById('oppDescription').value.trim(),
        skills: document.getElementById('oppSkills').value.trim(),
        category: document.getElementById('oppCategory').value,
        future_opportunities: document.getElementById('oppFuture').value.trim(),
        max_applicants: document.getElementById('oppMaxApplicants').value.trim() || null
    };

    if (!data.name || !data.duration || !data.start_date || !data.description || !data.skills || !data.category || !data.future_opportunities) {
        showToast('Please fill all required fields');
        return;
    }

    const url = editingId ? `/api/opportunities/${editingId}` : '/api/opportunities';
    const method = editingId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showToast(editingId ? 'Opportunity updated successfully!' : 'Opportunity created successfully!');
            closeOpportunityModal();
            this.reset();
            editingId = null;
            loadOpportunities();
        } else {
            const errData = await response.json();
            showToast(errData.error || 'Operation failed');
        }
    } catch (err) {
        console.error('Operation failed', err);
        showToast('An error occurred. Please try again.');
    }
});

// ===== AUTH HANDLERS =====

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearAllErrors('loginForm');
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const captchaInput = document.getElementById('loginCaptchaInput').value.trim();
    const remember = document.querySelector('.remember-me input').checked;

    let valid = true;
    if (!email || !isValidEmail(email)) { showError('loginEmailErr'); document.getElementById('loginEmail').classList.add('error'); valid = false; }
    if (!password) { showError('loginPasswordErr', 'Please enter your password'); document.getElementById('loginPassword').classList.add('error'); valid = false; }
    if (!captchaInput) { showError('loginCaptchaErr', 'Please enter the captcha code'); valid = false; }
    else if (captchaInput !== captchas.login) { showError('loginCaptchaErr', 'Captcha does not match.'); valid = false; generateCaptcha('login'); }

    if (!valid) { shakeForm('loginForm'); return; }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, remember })
        });

        const data = await response.json();
        if (response.ok) {
            showToast('Login successful! Redirecting...');
            setTimeout(() => showDashboard(data.user), 1200);
        } else {
            showToast(data.error || 'Invalid email or password');
            shakeForm('loginForm');
            generateCaptcha('login');
        }
    } catch (err) {
        console.error('Login failed', err);
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
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name, email, password, confirm_password })
        });

        const data = await response.json();
        if (response.ok) {
            showToast('Account created successfully!');
            generateCaptcha('signup');
            this.reset(); checkStrength('');
            setTimeout(() => showPage('loginPage'), 1500);
        } else {
            showToast(data.error || 'Signup failed');
            shakeForm('signupForm');
        }
    } catch (err) {
        console.error('Signup failed', err);
        showToast('Connection error. Please try again.');
    }
});

document.getElementById('forgotForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearAllErrors('forgotForm');

    const email = document.getElementById('forgotEmail').value.trim();
    const captchaInput = document.getElementById('forgotCaptchaInput').value.trim();

    let valid = true;
    if (!email || !isValidEmail(email)) { showError('forgotEmailErr'); document.getElementById('forgotEmail').classList.add('error'); valid = false; }
    if (!captchaInput) { showError('forgotCaptchaErr', 'Please enter the captcha code'); valid = false; }
    else if (captchaInput !== captchas.forgot) { showError('forgotCaptchaErr', 'Captcha does not match.'); valid = false; generateCaptcha('forgot'); }

    if (!valid) { shakeForm('forgotForm'); return; }

    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (response.ok) {
            showToast('Reset link sent to your email (check console)!');
            generateCaptcha('forgot');
            this.reset();
        }
    } catch (err) {
        console.error('Forgot password failed', err);
        showToast('Connection error.');
    }
});

// Small helper to avoid HTML injection
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ===== REST OF THE ORIGINAL UI LOGIC (TABS, THEME, ETC.) =====

function changeChartPeriod(period) {
    document.querySelectorAll('.tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === period) btn.classList.add('active');
    });
    const chartData = {
        daily: 'M0,120 Q50,110 100,90 T200,70 T300,50 T400,40',
        weekly: 'M0,110 Q50,95 100,85 T200,65 T300,45 T400,35',
        monthly: 'M0,100 Q50,85 100,75 T200,55 T300,40 T400,30',
        quarterly: 'M0,90 Q50,75 100,65 T200,50 T300,35 T400,25',
        yearly: 'M0,80 Q50,65 100,55 T200,40 T300,30 T400,20'
    };
    const linePath = document.getElementById('linePath');
    const lineArea = document.getElementById('lineArea');
    if (linePath && lineArea) {
        const path = chartData[period];
        linePath.setAttribute('d', path);
        lineArea.setAttribute('d', path + ' L400,150 L0,150 Z');
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.toggle('active');
}

function markAllRead() {
    document.querySelectorAll('.notif-item.unread').forEach(item => item.classList.remove('unread'));
    showToast('All notifications marked as read');
}

document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('notificationDropdown');
    const btn = document.getElementById('notifBtn');
    if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    const icon = document.getElementById('themeIcon');
    if (icon) {
        if (newTheme === 'dark') icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
        else icon.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
    }
}

function openSearch() {
    const el = document.getElementById('searchContainer');
    if (el) {
        el.classList.add('active');
        const input = document.getElementById('searchInput');
        if (input) input.focus();
    }
}

function closeSearch() {
    const el = document.getElementById('searchContainer');
    if (el) el.classList.remove('active');
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSearch();
        closeCourseModal();
        closeOpportunityModal();
        closeOpportunityDetailsModal();
        closeCollaboratorCoursesModal();
        closeQuickAddModal();
        closeBulkUploadModal();
        closeQuickAddVerifierModal();
        closeBulkUploadVerifierModal();
        closeVerifierDetailsModal();
    }
});

function openCourseDetails(courseName, stats) {
    document.getElementById('modalCourseTitle').textContent = courseName;
    document.getElementById('modalEnrolled').textContent = stats.enrolled;
    document.getElementById('modalCompleted').textContent = stats.completed;
    document.getElementById('modalInProgress').textContent = stats.inProgress;
    document.getElementById('modalHalfDone').textContent = stats.halfDone;
    document.getElementById('courseModal').classList.add('active');
}

function closeCourseModal() { document.getElementById('courseModal').classList.remove('active'); }

function openOpportunityDetails(title, details) {
    document.getElementById('opportunityDetailTitle').textContent = title;
    document.getElementById('opportunityDetailDuration').textContent = details.duration;
    document.getElementById('opportunityDetailStartDate').textContent = details.startDate;
    document.getElementById('opportunityDetailApplicants').textContent = details.applicants;
    document.getElementById('opportunityDetailDescription').textContent = details.description;
    document.getElementById('opportunityDetailFuture').textContent = details.futureOpportunities;
    document.getElementById('opportunityDetailPrereqs').textContent = details.prerequisites;
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

function closeOpportunityDetailsModal() { document.getElementById('opportunityDetailsModal').classList.remove('active'); }

function openOpportunityModal() { document.getElementById('opportunityModal').classList.add('active'); }
function closeOpportunityModal() { 
    document.getElementById('opportunityModal').classList.remove('active'); 
    editingId = null;
}

// ... the rest of the modal handlers are mostly simple UI toggles ...
function openQuickAddModal() { document.getElementById('quickAddModal').classList.add('active'); }
function closeQuickAddModal() { document.getElementById('quickAddModal').classList.remove('active'); }
function openBulkUploadModal() { document.getElementById('bulkUploadModal').classList.add('active'); }
function closeBulkUploadModal() { document.getElementById('bulkUploadModal').classList.remove('active'); }
function openQuickAddVerifierModal() { document.getElementById('quickAddVerifierModal').classList.add('active'); }
function closeQuickAddVerifierModal() { document.getElementById('quickAddVerifierModal').classList.remove('active'); }
function openBulkUploadVerifierModal() { document.getElementById('bulkUploadVerifierModal').classList.add('active'); }
function closeBulkUploadVerifierModal() { document.getElementById('bulkUploadVerifierModal').classList.remove('active'); }
function openVerifierDetailsModal() { document.getElementById('verifierDetailsModal').classList.add('active'); }
function closeVerifierDetailsModal() { document.getElementById('verifierDetailsModal').classList.remove('active'); }
function closeCollaboratorCoursesModal() { document.getElementById('collaboratorCoursesModal').classList.remove('active'); }

// Filters (Local for now as per assignment focus)
function filterStudents() {
    const statusFilter = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('#studentsTableBody tr');
    rows.forEach(row => {
        const rowStatus = row.getAttribute('data-status');
        row.style.display = (statusFilter === 'all' || rowStatus === statusFilter) ? '' : 'none';
    });
}
function filterVerifiers() {
    const statusFilter = document.getElementById('verifierStatusFilter').value;
    const rows = document.querySelectorAll('#verifiersTableBody tr');
    rows.forEach(row => {
        const rowStatus = row.getAttribute('data-status');
        row.style.display = (statusFilter === 'all' || rowStatus === statusFilter) ? '' : 'none';
    });
}

// Clear errors on input
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function() {
        this.classList.remove('error');
        const err = this.closest('.form-group')?.querySelector('.error-msg');
        if (err) err.classList.remove('show');
    });
});

window.addEventListener('resize', () => {
    const toggle = document.getElementById('menuToggle');
    if (toggle) toggle.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
});
