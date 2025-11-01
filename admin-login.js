// ==========================================
// 🔐 TrellonPay Admin Login (v2)
// ==========================================
import { auth, db } from "./backend.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


// ==========================================
// 💬 POPUP FUNCTION (TrellonPay Style)
// ==========================================
function showPopup(message, type = "success") {
  const popup = document.createElement("div");
  popup.textContent = message;
  popup.style.position = "fixed";
  popup.style.top = "20px";
  popup.style.right = "20px";
  popup.style.padding = "12px 18px";
  popup.style.background = 
    type === "success" ? "#4CAF50" :
    type === "error" ? "#f44336" :
    type === "warning" ? "#ff9800" : "#2196F3";
  popup.style.color = "#fff";
  popup.style.borderRadius = "8px";
  popup.style.fontSize = "14px";
  popup.style.fontWeight = "500";
  popup.style.boxShadow = "0 3px 8px rgba(0,0,0,0.2)";
  popup.style.transition = "all 0.3s ease";
  popup.style.zIndex = "9999";
  popup.style.opacity = "0";
  document.body.appendChild(popup);

  setTimeout(() => popup.style.opacity = "1", 50);
  setTimeout(() => {
    popup.style.opacity = "0";
    setTimeout(() => popup.remove(), 300);
  }, 3000);
}


// ==========================================
// 🧾 ADMIN LOGIN HANDLER
// ==========================================
const form = document.getElementById("adminLoginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();

  if (!email || !password) {
    showPopup("Please fill in all fields.", "warning");
    return;
  }

  try {
    // Try to log in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch admin data
    const adminRef = doc(db, "users", user.uid);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      showPopup("No admin record found.", "error");
      return;
    }

    const adminData = adminSnap.data();

    // Check admin role
    if (adminData.isAdmin === true) {
      showPopup("Welcome back, Admin!");
      setTimeout(() => window.location.href = "index.html", 1200);
    } else {
      showPopup("Access denied. Not an admin account.", "error");
    }

  } catch (error) {
    console.error(error);
    if (error.code === "auth/invalid-email") {
      showPopup("Invalid email address.", "error");
    } else if (error.code === "auth/wrong-password") {
      showPopup("Incorrect password.", "error");
    } else if (error.code === "auth/user-not-found") {
      showPopup("Admin account not found.", "error");
    } else {
      showPopup("Login failed. Please try again.", "error");
    }
  }
});