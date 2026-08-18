import { INITIAL_RESEARCH_DATA } from './data.js';

// --- Configuration & Auth Credentials ---
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'bksda@kaltim2026';

const STORAGE_KEY = 'UPT_RESEARCH_DATA_V1';
const THEME_KEY = 'UPT_THEME_PREF';
const AUTH_KEY = 'UPT_ADMIN_AUTH_V1';

// --- Application State ---
let researchData = [];
let currentMode = 'public'; // 'public' | 'admin'
let isAdminLoggedIn = sessionStorage.getItem(AUTH_KEY) === 'true';
let activeFilterTab = 'all';
let searchQuery = '';
let targetDeleteId = null;

// --- DOM Elements ---
const modeSwitcher = document.getElementById('modeSwitcher');
const btnPublicView = document.getElementById('btnPublicView');
const btnAdminView = document.getElementById('btnAdminView');
const btnAdminLogout = document.getElementById('btnAdminLogout');
const btnThemeToggle = document.getElementById('btnThemeToggle');
const iconTheme = document.getElementById('iconTheme');
const btnResetData = document.getElementById('btnResetData');

const welcomeTitle = document.getElementById('welcomeTitle');
const welcomeDesc = document.getElementById('welcomeDesc');
const modeBadge = document.getElementById('modeBadge');

const statTotal = document.getElementById('statTotal');
const statProposal = document.getElementById('statProposal');
const statHasil = document.getElementById('statHasil');
const statDocs = document.getElementById('statDocs');

const inputSearch = document.getElementById('inputSearch');
const filterTabs = document.getElementById('filterTabs');
const btnTambahData = document.getElementById('btnTambahData');

const researchTable = document.getElementById('researchTable');
const tableBody = document.getElementById('tableBody');
const thActions = document.getElementById('thActions');
const emptyState = document.getElementById('emptyState');

// Admin Login Modal Elements
const modalLogin = document.getElementById('modalLogin');
const formLoginAdmin = document.getElementById('formLoginAdmin');
const inputLoginUsername = document.getElementById('inputLoginUsername');
const inputLoginPassword = document.getElementById('inputLoginPassword');
const loginErrorAlert = document.getElementById('loginErrorAlert');
const btnCloseModalLogin = document.getElementById('btnCloseModalLogin');
const btnBatalLogin = document.getElementById('btnBatalLogin');
const btnAutoFillLogin = document.getElementById('btnAutoFillLogin');

// Modals & Toast
const modalForm = document.getElementById('modalForm');
const formPenelitian = document.getElementById('formPenelitian');
const modalFormTitle = document.getElementById('modalFormTitle');
const btnCloseModalForm = document.getElementById('btnCloseModalForm');
const btnBatalForm = document.getElementById('btnBatalForm');
const editRecordId = document.getElementById('editRecordId');

const modalDocViewer = document.getElementById('modalDocViewer');
const btnCloseDocViewer = document.getElementById('btnCloseDocViewer');
const btnCloseDocViewerFooter = document.getElementById('btnCloseDocViewerFooter');
const btnDownloadDoc = document.getElementById('btnDownloadDoc');

const modalDelete = document.getElementById('modalDelete');
const btnCloseModalDelete = document.getElementById('btnCloseModalDelete');
const btnBatalDelete = document.getElementById('btnBatalDelete');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');
const deleteTargetName = document.getElementById('deleteTargetName');

const toastNotification = document.getElementById('toastNotification');
const toastMessage = document.getElementById('toastMessage');

// --- Initialization ---
function initApp() {
  loadDataFromStorage();
  initTheme();
  setupEventListeners();
  renderApp();
}

