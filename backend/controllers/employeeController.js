// backend/controllers/employeeController.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Ambil daftar semua pegawai (beserta relasi email dari tabel users jika ada)
const getEmployees = async (req, res) => {
    try {
        // Menggunakan join ke tabel users untuk mendapatkan email
        const { data, error } = await supabase
            .from('employee')
            .select(`
                employee_id,
                name,
                phone_number,
                account_status,
                users!inner (email)
            `)
            .order('name', { ascending: true });

        if (error) throw error;

        // Memformat data agar mudah dibaca oleh frontend
        const formattedData = data.map(emp => ({
            id: emp.employee_id,
            name: emp.name,
            email: emp.users.email,
            status: emp.account_status,
            createdAt: emp.created_at
        }));

        return res.status(200).json({ status: 'success', data: formattedData });
    } catch (error) {
        console.error('Error getEmployees:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal memuat data pegawai' });
    }
};

// PUT: Setujui akun pegawai (ubah status dari 'Pending' ke 'Aktif')
const approveEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('employee')
            .update({ account_status: 'Aktif' })
            .eq('employee_id', id)
            .select();

        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ status: 'error', message: 'Pegawai tidak ditemukan' });

        return res.status(200).json({ status: 'success', message: 'Akun pegawai berhasil disetujui' });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

// PUT: Tolak akun pegawai (ubah status ke 'Ditolak' atau Anda bisa menggunakan DELETE jika ingin menghapus permanen)
const rejectEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        // Opsi 1: Ubah status menjadi Ditolak
        const { data, error } = await supabase
            .from('employee')
            .update({ account_status: 'Ditolak' })
            .eq('employee_id', id)
            .select();

        // Opsi 2 (Alternatif): Langsung hapus dari tabel employee & users
        // const { error } = await supabase.from('employee').delete().eq('employee_id', id);

        if (error) throw error;
        return res.status(200).json({ status: 'success', message: 'Pendaftaran akun ditolak' });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

// PUT: Toggle status aktif/nonaktif
const toggleEmployeeStatus = async (req, res) => {
    const { id } = req.params;
    const { newStatus } = req.body; // Expects 'Aktif' or 'Nonaktif'

    if (!['Aktif', 'Nonaktif'].includes(newStatus)) {
        return res.status(400).json({ status: 'error', message: 'Status tidak valid' });
    }

    try {
        const { data, error } = await supabase
            .from('employee')
            .update({ account_status: newStatus })
            .eq('employee_id', id)
            .select();

        if (error) throw error;
        return res.status(200).json({ status: 'success', message: `Akun berhasil diubah menjadi ${newStatus}` });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = {
    getEmployees,
    approveEmployee,
    rejectEmployee,
    toggleEmployeeStatus
};