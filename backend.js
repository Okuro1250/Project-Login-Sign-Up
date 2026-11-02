document.addEventListener("DOMContentLoaded", () => {
  const authForm = document.getElementById("authForm");
  const usernameInput = document.getElementById("Inpuser");
  const usernameLabel = document.getElementById("usernameLabel");
  const passwordInput = document.getElementById("inpPass");
  const passwordHint = document.getElementById("passwordHint");
  const message = document.getElementById("pesan");
  const title = document.getElementById("TeksSign");
  const subtitle = document.getElementById("authSubtitle");
  const formEyebrow = document.getElementById("formEyebrow");
  const switchText = document.getElementById("switchText");
  const switchButton = document.getElementById("switchBut");
  const emailField = document.getElementById("emailField");
  const emailInput = document.getElementById("Email");
  const submitButton = document.getElementById("ConfirmBut");
  const submitLabel = document.getElementById("submitLabel");
  const passwordToggle = document.getElementById("togglePassword");

  let isSignUp = false;
  const storageKey = "pfsUsers";
  const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
  const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "1234567890";
  const symbols = "!@#$%^&*()-_=+[]{};:'\",.<>?/\\|`~";
  const encoder = new TextEncoder();

  const eyeIcon = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.75 12s3.2-5.25 9.25-5.25S21.25 12 21.25 12s-3.2 5.25-9.25 5.25S2.75 12 2.75 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>`;

  const eyeOffIcon = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m3 3 18 18M10.6 6.85c.45-.07.91-.1 1.4-.1 6.05 0 9.25 5.25 9.25 5.25a16.3 16.3 0 0 1-2.55 3.15M6.2 6.2C3.95 7.65 2.75 12 2.75 12S5.95 17.25 12 17.25c.88 0 1.68-.13 2.4-.35" />
      <path d="M9.9 9.9a2.97 2.97 0 0 0 4.2 4.2" />
    </svg>`;

  const toHex = (bytes) =>
    Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

  const fromHex = (hex) =>
    Uint8Array.from(hex.match(/.{2}/g) ?? [], (byte) =>
      Number.parseInt(byte, 16),
    );

  const setMessage = (text, state = "error") => {
    message.textContent = text;
    message.dataset.state = state;
    message.hidden = text.length === 0;
  };

  const hashPassword = async (password, salt) => {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const hash = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: fromHex(salt),
        iterations: 120000,
        hash: "SHA-256",
      },
      key,
      256,
    );
    return toHex(new Uint8Array(hash));
  };

  const readUsers = () => {
    const savedData = localStorage.getItem(storageKey);
    if (!savedData) return [];

    const users = JSON.parse(savedData);
    if (!Array.isArray(users)) {
      throw new Error("Format penyimpanan akun tidak valid.");
    }
    return users;
  };

  const getPasswordIssues = (password) => {
    const issues = [];
    if (password.length <= 8) issues.push("minimal 9 karakter");
    if (
      ![...password].some((character) => lowercaseLetters.includes(character))
    ) {
      issues.push("huruf kecil");
    }
    if (
      ![...password].some((character) => uppercaseLetters.includes(character))
    ) {
      issues.push("huruf besar");
    }
    if (![...password].some((character) => digits.includes(character))) {
      issues.push("angka");
    }
    if (![...password].some((character) => symbols.includes(character))) {
      issues.push("simbol");
    }
    return issues;
  };

  const signUp = async (username, email, password) => {
    const users = readUsers();
    const passwordIssues = getPasswordIssues(password);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Email harus memiliki format yang valid (contoh: nama@email.com).", "error");
      return;
    }
    if (passwordIssues.length > 0) {
      setMessage(`Password belum valid. Kurang: ${passwordIssues.join(", ")}.`, "error");
      return;
    }
    if (users.some((user) => user.username === username)) {
      setMessage("Username sudah terdaftar.", "error");
      return;
    }
    if (users.some((user) => user.email?.toLowerCase() === email.toLowerCase())) {
      setMessage("Email sudah terdaftar.", "error");
      return;
    }

    const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
    const passwordHash = await hashPassword(password, salt);
    users.push({ username, email, salt, passwordHash });
    localStorage.setItem(storageKey, JSON.stringify(users));
    setMessage("Sign-Up berhasil. Akun tersimpan di browser ini.", "success");
  };

  const signIn = async (usernameOrEmail, password) => {
    const user = readUsers().find(
      (savedUser) =>
        savedUser.username === usernameOrEmail ||
        savedUser.email?.toLowerCase() === usernameOrEmail.toLowerCase(),
    );

    if (!user) {
      setMessage("Username atau email tidak terdaftar.", "error");
      return;
    }

    const passwordHash = await hashPassword(password, user.salt);
    setMessage(
      passwordHash === user.passwordHash ? "Sign-In berhasil." : "Password salah.",
      passwordHash === user.passwordHash ? "success" : "error",
    );
  };

  const setMode = (signUpMode) => {
    isSignUp = signUpMode;
    title.innerHTML = isSignUp
      ? 'Create your <em>account.</em>'
      : 'Welcome <em>back.</em>';
    subtitle.textContent = isSignUp
      ? "Buat akun untuk memulai ruang personalmu."
      : "Masuk untuk melanjutkan perjalananmu.";
    formEyebrow.textContent = isSignUp
      ? "A GOOD PLACE TO START"
      : "NICE TO SEE YOU AGAIN";
    usernameLabel.textContent = isSignUp ? "Username" : "Username atau email";
    usernameInput.placeholder = isSignUp ? "Buat username" : "Contoh: fazq01";
    usernameInput.setAttribute(
      "aria-label",
      isSignUp ? "Username" : "Username atau email",
    );
    emailField.hidden = !isSignUp;
    emailInput.required = isSignUp;
    passwordHint.hidden = !isSignUp;
    passwordInput.autocomplete = isSignUp ? "new-password" : "current-password";
    switchText.textContent = isSignUp ? "Sudah punya akun?" : "Belum punya akun?";
    switchButton.textContent = isSignUp ? "Masuk" : "Buat akun";
    submitLabel.textContent = isSignUp ? "Buat akun sekarang" : "Masuk ke akun";
    passwordInput.value = "";
    emailInput.value = "";
    passwordInput.type = "password";
    passwordToggle.innerHTML = eyeIcon;
    passwordToggle.setAttribute("aria-label", "Tampilkan password");
    passwordToggle.setAttribute("aria-pressed", "false");
    setMessage("", "neutral");
  };

  passwordToggle.addEventListener("click", () => {
    const shouldShow = passwordInput.type === "password";
    passwordInput.type = shouldShow ? "text" : "password";
    passwordToggle.innerHTML = shouldShow ? eyeOffIcon : eyeIcon;
    passwordToggle.setAttribute(
      "aria-label",
      shouldShow ? "Sembunyikan password" : "Tampilkan password",
    );
    passwordToggle.setAttribute("aria-pressed", String(shouldShow));
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("", "neutral");

    const usernameOrEmail = usernameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (usernameOrEmail === "" || password === "") {
      setMessage("Username/email dan password tidak boleh kosong.", "error");
      return;
    }
    if (isSignUp && email === "") {
      setMessage("Email wajib diisi saat sign-up.", "error");
      emailInput.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    submitLabel.textContent = "Memproses...";

    try {
      if (isSignUp) {
        await signUp(usernameOrEmail, email, password);
      } else {
        await signIn(usernameOrEmail, password);
      }
    } catch (error) {
      setMessage(
        "Gagal memproses akun. Coba akses melalui localhost dan periksa penyimpanan browser.",
        "error",
      );
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
      submitLabel.textContent = isSignUp ? "Buat akun sekarang" : "Masuk ke akun";
    }
  });

  switchButton.addEventListener("click", () => {
    setMode(!isSignUp);
  });
});
