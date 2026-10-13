document.addEventListener("DOMContentLoaded", () => {
    // --- Referensi Elemen Utama ---
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const formLogin = document.getElementById("form-login");
    const formRegister = document.getElementById("form-register");
    const authTitle = document.getElementById("auth-title");
    const authSubtitle = document.getElementById("auth-subtitle");

    // --- Fungsi Helper: Tampilkan/Sembunyikan Error Spesifik ---
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

        authTitle.textContent = "Daftar akun";
        authSubtitle.innerHTML = "Khusus Employee. Akun aktif setelah disetujui<br>Owner.";
    });

    // --- Pola Regex (Regular Expression) ---
    // Email wajib memiliki '@' dan domain yang valid seperti '.com', '.id', dsb.
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // Nama harus dimulai dengan huruf kapital untuk setiap katanya. Contoh: 'Samuel', 'Samuel Budi'
    const capitalizeNameRegex = /^([A-Z][a-z]+)(\s[A-Z][a-z]+)*$/;

    // --- LOGIKA FORM LOGIN ---
    formLogin.addEventListener("submit", (e) => {
        e.preventDefault(); // Mencegah reload halaman
        clearAllErrors();

        let isValid = true;
        const role = document.getElementById("login-role").value;
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        // 1. Validasi Role
        if (role === "") {
            showFieldError("err-login-role", "Harap pilih status peran Anda.");
            isValid = false;
        }

        // 2. Validasi Email
        if (!emailRegex.test(email)) {
            showFieldError("err-login-email", "Format email tidak valid (contoh: nama@email.com).");
            isValid = false;
        }

        // 3. Validasi Sandi
        if (password.length < 8) {
            showFieldError("err-login-password", "Kata sandi salah atau kurang dari 8 karakter.");
            isValid = false;
        }

        if (!isValid) return; // Stop eksekusi jika ada error

        // Jika berhasil
        console.log("Mencoba login...", { role, email, password });
        if (role === "owner") {
            window.location.href = "/frontend/pages/owner/dashboard.html";
        } else {
            alert("Berhasil login sebagai Employee.");
        }
    });

    // --- LOGIKA FORM REGISTER ---
    formRegister.addEventListener("submit", (e) => {
        e.preventDefault();
        clearAllErrors();

        let isValid = true;
        const name = document.getElementById("reg-name").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value;
        const confirmPassword = document.getElementById("reg-password-confirm").value;

        // 1. Validasi Nama Kapital
        if (!capitalizeNameRegex.test(name)) {
            showFieldError("err-reg-name", "Tiap awalan kata harus huruf kapital (contoh: Samuel Budi).");
            isValid = false;
        }

        // 2. Validasi Email
        if (!emailRegex.test(email)) {
            showFieldError("err-reg-email", "Format email tidak valid (wajib menggunakan @ dan domain).");
            isValid = false;
        }

        // 3. Validasi Kekuatan Kata Sandi
        if (password.length < 8) {
            showFieldError("err-reg-password", "Kata sandi wajib minimal 8 karakter.");
            isValid = false;
        }

        // 4. Validasi Konfirmasi Kata Sandi
        if (confirmPassword !== password) {
            showFieldError("err-reg-confirm", "Kata sandi yang diulang tidak cocok.");
            isValid = false;
        }

        if (!isValid) return;

        console.log("Mencoba mendaftar...", { name, email, password });
        alert("Pendaftaran berhasil! Akun Anda menunggu persetujuan Owner.");

        tabLogin.click(); // Pindah kembali ke view login setelah mendaftar
    });
});