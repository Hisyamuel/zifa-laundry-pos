// Deklarasi variabel global untuk menyimpan ID layanan yang akan dihapus
let serviceIdToDelete = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchServices();

    // Event Listener untuk Form Submit
    document.getElementById('form-layanan').addEventListener('submit', handleFormSubmit);

    // Event Listener untuk tombol Batal Edit
    document.getElementById('btn-cancel-edit').addEventListener('click', resetFormMode);

    // Event Listener untuk tombol di dalam Modal Hapus
    document.getElementById('btn-cancel-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('btn-confirm-delete').addEventListener('click', executeDelete);
});

// --- SISTEM TOAST NOTIFICATION ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Animasi masuk
    setTimeout(() => toast.classList.add('show'), 10);

    // Hilang otomatis setelah 3 detik
    setTimeout(() => {
        toast.classList.remove('show');
        // Hapus elemen dari DOM setelah animasi selesai
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// === READ: Tampilkan Data ===
async function fetchServices() {
    try {
        const response = await fetch('http://localhost:3000/api/services');
        const result = await response.json();
        renderTable(result.data);
    } catch (error) {
        console.error('Gagal memuat layanan:', error);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('table-layanan-body');
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Layanan belum ditambahkan.</td></tr>';
        return;
    }

    data.forEach(item => {
        // Logika dinamis untuk mengubah pcs menjadi tabung
        const isTabung = item.service_name.toLowerCase().includes('cuci saja') || 
                         (item.service_name.toLowerCase().includes('cuci kering') && !item.service_name.toLowerCase().includes('setrika'));
        
        let satuanTarif = item.type === 'Kiloan' ? '/ kg' : '/ pcs';
        if (item.type === 'Satuan' && isTabung) satuanTarif = '/ tabung';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.service_name}</td>
            <td>${item.type}</td>
            <td>Rp ${item.rate.toLocaleString('id-ID')} ${satuanTarif}</td>
            <td>
                <button onclick="editMode('${item.service_id}', '${item.service_name}', '${item.type}', ${item.rate})" class="btn-link text-blue">Ubah</button>
                <span>·</span>
                <button onclick="openDeleteModal('${item.service_id}', '${item.service_name}')" class="btn-link text-red">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// === CREATE & UPDATE: Submit Form ===
async function handleFormSubmit(e) {
    e.preventDefault();

    const idHidden = document.getElementById('service-id-hidden').value;
    const name = document.getElementById('input-nama').value;
    const type = document.getElementById('select-tipe').value;
    const rate = document.getElementById('input-tarif').value;

    const payload = {
        service_name: name,
        type: type,
        rate: parseInt(rate)
    };

    // Menangkap elemen tombol dan mengubah state-nya menjadi loading
    const btnSubmit = document.getElementById('btn-submit-layanan');
    const originalText = btnSubmit.textContent; // "Simpan layanan" atau "Perbarui Layanan"
    btnSubmit.textContent = 'Memproses...';
    btnSubmit.disabled = true;

    try {
        let url = 'http://localhost:3000/api/services';
        let method = 'POST'; 

        if (idHidden) {
            url = `http://localhost:3000/api/services/${idHidden}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            showToast(result.message, 'success');
            resetFormMode(); 
            fetchServices(); 
        } else {
            showToast(result.message || 'Terjadi kesalahan', 'error');
        }
    } catch (error) {
        showToast('Gagal menghubungi server', 'error');
        console.error(error); 
    } finally {
        // Mengembalikan teks dan mengaktifkan tombol kembali setelah selesai
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
    }
}

// === UPDATE (Prep): Persiapan Mode Edit ===
window.editMode = function (id, name, type, rate) {
    document.getElementById('service-id-hidden').value = id;
    document.getElementById('input-nama').value = name;
    document.getElementById('select-tipe').value = type;
    document.getElementById('input-tarif').value = rate;

    // Mengubah teks tombol dan menampilkan tombol batal
    document.getElementById('btn-submit-layanan').textContent = 'Perbarui Layanan';
    document.getElementById('btn-cancel-edit').style.display = 'block';
};

function resetFormMode() {
    document.getElementById('form-layanan').reset();
    document.getElementById('service-id-hidden').value = '';

    document.getElementById('btn-submit-layanan').textContent = 'Simpan layanan';
    document.getElementById('btn-cancel-edit').style.display = 'none';
}

// === DELETE: Hapus Data ===
window.openDeleteModal = function (id, name) {
    serviceIdToDelete = id; 
    document.getElementById('delete-service-name').textContent = name;
    
    const modal = document.getElementById('delete-modal');
    modal.style.display = 'flex'; 
    
    setTimeout(() => modal.classList.add('show-modal'), 10);
};

function closeDeleteModal() {
    serviceIdToDelete = null;
    const modal = document.getElementById('delete-modal');
    
    // Hilangkan class animasi terlebih dahulu
    modal.classList.remove('show-modal');
    
    // Tunggu transisi 0.3 detik selesai, baru hilangkan dari DOM
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

async function executeDelete() {
    if (!serviceIdToDelete) return;

    // Menambahkan efek loading pada tombol agar pengguna tahu proses sedang berjalan
    const btnConfirm = document.getElementById('btn-confirm-delete');
    const originalText = btnConfirm.textContent;
    btnConfirm.textContent = 'Menghapus...';
    btnConfirm.disabled = true;

    try {
        const response = await fetch(`http://localhost:3000/api/services/${serviceIdToDelete}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (response.ok) {
            showToast(result.message, 'success');
            fetchServices(); // Refresh tabel setelah terhapus
        } else {
            showToast(result.message || 'Gagal menghapus', 'error');
        }
    } catch (error) {
        showToast('Gagal menghubungi server', 'error');
    } finally {
        btnConfirm.textContent = originalText;
        btnConfirm.disabled = false;
        closeDeleteModal(); 
    }
}