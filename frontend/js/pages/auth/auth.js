document.addEventListener("DOMContentLoaded", () => {
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const formLogin = document.getElementById("form-login");
    const formRegister = document.getElementById("form-register");
    const authTitle = document.getElementById("auth-title");
    const authSubtitle = document.getElementById("auth-subtitle");
    const formTrack = document.getElementById("form-track");
    const formWrapper = document.querySelector(".form-slider-wrapper");

    // --- SISTEM TOAST (Notifikasi) ---
    function showToast(message, type = 'success') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    const adjustHeight = (activeElement) => {
        formWrapper.style.height = activeElement.scrollHeight + "px";
    };

    setTimeout(() => adjustHeight(formLogin), 50);

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
    // REGEX: Mewajibkan tiap kata diawali huruf besar, tapi toleran terhadap spasi ganda/tanda baca
    const capitalizeNameRegex = /^([A-Z][^\s]*\s*)+$/;

    // --- PROSES LOGIN ---
    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearAllErrors();

        let isValid = true;
        const role = document.getElementById("login-role").value;
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        if (role === "") { showFieldError("err-login-role", "Harap pilih status peran Anda."); isValid = false; }
        if (!emailRegex.test(email)) { showFieldError("err-login-email", "Format email tidak valid."); isValid = false; }
        if (password.length < 8) { showFieldError("err-login-password", "Kata sandi salah atau kurang dari 8 karakter."); isValid = false; }

        if (!isValid) return;

        try {
            const btnSubmit = formLogin.querySelector('button[type="submit"]');
            btnSubmit.textContent = "Mengecek...";
            btnSubmit.disabled = true;

            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('role', result.data.user.role);
                localStorage.setItem('name', result.data.user.name);

                showToast(result.message, 'success');

                // Beri sedikit jeda agar animasi toast terlihat sebelum pindah halaman
                setTimeout(() => {
                    if (result.data.user.role === 'Owner') {
                        window.location.href = "/frontend/pages/owner/dashboard.html";
                    } else {
                        window.location.href = "/frontend/pages/employee/pesanan-baru.html";
                    }
                }, 1000);
            } else {
                showToast(result.message || 'Email, sandi, atau role salah.', 'error');
            }
        } catch (error) {
            console.error("Kesalahan jaringan:", error);
            showToast("Gagal terhubung ke server backend Zifa Laundry.", 'error');
        } finally {
            const btnSubmit = formLogin.querySelector('button[type="submit"]');
            btnSubmit.textContent = "Masuk";
            btnSubmit.disabled = false;
        }
    });

    // --- PROSES DAFTAR (EMPLOYEE) ---
    formRegister.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearAllErrors();

        let isValid = true;
        const name = document.getElementById("reg-name").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const phone = document.getElementById("reg-phone") ? document.getElementById("reg-phone").value.trim() : "-"; // Tangkap input no telepon
        const password = document.getElementById("reg-password").value;
        const confirmPassword = document.getElementById("reg-password-confirm").value;

        if (!capitalizeNameRegex.test(name)) { showFieldError("err-reg-name", "Awalan setiap kata harus huruf kapital (contoh: Samuel Budi)."); isValid = false; }
        if (!emailRegex.test(email)) { showFieldError("err-reg-email", "Format email tidak valid."); isValid = false; }
        if (password.length < 8) { showFieldError("err-reg-password", "Kata sandi wajib minimal 8 karakter."); isValid = false; }
        if (confirmPassword !== password) { showFieldError("err-reg-confirm", "Kata sandi yang diulang tidak cocok."); isValid = false; }

        if (!isValid) return;

        try {
            const btnSubmit = formRegister.querySelector('button[type="submit"]');
            btnSubmit.textContent = "Mendaftarkan...";
            btnSubmit.disabled = true;

            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, phone }) 
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                showToast(result.message, 'success');
                setTimeout(() => tabLogin.click(), 1500);
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error("Kesalahan jaringan:", error);
            showToast("Gagal terhubung ke server backend Zifa Laundry.", 'error');
        } finally {
            const btnSubmit = formRegister.querySelector('button[type="submit"]');
            btnSubmit.textContent = "Daftar";
            btnSubmit.disabled = false;
        }
    });
});