// --- LocalStorage Helpers ---
function loadDataFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      researchData = JSON.parse(saved);
      // Migration & map GDrive URLs (preserve user edited namaMahasiswa)
      researchData = researchData.map(item => {
        const initialItem = INITIAL_RESEARCH_DATA.find(d => d.id === item.id);
        return {
          ...item,
          namaMahasiswa: item.namaMahasiswa !== undefined ? item.namaMahasiswa : '',
          tanggalPresentasiProposal: item.tanggalPresentasiProposal || item.tanggalPresentasi || (initialItem ? initialItem.tanggalPresentasiProposal : ''),
          tanggalPresentasiHasil: item.tanggalPresentasiHasil || '',
          dokumenProposal: item.dokumenProposal ? {
            ...item.dokumenProposal,
            url: item.dokumenProposal.url || (initialItem && initialItem.dokumenProposal ? initialItem.dokumenProposal.url : 'https://drive.google.com')
          } : null,
          dokumenHasil: item.dokumenHasil ? {
            ...item.dokumenHasil,
            url: item.dokumenHasil.url || (initialItem && initialItem.dokumenHasil ? initialItem.dokumenHasil.url : 'https://drive.google.com')
          } : null,
          statusProposal: item.statusProposal || (item.status === 'Done' || item.status === 'Selesai' ? 'Selesai' : 'Belum'),
          statusHasil: item.statusHasil || (item.status === 'Done' || item.status === 'Selesai' ? 'Selesai' : 'Belum'),
          tempatPenelitian: item.tempatPenelitian || item.bidangUpt || 'Seksi KSDA Wilayah II Tenggarong'
        };
      });
      if (researchData.length === 0 && INITIAL_RESEARCH_DATA.length > 0) {
        researchData = [...INITIAL_RESEARCH_DATA];
        saveDataToStorage();
      }
    } catch (e) {
      console.error("Gagal memuat data dari localStorage, memakai data default.", e);
      researchData = [...INITIAL_RESEARCH_DATA];
      saveDataToStorage();
    }
  } else {
    researchData = [...INITIAL_RESEARCH_DATA];
    saveDataToStorage();
  }
}

function saveDataToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(researchData));
}

// --- Theme Management ---
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
  updateThemeIcon(newTheme);
  showToast(`Mode tampilan diubah ke ${newTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}`);
}

function updateThemeIcon(theme) {
  if (theme === 'dark') {
    iconTheme.innerHTML = `<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/>`;
  } else {
    iconTheme.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
  }
}

// --- Toast Notification ---
let toastTimeout;
function showToast(msg) {
  toastMessage.textContent = msg;
  toastNotification.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastNotification.classList.remove('show');
  }, 3000);
}

// --- Render Core Function ---
function renderApp() {
  renderStats();
  renderTable();
}

function renderStats() {
  const total = researchData.length;
  const countPropSelesai = researchData.filter(d => d.statusProposal === 'Selesai').length;
  const countHasilSelesai = researchData.filter(d => d.statusHasil === 'Selesai').length;
  const docs = researchData.filter(d => d.dokumenHasil !== null).length;

  statTotal.textContent = total;
  statProposal.textContent = countPropSelesai;
  statHasil.textContent = countHasilSelesai;
  statDocs.textContent = docs;
}

function getFilteredData() {
  return researchData.filter(item => {
    // Filter status tab
    if (activeFilterTab === 'prop-selesai' && item.statusProposal !== 'Selesai') {
      return false;
    }
    if (activeFilterTab === 'hasil-selesai' && item.statusHasil !== 'Selesai') {
      return false;
    }
    if (activeFilterTab === 'belum' && (item.statusProposal !== 'Belum' && item.statusHasil !== 'Belum')) {
      return false;
    }

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchNama = item.namaMahasiswa.toLowerCase().includes(q);
      const matchJudul = item.judulPenelitian.toLowerCase().includes(q);
      const matchUniv = item.universitas.toLowerCase().includes(q);
      const matchTempat = (item.tempatPenelitian || '').toLowerCase().includes(q);
      return matchNama || matchJudul || matchUniv || matchTempat;
    }
    return true;
  });
}

