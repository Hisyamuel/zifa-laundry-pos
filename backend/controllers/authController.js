const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_zifa_laundry_super_aman';

// --- LOGIKA LOGIN ---
const login = async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('role', role.toLowerCase())
            .maybeSingle();

        if (error || !user) {
            return res.status(401).json({ status: 'error', message: 'Email atau status peran salah.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Kata sandi salah.' });
        }

        let userName = '';
        if (user.role === 'owner') {
            const { data: ownerData } = await supabase.from('owner').select('name').eq('owner_id', user.user_id).single();
            userName = ownerData ? ownerData.name : 'Owner';
        } else if (user.role === 'employee') {
            const { data: empData } = await supabase.from('employee').select('name, account_status').eq('employee_id', user.user_id).single();
            
            // SESUAIKAN DENGAN DATABASE
            if (empData && empData.account_status === 'Menunggu persetujuan') {
                return res.status(403).json({ status: 'error', message: 'Akun Anda masih menunggu persetujuan Owner.' });
            }
            if (empData && empData.account_status === 'Nonaktif') {
                return res.status(403).json({ status: 'error', message: 'Akun Anda telah dinonaktifkan.' });
            }
            userName = empData ? empData.name : 'Employee';
        }

        const token = jwt.sign({ id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '12h' });

        return res.status(200).json({
            status: 'success',
            message: 'Login berhasil',
            data: {
                token: token,
                user: {
                    role: user.role === 'owner' ? 'Owner' : 'Employee',
                    name: userName
                }
            }
        });

    } catch (error) {
        console.error('Error saat login:', error);
        return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal server.' });
    }
};

// --- LOGIKA DAFTAR (KHUSUS EMPLOYEE) ---
const register = async (req, res) => {
    // Tangkap tambahan 'phone' dari req.body
    const { name, email, password, phone } = req.body;

    try {
        const { data: existUser } = await supabase.from('users').select('email').eq('email', email).maybeSingle();
        if (existUser) {
            return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar. Silakan gunakan email lain.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userId = 'EMP-' + Date.now();

        const { error: userErr } = await supabase.from('users').insert([{
            user_id: userId,
            email: email,
            password: hashedPassword,
            role: 'employee'
        }]);
        if (userErr) throw userErr;

        const { error: empErr } = await supabase.from('employee').insert([{
            employee_id: userId,
            name: name,
            phone_number: phone || '-',  
            account_status: 'Menunggu persetujuan' 
        }]);
        if (empErr) throw empErr;;

        return res.status(201).json({ status: 'success', message: 'Pendaftaran berhasil. Silakan tunggu persetujuan Owner.' });

    } catch (error) {
        console.error('Error saat register:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal mendaftarkan akun.' });
    }
};

module.exports = { login, register };