const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Ambil riwayat transaksi dengan fitur filter
const getOrderHistory = async (req, res) => {
    const { search, date, status } = req.query;

    try {
        let query = supabase
            .from('pesanan')
            .select(`
                order_id,
                resi_number,
                transaction_date,
                completed_at,
                laundry_status,
                payment_method,
                total_cost,
                customer (name)
            `)
            .order('transaction_date', { ascending: false });

        if (search) {
            // Mencari ID pelanggan yang namanya cocok dengan kata kunci pencarian
            const { data: matchedCustomers } = await supabase
                .from('customer')
                .select('customer_id')
                .ilike('name', `%${search}%`);

            if (matchedCustomers && matchedCustomers.length > 0) {
                // Jika nama pelanggan ditemukan, cari berdasarkan Resi atau ID Pelanggan tersebut
                const custIds = matchedCustomers.map(c => `"${c.customer_id}"`).join(',');
                query = query.or(`resi_number.ilike.%${search}%,customer_id.in.(${custIds})`);
            } else {
                // Jika tidak ada pelanggan yang cocok, fokus cari berdasarkan Nomor Resi saja
                query = query.ilike('resi_number', `%${search}%`);
            }
        }

        if (date) {
            const startOfDay = dayjs(date).startOf('day').toISOString();
            const endOfDay = dayjs(date).endOf('day').toISOString();
            query = query.gte('transaction_date', startOfDay).lte('transaction_date', endOfDay);
        }

        if (status && status !== 'Semua status') {
            query = query.eq('laundry_status', status);
        }

        const { data, error } = await query;
        if (error) throw error;

        const orderIds = data.map(order => order.order_id);
        let servicesMap = {};

        if (orderIds.length > 0) {
            const { data: details, error: detailsError } = await supabase
                .from('detail_transaksi')
                .select(`
                    order_id,
                    quantity,
                    layanan (service_name, type)
                `)
                .in('order_id', orderIds);

            if (!detailsError && details) {
                details.forEach(detail => {
                    if (!servicesMap[detail.order_id]) {
                        servicesMap[detail.order_id] = [];
                    }
                    const serviceName = detail.layanan ? detail.layanan.service_name : 'Unknown';
                    const serviceType = detail.layanan ? detail.layanan.type : '';
                    const satuan = detail.quantity > 0 ? (serviceType === 'Kiloan' ? 'kg' : 'pcs') : '';
                    servicesMap[detail.order_id].push(`${serviceName} · ${detail.quantity} ${satuan}`);
                });
            }
        }

        const formattedData = data.map(order => {
            const layananLengkap = servicesMap[order.order_id] ? servicesMap[order.order_id].join(', ') : '-';
            return {
                id: order.order_id,
                resi: order.resi_number,
                tanggal: order.transaction_date,
                waktu_selesai: order.completed_at,
                pelanggan: order.customer ? order.customer.name : 'Unknown',
                layanan: layananLengkap,
                status: order.laundry_status,
                total: Number(order.total_cost),
                pembayaran: order.payment_method
            };
        });

        return res.status(200).json({ status: 'success', data: formattedData });

    } catch (error) {
        return res.status(500).json({ status: 'error', message: 'Gagal memuat riwayat transaksi' });
    }
};

// GET: Ambil daftar layanan untuk dropdown pesanan baru
const getLayanan = async (_req, res) => {
    try {
        const { data, error } = await supabase
            .from('layanan')
            .select('service_id, service_name, type, rate');

        if (error) throw error;

        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching layanan:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal memuat data layanan' });
    }
};

// POST: Buat pesanan baru dan simpan ke database
const createOrder = async (req, res) => {
    const { pelanggan, no_hp, layanan_id, kuantitas, total_biaya, metode_bayar } = req.body;

    try {
        // Cek atau Tambah Customer
        let customerId;
        const { data: existCust, error: errCust } = await supabase
            .from('customer')
            .select('customer_id')
            .eq('phone_number', no_hp)
            .maybeSingle();

        if (errCust) throw errCust;

        if (!existCust) {
            const generatedCustId = 'CUS-' + Date.now();
            const { data: newCust, error: newCustErr } = await supabase
                .from('customer')
                .insert([{ customer_id: generatedCustId, name: pelanggan, phone_number: no_hp }])
                .select('customer_id')
                .single();

            if (newCustErr) throw newCustErr;
            customerId = newCust.customer_id;
        } else {
            customerId = existCust.customer_id;
        }

        // Format Metode Bayar 
        const methodMap = {
            'tunai': 'Tunai',
            'transfer': 'Transfer',
            'qris': 'QRIS'
        };
        const formattedPaymentMethod = methodMap[metode_bayar ? metode_bayar.toLowerCase() : 'tunai'] || 'Tunai';

        // Cek Nama Layanan untuk Penentuan Status Awal
        let initialStatus = 'Dicuci';
        const { data: svcData } = await supabase
            .from('layanan')
            .select('service_name')
            .eq('service_id', layanan_id)
            .maybeSingle();

        // Jika layanan yang dipilih adalah "Cuci Saja", langsung masuk kolom Dicuci
        if (svcData && svcData.service_name.toLowerCase().includes('cuci saja')) {
            initialStatus = 'Dicuci';
        }

        // Generate ID Unik
        const generatedOrderId = 'ORD-' + Date.now();
        const timestamp = Date.now().toString().slice(-4);
        const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
        const resiNumber = `ZL-${timestamp}${randomStr}`;

        // Insert ke Tabel Pesanan menggunakan initialStatus
        const { data: order, error: orderErr } = await supabase
            .from('pesanan')
            .insert([{
                order_id: generatedOrderId,
                resi_number: resiNumber,
                transaction_date: new Date().toISOString(),
                laundry_status: initialStatus, 
                payment_status: 'Lunas',
                payment_method: formattedPaymentMethod,
                total_cost: total_biaya,
                customer_id: customerId
            }])
            .select('order_id, resi_number')
            .single();

        if (orderErr) throw orderErr;

        // Insert ke Detail Transaksi (Tanpa kolom notes)
        const generatedDetailId = 'DTL-' + Date.now();
        const { error: detailErr } = await supabase
            .from('detail_transaksi')
            .insert([{
                order_detail_id: generatedDetailId,
                order_id: order.order_id,
                service_id: layanan_id,
                quantity: kuantitas,
                subtotal: total_biaya
            }]);

        if (detailErr) throw detailErr;

        return res.status(201).json({
            status: 'success',
            message: 'Pesanan berhasil disimpan',
            data: {
                order_id: order.order_id,
                resi_number: order.resi_number
            }
        });

    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal membuat pesanan baru' });
    }
};

// Perbarui status cucian
const updateLaundryStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const updateData = { laundry_status: status };
        
        if (status === 'Selesai') {
            updateData.completed_at = new Date().toISOString();
        } else {
            updateData.completed_at = null; 
        }

        const { error } = await supabase
            .from('pesanan')
            .update(updateData)
            .eq('order_id', id);

        if (error) throw error;
        return res.status(200).json({ status: 'success', message: 'Status berhasil diperbarui' });
    } catch (error) {
        console.error('Error updating laundry status:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal memperbarui status cucian' });
    }
};

module.exports = {
    getOrderHistory,
    getLayanan,
    createOrder,
    updateLaundryStatus
};