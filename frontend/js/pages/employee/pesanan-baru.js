document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // DEKLARASI ELEMEN DOM
    // ==========================================
    const formPesanan = document.getElementById("form-pesanan");
    const selectLayanan = document.getElementById("layanan");
    const inputKuantitas = document.getElementById("kuantitas");
    const ringkasanItems = document.getElementById("ringkasan-items");
    const textTotalBiaya = document.getElementById("total-biaya");
    const btnTipeKilo = document.getElementById("tipe-kilo");
    const btnTipeSatuan = document.getElementById("tipe-satuan");
    const payBtns = document.querySelectorAll(".pay-btn");
    const btnSimpanCetak = document.getElementById("btn-simpan-cetak");
    const btnKirimWa = document.getElementById("btn-kirim-wa");
    const btnLogout = document.querySelector(".logout-btn");

    // ==========================================
    // STATE ATAU VARIABEL GLOBAL
    // ==========================================
    let totalBiaya = 0;
    let selectedMethod = "tunai";
    let layananList = [];
    let lastSavedOrder = null; 

    // ==========================================
    // HELPER & UTILITY FUNCTIONS
    // ==========================================

    // Custom Toast Notification
    function showToast(message, type = 'success') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    }

    function formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    }

    function updateSlider(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const activeBtn = container.querySelector('button.on');
        const indicator = container.querySelector('.slider-indicator');

        if (activeBtn && indicator) {
            indicator.style.width = `${activeBtn.offsetWidth}px`;
            indicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
        }
    }

    function resetRingkasan(keepTotal = false) {
        if (!keepTotal) {
            ringkasanItems.innerHTML = '<div style="color: var(--mu); font-style: italic; font-size: 14px;">Belum ada layanan dipilih</div>';
        } else {
            ringkasanItems.innerHTML = '<div style="color: var(--mu); font-style: italic; font-size: 14px;">Masukkan jumlah/berat...</div>';
        }
        textTotalBiaya.textContent = "Rp 0";
        totalBiaya = 0;
    }

    function renderLayananOptions(data) {
        selectLayanan.innerHTML = '<option value="" disabled selected>Pilih layanan</option>';

        data.forEach(item => {
            const option = document.createElement("option");
            option.value = item.service_id;

            const isKilo = item.type && item.type.toLowerCase().includes('kilo');
            const tipeLabel = isKilo ? 'Kiloan' : 'Satuan';
            const tipeCode = isKilo ? 'kilo' : 'satuan';

            option.textContent = `${item.service_name} (${tipeLabel})`;
            option.dataset.harga = item.rate;
            option.dataset.tipe = tipeCode;
            option.dataset.nama = item.service_name;

            selectLayanan.appendChild(option);
        });
    }

    function printResi(data) {
        const iframe = document.getElementById("print-frame");
        const doc = iframe.contentWindow.document;

        const resiHTML = `
            <html>
            <head>
                <style>
                    body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; width: 58mm; }
                    .center { text-align: center; }
                    .divider { border-bottom: 1px dashed black; margin: 5px 0; }
                    .row { display: flex; justify-content: space-between; margin: 3px 0; }
                </style>
            </head>
            <body>
                <div class="center">
                    <h2>ZIFA LAUNDRY</h2>
                    <p>Telp: 082159103747</p>
                </div>
                <div class="divider"></div>
                <p>No. Resi : ${data.noResi}</p>
                <p>Tanggal  : ${new Date().toLocaleString('id-ID')}</p>
                <p>Pelanggan: ${data.pelanggan}</p>
                <div class="divider"></div>
                <div class="row">
                    <span>${data.layanan} (${data.kuantitas})</span>
                </div>
                <div class="row">
                    <span>Total</span>
                    <span>${formatRupiah(data.total)}</span>
                </div>
                <div class="row">
                    <span>Bayar</span>
                    <span>${data.metode.toUpperCase()}</span>
                </div>
                <div class="divider"></div>
                <div class="center">
                    <p>Terima Kasih</p>
                </div>
            </body>
            </html>
        `;

        doc.open();
        doc.write(resiHTML);
        doc.close();

        iframe.contentWindow.focus();
        setTimeout(() => iframe.contentWindow.print(), 500);
    }

    function updateRingkasan() {
        const option = selectLayanan.options[selectLayanan.selectedIndex];
        if (!option || !option.value) {
            resetRingkasan();
            return;
        }

        const harga = parseFloat(option.dataset.harga);
        const tipe = option.dataset.tipe;
        const namaLayanan = option.dataset.nama;
        const kuantitas = parseFloat(inputKuantitas.value) || 0;

        if (tipe === "kilo") {
            btnTipeKilo.classList.add("on");
            btnTipeSatuan.classList.remove("on");
        } else {
            btnTipeSatuan.classList.add("on");
            btnTipeKilo.classList.remove("on");
        }
        updateSlider("seg-tipe-hitung");

        if (kuantitas > 0) {
            totalBiaya = harga * kuantitas;
            const satuanTeks = tipe === "kilo" ? "kg" : "pcs";

            ringkasanItems.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
                    <span>${namaLayanan} • ${kuantitas} ${satuanTeks} &times; ${formatRupiah(harga)}</span>
                    <span>${formatRupiah(totalBiaya)}</span>
                </div>
            `;
            textTotalBiaya.textContent = formatRupiah(totalBiaya);
        } else {
            resetRingkasan(true);
        }
    }

    function handlePaymentSelection(targetBtn) {
        payBtns.forEach(b => b.classList.remove("on"));
        targetBtn.classList.add("on");
        updateSlider("seg-metode-bayar");

        selectedMethod = targetBtn.dataset.method;
    }

    function handleKirimWa() {
        let pelanggan = document.getElementById("pelanggan").value;
        let noHp = document.getElementById("no_hp").value;
        let noResi = "";

        // Jika form sudah di-reset setelah simpan, gunakan data dari simpanan terakhir
        if ((!pelanggan || !noHp) && lastSavedOrder) {
            pelanggan = lastSavedOrder.pelanggan;
            noHp = lastSavedOrder.no_hp;
            noResi = lastSavedOrder.noResi;
        } else if (lastSavedOrder) {
            noResi = lastSavedOrder.noResi;
        }

        if (!pelanggan || !noHp) {
            showToast("Harap lengkapi data pelanggan terlebih dahulu.", "error");
            return;
        }

        if (!noResi) {
            showToast("Harap simpan pesanan terlebih dahulu untuk mendapatkan nomor resi.", "error");
            return;
        }

        if (noHp.startsWith('0')) noHp = '62' + noHp.substring(1);

        const pesan = `Halo kak ${pelanggan},\nIni adalah resi digital dari Zifa Laundry.\n\nNomor Resi: ${noResi}\nStatus: Dicuci\n\nDetail pesanan Anda sudah masuk dalam antrean cucian.\nTerima kasih!`;
        window.open(`https://wa.me/${noHp}?text=${encodeURIComponent(pesan)}`, '_blank');
    }

    // ==========================================
    // ASYNC FUNCTIONS
    // ==========================================
    async function fetchLayanan() {
        try {
            const response = await fetch('/api/orders/layanan');
            const result = await response.json();

            if (result.status === 'success') {
                layananList = result.data;
                renderLayananOptions(layananList);
            } else {
                selectLayanan.innerHTML = '<option value="" disabled selected>Gagal memuat layanan</option>';
                showToast("Gagal mengambil data layanan dari server.", "error");
            }
        } catch (error) {
            console.error("Gagal memuat layanan:", error);
            showToast("Koneksi terputus, memuat data layanan cadangan.", "error");

            const dummyData = [
                { service_id: "L01", service_name: "Cuci Kering", type: "Kiloan", rate: 10000 },
                { service_id: "L02", service_name: "Cuci Kering + Setrika", type: "Kiloan", rate: 15000 },
                { service_id: "L03", service_name: "Cuci Saja", type: "Kiloan", rate: 8000 }
            ];
            layananList = dummyData;
            renderLayananOptions(layananList);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (totalBiaya <= 0) {
            showToast("Harap lengkapi data layanan dan jumlah/berat.", "error");
            return;
        }

        const originalBtnText = btnSimpanCetak.textContent;
        btnSimpanCetak.disabled = true;
        btnSimpanCetak.textContent = "Memproses...";

        const formData = new FormData(formPesanan);
        const payload = {
            pelanggan: formData.get("pelanggan"),
            no_hp: formData.get("no_hp"),
            layanan_id: formData.get("layanan_id"),
            kuantitas: parseFloat(formData.get("kuantitas")),
            total_biaya: totalBiaya,
            metode_bayar: selectedMethod
        };

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.status === 'success') {
                const noResi = result.data.resi_number;

                lastSavedOrder = {
                    pelanggan: payload.pelanggan,
                    no_hp: payload.no_hp,
                    noResi: noResi
                };

                const printData = {
                    noResi: noResi,
                    pelanggan: payload.pelanggan,
                    layanan: selectLayanan.options[selectLayanan.selectedIndex].dataset.nama,
                    kuantitas: payload.kuantitas,
                    total: payload.total_biaya,
                    metode: payload.metode_bayar
                };

                printResi(printData);
                showToast(`Pesanan berhasil disimpan (No. Resi: ${noResi})`, "success");

                formPesanan.reset();
                resetRingkasan();
            } else {
                showToast("Gagal menyimpan pesanan: " + result.message, "error");
            }
        } catch (error) {
            console.error("Gagal mengirim pesanan:", error);
            const noResi = "ZL-" + Math.floor(1000 + Math.random() * 9000);

            lastSavedOrder = {
                pelanggan: payload.pelanggan,
                no_hp: payload.no_hp,
                noResi: noResi
            };

            printResi({
                noResi: noResi,
                pelanggan: payload.pelanggan,
                layanan: selectLayanan.options[selectLayanan.selectedIndex].dataset.nama,
                kuantitas: payload.kuantitas,
                total: payload.total_biaya,
                metode: payload.metode_bayar
            });
            showToast(`Pesanan tersimpan lokal (No. Resi: ${noResi})`, "success");

            formPesanan.reset();
            resetRingkasan();
        } finally {
            // Kembalikan tombol ke keadaan semula
            btnSimpanCetak.disabled = false;
            btnSimpanCetak.textContent = originalBtnText;
        }
    }

    // ==========================================
    // INISIALISASI & EVENT LISTENERS
    // ==========================================
    if (btnLogout) {
        btnLogout.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "/frontend/pages/auth/auth.html";
        });
    }

    selectLayanan.addEventListener("change", updateRingkasan);
    inputKuantitas.addEventListener("input", updateRingkasan);

    payBtns.forEach(btn => {
        btn.addEventListener("click", (e) => handlePaymentSelection(e.target));
    });

    formPesanan.addEventListener("submit", handleSubmit);

    if (btnKirimWa) {
        btnKirimWa.addEventListener("click", handleKirimWa);
    }

    fetchLayanan();
    setTimeout(() => {
        updateSlider("seg-tipe-hitung");
        updateSlider("seg-metode-bayar");
    }, 100);
});