document.addEventListener("DOMContentLoaded", () => {

    // Variabel untuk melacak ID pesanan yang sedang dianimasikan
    let lastMovedOrderId = null;

    // Fungsi Logika Penentuan Status Berikutnya Berdasarkan Nama Layanan
    function getNextStatus(currentStatus, namaLayanan) {
        const isSetrika = namaLayanan.toLowerCase().includes('setrika');

        switch (currentStatus) {
            case 'Dicuci':
                return 'Dikeringkan';
            case 'Dikeringkan':
                return isSetrika ? 'Disetrika' : 'Siap Ambil';
            case 'Disetrika':
                return 'Siap Ambil';
            case 'Siap Ambil':
                return 'Selesai';
            default:
                return null;
        }
    }

    // Fungsi Mengambil Data dari Server
    async function fetchKanbanData() {
        try {
            const response = await fetch('/api/orders');
            const result = await response.json();

            if (result.status === 'success') {
                renderKanban(result.data);
            }
        } catch (error) {
            console.error("Gagal memuat status cucian:", error);
        }
    }

    // Fungsi Render Papan Kanban
    // Fungsi Render Papan Kanban
    function renderKanban(orders) {
        const cols = ['Dicuci', 'Dikeringkan', 'Disetrika', 'Siap Ambil', 'Selesai'];
        const counts = { 'Dicuci': 0, 'Dikeringkan': 0, 'Disetrika': 0, 'Siap Ambil': 0, 'Selesai': 0 };

        cols.forEach(col => {
            const el = document.getElementById(`col-${col}`);
            if (el) el.innerHTML = '';
        });

        // PISAHKAN LOGIKA UNTUK KOLOM SELESAI
        const activeOrders = orders.filter(o => o.status !== 'Selesai');
        const finishedOrders = orders.filter(o => o.status === 'Selesai');

        // Hanya ambil 5 pesanan Selesai terbaru agar tidak menumpuk ke bawah
        const limitedFinishedOrders = finishedOrders.slice(0, 5);

        // Gabungkan kembali untuk dirender
        const ordersToDisplay = [...activeOrders, ...limitedFinishedOrders];

        ordersToDisplay.forEach(order => {
            const colEl = document.getElementById(`col-${order.status}`);
            if (colEl) {
                counts[order.status]++; // Hitung badge

                const nextStatus = getNextStatus(order.status, order.layanan);
                let btnHTML = '';

                if (nextStatus) {
                    btnHTML = `<button class="k-btn" onclick="updateOrderStatus('${order.id}', '${nextStatus}', this)">Pindah ke ${nextStatus}</button>`;
                }

                const animationClass = (order.id === lastMovedOrderId) ? 'fade-in' : '';

                const cardHTML = `
                    <div class="k-card ${animationClass}">
                        <div>
                            <div class="resi">${order.resi}</div>
                            <div class="cust">${order.pelanggan}</div>
                            <div style="font-size: 11px; color: var(--mu); margin-top: 4px;">${order.layanan}</div>
                        </div>
                        ${btnHTML}
                    </div>
                `;
                colEl.insertAdjacentHTML('beforeend', cardHTML);
            }
        });

        // Setel total asli (termasuk yang disembunyikan) untuk badge "Selesai" jika ingin akurat, 
        // atau gunakan angka dari yang tertampil saja.
        counts['Selesai'] = finishedOrders.length;

        // Reset pelacak animasi setelah render selesai
        lastMovedOrderId = null;

        document.getElementById('count-dicuci').textContent = counts['Dicuci'];
        document.getElementById('count-dikeringkan').textContent = counts['Dikeringkan'];
        document.getElementById('count-disetrika').textContent = counts['Disetrika'];
        document.getElementById('count-siap-ambil').textContent = counts['Siap Ambil'];
        document.getElementById('count-selesai').textContent = counts['Selesai'];
    }

    fetchKanbanData();

    // Fungsi Global untuk Tombol Pindah Status
    window.updateOrderStatus = async function (orderId, nextStatus, btnElement) {
        // 1. Eksekusi Animasi Fade Out pada kartu saat ini
        if (btnElement) {
            const card = btnElement.closest('.k-card');
            if (card) {
                card.classList.add('fade-out');
            }
        }

        try {
            // Lakukan pembaruan di server secara asinkron
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus })
            });

            const result = await response.json();

            if (result.status === 'success') {
                lastMovedOrderId = orderId;

                // Beri waktu 250ms agar animasi fade out terlihat sempurna sebelum re-render papan kanban
                setTimeout(() => {
                    fetchKanbanData();
                }, 250);
            } else {
                alert("Gagal memindahkan status: " + result.message);
                fetchKanbanData(); // Refresh untuk mengembalikan kartu yang gagal dipindah
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Terjadi kesalahan jaringan.");
            fetchKanbanData();
        }
    };
});