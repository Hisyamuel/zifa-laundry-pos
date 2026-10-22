// backend/controllers/serviceController.js
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Inisialisasi Supabase Client menggunakan environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// READ: Ambil semua data dari tabel 'layanan'
const getServices = async (_req, res) => {
    try {
        const { data, error } = await supabase
            .from('layanan')
            .select('*')
            .order('service_name', { ascending: true }); // Opsional: mengurutkan abjad

        if (error) throw error;
        return res.status(200).json({ status: 'success', data: data });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

// CREATE: Tambah layanan baru ke Supabase
const createService = async (req, res) => {
    const { service_name, type, rate } = req.body;

    // Validasi input dasar
    if (!service_name || !type || !rate) {
        return res.status(400).json({ status: 'error', message: 'Semua kolom wajib diisi' });
    }

    try {
        const newService = {
            service_id: `srv-${uuidv4().slice(0, 8)}`, // Membuat ID unik dengan prefix
            service_name,
            type,
            rate: Number(rate)
        };

        const { data, error } = await supabase
            .from('layanan')
            .insert([newService])
            .select();

        if (error) throw error;
        return res.status(201).json({ status: 'success', data: data[0], message: 'Layanan berhasil ditambahkan' });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

// UPDATE: Ubah data layanan di Supabase
const updateService = async (req, res) => {
    const { id } = req.params;
    const { service_name, type, rate } = req.body;

    try {
        const { data, error } = await supabase
            .from('layanan')
            .update({
                service_name,
                type,
                rate: Number(rate)
            })
            .eq('service_id', id)
            .select();

        if (error) throw error;

        // Cek jika layanan dengan ID tersebut tidak ada
        if (data.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Layanan tidak ditemukan' });
        }

        return res.status(200).json({ status: 'success', message: 'Layanan berhasil diperbarui', data: data[0] });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

// DELETE: Hapus layanan dari Supabase
const deleteService = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('layanan')
            .delete()
            .eq('service_id', id)
            .select();

        if (error) {
            // Tangkap error Foreign Key Constraint jika layanan sudah terpakai di riwayat pesanan
            if (error.code === '23503') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Gagal: Layanan ini sudah terpakai dalam transaksi pelanggan. Ubah nama/tarifnya saja.'
                });
            }
            throw error; // Lempar error lain jika ada
        }

        if (data.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Layanan tidak ditemukan' });
        }

        return res.status(200).json({ status: 'success', message: 'Layanan berhasil dihapus' });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = {
    getServices,
    createService,
    updateService,
    deleteService
};