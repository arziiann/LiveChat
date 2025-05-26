const form = document.getElementById("verifyForm");
const msg = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  msg.textContent = "";
  msg.className = "";

  const email = document.getElementById("email").value.trim();
  const code = document.getElementById("code").value.trim();

  if (!email) {
    msg.className = "error";
    msg.textContent = "Please enter your email.";
    return;
  }

  if (!code) {
    msg.className = "error";
    msg.textContent = "Please enter the verification code.";
    return;
  }

  submitBtn.disabled = true;

  try {
    const res = await fetch("/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json();

    if (res.ok) {
      msg.className = "success";
      msg.textContent = "Verification successful! You can now log in.";
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } else {
      msg.className = "error";
      msg.textContent = data.message || "Verification failed.";
    }
  } catch (err) {
    msg.className = "error";
    msg.textContent = "Network error. Please try again.";
  } finally {
    submitBtn.disabled = false;
  }
});
