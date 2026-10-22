// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_zifa_laundry_super_aman';

const authenticateToken = (req, res, next) => {
    // Ambil token dari header Authorization (Format: "Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Akses ditolak. Token tidak ditemukan. Silakan login kembali.' });
    }

    // Verifikasi keaslian dan masa berlaku token
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ status: 'error', message: 'Sesi telah kedaluwarsa atau token tidak valid.' });
        }

        // Simpan data user ke dalam request agar bisa dibaca oleh Controller
        req.user = user;
        next(); // Persilakan masuk ke Controller
    });
};

module.exports = authenticateToken;