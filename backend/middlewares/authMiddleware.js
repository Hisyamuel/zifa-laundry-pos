const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_zifa_laundry_super_aman';

// Inisialisasi Supabase di dalam middleware
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Akses ditolak. Token tidak ditemukan.' });
    }

    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).json({ status: 'error', message: 'Sesi kedaluwarsa atau token tidak valid.' });
        }

        try {
            // CEK DATABASE: Pastikan user belum dihapus
            const { data: dbUser } = await supabase.from('users').select('*').eq('user_id', user.id).maybeSingle();
            
            if (!dbUser) {
                return res.status(401).json({ status: 'error', message: 'Akses ditolak: Akun Anda telah dihapus.' });
            }

            // CEK DATABASE: Jika dia pegawai, pastikan statusnya masih 'Aktif'
            if (dbUser.role === 'employee') {
                const { data: empData } = await supabase.from('employee').select('account_status').eq('employee_id', user.id).single();
                if (empData && empData.account_status !== 'Aktif') {
                    return res.status(403).json({ status: 'error', message: 'Akses ditolak: Akun Anda telah dinonaktifkan.' });
                }
            }

            req.user = user;
            next(); 
        } catch (dbError) {
            return res.status(500).json({ status: 'error', message: 'Gagal memvalidasi status akun.' });
        }
    });
};

module.exports = authenticateToken;