// ================================
// Firebase Initialization
// ================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection, 
  addDoc, 
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA-4CUzVTziJCX1RTW1eRWdhfYB-IDGYIg",
  authDomain: "trellonpay.firebaseapp.com",
  projectId: "trellonpay",
  storageBucket: "trellonpay.firebasestorage.app",
  messagingSenderId: "249844932711",
  appId: "1:249844932711:web:a90459c84cfa137216f4c2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

// ================================
// Pop-up Message Utility
// ================================
function showPopup(message, type = "info") {
  let popup = document.createElement("div");
  popup.className = `popup-message ${type}`;
  popup.textContent = message;
  document.body.appendChild(popup);

  setTimeout(() => popup.classList.add("show"), 50);
  setTimeout(() => popup.classList.remove("show"), 2000);
  setTimeout(() => popup.remove(), 2500);
}

const popupStyles = document.createElement("style");
popupStyles.textContent = `
  .popup-message {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.9);
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    padding: 14px 25px;
    border-radius: 8px;
    font-family: "Poppins", sans-serif;
    font-size: 15px;
    opacity: 0;
    z-index: 9999;
    transition: opacity 0.3s ease, transform 0.3s ease;
    text-align: center;
    max-width: 80%;
  }
  .popup-message.show {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  .popup-message.success { background: #28a745; }
  .popup-message.error { background: #e74c3c; }
  .popup-message.info { background: #3498db; }
`;
document.head.appendChild(popupStyles);

// ================================
// Loader Utility
// ================================
function showLoader(message = "Please wait...") {
  let loader = document.getElementById("loaderOverlay");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "loaderOverlay";
    loader.innerHTML = `
      <div class="loader-container">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
      <style>
        #loaderOverlay {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          z-index: 9998;
          color: white;
          font-family: "Poppins", sans-serif;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid rgba(255,255,255,0.3);
          border-top: 5px solid #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loader-container p {
          margin-top: 15px;
          font-size: 16px;
        }
      </style>
    `;
    document.body.appendChild(loader);
  } else {
    loader.style.display = "flex";
  }
}

function hideLoader() {
  const loader = document.getElementById("loaderOverlay");
  if (loader) loader.style.display = "none";
}

// ================================
// User Sign-Up
// ================================
export async function signUpUser(fullName, email, password) {
  try {
    showLoader("Creating your account...");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userData = {
      fullName: fullName,
      email: email,
      points: 0,
      dateJoined: new Date().toISOString(),
      uid: user.uid,
    };

    await setDoc(doc(db, "users", user.uid), userData);

    hideLoader();
    showPopup("✅ Registration complete! Login now.", "success");
    setTimeout(() => window.location.reload(), 2200);
  } catch (error) {
    hideLoader();
    console.error("Signup error:", error.message);
    showPopup("⚠️ Invalid credentials. Check your details.", "error");
  }
}

// ================================
// User Login
// ================================
export async function loginUser(email, password) {
  try {
    showLoader("Signing you in...");
    await signInWithEmailAndPassword(auth, email, password);
    hideLoader();
    showPopup("✅ Login successful!", "success");
    setTimeout(() => (window.location.href = "index.html"), 2200);
  } catch (error) {
    hideLoader();
    console.error("Login error:", error.message);
    showPopup("⚠️ User not found. Check email/password.", "error");
  }
}

// ================================
// Auth State Listener
// ================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User logged in:", user.email);
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        if (document.getElementById("userName"))
          document.getElementById("userName").innerText = data.fullName || "Guest";

        if (document.getElementById("userEmail"))
          document.getElementById("userEmail").innerText = data.email;

        if (document.getElementById("userEmailHeader"))
          document.getElementById("userEmailHeader").innerText = data.email;

        if (document.getElementById("userPoints"))
          document.getElementById("userPoints").innerText = data.points || 0;

        if (document.getElementById("userDateJoined")) {
          const date = new Date(data.dateJoined);
          document.getElementById("userDateJoined").innerText = date.toDateString();
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error.message);
    }
  } else {
    console.warn("No user logged in — redirecting to login page...");
    setTimeout(() => {
      if (!window.location.pathname.endsWith("login.html")) {
        window.location.href = "login.html";
      }
    }, 800);
  }
});