function renderTable() {
  const filtered = getFilteredData();
  tableBody.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    researchTable.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  researchTable.style.display = 'table';

  filtered.forEach((item, index) => {
    const tr = document.createElement('tr');
    
    // Status Proposal Badge & Schedule
    const isPropSelesai = item.statusProposal === 'Selesai';
    const tglPropFormatted = formatDate(item.tanggalPresentasiProposal);
    const statusPropBadge = `
      <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
        <span class="status-badge ${isPropSelesai ? 'done' : 'belum'}">
          <span class="status-dot"></span>
          ${isPropSelesai ? 'Selesai' : 'Belum'}
        </span>
        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; white-space: nowrap;">
          ${tglPropFormatted ? `📅 ${tglPropFormatted}` : '<span style="opacity: 0.6;">Belum ada jadwal</span>'}
        </span>
      </div>
    `;

    // Status Hasil Badge & Schedule
    const isHasilSelesai = item.statusHasil === 'Selesai';
    const tglHasilFormatted = formatDate(item.tanggalPresentasiHasil);
    const statusHasilBadge = `
      <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
        <span class="status-badge ${isHasilSelesai ? 'done' : 'belum'}">
          <span class="status-dot"></span>
          ${isHasilSelesai ? 'Selesai' : 'Belum'}
        </span>
        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; white-space: nowrap;">
          ${tglHasilFormatted ? `📅 ${tglHasilFormatted}` : '<span style="opacity: 0.6;">Belum ada jadwal</span>'}
        </span>
      </div>
    `;

    // Proposal Document Button
    const propDocUrl = item.dokumenProposal ? (item.dokumenProposal.url || '#') : null;
    const propDocHtml = item.dokumenProposal ? `
      <a href="${escapeHtml(propDocUrl)}" target="_blank" rel="noopener noreferrer" class="doc-btn proposal" data-action="view-doc" data-id="${item.id}" data-type="proposal" title="Buka Dokumen Proposal di Google Drive">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Proposal (.pdf)
      </a>
    ` : '<span style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">Tidak ada</span>';

    // Result Document Button
    const hasilDocUrl = item.dokumenHasil ? (item.dokumenHasil.url || '#') : null;
    const hasilDocHtml = item.dokumenHasil ? `
      <a href="${escapeHtml(hasilDocUrl)}" target="_blank" rel="noopener noreferrer" class="doc-btn hasil" data-action="view-doc" data-id="${item.id}" data-type="hasil" title="Buka Dokumen Hasil di Google Drive">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Hasil Akhir (.pdf)
      </a>
    ` : `
      <button type="button" class="doc-btn disabled" disabled title="Belum tersedia">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Belum tersedia
      </button>
    `;

    // Admin Actions HTML
    const adminActionsHtml = currentMode === 'admin' ? `
      <td class="actions-cell" style="text-align: center;">
        <div class="action-btn-group" style="justify-content: center;">
          <button type="button" class="icon-btn edit" data-action="edit-item" data-id="${item.id}" title="Edit Data">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button type="button" class="icon-btn delete" data-action="delete-item" data-id="${item.id}" title="Hapus Data">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </td>
    ` : '';

    tr.innerHTML = `
      <td class="col-num">${index + 1}</td>
      <td>
        <div class="student-info">
          <span class="student-name">${escapeHtml(item.namaMahasiswa)}</span>
          <div class="student-meta">
            <span class="univ-badge">${escapeHtml(item.universitas)}</span>
          </div>
        </div>
      </td>
      <td>
        <div class="research-info">
          <span class="research-title">${escapeHtml(item.judulPenelitian)}</span>
          <span class="research-field">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${escapeHtml(item.tempatPenelitian || 'Seksi KSDA Wilayah II Tenggarong')}
          </span>
        </div>
      </td>
      <td>
        <div class="doc-btn-group">
          ${propDocHtml}
        </div>
      </td>
      <td>
        <div class="doc-btn-group">
          ${hasilDocHtml}
        </div>
      </td>
      <td>
        ${statusPropBadge}
      </td>
      <td>
        ${statusHasilBadge}
      </td>
      ${adminActionsHtml}
    `;

    tableBody.appendChild(tr);
  });
}

// --- Helper Functions ---
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  } catch (e) {
    return dateStr;
  }
}

