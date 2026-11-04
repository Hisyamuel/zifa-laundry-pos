document.addEventListener('DOMContentLoaded', () => {
    const catalogEl = document.getElementById('catalog');
    const searchInput = document.getElementById('search-input');
    const chips = document.querySelectorAll('#filter-chips .chip');

    let services = [];
    let activeFilter = 'Semua';

    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    const formatRupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

    // Satuan harga mengikuti logika yang sama dengan riwayat transaksi
    function getUnit(svc) {
        if (svc.type === 'Kiloan') return 'kg';
        const name = svc.service_name.toLowerCase();
        const isTabung = name.includes('cuci saja') || (name.includes('cuci kering') && !name.includes('setrika'));
        return isTabung ? 'tabung' : 'pcs';
    }

    function showState(icon, text) {
        catalogEl.innerHTML = `<div class="state-box"><i class="ph ${icon}"></i>${escapeHTML(text)}</div>`;
    }

    function cardHTML(svc) {
        const icon = svc.type === 'Kiloan' ? 'ph-scales' : 'ph-t-shirt';
        return `
            <div class="service-card">
                <div class="service-top">
                    <div class="feature-icon"><i class="ph ${icon}"></i></div>
                    <span class="tag">${escapeHTML(svc.type)}</span>
                </div>
                <h3>${escapeHTML(svc.service_name)}</h3>
                <div class="price">${escapeHTML(formatRupiah(svc.rate))} <small>/ ${escapeHTML(getUnit(svc))}</small></div>
            </div>`;
    }

    function render() {
        const keyword = searchInput.value.trim().toLowerCase();
        const filtered = services.filter(s =>
            (activeFilter === 'Semua' || s.type === activeFilter) &&
            s.service_name.toLowerCase().includes(keyword)
        );

        if (filtered.length === 0) {
            showState('ph-magnifying-glass', 'Layanan tidak ditemukan.');
            return;
        }

        const groups = [
            { type: 'Kiloan', title: 'Layanan Kiloan', note: 'dihitung per kilogram' },
            { type: 'Satuan', title: 'Layanan Satuan', note: 'dihitung per tabung' }
        ];

        catalogEl.innerHTML = groups.map(g => {
            const items = filtered.filter(s => s.type === g.type);
            if (items.length === 0) return '';
            return `
                <section class="catalog-group">
                    <h2>${g.title} <small>${g.note}</small></h2>
                    <div class="catalog-grid">${items.map(cardHTML).join('')}</div>
                </section>`;
        }).join('');
    }

    async function loadServices() {
        showState('ph-spinner-gap', 'Memuat layanan...');
        try {
            const res = await fetch('/api/services');
            const json = await res.json();
            if (!res.ok || json.status !== 'success') throw new Error(json.message || 'Gagal memuat');
            services = json.data;
            if (services.length === 0) {
                showState('ph-tray', 'Belum ada layanan yang tersedia.');
                return;
            }
            render();
        } catch (err) {
            showState('ph-warning-circle', 'Gagal memuat katalog. Silakan coba lagi nanti.');
        }
    }

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilter = chip.dataset.filter;
            render();
        });
    });

    searchInput.addEventListener('input', render);

    loadServices();
});
