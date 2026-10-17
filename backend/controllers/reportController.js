// backend/controllers/reportController.js
const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');
dayjs.extend(isoWeek);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const getFinancialReport = async (req, res) => {
    let { period, date } = req.query; // period: 'harian', 'mingguan', 'bulanan'. date: YYYY-MM-DD (opsional)

    if (!period) period = 'mingguan'; // Default mingguan

    let startDate, endDate;
    const baseDate = date ? dayjs(date) : dayjs();

    // 1. Tentukan Rentang Waktu (startDate dan endDate)
    if (period === 'harian') {
        startDate = baseDate.startOf('day').toISOString();
        endDate = baseDate.endOf('day').toISOString();
    } else if (period === 'mingguan') {
        // Asumsi minggu dimulai hari Senin (isoWeek)
        startDate = baseDate.startOf('isoWeek').toISOString();
        endDate = baseDate.endOf('isoWeek').toISOString();
    } else if (period === 'bulanan') {
        startDate = baseDate.startOf('month').toISOString();
        endDate = baseDate.endOf('month').toISOString();
    } else {
        return res.status(400).json({ status: 'error', message: 'Periode tidak valid' });
    }

    try {
        // 2. Ambil data pesanan dalam rentang waktu tersebut
        const { data: orders, error } = await supabase
            .from('pesanan')
            .select('transaction_date, total_cost')
            .gte('transaction_date', startDate)
            .lte('transaction_date', endDate)
            .order('transaction_date', { ascending: false });

        if (error) throw error;

        // 3. Kalkulasi Metrik Utama
        let totalRevenue = 0;
        const transactionCount = orders.length;

        orders.forEach(order => {
            totalRevenue += Number(order.total_cost || 0);
        });

        const averagePerTransaction = transactionCount > 0 ? (totalRevenue / transactionCount) : 0;

        // 4. Kelompokkan Data untuk Tabel (Rincian Transaksi)
        let groupedData = [];

        if (period === 'harian') {
            // Kelompokkan per sesi waktu: Pagi (08-12), Siang (12-16), Sore (16-20)
            const sessions = { pagi: { count: 0, sum: 0 }, siang: { count: 0, sum: 0 }, sore: { count: 0, sum: 0 } };

            orders.forEach(order => {
                const hour = dayjs(order.transaction_date).hour();
                if (hour >= 8 && hour < 12) { sessions.pagi.count++; sessions.pagi.sum += Number(order.total_cost); }
                else if (hour >= 12 && hour < 16) { sessions.siang.count++; sessions.siang.sum += Number(order.total_cost); }
                else if (hour >= 16 && hour <= 20) { sessions.sore.count++; sessions.sore.sum += Number(order.total_cost); }
            });

            groupedData = [
                { label: 'Pagi (08.00 - 12.00)', count: sessions.pagi.count, revenue: sessions.pagi.sum },
                { label: 'Siang (12.00 - 16.00)', count: sessions.siang.count, revenue: sessions.siang.sum },
                { label: 'Sore (16.00 - 20.00)', count: sessions.sore.count, revenue: sessions.sore.sum }
            ];

        } else if (period === 'mingguan') {
            // Kelompokkan per hari (Senin - Minggu)
            const daysMap = {};
            // Inisialisasi hari dalam seminggu
            for (let i = 0; i < 7; i++) {
                const dayDate = dayjs(startDate).add(i, 'day').format('DD MMM YYYY');
                daysMap[dayDate] = { count: 0, sum: 0 };
            }

            orders.forEach(order => {
                const dayLabel = dayjs(order.transaction_date).format('DD MMM YYYY');
                if (daysMap[dayLabel]) {
                    daysMap[dayLabel].count++;
                    daysMap[dayLabel].sum += Number(order.total_cost);
                }
            });

            // Ubah object ke array untuk frontend (urutkan dari terbaru)
            groupedData = Object.keys(daysMap).reverse().map(key => ({
                label: key,
                count: daysMap[key].count,
                revenue: daysMap[key].sum
            }));

        } else if (period === 'bulanan') {
            // Kelompokkan per minggu (Minggu 1, 2, 3, 4)
            // Sederhananya, bagi bulan menjadi 4 segmen (1-7, 8-14, 15-21, 22-akhir)
            const weeks = { w1: { count: 0, sum: 0 }, w2: { count: 0, sum: 0 }, w3: { count: 0, sum: 0 }, w4: { count: 0, sum: 0 } };
            const monthName = baseDate.format('MMM');
            const endOfMonth = baseDate.endOf('month').date();

            orders.forEach(order => {
                const dateNum = dayjs(order.transaction_date).date();
                if (dateNum >= 1 && dateNum <= 7) { weeks.w1.count++; weeks.w1.sum += Number(order.total_cost); }
                else if (dateNum >= 8 && dateNum <= 14) { weeks.w2.count++; weeks.w2.sum += Number(order.total_cost); }
                else if (dateNum >= 15 && dateNum <= 21) { weeks.w3.count++; weeks.w3.sum += Number(order.total_cost); }
                else { weeks.w4.count++; weeks.w4.sum += Number(order.total_cost); }
            });

            groupedData = [
                { label: `1 (1 - 7 ${monthName})`, count: weeks.w1.count, revenue: weeks.w1.sum },
                { label: `2 (8 - 14 ${monthName})`, count: weeks.w2.count, revenue: weeks.w2.sum },
                { label: `3 (15 - 21 ${monthName})`, count: weeks.w3.count, revenue: weeks.w3.sum },
                { label: `4 (22 - ${endOfMonth} ${monthName})`, count: weeks.w4.count, revenue: weeks.w4.sum }
            ];
        }

        // 5. Susun format tanggal untuk ditampilkan di UI (misal: "01 Nov - 07 Nov 2026")
        let displayDateRange = '';
        if (period === 'harian') {
            displayDateRange = baseDate.format('DD MMM YYYY');
        } else if (period === 'mingguan') {
            displayDateRange = `${dayjs(startDate).format('DD MMM')} - ${dayjs(endDate).format('DD MMM YYYY')}`;
        } else {
            displayDateRange = baseDate.format('MMMM YYYY');
        }

        // 6. Response Payload
        const responseData = {
            summary: {
                totalRevenue,
                transactionCount,
                averagePerTransaction,
                displayDateRange
            },
            tableData: groupedData
        };

        return res.status(200).json({ status: 'success', data: responseData });

    } catch (error) {
        console.error('Error getFinancialReport:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal memuat laporan' });
    }
};

module.exports = { getFinancialReport };