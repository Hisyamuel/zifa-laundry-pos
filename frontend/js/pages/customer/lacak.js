document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('track-form');
    const input = document.getElementById('resi-input');
    const btn = document.getElementById('track-btn');
    const resultEl = document.getElementById('track-result');

    const STEPS = [
        { status: 'Dicuci', icon: 'ph-washing-machine', desc: 'Pakaian Anda sedang dicuci.' },
        { status: 'Dikeringkan', icon: 'ph-wind', desc: 'Pakaian Anda sedang dikeringkan.' },
        { status: 'Disetrika', icon: 'ph ph-t-shirt', desc: 'Pakaian Anda sedang disetrika dan dirapikan.' },
        { status: 'Siap Ambil', icon: 'ph-package', desc: 'Cucian sudah siap, silakan diambil di gerai.' },
        { status: 'Selesai', icon: 'ph-check-circle', desc: 'Pesanan telah diambil. Terima kasih!' }
    ];

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

    function formatDateTime(str) {
        return str || '-';
    }

    function showError(message) {
        resultEl.innerHTML = `<div class="alert-box"><strong>${escapeHTML(message)}</strong></div>`;
    }

    function render(order) {
        const currentIdx = STEPS.findIndex(s => s.status === order.status);

        const timeline = STEPS.map((step, i) => {
            const cls = i < currentIdx ? 'done' : (i === currentIdx ? 'current' : '');
            const desc = i === currentIdx ? `<p>${escapeHTML(step.desc)}</p>` : '';
            const icon = i < currentIdx ? 'ph-check' : step.icon;
            return `
                <li class="${cls}">
                    <div class="tl-dot"><i class="ph ${icon}"></i></div>
                    <div class="tl-text"><h4>${escapeHTML(step.status)}</h4>${desc}</div>
                </li>`;
        }).join('');

        const items = order.layanan.length
            ? order.layanan.map(l => `<li><span>${escapeHTML(l.name)}</span><span>${escapeHTML(l.quantity)} ${escapeHTML(l.unit)}</span></li>`).join('')
            : '<li><span>-</span><span></span></li>';

        resultEl.innerHTML = `
            <div class="track-card">
                <div class="track-summary">
                    <div><div class="label">Nomor Resi</div><div class="value">${escapeHTML(order.resi)}</div></div>
                    <div><div class="label">Pelanggan</div><div class="value">${escapeHTML(order.pelanggan)}</div></div>
                    <div><div class="label">Tanggal Masuk</div><div class="value">${escapeHTML(formatDateTime(order.tanggal))}</div></div>
                    <div><div class="label">Status</div><div class="status-pill">${escapeHTML(order.status)}</div></div>
                </div>
            </div>
            <div class="track-card">
                <h3>Progres Cucian</h3>
                <ul class="timeline">${timeline}</ul>
            </div>
            <div class="track-card">
                <h3>Rincian Pesanan</h3>
                <ul class="item-list">${items}</ul>
                <div class="total-row"><span>Total</span><span>${escapeHTML(formatRupiah(order.total))}</span></div>
                <p class="track-hint" style="text-align:left;margin-top:8px;">Pembayaran: ${escapeHTML(order.pembayaran)}</p>
            </div>`;
    }

    async function track(resi) {
        btn.disabled = true;
        btn.textContent = 'Mencari...';
        resultEl.innerHTML = '';
        try {
            const res = await fetch('/api/tracking/' + encodeURIComponent(resi));
            const json = await res.json();
            if (!res.ok || json.status !== 'success') {
                showError(json.message || 'Pesanan tidak ditemukan.');
                return;
            }
            render(json.data);
        } catch (err) {
            showError('Tidak dapat terhubung ke server. Silakan coba lagi.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Lacak';
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const resi = input.value.trim().toUpperCase();
        if (!resi) return;
        history.replaceState(null, '', '?resi=' + encodeURIComponent(resi));
        track(resi);
    });

    // Dukung tautan langsung: lacak.html?resi=ZL-XXXX
    const initial = new URLSearchParams(location.search).get('resi');
    if (initial) {
        input.value = initial.toUpperCase();
        track(initial.trim().toUpperCase());
    }
});
