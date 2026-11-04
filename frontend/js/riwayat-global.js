document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    const itemsPerPage = 6;
    
    // Variabel untuk menyimpan semua data hasil fetch agar bisa dipaginasi manual di frontend
    let allData = []; 

    fetchRiwayat();

    document.getElementById('btn-terapkan').addEventListener('click', () => {
        currentPage = 1; 
        fetchRiwayat();
    });

    let timeoutId;
    document.getElementById('input-search').addEventListener('input', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            currentPage = 1; 
            fetchRiwayat();
        }, 500);
    });

    function formatDateTime(dateString) {
        if (!dateString) return '-';
        const validDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(validDateString);
        const optionsDate = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Jakarta'
        };
        const datePart = date.toLocaleDateString('id-ID', optionsDate);
        const optionsTime = {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta'
        };
        const timePart = date.toLocaleTimeString('id-ID', optionsTime).replace('.', ':');
        return `${datePart} · ${timePart} WIB`;
    }

    function formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    }

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

    async function fetchRiwayat() {
        try {
            const searchValue = document.getElementById('input-search').value.trim();
            const dateValue = document.getElementById('input-date').value;
            const statusValue = document.getElementById('select-status').value;

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const isoSevenDaysAgo = sevenDaysAgo.toISOString();

            let url = new URL('/api/orders');

            if (searchValue) url.searchParams.append('search', searchValue);
            if (dateValue) {
                url.searchParams.append('date', dateValue);
            } else {
                url.searchParams.append('startDate', isoSevenDaysAgo);
            }
            if (statusValue && statusValue !== 'Semua status') url.searchParams.append('status', statusValue);

            const response = await fetch(url);
            const result = await response.json();

            if (response.ok) {
                // Simpan semua data ke variabel global
                allData = result.data || [];
                // Render halaman saat ini (akan memotong data sesuai itemsPerPage)
                renderPage(currentPage);
            } else {
                console.error('Gagal mengambil data riwayat:', result.message);
            }
        } catch (error) {
            console.error('Koneksi server gagal:', error);
        }
    }

    // Fungsi pemisah data berdasarkan halaman
    function renderPage(page) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        // Ambil data hanya untuk halaman ini
        const dataForPage = allData.slice(startIndex, endIndex);
        
        renderTable(dataForPage);
        renderPagination(allData.length, page);
    }

    function renderTable(data) {
        const tbody = document.getElementById('table-riwayat-body');
        tbody.innerHTML = '';

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Tidak ada transaksi ditemukan.</td></tr>';
            return;
        }

        data.forEach(item => {
            const badgeClass = getStatusBadgeClass(item.status);
            const waktuTampil = item.status === 'Selesai' && item.waktu_selesai
                ? formatDateTime(item.waktu_selesai)
                : formatDateTime(item.waktu_masuk); 

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.resi}</td>
                <td>${waktuTampil}</td>
                <td>${item.pelanggan}</td>
                <td>${item.layanan}</td>
                <td><span class="${badgeClass}">${item.status}</span></td>
                <td>${formatRupiah(item.total)}</td>
                <td>${item.pembayaran}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderPagination(total, page) {
        const totalPages = Math.ceil(total / itemsPerPage);
        
        // Cari kontainer pagination, jika tidak ada buat baru di dalam div.tw
        let paginationContainer = document.getElementById('pagination-container');
        
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'pagination-container';
            paginationContainer.className = 'pagination-container';
            
            // Pasang di dalam div.tw, setelah tabel
            const twContainer = document.querySelector('.tw');
            twContainer.appendChild(paginationContainer);
        }

        paginationContainer.innerHTML = '';

        // Tampilkan pagination bahkan jika hanya ada 1 halaman untuk memastikan div terbentuk rapi
        if (total === 0) return; 

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === page ? 'page-btn active' : 'page-btn';

            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderPage(currentPage); // Hanya ubah isi tabel
            });

            paginationContainer.appendChild(pageBtn);
        }
    }
});