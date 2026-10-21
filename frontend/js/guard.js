// frontend/js/guard.js

document.addEventListener("DOMContentLoaded", () => {
    // Ambil data sesi dari penyimpanan browser
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    const currentPath = window.location.pathname;

    // 1. Jika belum login dan mencoba masuk ke halaman selain auth, tendang ke login
    if (!token && !currentPath.includes('/auth/auth.html')) {
        alert("Sesi Anda telah habis atau Anda belum login.");
        window.location.href = '/frontend/pages/auth/auth.html';
        return;
    }

    // 2. Proteksi Halaman Berdasarkan Role
    if (currentPath.includes('/owner/') && role !== 'Owner') {
        alert("Akses Ditolak! Halaman ini khusus Pemilik (Owner).");
        // Kembalikan ke halaman yang sesuai perannya
        window.location.href = role === 'Employee' ? '/frontend/pages/employee/pesanan-baru.html' : '/frontend/pages/auth/auth.html';
    } 
    else if (currentPath.includes('/employee/') && role !== 'Employee') {
        alert("Akses Ditolak! Halaman ini khusus Pegawai (Employee).");
        // Kembalikan ke halaman owner jika dia owner
        window.location.href = role === 'Owner' ? '/frontend/pages/owner/dashboard.html' : '/frontend/pages/auth/auth.html';
    }
});