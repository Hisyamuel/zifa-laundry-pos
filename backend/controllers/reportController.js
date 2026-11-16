const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');
const NodeCache = require('node-cache'); 

dayjs.extend(isoWeek);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Inisialisasi Cache
const reportCache = new NodeCache({ stdTTL: 300 });

const getFinancialReport = async (req, res) => {
    let { period, date } = req.query; 

    if (!period) period = 'mingguan'; 
    
    const baseDate = date ? dayjs(date) : dayjs();

    // Merangkai Kunci Dinamis berdasarkan parameter (contoh: report_mingguan_2026-10-29)
    const formattedDateKey = baseDate.format('YYYY-MM-DD');
    const cacheKey = `report_${period}_${formattedDateKey}`;

    // Cek apakah key tersebut sudah tersimpan di Cache
    const cachedData = reportCache.get(cacheKey);
    if (cachedData) {
        console.log(`Mengambil Data Laporan dari Cache: ${cacheKey}`);
        return res.status(200).json({ status: 'success', data: cachedData });
    }

    let startDate, endDate;

    // Menentukan Rentang Waktu (startDate dan endDate)
    if (period === 'harian') {
        startDate = baseDate.startOf('day').toISOString();
        endDate = baseDate.endOf('day').toISOString();
    } else if (period === 'mingguan') {
        startDate = baseDate.startOf('isoWeek').toISOString();
        endDate = baseDate.endOf('isoWeek').toISOString();
    } else if (period === 'bulanan') {
        startDate = baseDate.startOf('month').toISOString();
        endDate = baseDate.endOf('month').toISOString();
    } else {
        return res.status(400).json({ status: 'error', message: 'Periode tidak valid' });
    }

    try {
        console.log(`Memproses Kueri Laporan dari Supabase: ${cacheKey}`);

        // Mengambil data pesanan dalam rentang waktu tersebut
        const { data: orders, error } = await supabase
            .from('pesanan')
            .select('transaction_date, total_cost')
            .gte('transaction_date', startDate)
            .lte('transaction_date', endDate)
            .order('transaction_date', { ascending: false });

        if (error) throw error;

        // Kalkulasi Metrik Utama
        let totalRevenue = 0;
        const transactionCount = orders.length;

        orders.forEach(order => {
            totalRevenue += Number(order.total_cost || 0);
        });

        const averagePerTransaction = transactionCount > 0 ? (totalRevenue / transactionCount) : 0;

        // Mengelompokkan Data untuk Tabel (Rincian Transaksi)
        let groupedData = [];

        if (period === 'harian') {
            const sessions = { pagi: { count: 0, sum: 0 }, siang: { count: 0, sum: 0 }, sore: { count: 0, sum: 0 }, malam: { count: 0, sum: 0 } };

            orders.forEach(order => {
                const orderDate = dayjs(order.transaction_date).add(7, 'hour'); // Menyesuaikan dari UTC ke WIB (UTC+7)
                const hour = orderDate.hour();
                if (hour >= 8 && hour < 12) { 
                    sessions.pagi.count++; 
                    sessions.pagi.sum += Number(order.total_cost); 
                }
                else if (hour >= 12 && hour < 16) { 
                    sessions.siang.count++; 
                    sessions.siang.sum += Number(order.total_cost); 
                }
                else if (hour >= 16 && hour < 20) { 
                    sessions.sore.count++; 
                    sessions.sore.sum += Number(order.total_cost); 
                }
                else { 
                    // Mencakup jam 20:00 hingga 07:59 pagi berikutnya
                    sessions.malam.count++; 
                    sessions.malam.sum += Number(order.total_cost); 
                }
            });

            groupedData = [
                { label: 'Pagi (08.00 - 12.00)', count: sessions.pagi.count, revenue: sessions.pagi.sum },
                { label: 'Siang (12.00 - 16.00)', count: sessions.siang.count, revenue: sessions.siang.sum },
                { label: 'Sore (16.00 - 20.00)', count: sessions.sore.count, revenue: sessions.sore.sum },
                { label: 'Malam (20.00 - 24.00)', count: sessions.malam.count, revenue: sessions.malam.sum }
            ];

        } else if (period === 'mingguan') {
            const daysMap = {};
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

            groupedData = Object.keys(daysMap).reverse().map(key => ({
                label: key,
                count: daysMap[key].count,
                revenue: daysMap[key].sum
            }));

        } else if (period === 'bulanan') {
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

        let displayDateRange = '';
        if (period === 'harian') {
            displayDateRange = baseDate.format('DD MMM YYYY');
        } else if (period === 'mingguan') {
            displayDateRange = `${dayjs(startDate).format('DD MMM')} - ${dayjs(endDate).format('DD MMM YYYY')}`;
        } else {
            displayDateRange = baseDate.format('MMMM YYYY');
        }

        const responseData = {
            summary: {
                totalRevenue,
                transactionCount,
                averagePerTransaction,
                displayDateRange
            },
            tableData: groupedData
        };

        // Simpan Payload ke dalam Memori
        reportCache.set(cacheKey, responseData);

        return res.status(200).json({ status: 'success', data: responseData });

    } catch (error) {
        console.error('Error getFinancialReport:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal memuat laporan' });
    }
};

