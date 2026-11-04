let currentPeriod = 'harian';
let currentDate = ''; 

document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi awal
    fetchReportData();

    requestAnimationFrame(() => updateSlider());
    window.addEventListener('resize', updateSlider); 

    // Event Listener Filter Tab (Harian, Mingguan, Bulanan)
    const tabs = document.querySelectorAll('#tab-filter button');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            // Abaikan jika menekan tab yang sudah aktif
            if (this.classList.contains('on')) return;

            // Pindah ke class 'on'
            tabs.forEach(t => t.classList.remove('on'));
            this.classList.add('on');

            currentPeriod = this.getAttribute('data-period');

            updateSlider();          // Jalankan animasi pergeseran tab
            loadDataWithAnimation(); // Jalankan animasi fade & muat data baru
        });
    });

    // Event Listener Date Picker
    const datePicker = document.getElementById('date-picker');
    datePicker.valueAsDate = new Date(); // Set default ke hari ini

    datePicker.addEventListener('change', function () {
        currentDate = this.value; // YYYY-MM-DD
        loadDataWithAnimation();  
    });

    // Event Listener Tombol Unduh Laporan
    document.getElementById('btn-unduh').addEventListener('click', downloadCSV);
});

// --- FUNGSI ANIMASI SLIDER ---
function updateSlider() {
    const activeBtn = document.querySelector('#tab-filter button.on');
    const slider = document.getElementById('slider-indicator');
    if (activeBtn && slider) {
        // Samakan lebar slider dengan tombol yang aktif
        slider.style.width = activeBtn.offsetWidth + 'px';
        // Geser slider sesuai dengan kordinat tombol yang aktif (X-axis)
        slider.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
    }
}

// --- FUNGSI ANIMASI FADE (MUAT DATA) ---
function loadDataWithAnimation() {
    const content = document.getElementById('report-content');

    // Fade Out (Sembunyikan konten secara halus)
    content.classList.add('hidden');

    // Tunggu 300ms (Sesuai durasi CSS transition), lalu muat data
    setTimeout(async () => {
        await fetchReportData(); // Panggil data dari backend

        // Fade In (Tampilkan kembali konten secara halus)
        content.classList.remove('hidden');
    }, 100);
}

// --- FUNGSI UTAMA FETCH ---
async function fetchReportData() {
    try {
        let url = `/api/reports?period=${currentPeriod}`;
        if (currentDate) {
            url += `&date=${currentDate}`;
        }

        const response = await fetch(url);

        // Cek dulu apakah responsnya sukses (200 OK)
        if (!response.ok) {
            throw new Error(`Endpoint tidak ditemukan! Status: ${response.status}`);
        }

        // Jika aman, render
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

    // Update Metrik
    document.getElementById('val-total').innerText = formatRupiah(summary.totalRevenue);
    document.getElementById('val-count').innerText = summary.transactionCount;
    document.getElementById('val-avg').innerText = formatRupiah(summary.averagePerTransaction);

    // Update Label Tanggal
    document.getElementById('val-date-1').innerText = summary.displayDateRange;
    document.getElementById('val-date-2').innerText = summary.displayDateRange;
    document.getElementById('val-date-3').innerText = summary.displayDateRange;

    // Update Header Tabel & Tombol
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

    // Render Isi Tabel
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

// --- FUNGSI UNDUH CSV ---
async function downloadCSV() {
    try {
        let url = `/api/reports/export?period=${currentPeriod}`;
        if (currentDate) {
            url += `&date=${currentDate}`;
        }

        const btnUnduh = document.getElementById('btn-unduh');
        const originalText = btnUnduh.innerText;
        btnUnduh.innerText = "Mengunduh...";
        btnUnduh.disabled = true;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();

        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'Laporan.csv';
        if (contentDisposition && contentDisposition.includes('filename=')) {
            filename = contentDisposition.split('filename=')[1].split(';')[0];
        }

        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        btnUnduh.innerText = originalText;
        btnUnduh.disabled = false;

    } catch (error) {
        console.error('Gagal mengunduh CSV:', error);
        alert("Gagal mengunduh laporan. Periksa koneksi server.");

        const btnUnduh = document.getElementById('btn-unduh');
        btnUnduh.innerText = `Unduh laporan ${currentPeriod}`;
        btnUnduh.disabled = false;
    }
}