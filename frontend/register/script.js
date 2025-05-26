const form = document.getElementById("registerForm");
const emailInput = document.getElementById("email");
const errorDiv = document.getElementById("emailError");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const firstName = form.querySelector('input[name="firstName"]').value.trim();
  const lastName = form.querySelector('input[name="lastName"]').value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = form.querySelector('input[name="password"]').value;

  if (!email.endsWith("@gmail.com")) {
    errorDiv.style.display = "block";
    errorDiv.textContent = "Only Gmail addresses are allowed.";
    return;
  } else {
    errorDiv.style.display = "none";
  }

  form.querySelector('input[type="submit"]').disabled = true;

  try {
    const res = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      alert(
        "Registration successful! Please check your Gmail for verification code."
      );
      window.location.href = "/verify";
    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    console.error("Request failed:", err);
    alert("Network error. Please try again.");
  } finally {
    form.querySelector('input[type="submit"]').disabled = false;
  }
});
