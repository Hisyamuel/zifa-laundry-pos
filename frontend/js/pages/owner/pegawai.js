// frontend/js/pages/owner/pegawai.js

// Variabel Global untuk Modal
let currentEmployeeId = null;
let targetStatus = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchEmployees();

    // Event listener untuk modal
    document.getElementById('btn-cancel-modal').addEventListener('click', closeStatusModal);
    document.getElementById('btn-confirm-modal').addEventListener('click', executeStatusChange);
});

// --- SISTEM TOAST --- 
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// === 1. FETCH & RENDER DATA ===
async function fetchEmployees() {
    try {
        const response = await fetch('http://localhost:3000/api/employees');
        const result = await response.json();

        if (response.ok) {
            processAndRenderData(result.data);
        } else {
            showToast(result.message || 'Gagal memuat data', 'error');
        }
    } catch (error) {
        showToast('Gagal menghubungi server', 'error');
    }
}

function processAndRenderData(data) {
    // Pisahkan data berdasarkan status
    const pendingEmployees = data.filter(emp => emp.status === 'Pending');
    // Pegawai yang sudah disetujui (Aktif / Nonaktif)
    const registeredEmployees = data.filter(emp => emp.status === 'Aktif' || emp.status === 'Nonaktif');

    renderPendingTable(pendingEmployees);
    renderEmployeeTable(registeredEmployees);
    updateSidebarNavCount(pendingEmployees.length);
}

// Format Tanggal (Misal: 09 Okt 2026)
function formatDate(dateString) {
    if (!dateString) return '-';
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

function renderPendingTable(employees) {
    const tbody = document.getElementById('table-pending-body');
    const badge = document.getElementById('pending-badge-count');
    const section = document.getElementById('pending-section');

    tbody.innerHTML = '';
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Belum ada data pegawai.</td></tr>';
        return;
    }
    badge.textContent = employees.length;

    // Sembunyikan bagian pending jika tidak ada data
    if (employees.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    employees.forEach(emp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${emp.name}</td>
            <td>${emp.email}</td>
            <td>${formatDate(emp.createdAt)}</td>
            <td>
                <button onclick="approveAccount('${emp.id}')" class="b p" style="padding: 6px 12px; margin-right: 5px;">Setujui</button>
                <button onclick="rejectAccount('${emp.id}')" class="b" style="padding: 6px 12px;">Tolak</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderEmployeeTable(employees) {
    const tbody = document.getElementById('table-employee-body');
    tbody.innerHTML = '';
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Belum ada data pegawai.</td></tr>';
        return;
    }

    employees.forEach(emp => {
        // Tentukan styling badge status
        const isAktif = emp.status === 'Aktif';
        const badgeColor = isAktif ? 'background-color: #3b82f6; color: white;' : 'background-color: #334155; color: #cbd5e1;';

        // Tentukan teks aksi kebalikan dari status saat ini
        const actionText = isAktif ? 'Nonaktifkan' : 'Aktifkan';
        const nextStatus = isAktif ? 'Nonaktif' : 'Aktif';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${emp.name}</td>
            <td>${emp.email}</td>
            <td>
                <span style="padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; ${badgeColor}">
                    ${emp.status}
                </span>
            </td>
            <td>
                <button onclick="openStatusModal('${emp.id}', '${emp.name}', '${nextStatus}')" class="btn-link text-blue">
                    Ubah · ${actionText}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Update angka notifikasi di Sidebar Navigasi
function updateSidebarNavCount(pendingCount) {
    const navLinks = document.querySelectorAll('.side .menu-link');
    navLinks.forEach(link => {
        if (link.textContent.includes('Akun Pegawai')) {
            // Jika ada pending, tampilkan angkanya. Jika 0, hilangkan angkanya.
            link.textContent = pendingCount > 0 ? `Akun Pegawai (${pendingCount})` : 'Akun Pegawai';
        }
    });
}

// === 2. AKSI: SETUJUI / TOLAK (PENDING) ===
async function approveAccount(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/employees/${id}/approve`, { method: 'PUT' });
        const result = await response.json();
        if (response.ok) {
            showToast(result.message, 'success');
            fetchEmployees();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Gagal menghubungi server', 'error');
    }
}

async function rejectAccount(id) {
    if (!confirm('Tolak pendaftaran akun ini?')) return;
    try {
        const response = await fetch(`http://localhost:3000/api/employees/${id}/reject`, { method: 'PUT' });
        const result = await response.json();
        if (response.ok) {
            showToast(result.message, 'success');
            fetchEmployees();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Gagal menghubungi server', 'error');
    }
}

// === 3. AKSI: UBAH STATUS (MODAL) ===
window.openStatusModal = function (id, name, nextStatus) {
    currentEmployeeId = id;
    targetStatus = nextStatus;

    document.getElementById('modal-title').textContent = nextStatus === 'Aktif' ? 'Aktifkan Akun' : 'Nonaktifkan Akun';
    document.getElementById('modal-desc').innerHTML = `Apakah Anda yakin ingin mengubah status <strong>${name}</strong> menjadi <strong>${nextStatus}</strong>?`;

    // Ubah warna tombol konfirmasi agar sesuai konteks
    const btnConfirm = document.getElementById('btn-confirm-modal');
    if (nextStatus === 'Nonaktif') {
        btnConfirm.style.backgroundColor = '#ef4444'; // Merah
        btnConfirm.style.borderColor = '#ef4444';
    } else {
        btnConfirm.style.backgroundColor = '#3b82f6'; // Biru (Zifa Primary)
        btnConfirm.style.borderColor = '#3b82f6';
    }

    document.getElementById('status-modal').style.display = 'flex';
};

function closeStatusModal() {
    currentEmployeeId = null;
    targetStatus = null;
    document.getElementById('status-modal').style.display = 'none';
}

async function executeStatusChange() {
    if (!currentEmployeeId || !targetStatus) return;

    try {
        const response = await fetch(`http://localhost:3000/api/employees/${currentEmployeeId}/toggle-status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newStatus: targetStatus })
        });

        const result = await response.json();

        if (response.ok) {
            showToast(result.message, 'success');
            fetchEmployees();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Gagal menghubungi server', 'error');
    } finally {
        closeStatusModal();
    }
}