const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Pastikan authMiddleware sudah dijalankan sebelumnya sehingga req.user ada isinya
        if (!req.user || !req.user.role) {
            return res.status(403).json({ status: 'error', message: 'Akses ditolak. Peran tidak dikenali.' });
        }

        // Cek apakah peran user ada di dalam daftar peran yang diizinkan (huruf kecil)
        const userRole = req.user.role.toLowerCase();
        const roles = allowedRoles.map(r => r.toLowerCase());

        if (!roles.includes(userRole)) {
            return res.status(403).json({ status: 'error', message: 'Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.' });
        }

        next(); // masuk ke Controller
    };
};

module.exports = authorizeRoles;