// --- Mode Switcher ---
function setViewMode(mode) {
  if (mode === 'admin' && !isAdminLoggedIn) {
    openLoginModal();
    return;
  }

  currentMode = mode;
  if (mode === 'admin') {
    btnAdminView.classList.add('active');
    btnPublicView.classList.remove('active');
    btnTambahData.style.display = 'inline-flex';
    btnAdminLogout.style.display = 'inline-flex';
    thActions.style.display = 'table-cell';
    welcomeTitle.textContent = 'Dashboard Admin — Kelola Penelitian BKSDA Kalimantan Timur';
    welcomeDesc.textContent = 'Mode Admin aktif. Anda dapat mengelola data penelitian mahasiswa/i, memperbarui berkas proposal/hasil riset konservasi BKSDA Kaltim, mengedit lokasi tempat penelitian, serta mengelola status presentasi.';
    modeBadge.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2 2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Mode Pengelola BKSDA Kaltim (Logged In)`;
  } else {
    btnPublicView.classList.add('active');
    btnAdminView.classList.remove('active');
    btnTambahData.style.display = 'none';
    btnAdminLogout.style.display = 'none';
    thActions.style.display = 'none';
    welcomeTitle.textContent = 'Daftar Penelitian';
    welcomeDesc.textContent = 'Daftar mahasiswa/i yang melaksanakan kegiatan penelitian, magang, praktik kerja lapangan di lingkup Balai Konservasi Sumber Daya Alam Kalimantan Timur. Informasi mencakup data penelitian dan dapat digunakan sebagai media informasi terkait kegiatan penelitian mahasiswa/i.';
    modeBadge.innerHTML = `Layanan Informasi Penelitian BKSDA Kaltim`;
  }
  renderTable();
}

// --- Admin Authentication Logic ---
function openLoginModal() {
  formLoginAdmin.reset();
  loginErrorAlert.style.display = 'none';
  modalLogin.classList.add('active');
}

function closeLoginModal() {
  modalLogin.classList.remove('active');
}

function handleAdminLogin(e) {
  e.preventDefault();
  const username = inputLoginUsername.value.trim();
  const password = inputLoginPassword.value.trim();

  // Valid Credentials Check (Configured in ADMIN_USERNAME & ADMIN_PASSWORD)
  const targetUser = localStorage.getItem('UPT_ADMIN_USER') || ADMIN_USERNAME;
  const targetPass = localStorage.getItem('UPT_ADMIN_PASS') || ADMIN_PASSWORD;

  if (username === targetUser && password === targetPass) {
    isAdminLoggedIn = true;
    sessionStorage.setItem(AUTH_KEY, 'true');
    closeLoginModal();
    setViewMode('admin');
    showToast('Login Admin Berhasil! Akses Dashboard Admin Aktif.');
  } else {
    loginErrorAlert.style.display = 'block';
  }
}

function handleAdminLogout(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  isAdminLoggedIn = false;
  sessionStorage.removeItem(AUTH_KEY);
  setViewMode('public');
  showToast('Anda telah Logout dari Admin. Kembali ke Tampilan Publik.');
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  btnPublicView.addEventListener('click', () => setViewMode('public'));
  btnAdminView.addEventListener('click', () => setViewMode('admin'));
  btnAdminLogout.addEventListener('click', handleAdminLogout);
  btnThemeToggle.addEventListener('click', toggleTheme);

  // Login Modal Events
  btnCloseModalLogin.addEventListener('click', closeLoginModal);
  btnBatalLogin.addEventListener('click', closeLoginModal);
  formLoginAdmin.addEventListener('submit', handleAdminLogin);
  btnAutoFillLogin.addEventListener('click', () => {
    inputLoginUsername.value = 'admin';
    inputLoginPassword.value = 'admin123';
  });

  // Reset Data Sample
  btnResetData.addEventListener('click', () => {
    if (confirm('Apakah Anda ingin mengembalikan data ke sampel default UPT? Data yang dibuat/diedit akan direset.')) {
      researchData = [...INITIAL_RESEARCH_DATA];
      saveDataToStorage();
      renderApp();
      showToast('Data berhasil direset ke sampel default UPT.');
    }
  });

  // Search Input
  inputSearch.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTable();
  });

  // Filter Tabs
  filterTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeFilterTab = e.target.getAttribute('data-filter');
      renderTable();
    }
  });


  // Open Form Modal (Add)
  btnTambahData.addEventListener('click', () => openFormModal());

  // Close Form Modal
  btnCloseModalForm.addEventListener('click', closeFormModal);
  btnBatalForm.addEventListener('click', closeFormModal);

  // Form Submit (Create / Update)
  formPenelitian.addEventListener('submit', handleFormSubmit);

  // Table Delegates (View Doc, Edit, Delete)
  tableBody.addEventListener('click', handleTableActions);

  // Doc Viewer Modal Events
  btnCloseDocViewer.addEventListener('click', closeDocViewer);
  btnCloseDocViewerFooter.addEventListener('click', closeDocViewer);
  btnDownloadDoc.addEventListener('click', handleDocDownload);

  // Delete Modal Events
  btnCloseModalDelete.addEventListener('click', closeDeleteModal);
  btnBatalDelete.addEventListener('click', closeDeleteModal);
  btnConfirmDelete.addEventListener('click', handleConfirmDelete);
}

// --- Table Action Delegations ---
function handleTableActions(e) {
  const targetBtn = e.target.closest('button, a');
  if (!targetBtn) return;

  const action = targetBtn.getAttribute('data-action');
  const id = targetBtn.getAttribute('data-id');

  if (action === 'view-doc') {
    const docType = targetBtn.getAttribute('data-type');
    const item = researchData.find(d => d.id === id);
    if (item) {
      const doc = docType === 'proposal' ? item.dokumenProposal : item.dokumenHasil;
      if (doc && doc.url && doc.url !== '#') {
        showToast(`Membuka dokumen ${docType === 'proposal' ? 'Proposal' : 'Hasil Akhir'} di Google Drive...`);
      } else {
        e.preventDefault();
        showToast('Link Google Drive belum tersedia untuk dokumen ini.');
      }
    }
  } else if (action === 'edit-item') {
    openFormModal(id);
  } else if (action === 'delete-item') {
    openDeleteModal(id);
  }
}

// --- Modal Form (Create / Edit) ---
function openFormModal(id = null) {
  formPenelitian.reset();
  if (id) {
    const item = researchData.find(d => d.id === id);
    if (!item) return;
    modalFormTitle.textContent = 'Edit Data Penelitian Mahasiswa';
    editRecordId.value = item.id;
    document.getElementById('inputNama').value = item.namaMahasiswa || '';
    document.getElementById('inputUniversitas').value = item.universitas || '';
    document.getElementById('inputJudul').value = item.judulPenelitian || '';
    document.getElementById('inputBidang').value = item.tempatPenelitian || '';
    document.getElementById('inputTglProposal').value = item.tanggalPresentasiProposal || item.tanggalPresentasi || '';
    document.getElementById('inputTglHasil').value = item.tanggalPresentasiHasil || '';
    document.getElementById('selectStatusProposal').value = item.statusProposal || 'Belum';
    document.getElementById('selectStatusHasil').value = item.statusHasil || 'Belum';
    document.getElementById('inputProposalFile').value = item.dokumenProposal ? (item.dokumenProposal.url || item.dokumenProposal.namaFile) : '';
    document.getElementById('inputHasilFile').value = item.dokumenHasil ? (item.dokumenHasil.url || item.dokumenHasil.namaFile) : '';
    document.getElementById('inputCatatan').value = item.catatan || '';
  } else {
    modalFormTitle.textContent = 'Tambah Data Penelitian Mahasiswa';
    editRecordId.value = '';
  }
  modalForm.classList.add('active');
}

function closeFormModal() {
  modalForm.classList.remove('active');
}

function handleFormSubmit(e) {
  e.preventDefault();

  const id = editRecordId.value;
  const nama = document.getElementById('inputNama').value.trim();
  const universitas = document.getElementById('inputUniversitas').value.trim();
  const judul = document.getElementById('inputJudul').value.trim();
  const tempat = document.getElementById('inputBidang').value.trim();
  const tglProposal = document.getElementById('inputTglProposal').value;
  const tglHasil = document.getElementById('inputTglHasil').value;
  const statusProp = document.getElementById('selectStatusProposal').value;
  const statusHasil = document.getElementById('selectStatusHasil').value;
  const proposalFileName = document.getElementById('inputProposalFile').value.trim();
  const hasilFileName = document.getElementById('inputHasilFile').value.trim();
  const catatan = document.getElementById('inputCatatan').value.trim();

  // Create doc objects if file names / URLs supplied
  const propDocObj = proposalFileName ? {
    namaFile: proposalFileName.includes('/') ? 'Proposal_GoogleDrive.pdf' : (proposalFileName.endsWith('.pdf') ? proposalFileName : `${proposalFileName}.pdf`),
    url: proposalFileName.startsWith('http') ? proposalFileName : `https://${proposalFileName}`,
    ukuran: 'Google Drive PDF',
    tanggalUpload: new Date().toISOString().split('T')[0],
    halaman: 20
  } : null;

  const hasilDocObj = hasilFileName ? {
    namaFile: hasilFileName.includes('/') ? 'Laporan_Hasil_GoogleDrive.pdf' : (hasilFileName.endsWith('.pdf') ? hasilFileName : `${hasilFileName}.pdf`),
    url: hasilFileName.startsWith('http') ? hasilFileName : `https://${hasilFileName}`,
    ukuran: 'Google Drive PDF',
    tanggalUpload: new Date().toISOString().split('T')[0],
    halaman: 50
  } : null;

  if (id) {
    // Edit existing
    const index = researchData.findIndex(d => d.id === id);
    if (index !== -1) {
      researchData[index] = {
        ...researchData[index],
        namaMahasiswa: nama,
        universitas: universitas,
        judulPenelitian: judul,
        tempatPenelitian: tempat,
        tanggalPresentasiProposal: tglProposal,
        tanggalPresentasiHasil: tglHasil,
        statusProposal: statusProp,
        statusHasil: statusHasil,
        catatan: catatan,
        dokumenProposal: propDocObj || researchData[index].dokumenProposal,
        dokumenHasil: hasilDocObj || researchData[index].dokumenHasil
      };
      showToast(`Data penelitian berhasil diperbarui.`);
    }
  } else {
    // Add new record
    const newId = `UPT-2026-${String(researchData.length + 1).padStart(3, '0')}`;
    const newRecord = {
      id: newId,
      namaMahasiswa: nama,
      universitas: universitas,
      judulPenelitian: judul,
      tempatPenelitian: tempat,
      dokumenProposal: propDocObj,
      dokumenHasil: hasilDocObj,
      tanggalPresentasiProposal: tglProposal,
      tanggalPresentasiHasil: tglHasil,
      statusProposal: statusProp,
      statusHasil: statusHasil,
      catatan: catatan
    };
    researchData.unshift(newRecord);
    showToast(`Berhasil menambah data penelitian baru (${newId}).`);
  }

  saveDataToStorage();
  renderApp();
  closeFormModal();
}

