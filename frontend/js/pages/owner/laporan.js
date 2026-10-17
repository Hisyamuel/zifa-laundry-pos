// frontend/js/pages/owner/laporan.js

let currentPeriod = 'mingguan';
let currentDate = ''; // Format YYYY-MM-DD, kosong = hari ini

document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi
    fetchReportData();

    // Event Listener Filter Tab (Harian, Mingguan, Bulanan)
    const tabs = document.querySelectorAll('#tab-filter button');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('on'));
            this.classList.add('on');

            currentPeriod = this.getAttribute('data-period');
            fetchReportData();
        });
    });

    // Event Listener Date Picker
    const datePicker = document.getElementById('date-picker');
    // Set default value ke hari ini
    datePicker.valueAsDate = new Date();

    datePicker.addEventListener('change', function () {
        currentDate = this.value; // YYYY-MM-DD
        fetchReportData();
    });

    // Event Listener Tombol Unduh Laporan
    document.getElementById('btn-unduh').addEventListener('click', downloadCSV);
});

async function fetchReportData() {
    try {
        let url = `http://localhost:3000/api/reports?period=${currentPeriod}`;
        if (currentDate) {
            url += `&date=${currentDate}`;
        }

        const response = await fetch(url);
        
        // Cek dulu apakah responsnya sukses (200 OK) sebelum diubah ke JSON
        if (!response.ok) {
            throw new Error(`Endpoint tidak ditemukan! Status: ${response.status}`);
        }

        // Jika aman, baru jadikan JSON
        const result = await response.json();
        renderDashboard(result.data);

    } catch (error) {
        console.error('Koneksi server gagal:', error);
    }
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

function renderDashboard(data) {
    const { summary, tableData } = data;

    // 1. Update Metrik Utama
    document.getElementById('val-total').innerText = formatRupiah(summary.totalRevenue);
    document.getElementById('val-count').innerText = summary.transactionCount;
    document.getElementById('val-avg').innerText = formatRupiah(summary.averagePerTransaction);

    // 2. Update Label Tanggal
    document.getElementById('val-date-1').innerText = summary.displayDateRange;
    document.getElementById('val-date-2').innerText = summary.displayDateRange;
    document.getElementById('val-date-3').innerText = summary.displayDateRange;

    // 3. Update Tombol Unduh & Header Tabel
    const btnUnduh = document.getElementById('btn-unduh');
    const thLabel = document.getElementById('th-label');

    if (currentPeriod === 'harian') {
        btnUnduh.innerText = 'Unduh laporan harian';
        thLabel.innerText = 'Sesi Waktu';
    } else if (currentPeriod === 'mingguan') {
        btnUnduh.innerText = 'Unduh laporan mingguan';
        thLabel.innerText = 'Tanggal';
    } else {
        btnUnduh.innerText = 'Unduh laporan bulanan';
        thLabel.innerText = 'Minggu Ke-';
    }

    // 4. Render Isi Tabel
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = "";

    tableData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.label}</td>
            <td>${row.count}</td>
            <td>${formatRupiah(row.revenue)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- FUNGSI UNDUH (DOWNLOAD CSV) ---
function downloadCSV() {
    const tbody = document.getElementById('table-body');
    const rows = tbody.querySelectorAll('tr');

    if (rows.length === 0) {
        alert("Tidak ada data untuk diunduh.");
        return;
    }

    const thLabelText = document.getElementById('th-label').innerText;

    // Header CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `${thLabelText},Jumlah Transaksi,Pendapatan\n`;

    // Isi CSV
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        // Bersihkan teks dari titik/koma format uang agar bisa dijumlah di Excel
        const col1 = cols[0].innerText;
        const col2 = cols[1].innerText;
        // Hapus 'Rp', titik, spasi untuk nilai uang
        const col3 = cols[2].innerText.replace(/[^0-9]/g, '');

        csvContent += `"${col1}","${col2}","${col3}"\n`;
    });

    // Proses Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);

    // Nama file dinamis
    const dateRangeStr = document.getElementById('val-date-1').innerText.replace(/\s/g, '_');
    link.setAttribute("download", `Laporan_ZifaLaundry_${currentPeriod}_${dateRangeStr}.csv`);

    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
}