// login.js
import { signUpUser, loginUser } from "./backend.js";

// ===============================
// Popup Notification (Top + Fade In)
// ===============================
function showPopup(message, type = "info") {
  const popup = document.createElement("div");
  popup.className = `popup-message ${type}`;
  popup.innerText = message;
  document.body.appendChild(popup);

  // Show animation
  setTimeout(() => popup.classList.add("show"), 50);

  // Remove after 2 seconds
  setTimeout(() => {
    popup.classList.remove("show");
    setTimeout(() => popup.remove(), 400);
  }, 2000);
}

// ===============================
// Handle Login
// ===============================
document.getElementById("loginBtn").addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    showPopup("Please enter your email and password", "error");
    return;
  }

  try {
    await loginUser(email, password);
    showPopup("Successful", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  } catch (error) {
    console.error("Login failed:", error);
    showPopup("User Not Found. Check email/password", "error");
  }
});

// ===============================
// Handle Sign-Up
// ===============================
document.getElementById("signupBtn").addEventListener("click", async (e) => {
  e.preventDefault();

  const fullName = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  if (!fullName || !email || !password) {
    showPopup("Please fill all fields", "error");
    return;
  }

  try {
    await signUpUser(fullName, email, password);
    showPopup("Registration complete: Login now!", "success");

    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error) {
    console.error("Signup failed:", error);
    showPopup("Invalid Credentials. Check your details", "error");
  }
});