-- 1. Tabel Users (Kredensial Login)
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'employee'))
);

-- 2. Tabel Owner
CREATE TABLE owner (
    owner_id VARCHAR(50) PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL
);

-- 3. Tabel Employee (Terdapat penambahan 'account_status')
CREATE TABLE employee (
    employee_id VARCHAR(50) PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    account_status VARCHAR(30) DEFAULT 'Menunggu persetujuan' CHECK (account_status IN ('Menunggu persetujuan', 'Aktif', 'Nonaktif')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Customer
CREATE TABLE customer (
    customer_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20)
);

-- 5. Tabel Layanan (Services)
CREATE TABLE layanan (
    service_id VARCHAR(50) PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Kiloan', 'Satuan')),
    rate DECIMAL(10,2) NOT NULL
);

-- 6. Tabel Pesanan (Orders)
CREATE TABLE pesanan (
    order_id VARCHAR(50) PRIMARY KEY,
    resi_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    laundry_status VARCHAR(30) NOT NULL CHECK (laundry_status IN ('Dicuci', 'Dikeringkan', 'Disetrika', 'Siap Ambil', 'Selesai')),
    payment_status VARCHAR(30) NOT NULL CHECK (payment_status IN ('Menunggu validasi', 'Lunas')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('Tunai', 'Transfer', 'QRIS')),
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    employee_id VARCHAR(50) REFERENCES employee(employee_id),
    customer_id VARCHAR(50) REFERENCES customer(customer_id)
);

-- 7. Tabel Detail Pesanan
CREATE TABLE detail_transaksi (
    order_detail_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES pesanan(order_id) ON DELETE CASCADE,
    service_id VARCHAR(50) REFERENCES layanan(service_id) ON DELETE RESTRICT,
    quantity DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);