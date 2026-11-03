const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Samarkan nama pelanggan: "Budi Santoso" -> "Budi S."
const maskName = (name) => {
    if (!name) return 'Pelanggan';
    const parts = name.trim().split(/\s+/);
    const rest = parts.slice(1).map(p => `${p[0].toUpperCase()}.`).join(' ');
    return rest ? `${parts[0]} ${rest}` : parts[0];
};

// GET: Lacak pesanan berdasarkan nomor resi (publik, tanpa login)
const trackOrder = async (req, res) => {
    const resi = (req.params.resi || '').trim().toUpperCase();

    if (!resi || resi.length > 50) {
        return res.status(400).json({ status: 'error', message: 'Nomor resi tidak valid.' });
    }

    try {
        const { data: order, error } = await supabase
            .from('pesanan')
            .select('order_id, resi_number, transaction_date, completed_at, laundry_status, payment_status, total_cost, customer (name)')
            .eq('resi_number', resi)
            .maybeSingle();

        if (error) throw error;
        if (!order) {
            return res.status(404).json({ status: 'error', message: 'Nomor resi tidak ditemukan.' });
        }

        const { data: details, error: detailsError } = await supabase
            .from('detail_transaksi')
            .select('quantity, layanan (service_name, type)')
            .eq('order_id', order.order_id);

        if (detailsError) throw detailsError;

        const items = (details || []).map(d => {
            const name = d.layanan ? d.layanan.service_name : 'Layanan';
            const type = d.layanan ? d.layanan.type : '';
            const lower = name.toLowerCase();
            const isTabung = lower.includes('cuci saja') || (lower.includes('cuci kering') && !lower.includes('setrika'));
            const unit = type === 'Kiloan' ? 'kg' : (isTabung ? 'tabung' : 'pcs');
            return { name, quantity: Number(d.quantity), unit };
        });

        return res.status(200).json({
            status: 'success',
            data: {
                resi: order.resi_number,
                pelanggan: maskName(order.customer ? order.customer.name : ''),
                tanggal: order.transaction_date,
                status: order.laundry_status,
                pembayaran: order.payment_status,
                total: Number(order.total_cost),
                layanan: items
            }
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: 'Gagal memuat data pesanan.' });
    }
};

module.exports = { trackOrder };
