const params = new URLSearchParams(window.location.search);
const vType = params.get("type") === "recovery" ? "recovery" : "signup";
let vEmail = (params.get("email") || "").trim().toLowerCase();

const noticeCard = document.getElementById("notice-card");
const otpCard = document.getElementById("otp-card");
const pwCard = document.getElementById("password-card");
const emailGroup = document.getElementById("email-group");
const otpInput = document.getElementById("otp-input");
const otpError = document.getElementById("otp-error");
const otpSubmit = document.getElementById("otp-submit");

const onlyDigits = (s) => String(s || "").replace(/\D/g, "");

function setError(el, msg) {
  el.textContent = msg || "";
  el.hidden = !msg;
}

function showOtpCard() {
  noticeCard.hidden = true;
  pwCard.hidden = true;
  otpCard.hidden = false;
  document.getElementById("otp-title").textContent =
    vType === "recovery" ? "Reset your password" : "Verify your email";
  if (vEmail) {
    document.getElementById("otp-subtitle").innerHTML =
      (vType === "recovery" ? "We sent a reset code to " : "We sent a 6-digit code to ") +
      '<strong id="otp-email"></strong>';
    document.getElementById("otp-email").textContent = vEmail;
    emailGroup.hidden = true;
  } else {
    document.getElementById("otp-subtitle").textContent =
      vType === "recovery"
        ? "Enter your email and the 6-digit reset code"
        : "Enter the 6-digit code we emailed you";
    emailGroup.hidden = false;
  }
  otpInput.focus();
}

function showPasswordCard() {
  noticeCard.hidden = true;
  otpCard.hidden = true;
  pwCard.hidden = false;
  if (vEmail) document.getElementById("pw-email").textContent = vEmail;
}

function currentEmail() {
  if (vEmail) return vEmail;
  const typed = document.getElementById("otp-email-input").value.trim().toLowerCase();
  if (typed) vEmail = typed;
  return vEmail;
}

async function submitCode(e) {
  if (e) e.preventDefault();
  const token = onlyDigits(otpInput.value);
  setError(otpError, "");
  if (token.length !== 6) return setError(otpError, "Enter the 6-digit code");
  const email = currentEmail();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError(otpError, "Enter your email address");
    document.getElementById("otp-email-input").focus();
    return;
  }
  otpSubmit.disabled = true;
  const result = await verifyOtpCode(email, token, vType);
  otpSubmit.disabled = false;
  if (!result.success) return setError(otpError, result.message);
  if (vType === "recovery") {
    showPasswordCard();
  } else {
    showToast("Email verified — welcome!");
    setTimeout(() => { window.location.href = "account.html"; }, 500);
  }
}

Store.ready().then(authReady).then(() => {
  const sb = Store.supabase();
  if (!sb) {
    noticeCard.hidden = false;
    return;
  }

  // Email link with ?code= (password reset link) skips typing the code
  const codeParam = (params.get("code") || params.get("token") || "").trim();
  if (vType === "recovery" && codeParam) {
    exchangeRecoveryCode(codeParam).then((r) => {
      if (r.success) showPasswordCard();
      else {
        showOtpCard();
        setError(otpError, r.message);
      }
    });
  } else {
    showOtpCard();
  }
});

document.getElementById("otp-form").addEventListener("submit", submitCode);
otpInput.addEventListener("input", () => {
  otpInput.value = onlyDigits(otpInput.value).slice(0, 6);
  if (otpInput.value.length === 6) submitCode();
});

document.getElementById("resend-link").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = currentEmail();
  if (!email) {
    setError(otpError, "Enter your email address first");
    return;
  }
  const result = await resendOtpCode(email, vType);
  showToast(result.success ? "New code sent — check your email" : result.message);
});

document.getElementById("password-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pw = document.getElementById("pw-input").value;
  const pw2 = document.getElementById("pw-confirm").value;
  const err = document.getElementById("pw-error");
  setError(err, "");
  if (pw.length < 6) return setError(err, "Password must be at least 6 characters");
  if (pw !== pw2) return setError(err, "Passwords do not match");
  const btn = document.getElementById("pw-submit");
  btn.disabled = true;
  const result = await setNewPassword(pw);
  btn.disabled = false;
  if (!result.success) return setError(err, result.message);
  showToast("Password updated — you're logged in");
  setTimeout(() => { window.location.href = "account.html"; }, 600);
});
