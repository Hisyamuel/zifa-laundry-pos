// backend/controllers/employeeController.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

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
                created_at,
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

// PUT: Setujui Akun
const approveEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('employee')
            .update({ account_status: 'Aktif' }) // Harus sama persis dengan aturan database
            .eq('employee_id', id);

        if (error) throw error;
        return res.status(200).json({ status: 'success', message: 'Akun pegawai berhasil disetujui.' });
    } catch (error) {
        console.error('Error approve:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal menyetujui akun.' });
    }
};

// DELETE: Tolak Akun (Hapus secara permanen)
const rejectEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        // Cukup hapus dari tabel 'users'. 
        // Berkat aturan ON DELETE CASCADE, data di tabel 'employee' akan otomatis ikut terhapus.
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('user_id', id);

        if (error) throw error;
        return res.status(200).json({ status: 'success', message: 'Pendaftaran ditolak/Akun dihapus.' });
    } catch (error) {
        console.error('Error reject:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal menolak akun.' });
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