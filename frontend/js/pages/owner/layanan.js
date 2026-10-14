// PERBAIKAN 1: Deklarasi variabel global untuk menyimpan ID layanan yang akan dihapus
let serviceIdToDelete = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchServices();

    // Event Listener untuk Form Submit
    document.getElementById('form-layanan').addEventListener('submit', handleFormSubmit);

    // Event Listener untuk tombol Batal Edit
    document.getElementById('btn-cancel-edit').addEventListener('click', resetFormMode);

    // PERBAIKAN 2: Daftarkan Event Listener untuk tombol di dalam Modal Hapus
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

// === 1. READ: Tampilkan Data ===
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

    data.forEach(item => {
        const satuanTarif = item.type === 'Kiloan' ? '/ kg' : '/ pcs';
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

// === 2. CREATE & UPDATE: Submit Form ===
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

    try {
        let url = 'http://localhost:3000/api/services';
        let method = 'POST'; // Default adalah CREATE

        // Jika ID tersembunyi ada isinya, berarti mode UPDATE
        if (idHidden) {
            url = `http://localhost:3000/api/services/${idHidden}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // PERBAIKAN 3: Ekstrak JSON dari response agar variabel 'result' dikenali
        const result = await response.json();

        if (response.ok) {
            showToast(result.message, 'success');
            resetFormMode(); // Kembalikan form ke keadaan kosong
            fetchServices(); // Refresh tabel
        } else {
            showToast(result.message || 'Terjadi kesalahan', 'error');
        }
    } catch (error) {
        showToast('Gagal menghubungi server', 'error');
        console.error(error); // Untuk membantu pelacakan jika ada error lain
    }
}

// === 3. UPDATE (Prep): Persiapan Mode Edit ===
window.editMode = function (id, name, type, rate) {
    document.getElementById('service-id-hidden').value = id;
    document.getElementById('input-nama').value = name;
    document.getElementById('select-tipe').value = type;
    document.getElementById('input-tarif').value = rate;

    // Ubah teks tombol dan tampilkan tombol batal
    document.getElementById('btn-submit-layanan').textContent = 'Perbarui Layanan';
    document.getElementById('btn-cancel-edit').style.display = 'block';
};

function resetFormMode() {
    document.getElementById('form-layanan').reset();
    document.getElementById('service-id-hidden').value = '';

    document.getElementById('btn-submit-layanan').textContent = 'Simpan layanan';
    document.getElementById('btn-cancel-edit').style.display = 'none';
}

// === 4. DELETE: Hapus Data ===
window.openDeleteModal = function (id, name) {
    serviceIdToDelete = id; // Simpan ID ke variabel global
    document.getElementById('delete-service-name').textContent = name;
    document.getElementById('delete-modal').style.display = 'flex'; // Tampilkan modal
};

function closeDeleteModal() {
    serviceIdToDelete = null;
    document.getElementById('delete-modal').style.display = 'none'; // Sembunyikan modal
}

async function executeDelete() {
    if (!serviceIdToDelete) return;

    try {
        const response = await fetch(`http://localhost:3000/api/services/${serviceIdToDelete}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (response.ok) {
            showToast(result.message, 'success');
            fetchServices();
        } else {
            showToast(result.message || 'Gagal menghapus', 'error');
        }
    } catch (error) {
        showToast('Gagal menghubungi server', 'error');
    } finally {
        closeDeleteModal(); // Selalu tutup modal setelah selesai
    }
}