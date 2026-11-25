Store.ready().then(authReady).then(() => {
  if (getCurrentUser()) window.location.href = "account.html";
});

document.getElementById("register-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const name = form.elements.namedItem("name").value;
  const email = form.elements.namedItem("email").value;
  const password = form.elements.namedItem("password").value;
  Store.ready()
    .then(() => register(name, email, password))
    .then((result) => {
      if (result.success && result.needsVerification) {
        showToast("Verification code sent — check your email");
        setTimeout(() => {
          window.location.href =
            "verify.html?type=signup&email=" + encodeURIComponent(result.email || email);
        }, 600);
      } else if (result.success) {
        showToast(result.message || "Account created!");
        setTimeout(() => { window.location.href = "account.html"; }, 500);
      } else {
        if (result.code === "user_already_exists") {
          showToast(result.message + " — redirecting…");
          setTimeout(() => { window.location.href = "login.html"; }, 900);
        } else {
          showToast(result.message);
        }
      }
    });
});
