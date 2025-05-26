const loginForm = document.getElementById("loginForm");

      loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;

        try {
          const res = await fetch("/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          alert(data.message);

          if (res.ok && data.userId) {
            window.location.href = `/chat/${data.userId}`;
          }
        } catch (err) {
          alert("Login failed. Please try again.");
          console.error(err);
        }
      });

      loginForm.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          loginForm.dispatchEvent(new Event("submit"));
        }
      });