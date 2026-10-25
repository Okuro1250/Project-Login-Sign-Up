document.addEventListener("DOMContentLoaded", () => {
  const authForm = document.getElementById("authForm");
  const usernameInput = document.getElementById("Inpuser");
  const passwordInput = document.getElementById("inpPass");
  const message = document.getElementById("pesan");
  const title = document.getElementById("TeksSign");
  const switchText = document.getElementById("switchText");
  const switchButton = document.getElementById("switchBut");
  const namablkngInput = document.getElementById("NamaBlk");
  let isSignUp = false;
  const storageKey = "pfsUsers";
  const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
  const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "1234567890";
  const symbols = "!@#$%^&*()-_=+[]{};:'\",.<>/?\\|`~";
  const encoder = new TextEncoder();

  const toHex = (bytes) =>
    Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

  const fromHex = (hex) =>
    Uint8Array.from(hex.match(/.{2}/g) ?? [], (byte) =>
      Number.parseInt(byte, 16),
    );

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

  const readUsers = () => JSON.parse(localStorage.getItem(storageKey) ?? "[]");

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

  const signUp = async (username, password) => {
    const users = readUsers();
    const passwordIssues = getPasswordIssues(password);

    if (passwordIssues.length > 0) {
      message.textContent = `Password belum valid. Kurang: ${passwordIssues.join(", ")}.`;
      return;
    }
    if (users.some((user) => user.username === username)) {
      message.textContent = "Username sudah terdaftar.";
      return;
    }

    const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
    const passwordHash = await hashPassword(password, salt);
    users.push({
      username,
      lastName: namablkngInput.value.trim(),
      salt,
      passwordHash,
    });
    localStorage.setItem(storageKey, JSON.stringify(users));
    message.textContent = "Sign-Up berhasil. Akun tersimpan di browser ini.";
  };

  const signIn = async (username, password) => {
    const user = readUsers().find(
      (savedUser) => savedUser.username === username,
    );
    if (!user) {
      message.textContent = "Username tidak ada.";
      return;
    }

    const passwordHash = await hashPassword(password, user.salt);
    message.textContent =
      passwordHash === user.passwordHash
        ? "Sign-In berhasil."
        : "Password salah.";
  };

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (username === "" || password === "") {
      message.textContent = "Username dan password tidak boleh kosong.";
      return;
    }

    try {
      if (isSignUp) {
        await signUp(username, password);
      } else {
        await signIn(username, password);
      }
    } catch {
      message.textContent = "Gagal memproses akun di penyimpanan browser ini.";
    }
  });

  switchButton.addEventListener("click", () => {
    isSignUp = !isSignUp;
    title.textContent = isSignUp ? "Sign-Up" : "Sign-In";
    switchText.textContent = isSignUp
      ? "Sudah punya akun?"
      : "Belum punya akun?";
    switchButton.textContent = isSignUp ? "Sign-In" : "Sign-Up";
    message.textContent = "";
    passwordInput.value = "";
    namablkngInput.hidden = !isSignUp;
    const usernameLabel = isSignUp ? "Nama Depan" : "Username";
    usernameInput.placeholder = usernameLabel;
    usernameInput.setAttribute("aria-label", usernameLabel);
  });
});
