// backend/controllers/dashboardController.js
const { createClient } = require('@supabase/supabase-js');

// Inisialisasi Supabase Client menggunakan environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Endpoint: GET /api/dashboard
 * Mengembalikan data statistik dasbor Owner menggunakan data real dari Supabase, 
 * kecuali diagram batang yang tetap dummy.
 */
const getDashboardStats = async (req, res) => {
    try {
        // 1. Menentukan batasan waktu untuk "Hari Ini"
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfDay = today.toISOString();
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const endOfDay = tomorrow.toISOString();

        // --- Eksekusi Query ke Supabase Secara Paralel ---
        
        // Query A: Ambil pesanan hari ini untuk Pendapatan & Jumlah Pesanan
        const queryToday = supabase
            .from('pesanan')
            .select('total_cost')
            .gte('transaction_date', startOfDay)
            .lt('transaction_date', endOfDay);

        // Query B: Hitung pesanan "Dalam Proses" (Status: Dicuci, Dikeringkan, Disetrika)
        const queryProses = supabase
            .from('pesanan')
            .select('*', { count: 'exact', head: true })
            .in('laundry_status', ['Dicuci', 'Dikeringkan', 'Disetrika']);

        // Query C: Hitung pesanan "Siap Diambil"
        const querySiap = supabase
            .from('pesanan')
            .select('*', { count: 'exact', head: true })
            .eq('laundry_status', 'Siap Ambil');

        // Query D: Ambil 4 Transaksi Terbaru (Join dengan tabel customer)
        const queryTerbaru = supabase
            .from('pesanan')
            .select(`
                resi_number, 
                total_cost, 
                customer (name)
            `)
            .order('transaction_date', { ascending: false })
            .limit(4);

        // Tunggu semua query selesai bersamaan agar respons API lebih cepat
        const [resToday, resProses, resSiap, resTerbaru] = await Promise.all([
            queryToday, queryProses, querySiap, queryTerbaru
        ]);

        // Jika terjadi error pada salah satu query, lempar error
        if (resToday.error) throw resToday.error;
        if (resProses.error) throw resProses.error;
        if (resSiap.error) throw resSiap.error;
        if (resTerbaru.error) throw resTerbaru.error;

        // --- Kalkulasi & Pemetaan Data ---

        // Hitung total pendapatan dari array 'total_cost' pesanan hari ini
        const pendapatanHariIni = resToday.data.reduce((sum, order) => sum + Number(order.total_cost || 0), 0);
        const pesananMasuk = resToday.data.length;

        // Map transaksi terbaru agar format strukturnya sesuai dengan yang diharapkan frontend (dashboard.js)
        const transaksiTerbaru = resTerbaru.data.map(trx => ({
            resi: trx.resi_number,
            customer: trx.customer ? trx.customer.name : 'Pelanggan Umum',
            total: Number(trx.total_cost || 0)
        }));

        // 2. Simulasi data chart pendapatan 7 hari terakhir (Biarkan Dummy)
        const chart7Hari = [
            { hari: 'Sen', persentase: 40 },
            { hari: 'Sel', persentase: 65 },
            { hari: 'Rab', persentase: 50 },
            { hari: 'Kam', persentase: 80 },
            { hari: 'Jum', persentase: 60 },
            { hari: 'Sab', persentase: 90 },
            { hari: 'Min', persentase: 72 }
        ];

        // 3. Susun Payload Akhir
        const responsePayload = {
            status: 'success',
            data: {
                stats: {
                    pendapatanHariIni: pendapatanHariIni,
                    pesananMasuk: pesananMasuk,
                    dalamProses: resProses.count || 0,
                    siapDiambil: resSiap.count || 0
                },
                chart7Hari: chart7Hari,
                transaksiTerbaru: transaksiTerbaru
            }
        };

        return res.status(200).json(responsePayload);

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal mengambil data dasbor' });
    }
};

module.exports = {
    getDashboardStats
};