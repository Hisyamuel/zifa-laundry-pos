// frontend/js/pages/auth/auth.js

document.addEventListener("DOMContentLoaded", () => {
    // --- Referensi Elemen Utama ---
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const formLogin = document.getElementById("form-login");
    const formRegister = document.getElementById("form-register");
    const authTitle = document.getElementById("auth-title");
    const authSubtitle = document.getElementById("auth-subtitle");

    // Elemen untuk animasi
    const formTrack = document.getElementById("form-track");
    const formWrapper = document.querySelector(".form-slider-wrapper");

    // Fungsi otomatis penyesuai tinggi form
    const adjustHeight = (activeElement) => {
        formWrapper.style.height = activeElement.scrollHeight + "px";
    };

    // Render awal
    setTimeout(() => adjustHeight(formLogin), 50);

    // --- Fungsi Helper: Error ---
    const showFieldError = (idTarget, message) => {
        const errElement = document.getElementById(idTarget);
        if (errElement) {
            errElement.textContent = message;
            errElement.classList.add("active");
        }
    };

    const clearAllErrors = () => {
        const errorNodes = document.querySelectorAll(".err-msg");
        errorNodes.forEach(node => {
            node.textContent = "";
            node.classList.remove("active");
        });
    };

    // --- Tab Navigasi ---
    tabLogin.addEventListener("click", (e) => {
        e.preventDefault();
        clearAllErrors();
        formLogin.reset();
        tabLogin.classList.add("on");
        tabRegister.classList.remove("on");
        formLogin.classList.add("active");
        formRegister.classList.remove("active");
        formTrack.style.transform = "translateX(0%)";
        adjustHeight(formLogin);
        authTitle.textContent = "Masuk staf";
        authSubtitle.textContent = "Khusus Owner dan Employee.";
    });

    tabRegister.addEventListener("click", (e) => {
        e.preventDefault();
        clearAllErrors();
        formRegister.reset();
        tabRegister.classList.add("on");
        tabLogin.classList.remove("on");
        formRegister.classList.add("active");
        formLogin.classList.remove("active");
        formTrack.style.transform = "translateX(-50%)";
        adjustHeight(formRegister);
        authTitle.textContent = "Daftar akun";
        authSubtitle.innerHTML = "Khusus Employee. Akun aktif setelah disetujui<br>Owner.";
    });

    // --- Pola Regex ---
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const capitalizeNameRegex = /^([A-Z][a-z]+)(\s[A-Z][a-z]+)*$/;

    // ==========================================
    // LOGIKA INTEGRASI API BACKEND 
    // ==========================================

    // --- 1. PROSES LOGIN ---
    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearAllErrors();

        let isValid = true;
        const role = document.getElementById("login-role").value;
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        // Validasi Klien
        if (role === "") {
            showFieldError("err-login-role", "Harap pilih status peran Anda.");
            isValid = false;
        }
        if (!emailRegex.test(email)) {
            showFieldError("err-login-email", "Format email tidak valid (contoh: nama@email.com).");
            isValid = false;
        }
        if (password.length < 8) {
            showFieldError("err-login-password", "Kata sandi salah atau kurang dari 8 karakter.");
            isValid = false;
        }

        if (!isValid) return;

        // Proses API
        try {
            const btnSubmit = formLogin.querySelector('button[type="submit"]');
            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = "Mengecek...";
            btnSubmit.disabled = true;

            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                // Simpan token untuk sesi aktif
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('role', result.data.user.role);
                localStorage.setItem('name', result.data.user.name);

                // Arahkan (Redirect) ke halaman yang benar
                if (result.data.user.role === 'Owner') {
                    window.location.href = "/frontend/pages/owner/dashboard.html";
                } else {
                    window.location.href = "/frontend/pages/employee/pesanan-baru.html";
                }
            } else {
                // Tampilkan pesan error spesifik dari backend (misal: "Akun belum di-approve Owner")
                alert("Login gagal: " + (result.message || 'Email, sandi, atau role salah.'));
            }
        } catch (error) {
            console.error("Kesalahan jaringan:", error);
            alert("Gagal terhubung ke server backend Zifa Laundry.");
        } finally {
            const btnSubmit = formLogin.querySelector('button[type="submit"]');
            btnSubmit.textContent = "Masuk";
            btnSubmit.disabled = false;
        }
    });

    // --- 2. PROSES DAFTAR (EMPLOYEE) ---
    formRegister.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearAllErrors();

        let isValid = true;
        const name = document.getElementById("reg-name").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value;
        const confirmPassword = document.getElementById("reg-password-confirm").value;

        // Validasi Klien
        if (!capitalizeNameRegex.test(name)) {
            showFieldError("err-reg-name", "Tiap awalan kata harus huruf kapital (contoh: Samuel Budi).");
            isValid = false;
        }
        if (!emailRegex.test(email)) {
            showFieldError("err-reg-email", "Format email tidak valid (wajib menggunakan @ dan domain).");
            isValid = false;
        }
        if (password.length < 8) {
            showFieldError("err-reg-password", "Kata sandi wajib minimal 8 karakter.");
            isValid = false;
        }
        if (confirmPassword !== password) {
            showFieldError("err-reg-confirm", "Kata sandi yang diulang tidak cocok.");
            isValid = false;
        }

        if (!isValid) return;

        // Proses API
        try {
            const btnSubmit = formRegister.querySelector('button[type="submit"]');
            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = "Mendaftarkan...";
            btnSubmit.disabled = true;

            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                alert("Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Owner.");
                tabLogin.click(); // Kembali ke tab login
            } else {
                alert("Gagal mendaftar: " + result.message);
            }
        } catch (error) {
            console.error("Kesalahan jaringan:", error);
            alert("Gagal terhubung ke server backend Zifa Laundry.");
        } finally {
            const btnSubmit = formRegister.querySelector('button[type="submit"]');
            btnSubmit.textContent = "Daftar";
            btnSubmit.disabled = false;
        }
    });
});