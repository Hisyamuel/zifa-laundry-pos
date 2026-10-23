document.addEventListener('DOMContentLoaded', () => {
    // Muat data awal tanpa filter
    fetchRiwayat();

    // Event Listener untuk Tombol Terapkan (Filter)
    document.getElementById('btn-terapkan').addEventListener('click', () => {
        fetchRiwayat();
    });

    // Pencarian otomatis saat mengetik di kolom pencarian (diberi jeda agar tidak spam API)
    let timeoutId;
    document.getElementById('input-search').addEventListener('input', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fetchRiwayat();
        }, 500); // Tunggu 500ms setelah selesai mengetik
    });
});

// Format Tanggal (Contoh: 04 Okt 2026 · 09:12)
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);

    const optionsDate = { day: '2-digit', month: 'short', year: 'numeric' };
    const datePart = date.toLocaleDateString('id-ID', optionsDate);

    const timePart = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

    return `${datePart} · ${timePart}`;
}

// Format Uang
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

// Menentukan CSS Class untuk Badge Status
function getStatusBadgeClass(status) {
    switch (status) {
        case 'Dicuci':
        case 'Dikeringkan':
        case 'Disetrika':
            return 'bd o'; 
        case 'Siap Ambil':
            return 'bd o text-blue border-blue'; 
        case 'Selesai':
            return 'bd k'; 
        default:
            return 'bd o';
    }
}

// Ambil Data dari API
async function fetchRiwayat() {
    try {
        // Ambil nilai dari filter
        const searchValue = document.getElementById('input-search').value.trim();
        const dateValue = document.getElementById('input-date').value;
        const statusValue = document.getElementById('select-status').value;

        // Susun URL dengan query parameters
        let url = new URL('http://localhost:3000/api/orders');

        if (searchValue) url.searchParams.append('search', searchValue);
        if (dateValue) url.searchParams.append('date', dateValue);
        if (statusValue && statusValue !== 'Semua status') url.searchParams.append('status', statusValue);

        const response = await fetch(url);
        const result = await response.json();

        if (response.ok) {
            renderTable(result.data);
        } else {
            console.error('Gagal mengambil data riwayat:', result.message);
        }
    } catch (error) {
        console.error('Koneksi server gagal:', error);
    }
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
        tr.innerHTML = `
            <td>${item.resi}</td>
            <td>${formatDateTime(item.tanggal)}</td>
            <td>${item.pelanggan}</td>
            <td>${item.layanan}</td>
            <td><span class="${badgeClass}">${item.status}</span></td>
            <td>${formatRupiah(item.total)}</td>
            <td>${item.pembayaran}</td>
        `;
        tbody.appendChild(tr);
    });
}