Store.ready().then(authReady).then(() => {
  if (getCurrentUser()) window.location.href = "account.html";
  const forgot = document.getElementById("forgot-link");
  if (Store.supabase()) forgot.style.display = "inline";
  forgot.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.querySelector('#login-form [name="email"]').value;
    if (!email) return showToast("Enter your email first");
    const result = await sendPasswordReset(email);
    if (!result.success) return showToast(result.message);
    showToast("Reset code sent — check your email");
    setTimeout(() => {
      window.location.href =
        "verify.html?type=recovery&email=" + encodeURIComponent(email);
    }, 700);
  });
});

document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const submit = form.querySelector('[type="submit"]');
  const email = form.elements.namedItem("email").value;
  const password = form.elements.namedItem("password").value;
  submit.disabled = true;
  submit.classList.add("is-loading");
  submit.setAttribute("aria-busy", "true");
  Store.ready()
    .then(() => login(email, password))
    .then((result) => {
      if (result.success) {
        showToast(result.message || "Welcome back!");
        setTimeout(() => { window.location.href = "account.html"; }, 500);
      } else if (result.code === "email_not_confirmed") {
        showToast("Email not verified yet — enter your code");
        setTimeout(() => {
          window.location.href =
            "verify.html?type=signup&email=" + encodeURIComponent(email);
        }, 700);
      } else {
        showToast(result.message);
      }
    })
    .catch(() => showToast("Sign-in failed — see the browser console (F12)."))
    .finally(() => {
      submit.disabled = false;
      submit.classList.remove("is-loading");
      submit.removeAttribute("aria-busy");
    });
});
