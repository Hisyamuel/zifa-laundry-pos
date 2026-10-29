const { createClient } = require('@supabase/supabase-js');
const NodeCache = require('node-cache'); 

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Inisialisasi Cache dengan kedaluwarsa 5 menit (300 detik)
const dashboardCache = new NodeCache({ stdTTL: 300 });

const getDashboardStats = async (_req, res) => {
    try {
        const cacheKey = 'dashboard_owner_data';
        const cachedData = dashboardCache.get(cacheKey);

        if (cachedData) {
            console.log('Mengambil Dashboard dari Cache');
            return res.status(200).json(cachedData);
        }

        console.log('Memproses kueri Dashboard dari Supabase');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfDay = today.toISOString();
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const endOfDay = tomorrow.toISOString();

        // Query Batas 7 Hari Terakhir
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 6 hari lalu + hari ini
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const startOf7Days = sevenDaysAgo.toISOString();

        const queryToday = supabase
            .from('pesanan')
            .select('total_cost')
            .gte('transaction_date', startOfDay)
            .lt('transaction_date', endOfDay);

        const queryProses = supabase
            .from('pesanan')
            .select('*', { count: 'exact', head: true })
            .in('laundry_status', ['Dicuci', 'Dikeringkan', 'Disetrika']);

        const querySiap = supabase
            .from('pesanan')
            .select('*', { count: 'exact', head: true })
            .eq('laundry_status', 'Siap Ambil');

        const queryTerbaru = supabase
            .from('pesanan')
            .select('resi_number, total_cost, customer (name)')
            .order('transaction_date', { ascending: false })
            .limit(4);
            
        // Kueri 7 hari terakhir untuk Chart
        const queryChart = supabase
            .from('pesanan')
            .select('transaction_date, total_cost')
            .gte('transaction_date', startOf7Days)
            .lt('transaction_date', endOfDay);

        const [resToday, resProses, resSiap, resTerbaru, resChart] = await Promise.all([
            queryToday, queryProses, querySiap, queryTerbaru, queryChart
        ]);

        if (resToday.error) throw resToday.error;
        if (resProses.error) throw resProses.error;
        if (resSiap.error) throw resSiap.error;
        if (resTerbaru.error) throw resTerbaru.error;
        if (resChart.error) throw resChart.error;

        const pendapatanHariIni = resToday.data.reduce((sum, order) => sum + Number(order.total_cost || 0), 0);
        const pesananMasuk = resToday.data.length;

        const transaksiTerbaru = resTerbaru.data.map(trx => ({
            resi: trx.resi_number,
            customer: trx.customer ? trx.customer.name : 'Pelanggan Umum',
            total: Number(trx.total_cost || 0)
        }));

        // Logika Chart Dinamis 7 Hari
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const chartDataMap = {};
        
        // Inisialisasi 7 hari terakhir dengan Rp 0
        let maxDailyRevenue = 0;
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            chartDataMap[dateStr] = { 
                hari: dayNames[d.getDay()], 
                total: 0 
            };
        }

        // Agregasi Data
        resChart.data.forEach(order => {
            const dateStr = order.transaction_date.split('T')[0];
            if (chartDataMap[dateStr]) {
                chartDataMap[dateStr].total += Number(order.total_cost || 0);
                if (chartDataMap[dateStr].total > maxDailyRevenue) {
                    maxDailyRevenue = chartDataMap[dateStr].total;
                }
            }
        });

        // Konversi ke persentase untuk tinggi bar 
        const chart7Hari = Object.values(chartDataMap).map(item => {
            const persentase = maxDailyRevenue === 0 ? 0 : Math.round((item.total / maxDailyRevenue) * 100);
            return {
                hari: item.hari,
                persentase: persentase,
                rawTotal: item.total 
            };
        });

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

        // Simpan Payload ke dalam Memori
        dashboardCache.set(cacheKey, responsePayload);

        return res.status(200).json(responsePayload);

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal mengambil data dasbor' });
    }
};

module.exports = {
    getDashboardStats
};