const exportFinancialReport = async (req, res) => {
    let { period, date } = req.query;

    if (!period) period = 'mingguan';

    let startDate, endDate;
    const baseDate = date ? dayjs(date) : dayjs();

    // Menentukan Rentang Waktu
    if (period === 'harian') {
        startDate = baseDate.startOf('day').toISOString();
        endDate = baseDate.endOf('day').toISOString();
    } else if (period === 'mingguan') {
        startDate = baseDate.startOf('isoWeek').toISOString();
        endDate = baseDate.endOf('isoWeek').toISOString();
    } else if (period === 'bulanan') {
        startDate = baseDate.startOf('month').toISOString();
        endDate = baseDate.endOf('month').toISOString();
    } else {
        return res.status(400).json({ status: 'error', message: 'Periode tidak valid' });
    }

    try {
        // Mengambil data pesanan
        const { data: orders, error } = await supabase
            .from('pesanan')
            .select('transaction_date, total_cost')
            .gte('transaction_date', startDate)
            .lte('transaction_date', endDate)
            .order('transaction_date', { ascending: false });

        if (error) throw error;

        let groupedData = [];
        let labelHeader = '';
        let dateRangeStr = '';

        // Mengelompokkan Data (Sama seperti getFinancialReport)
        if (period === 'harian') {
            labelHeader = 'Sesi Waktu';
            dateRangeStr = baseDate.format('DD_MMM_YYYY');
            const sessions = { pagi: { count: 0, sum: 0 }, siang: { count: 0, sum: 0 }, sore: { count: 0, sum: 0 }, malam: { count: 0, sum: 0 } };

            orders.forEach(order => {
                const orderDate = dayjs(order.transaction_date).add(7, 'hour'); // Menyesuaikan dari UTC ke WIB (UTC+7)
                const hour = orderDate.hour();;
                if (hour >= 8 && hour < 12) { 
                    sessions.pagi.count++; 
                    sessions.pagi.sum += Number(order.total_cost); 
                }
                else if (hour >= 12 && hour < 16) { 
                    sessions.siang.count++; 
                    sessions.siang.sum += Number(order.total_cost); 
                }
                else if (hour >= 16 && hour < 20) { 
                    sessions.sore.count++; 
                    sessions.sore.sum += Number(order.total_cost); 
                }
                else { 
                    // Mencakup jam 20:00 hingga 07:59 pagi berikutnya
                    sessions.malam.count++; 
                    sessions.malam.sum += Number(order.total_cost); 
                }
            });

            groupedData = [
                { label: 'Pagi (08.00 - 12.00)', count: sessions.pagi.count, revenue: sessions.pagi.sum },
                { label: 'Siang (12.00 - 16.00)', count: sessions.siang.count, revenue: sessions.siang.sum },
                { label: 'Sore (16.00 - 20.00)', count: sessions.sore.count, revenue: sessions.sore.sum },
                { label: 'Malam (20.00 - 24.00)', count: sessions.malam.count, revenue: sessions.malam.sum }
            ];
        } else if (period === 'mingguan') {
            labelHeader = 'Tanggal';
            dateRangeStr = `${dayjs(startDate).format('DD_MMM')}-${dayjs(endDate).format('DD_MMM_YYYY')}`;
            const daysMap = {};
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

            groupedData = Object.keys(daysMap).reverse().map(key => ({
                label: key,
                count: daysMap[key].count,
                revenue: daysMap[key].sum
            }));
        } else if (period === 'bulanan') {
            labelHeader = 'Minggu Ke-';
            dateRangeStr = baseDate.format('MMMM_YYYY');
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

        // Susun Format CSV
        let csvString = `"${labelHeader}";"Jumlah Transaksi";"Pendapatan"\n`;

        groupedData.forEach(row => {
            csvString += `"${row.label}";"${row.count}";"${row.revenue}"\n`;
        });

        const fileName = `Laporan_ZifaLaundry_${period}_${dateRangeStr}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        return res.status(200).send(csvString);

    } catch (error) {
        console.error('Error exportFinancialReport:', error);
        return res.status(500).send('Gagal mengekspor laporan');
    }
};

module.exports = { getFinancialReport, exportFinancialReport };