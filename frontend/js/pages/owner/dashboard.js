document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

/**
 * Fungsi utama untuk menarik data dari API dan mendistribusikannya ke komponen UI
 */
async function initDashboard() {
    try {
        // Sesuaikan PORT dengan konfigurasi server Node.js lokal Anda (misal: 3000)
        const response = await fetch('http://localhost:3000/api/dashboard');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        const { stats, chart7Hari, transaksiTerbaru } = result.data;
        
        // Render data ke masing-masing bagian DOM
        renderStats(stats);
        renderChart(chart7Hari);
        renderRecentTransactions(transaksiTerbaru);
        
    } catch (error) {
        console.error('Gagal memuat data dasbor:', error);
        // Fallback opsional: Anda bisa memunculkan notifikasi error ke user di sini
    }
}

/**
 * Utilitas untuk format angka mentah menjadi format Rupiah
 */
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

/**
 * Update 4 Kartu Statistik
 */
function renderStats(stats) {
    // Menargetkan elemen tag <b> di dalam 4 kartu secara berurutan
    const statCards = document.querySelectorAll('.grid.g4 .card.st b');
    
    if (statCards.length >= 4) {
        statCards[0].textContent = formatRupiah(stats.pendapatanHariIni);
        statCards[1].textContent = stats.pesananMasuk;
        statCards[2].textContent = stats.dalamProses;
        statCards[3].textContent = stats.siapDiambil;
    }
}

/**
 * Update Grafik Batang 7 Hari Terakhir
 */
function renderChart(chartData) {
    const barsContainer = document.querySelector('.bars');
    if (!barsContainer) return;

    barsContainer.innerHTML = ''; // Kosongkan elemen statis bawaan HTML
    
    chartData.forEach(item => {
        const barDiv = document.createElement('div');
        barDiv.innerHTML = `<i style="height: ${item.persentase}%"></i>${item.hari}`;
        barsContainer.appendChild(barDiv);
    });
}

/**
 * Update Tabel Transaksi Terbaru
 */
function renderRecentTransactions(transactions) {
    const tbody = document.querySelector('.tw tbody');

    tbody.innerHTML = ''; // Kosongkan elemen statis bawaan HTML
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Tidak ada transaksi ditemukan.</td></tr>';
        return;
    }

    transactions.forEach(trx => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${trx.resi} · ${trx.customer}</td>
            <td>${formatRupiah(trx.total)}</td>
        `;
        tbody.appendChild(tr);
    });
}