// --- Delete Modal ---
function openDeleteModal(id) {
  const item = researchData.find(d => d.id === id);
  if (!item) return;
  targetDeleteId = id;
  const targetLabel = item.namaMahasiswa ? `${item.namaMahasiswa} (${item.universitas})` : `${item.universitas} [${item.id}]`;
  deleteTargetName.textContent = targetLabel;
  modalDelete.classList.add('active');
}

function closeDeleteModal() {
  modalDelete.classList.remove('active');
  targetDeleteId = null;
}

function handleConfirmDelete() {
  if (!targetDeleteId) return;
  const item = researchData.find(d => d.id === targetDeleteId);
  const name = item ? item.namaMahasiswa : '';
  researchData = researchData.filter(d => d.id !== targetDeleteId);
  saveDataToStorage();
  renderApp();
  closeDeleteModal();
  showToast(`Data penelitian berhasil dihapus.`);
}

// --- Document Viewer Modal ---
let activeDocData = null;
function openDocViewer(id, docType) {
  const item = researchData.find(d => d.id === id);
  if (!item) return;

  const doc = docType === 'proposal' ? item.dokumenProposal : item.dokumenHasil;
  if (!doc) {
    showToast('Dokumen belum tersedia.');
    return;
  }

  activeDocData = { item, doc, docType };

  document.getElementById('docViewerTitle').textContent = `Pratinjau ${docType === 'proposal' ? 'Dokumen Proposal' : 'Laporan Hasil Penelitian'}`;
  document.getElementById('docTypeLabel').textContent = `${docType === 'proposal' ? 'PROPOSAL PENELITIAN' : 'LAPORAN HASIL AKHIR'} • ${doc.namaFile}`;
  document.getElementById('docMetaLabel').textContent = `Upload: ${doc.tanggalUpload} • ${doc.ukuran || 'Google Drive PDF'}`;

  document.getElementById('pdfHeaderTitle').textContent = item.judulPenelitian;
  document.getElementById('pdfHeaderAuthor').textContent = `Asal Perguruan Tinggi: ${item.universitas}`;
  
  const abstractText = docType === 'proposal' 
    ? `Dokumen proposal penelitian ini diarsipkan secara aman di Google Drive BKSDA Kaltim. Status Presentasi Proposal: ${item.statusProposal}.`
    : `Dokumen laporan hasil akhir penelitian diarsipkan secara aman di Google Drive BKSDA Kaltim. Status Presentasi Hasil: ${item.statusHasil}. Catatan UPT: ${item.catatan || 'Dokumen lengkap.'}`;
  
  document.getElementById('pdfHeaderAbstract').textContent = abstractText;

  const gdriveAnchor = document.getElementById('pdfGdriveAnchor');
  if (gdriveAnchor) {
    const targetUrl = doc.url || '#';
    gdriveAnchor.href = targetUrl;
    gdriveAnchor.textContent = targetUrl;
  }

  modalDocViewer.classList.add('active');
}

function closeDocViewer() {
  modalDocViewer.classList.remove('active');
  activeDocData = null;
}

function handleDocDownload() {
  if (!activeDocData) return;
  const { doc } = activeDocData;
  
  if (doc.url && doc.url !== '#') {
    window.open(doc.url, '_blank');
    showToast(`Membuka tautan Google Drive dokumen...`);
  } else {
    showToast(`Link Google Drive belum tersedia.`);
  }
}


// Start application when DOM loaded
document.addEventListener('DOMContentLoaded', initApp);
