function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Render Data ke Tabel
function renderTable(data) {
    const tbody = document.getElementById('table-riwayat-body');
    tbody.innerHTML = ''; // Kosongkan tabel sebelumnya

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Tidak ada transaksi ditemukan.</td></tr>';
        return;
    }

    data.forEach(item => {
        const badgeClass = getStatusBadgeClass(item.status);

        const tr = document.createElement('tr');
        // Bungkus variabel teks yang berasal dari input user dengan escapeHTML()
        tr.innerHTML = `
            <td>${escapeHTML(item.resi)}</td>
            <td>${escapeHTML(formatDateTime(item.tanggal))}</td>
            <td>${escapeHTML(item.pelanggan)}</td>
            <td>${escapeHTML(item.layanan)}</td>
            <td><span class="${escapeHTML(badgeClass)}">${escapeHTML(item.status)}</span></td>
            <td>${escapeHTML(formatRupiah(item.total))}</td>
            <td>${escapeHTML(item.pembayaran)}</td>
        `;
        tbody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.querySelector('.side');
    const overlay = document.getElementById('sidebar-overlay');

    function toggleNav() {
        hamburgerBtn.classList.toggle('active');
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    if (hamburgerBtn && sidebar) {
        // Event saat tombol hamburger/X dipencet
        hamburgerBtn.addEventListener('click', toggleNav);
        
        // Event agar sidebar tertutup jika area gelap (overlay) diklik
        if (overlay) {
            overlay.addEventListener('click', toggleNav);
        }

        // Tutup sidebar otomatis saat salah satu menu diklik (khusus mobile)
        const navLinks = sidebar.querySelectorAll('.menu-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 760) {
                    toggleNav();
                }
            });
        });
    }
});