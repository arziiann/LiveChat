let socket;
let currentUserId;
let selectedReceiverId = null;

async function loadUserData() {
  try {
    const res = await fetch("/chat-data", { credentials: "include" });
    if (!res.ok) throw new Error("User not authenticated");

    const data = await res.json();
    currentUserId = data.userId;

    const userIdFromUrl = window.location.pathname.split("/").pop();
    if (parseInt(userIdFromUrl) !== data.userId) {
      alert("You are not authorized to view this page.");
      window.location.href = "/";
      return;
    }

    document.querySelector(".menu-name").innerHTML = `${data.firstName} ${data.lastName}`;
    document.getElementById("profilePic").src = data.profileImageUrl || "/xamo.jpg";

    socket = io("http://localhost:3001", {
      withCredentials: true,
      transports: ["websocket"],
    });
    socket.emit("user-online", currentUserId);

    socket.on("new-message", (message) => {
      if (message.from === selectedReceiverId) {
        appendHTMLMessage(
          `<strong>${message.senderName}</strong>: ${message.text}`,
          "received"
        );
        socket.emit("mark-messages-read", {
          from: selectedReceiverId,
          to: currentUserId,
        });
      } else {
        const userDiv = document.querySelector(
          `.user[data-id="${message.from}"]`
        );
        if (userDiv) {
          let badge = userDiv.querySelector(".unread-count");
          if (!badge) {
            badge = document.createElement("span");
            badge.className = "unread-count";
            userDiv.appendChild(badge);
          }
          badge.textContent = String(
            parseInt(badge.textContent || "0") + 1
          );
        }
      }
      moveUserToTop(message.from);
    });

    socket.on("unread-count", ({ userId, count }) => {
      const userDiv = document.querySelector(
        `.user[data-id="${userId}"]`
      );
      if (!userDiv) return;

      let badge = userDiv.querySelector(".unread-count");
      if (count > 0) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "unread-count";
          userDiv.appendChild(badge);
        }
        badge.textContent = count;
      } else if (badge) {
        badge.remove();
      }
    });
    await loadUserList();
  } catch (error) {
    console.error("Error loading user data:", error);
    document.getElementById("chatHeader").textContent =
      "Authentication Error";
  }
}

async function loadUserList() {
  try {
    const res = await fetch("/users", {
      credentials: "include",
    });

    if (!res.ok) {
      console.error("Failed to load users1");
      return;
    }

    const users = await res.json();
    const userListContainer = document.getElementById("userList");
    userListContainer.innerHTML = "";

    users.forEach((user) => {
      const userDiv = document.createElement("div");
      userDiv.classList.add("user");
      userDiv.setAttribute("data-id", user.id);

      if (user.id === selectedReceiverId) {
        userDiv.classList.add("selected");
      }

      const profileImg = user.profileImageUrl || "/xamo.jpg";
      userDiv.innerHTML = `
        <img src="${profileImg}" alt="Profile" />
        <span class="user-name">${user.firstName} ${user.lastName}</span>
      `;

      userDiv.addEventListener("click", () => {
        selectedReceiverId = user.id;
        document.getElementById("chatMessages").innerHTML = " ";
        document.getElementById("chatHeader").textContent = `Chat with ${user.firstName} ${user.lastName}`;
        document.querySelectorAll(".user").forEach((el) => el.classList.remove("selected"));
        userDiv.classList.add("selected");
        document.getElementById("userMenu").classList.remove("open");
        document.getElementById("messageInput").addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            document.getElementById("sendBtn").click();
          }
        });

        const badge = userDiv.querySelector(".unread-count");
        if (badge) badge.remove();

        socket.emit("mark-messages-read", {
          from: selectedReceiverId,
          to: currentUserId,
        });

        loadMessagesForUser(user.id);
        updateUnreadCount();
      });

      userListContainer.appendChild(userDiv);
    });
  } catch (err) {
    console.error("Failed to load users2:", err);
  }
}

async function loadMessagesForUser(userId) {
  try {
    const res = await fetch(`/messages/${userId}`, {
      method: "GET",
      credentials: "include",
    });
    const messages = await res.json();
    const chatMessages = document.getElementById("chatMessages");
    chatMessages.innerHTML = "";
    messages.forEach((msg) => {
      const isSent = msg.from === currentUserId;
      const senderName = isSent ? "You" : msg.senderName;
      const html = `<strong>${senderName}</strong>: ${msg.text}`;
      appendHTMLMessage(html, isSent ? "sent" : "received", false);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (err) {
    console.error("Failed to load message history:", err);
  }
}

function appendHTMLMessage(html, type, scroll = true) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", type);
  msgDiv.innerHTML = html;
  document.getElementById("chatMessages").appendChild(msgDiv);
  if (scroll) {
    msgDiv.scrollIntoView({ behavior: "smooth" });
  }
}

function moveUserToTop(userId) {
  const userList = document.getElementById("userList");
  const userDiv = userList.querySelector(`[data-id='${userId}']`);
  if (userDiv && userList.firstChild !== userDiv) {
    userList.prepend(userDiv);
  }
}

function updateUnreadCount() {
  if (selectedReceiverId && socket) {
    socket.emit("get-unread-count", {
      from: selectedReceiverId,
      to: currentUserId,
    });
  }
}

document.addEventListener("click", (event) => {
  const menu = document.getElementById("userMenu");
  const toggleBtn = document.querySelector(".menu-toggle");

  if (
    menu.classList.contains("open") &&
    !menu.contains(event.target) &&
    !toggleBtn.contains(event.target)
  ) {
    menu.classList.remove("open");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadUserData();
  document.getElementById("profilePic").addEventListener("click", () => {
    document.getElementById("profilePicInput").click();
  });

  document.getElementById("profilePicInput").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const res = await fetch("/upload-profile-pic", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        document.getElementById("profilePic").src = data.imageUrl;
      } else {
        console.error(data.message || "Failed to upload image");
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  });

  const sendBtn = document.getElementById("sendBtn");
  sendBtn.addEventListener("click", () => {
    const input = document.getElementById("messageInput");
    const text = input.value.trim();
    if (!selectedReceiverId) return;
    if (text && socket && currentUserId) {
      socket.emit("send-message", {
        from: currentUserId,
        to: selectedReceiverId,
        text,
      });

      appendHTMLMessage(`<strong>You</strong>: ${text}`, "sent");
      moveUserToTop(selectedReceiverId);
      input.value = "";
    }
  });
});

function toggleMenu() {
  const menu = document.getElementById("userMenu");
  menu.classList.toggle("open");
}
