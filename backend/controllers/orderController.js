// backend/controllers/orderController.js
const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs'); // Pastikan dayjs terinstal

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Ambil riwayat transaksi dengan fitur filter
const getOrderHistory = async (req, res) => {
    // Ambil parameter filter dari query string
    const { search, date, status } = req.query;

    try {
        // Mulai membangun query dasar
        // Kita join dengan tabel customer dan mengambil atribut terkait
        let query = supabase
            .from('pesanan')
            .select(`
                order_id,
                resi_number,
                transaction_date,
                laundry_status,
                payment_method,
                total_cost,
                customer (name)
            `)
            .order('transaction_date', { ascending: false });

        // 1. Terapkan Filter Pencarian (Nama Pelanggan atau Nomor Resi)
        if (search) {
            // Karena kita mencari nama di dalam tabel relasi (customer), 
            // query pencariannya sedikit kompleks di Supabase.
            // Solusi sederhana: Cari resi OR cari nama pelanggan
            query = query.or(`resi_number.ilike.%${search}%, customer.name.ilike.%${search}%`);
        }

        // 2. Terapkan Filter Tanggal
        if (date) {
            // 'date' format YYYY-MM-DD. Kita ambil transaksi sepanjang hari tersebut.
            const startOfDay = dayjs(date).startOf('day').toISOString();
            const endOfDay = dayjs(date).endOf('day').toISOString();
            query = query.gte('transaction_date', startOfDay).lte('transaction_date', endOfDay);
        }

        // 3. Terapkan Filter Status Cucian
        if (status && status !== 'Semua status') {
            query = query.eq('laundry_status', status);
        }

        // Eksekusi query
        const { data, error } = await query;

        if (error) throw error;

        // --- AMBIL DETAIL LAYANAN (Workaround untuk Supabase) ---
        // Karena relasi pesanan ke layanan melewati tabel detail_transaksi,
        // lebih mudah kita ambil detailnya secara terpisah lalu digabungkan.

        // Ambil semua order_id dari hasil pencarian
        const orderIds = data.map(order => order.order_id);

        let servicesMap = {};
        if (orderIds.length > 0) {
            const { data: details, error: detailsError } = await supabase
                .from('detail_transaksi')
                .select(`
                    order_id,
                    quantity,
                    layanan (service_name)
                `)
                .in('order_id', orderIds);

            if (!detailsError && details) {
                // Kelompokkan layanan berdasarkan order_id
                details.forEach(detail => {
                    if (!servicesMap[detail.order_id]) {
                        servicesMap[detail.order_id] = [];
                    }
                    const serviceName = detail.layanan ? detail.layanan.service_name : 'Unknown';
                    const satuan = detail.quantity > 0 ? (serviceName.toLowerCase().includes('kiloan') ? 'kg' : 'pcs') : '';
                    servicesMap[detail.order_id].push(`${serviceName} · ${detail.quantity} ${satuan}`);
                });
            }
        }

        // Format data untuk dikirim ke frontend
        const formattedData = data.map(order => {
            // Ambil array layanan, gabungkan dengan koma jika lebih dari satu
            const layananLengkap = servicesMap[order.order_id] ? servicesMap[order.order_id].join(', ') : '-';

            return {
                id: order.order_id,
                resi: order.resi_number,
                tanggal: order.transaction_date,
                pelanggan: order.customer ? order.customer.name : 'Unknown',
                layanan: layananLengkap,
                status: order.laundry_status,
                total: Number(order.total_cost),
                pembayaran: order.payment_method
            };
        });

        return res.status(200).json({ status: 'success', data: formattedData });

    } catch (error) {
        console.error('Error fetching order history:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal memuat riwayat transaksi' });
    }
};

module.exports = {
    getOrderHistory
};