// === 1. INTERCEPTOR FETCH GLOBAL (Mengawasi Semua Request API) ===
const originalFetch = window.fetch;

// --- SISTEM TOAST (Notifikasi) ---
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 50);
    }, 500);
}

window.fetch = async function (...args) {
    let url = args[0];
    let options = args[1] || {};

    // Otomatis menyisipkan kartu identitas (Token JWT) ke setiap komunikasi API
    if (typeof url === 'string' && url.includes('/api/')) {
        const token = localStorage.getItem('token');
        if (token) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            };
        }
    }

    // Lanjutkan pengiriman ke backend
    const response = await originalFetch(url, options);

    // Jika backend memblokir (401/403) 
    if ((response.status === 401 || response.status === 403) && typeof url === 'string' && !url.includes('/api/auth/')) {
        showToast("Akses ditolak: Akun Anda telah dinonaktifkan atau dihapus.", 'error');
        localStorage.clear(); 
        
        // Beri jeda 1.5 detik agar notifikasi terbaca sebelum ditendang
        setTimeout(() => {
            window.location.href = '/frontend/pages/auth/auth.html';
        }, 1500); 
    }

    return response;
};


// === 2. PROTEKSI HALAMAN HTML ===
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const currentPath = window.location.pathname;

    // Cek keberadaan sesi
    if (!token && !currentPath.includes('/auth/auth.html')) {
        showToast("Sesi Anda telah habis atau Anda belum login.", 'error');
        window.location.href = '/frontend/pages/auth/auth.html';
        return;
    }

    // Cek silang kepemilikan halaman (Role)
    if (currentPath.includes('/owner/') && role !== 'Owner') {
        showToast("Akses Ditolak! Halaman ini khusus Pemilik (Owner).", 'error');
        window.location.href = role === 'Employee' ? '/frontend/pages/employee/pesanan-baru.html' : '/frontend/pages/auth/auth.html';
    }
    else if (currentPath.includes('/employee/') && role !== 'Employee') {
        showToast("Akses Ditolak! Halaman ini khusus Pegawai (Employee).", 'error');
        window.location.href = role === 'Owner' ? '/frontend/pages/owner/dashboard.html' : '/frontend/pages/auth/auth.html';
    }

    // Sistem tombol Logout Manual
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('logout-btn')) {
            e.preventDefault();
            localStorage.clear();
            window.location.href = '/frontend/pages/auth/auth.html';
        }
    });
});