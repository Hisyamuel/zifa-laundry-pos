let currentEmployeeId = null;
let targetStatus = null; // Bisa berisi: 'Aktif', 'Nonaktif', atau 'Tolak'

document.addEventListener('DOMContentLoaded', () => {
    fetchEmployees();
    document.getElementById('btn-cancel-modal').addEventListener('click', closeStatusModal);
    document.getElementById('btn-confirm-modal').addEventListener('click', executeStatusChange);
});

// --- SISTEM TOAST --- 
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
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

// === FETCH & RENDER DATA ===
async function fetchEmployees() {
    try {
        const response = await fetch('http://localhost:3000/api/employees');
        const result = await response.json();
        if (response.ok) processAndRenderData(result.data);
    } catch (error) {
        showToast('Gagal menghubungi server', 'error');
    }
}

function processAndRenderData(data) {
    const pendingEmployees = data.filter(emp => emp.status === 'Menunggu persetujuan');
    const registeredEmployees = data.filter(emp => emp.status === 'Aktif' || emp.status === 'Nonaktif');
    renderPendingTable(pendingEmployees);
    renderEmployeeTable(registeredEmployees);
    updateSidebarNavCount(pendingEmployees.length);
}

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
                <!-- Panggil Modal Tolak -->
                <button onclick="openRejectModal('${emp.id}', '${emp.name}')" class="b" style="padding: 6px 12px;">Tolak</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- RENDER TABEL PEGAWAI ---
function renderEmployeeTable(employees) {
    const tbody = document.getElementById('table-employee-body');
    tbody.innerHTML = '';
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Belum ada data pegawai.</td></tr>';
        return;
    }

    employees.forEach(emp => {
        const isAktif = emp.status === 'Aktif';
        const badgeColor = isAktif ? 'background-color: #3b82f6; color: white;' : 'background-color: #334155; color: #cbd5e1;';
        const actionText = isAktif ? 'Nonaktifkan' : 'Aktifkan';
        const nextStatus = isAktif ? 'Nonaktif' : 'Aktif';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${emp.name}</td>
            <td>${emp.email}</td>
            <td><span style="padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; ${badgeColor}">${emp.status}</span></td>
            <td>
                <button onclick="openStatusModal('${emp.id}', '${emp.name}', '${nextStatus}')" class="btn-link text-blue">${actionText}</button>
                <span style="margin: 0 5px; color: var(--mu);">·</span>
                <button onclick="openRejectModal('${emp.id}', '${emp.name}')" class="btn-link text-red">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateSidebarNavCount(pendingCount) {
    const navLinks = document.querySelectorAll('.side .menu-link');
    navLinks.forEach(link => {
        if (link.textContent.includes('Akun Pegawai')) {
            link.textContent = pendingCount > 0 ? `Akun Pegawai (${pendingCount})` : 'Akun Pegawai';
        }
    });
}

// === AKSI: SETUJUI (Tanpa Modal) ===
async function approveAccount(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/employees/${id}/approve`, { method: 'PUT' });
        const result = await response.json();
        if (response.ok) {
            showToast(result.message, 'success');
            fetchEmployees();
        } else showToast(result.message, 'error');
    } catch (error) {
        showToast('Gagal menghubungi server', 'error');
    }
}

// --- FUNGSI TAMPILKAN MODAL DENGAN ANIMASI ---
window.openStatusModal = function (id, name, nextStatus) {
    currentEmployeeId = id;
    targetStatus = nextStatus;

    document.getElementById('modal-title').textContent = nextStatus === 'Aktif' ? 'Aktifkan Akun' : 'Nonaktifkan Akun';
    document.getElementById('modal-desc').innerHTML = `Apakah Anda yakin ingin mengubah status <strong>${name}</strong> menjadi <strong>${nextStatus}</strong>?`;

    const btnConfirm = document.getElementById('btn-confirm-modal');
    btnConfirm.style.backgroundColor = nextStatus === 'Nonaktif' ? '#ef4444' : '#1e67db';
    btnConfirm.style.borderColor = nextStatus === 'Nonaktif' ? '#ef4444' : '#1e67db';
    btnConfirm.style.color = 'white';
    btnConfirm.textContent = 'Ya, Ubah Status';

    const modal = document.getElementById('status-modal');
    modal.style.display = 'flex'; 
    setTimeout(() => modal.classList.add('show-modal'), 10);
};

window.openRejectModal = function (id, name) {
    currentEmployeeId = id;
    targetStatus = 'Tolak';

    document.getElementById('modal-title').textContent = 'Tolak / Hapus Akun';
    document.getElementById('modal-desc').innerHTML = `Apakah Anda yakin ingin menolak/menghapus <strong>${name}</strong>? Data akan dihapus secara permanen.`;

    const btnConfirm = document.getElementById('btn-confirm-modal');
    btnConfirm.style.backgroundColor = '#ef4444';
    btnConfirm.style.borderColor = '#ef4444';
    btnConfirm.style.color = 'white';
    btnConfirm.textContent = 'Ya, Hapus Permanen';

    const modal = document.getElementById('status-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show-modal'), 10);
};

function closeStatusModal() {
    currentEmployeeId = null;
    targetStatus = null;

    const modal = document.getElementById('status-modal');
    modal.classList.remove('show-modal');

    // Tunggu animasi CSS selesai baru sembunyikan display
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// === EKSEKUSI API DARI MODAL ===
async function executeStatusChange() {
    if (!currentEmployeeId || !targetStatus) return;

    try {
        let url = '';
        let options = { headers: { 'Content-Type': 'application/json' } };

        // Route: Memisahkan DELETE dan PUT
        if (targetStatus === 'Tolak') {
            url = `http://localhost:3000/api/employees/${currentEmployeeId}/reject`;
            options.method = 'DELETE';
        } else {
            url = `http://localhost:3000/api/employees/${currentEmployeeId}/toggle-status`;
            options.method = 'PUT';
            options.body = JSON.stringify({ newStatus: targetStatus });
        }

        const btnConfirm = document.getElementById('btn-confirm-modal');
        const originalText = btnConfirm.textContent;
        btnConfirm.textContent = "Memproses...";
        btnConfirm.disabled = true;

        const response = await fetch(url, options);
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
        const btnConfirm = document.getElementById('btn-confirm-modal');
        btnConfirm.disabled = false;
        closeStatusModal();
    }
}