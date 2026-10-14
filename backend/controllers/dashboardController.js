/**
 * Endpoint: GET /api/dashboard
 * Mengembalikan data statistik dasbor Owner menggunakan data dummy.
 */
const getDashboardStats = (req, res) => {
    // 1. Simulasi data agregat untuk 4 kartu statistik teratas
    const stats = {
        pendapatanHariIni: 1250000,
        pesananMasuk: 28,
        dalamProses: 17, // Kalkulasi pesanan berstatus: Dicuci, Dikeringkan, Disetrika
        siapDiambil: 6
    };

    // 2. Simulasi data chart pendapatan 7 hari terakhir
    const chart7Hari = [
        { hari: 'Sen', persentase: 40 },
        { hari: 'Sel', persentase: 65 },
        { hari: 'Rab', persentase: 50 },
        { hari: 'Kam', persentase: 80 },
        { hari: 'Jum', persentase: 60 },
        { hari: 'Sab', persentase: 90 },
        { hari: 'Min', persentase: 72 }
    ];

    // 3. Simulasi data riwayat transaksi terbaru (INNER JOIN pesanan & customer)
    const transaksiTerbaru = [
        { resi: 'ZL-0412', customer: 'Siti Aulia', total: 24000 },
        { resi: 'ZL-0411', customer: 'Budi Santoso', total: 25000 },
        { resi: 'ZL-0410', customer: 'Rina Marlina', total: 30000 },
        { resi: 'ZL-0409', customer: 'Dedi Kurnia', total: 60000 }
    ];

    // Menyusun payload JSON
    const responsePayload = {
        status: 'success',
        data: {
            stats,
            chart7Hari,
            transaksiTerbaru
        }
    };

    // Mengirim response (Express.js)
    return res.status(200).json(responsePayload);
};

module.exports = {
    getDashboardStats
};