// ================================
// Logout
// ================================
export async function logoutUser() {
  try {
    showLoader("Logging out...");
    await signOut(auth);
    hideLoader();
    showPopup("✅ Successfully logged out!", "success");
    setTimeout(() => (window.location.href = "login.html"), 2200);
  } catch (error) {
    hideLoader();
    console.error("Logout error:", error.message);
    showPopup("⚠️ " + error.message, "error");
  }
}

// ================================
// Update User Points
// ================================
export async function updateUserPoints(userId, newPoints) {
  try {
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const currentPoints = docSnap.data().points || 0;
      await setDoc(userRef, { points: currentPoints + newPoints }, { merge: true });
    }
  } catch (error) {
    console.error("Error updating points:", error.message);
  }
}

// ================================
// WITHDRAWAL HANDLERS (Merged from withdraw.js)
// ================================

// Helper popup reused
function withdrawPopup(message, type = "success") {
  showPopup(message, type);
}

// 1️⃣ Airtime Withdrawal
const airtimeForm = document.getElementById("airtimeForm");
if (airtimeForm) {
  airtimeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return withdrawPopup("Please login first!", "error");

    const amount = document.getElementById("airtimeAmount").value;
    const phone = document.getElementById("airtimePhone").value;
    const network = document.getElementById("network").value;

    if (!amount || !phone || !network) return withdrawPopup("Please fill all fields.", "error");

    try {
      await addDoc(collection(db, "withdrawals"), {
        email: user.email,
        type: "airtime",
        amount: parseFloat(amount),
        details: { phoneNumber: phone, network },
        status: "pending",
        date: serverTimestamp(),
      });

      withdrawPopup("Airtime withdrawal request sent successfully!", "success");
      airtimeForm.reset();
    } catch (error) {
      console.error(error);
      withdrawPopup("Error sending airtime request.", "error");
    }
  });
}

// 2️⃣ Bank Transfer Withdrawal
const bankForm = document.getElementById("bankForm");
if (bankForm) {
  bankForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return withdrawPopup("Please login first!", "error");

    const amount = document.getElementById("bankAmount").value;
    const bankName = document.getElementById("bankName").value;
    const accountNumber = document.getElementById("accountNumber").value;
    const accountName = document.getElementById("accountName").value;

    if (!amount || !bankName || !accountNumber || !accountName)
      return withdrawPopup("Please fill all fields.", "error");

    try {
      await addDoc(collection(db, "withdrawals"), {
        email: user.email,
        type: "bank",
        amount: parseFloat(amount),
        details: { bankName, accountNumber },
        status: "pending",
        date: serverTimestamp(),
      });

      withdrawPopup("Bank withdrawal request sent successfully!", "success");
      bankForm.reset();
    } catch (error) {
      console.error(error);
      withdrawPopup("Error sending bank request.", "error");
    }
  });
}

// 3️⃣ StudyPro Wallet Withdrawal
const studyForm = document.getElementById("studyForm");
if (studyForm) {
  studyForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return withdrawPopup("Please login first!", "error");

    const amount = document.getElementById("studyproAmount").value;
    const walletId= document.getElementById("studyproEmail").value;

    if (!amount || !walletId) return withdrawPopup("Please fill all fields.", "error");

    try {
      await addDoc(collection(db, "withdrawals"), {
        email: user.email,
        type: "studypro",
        amount: parseFloat(amount),
        details: { walletId },
        status: "pending",
        date: serverTimestamp(),
      });

      withdrawPopup("StudyPro withdrawal request sent successfully!", "success");
      studyForm.reset();
    } catch (error) {
      console.error(error);
      withdrawPopup("Error sending StudyPro request.", "error");
    }
  });
}