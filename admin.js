// ==========================================
// 🔥 TrellonPay Admin Dashboard (v3)
// ==========================================
import { db, auth } from "./backend.js";
import { 
  collection, getDocs, onSnapshot, query, where, orderBy, limit, doc, updateDoc, getDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";


// ==========================================
// 💬 POPUP FUNCTION (Unified TrellonPay Style)
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
// 🔒 ADMIN AUTH CHECK
// ==========================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showPopup("Access denied. Please log in as admin.", "warning");
    window.location.href = "admin-login.html";
    return;
  }

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists() || docSnap.data().isAdmin !== true) {
    showPopup("Access denied. Admins only.", "error");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  showPopup("Admin verified. Loading dashboard...");
  loadAdminDashboard();
});


// ==========================================
// 📊 1. Total Users (Live)
// ==========================================
function getTotalUsers() {
  onSnapshot(collection(db, "users"), (snapshot) => {
    document.getElementById("totalUsers").textContent = snapshot.size;
  });
}


// ==========================================
// 👥 2. Daily Active Users
// ==========================================
async function getDailyActiveUsers() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, "users"),
    where("lastActive", ">=", Timestamp.fromDate(today))
  );

  const snapshot = await getDocs(q);
  document.getElementById("dailyActiveUsers").textContent = snapshot.size;
}


// ==========================================
// 💸 3. Pending Withdrawals (Live)
// ==========================================
function getPendingWithdrawals() {
  onSnapshot(
    query(collection(db, "withdrawals"), where("status", "==", "pending")),
    (snapshot) => {
      document.getElementById("pendingWithdrawals").textContent = snapshot.size;
    }
  );
}

// ==========================================
// 💰 Completed Withdrawals Count (Live)
// ==========================================
function getCompletedWithdrawals() {
  const el = document.getElementById("completedWithdrawals");
  if (!el) return; // exit if element not found

  onSnapshot(
    query(collection(db, "withdrawals"), where("status", "==", "completed")),
    (snapshot) => {
      el.textContent = snapshot.size;
    }
  );
}

// ==========================================
// 📈 4. Total Points Summary
// ==========================================
async function getPointsSummary() {
  const usersSnapshot = await getDocs(collection(db, "users"));
  let totalPoints = 0;

  usersSnapshot.forEach((doc) => {
    totalPoints += doc.data().points || 0;
  });

  document.getElementById("totalPoints").textContent = totalPoints.toLocaleString();

  await calculatePointsPeriod("week");
  await calculatePointsPeriod("month");
}

async function calculatePointsPeriod(type) {
  const now = new Date();
  const dateFrom = new Date();
  if (type === "week") dateFrom.setDate(now.getDate() - 7);
  if (type === "month") dateFrom.setMonth(now.getMonth() - 1);

  const q = query(
    collection(db, "earnings"),
    where("timestamp", ">=", Timestamp.fromDate(dateFrom))
  );

  const snapshot = await getDocs(q);
  let total = 0;
  snapshot.forEach((doc) => (total += doc.data().points || 0));

  const el = document.getElementById(type === "week" ? "weeklyPoints" : "monthlyPoints");
  if (el) el.textContent = total.toLocaleString();
}


// ==========================================
// 📋 5. Users Table (Live)
// ==========================================
function getUsersList() {
  onSnapshot(collection(db, "users"), (snapshot) => {
    const table = document.getElementById("usersTableBody");
    if (!table) return;

    // Create table header (S/N, Name, Email, UID, etc)
    let tableHTML = `
      <tr style="font-weight:bold; background:#f4f4f4;">
        <th>S/N</th>
        <th>Full Name</th>
        <th>Email</th>
        <th>UID</th>
        <th>Points</th>
        <th>Action</th>
      </tr>
    `;

    let sn = 1;
    snapshot.forEach((docSnap) => {
      const u = docSnap.data();
      const date = u.userDateJoined?.seconds
        ? new Date(u.userDateJoined.seconds * 1000).toLocaleDateString()
        : "—";

      tableHTML += `
        <tr>
          <td>${sn++}</td>
          <td>${u.fullName || "N/A"}</td>
          <td>${u.email || "N/A"}</td>
          <td>${docSnap.id}</td>
          <td>${u.points || 0}</td>
          <td>
            <button class="remove-user-btn" data-id="${docSnap.id}" 
              style="background:#f44336; color:#fff; border:none; padding:5px 8px; border-radius:5px; cursor:pointer;">
              Remove
            </button>
          </td>
        </tr>`;
    });

    table.innerHTML = tableHTML;

    // Attach delete event to each button
    document.querySelectorAll(".remove-user-btn").forEach(btn => {
      btn.addEventListener("click", () => removeUser(btn.dataset.id));
    });
  });
}


// 🗑️ Permanently delete user document from Firestore
import { deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

async function removeUser(uid) {
  if (!confirm("Are you sure you want to permanently delete this user?")) return;

  try {
    await deleteDoc(doc(db, "users", uid));
    showPopup("User account permanently deleted.", "success");
  } catch (err) {
    console.error(err);
    showPopup("Error deleting user account.", "error");
  }
}


// ==========================================
// 💰 6. Withdrawals Table + Pay / Reject
// ==========================================
function getWithdrawals() {
  const withdrawalsRef = collection(db, "withdrawals");

  onSnapshot(withdrawalsRef, (snapshot) => {
    const table = document.getElementById("withdrawalsTableBody");
    if (!table) return;

    // Table header
    let tableHTML = `
      <tr style="font-weight:bold; background:#f4f4f4;">
        <th>S/N</th>
        <th>Email</th>
        <th>Type</th>
        <th>Amount</th>
        <th>Details</th>
        <th>Status</th>
        <th>Date Requested</th>
        <th>Action</th>
      </tr>
    `;

    if (snapshot.empty) {
      table.innerHTML = `<tr><td colspan="8" style="text-align:center; color:gray;">No withdrawal requests found</td></tr>`;
      return;
    }

    // Collect all docs into an array
    const withdrawalsArray = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      data.id = docSnap.id; // keep the doc ID
      withdrawalsArray.push(data);
    });

    // Sort by date descending (most recent first)
    withdrawalsArray.sort((a, b) => {
      const dateA = a.date?.seconds ? a.date.seconds * 1000 : 0;
      const dateB = b.date?.seconds ? b.date.seconds * 1000 : 0;
      return dateB - dateA; // descending
    });

    // Build table HTML
    let sn = 1;
    withdrawalsArray.forEach((w) => {
      const id = w.id;

      // Format date requested
      const dateRequested = w.date?.seconds
        ? new Date(w.date.seconds * 1000).toLocaleDateString()
        : "—";

      // Convert details object to string
      let detailsStr = "—";
      if (w.details && typeof w.details === "object") {
        detailsStr = Object.entries(w.details).map(([k, v]) => `${k}: ${v}`).join(", ");
      } else if (w.details) {
        detailsStr = w.details;
      }

      // Action buttons
      let actionHTML = `<span style="color:gray;">${w.status}</span>`;
      if (w.status === "pending") {
        actionHTML = `
          <button class="pay-btn" data-id="${id}" 
            style="background:#4CAF50; color:#fff; border:none; padding:5px 8px; border-radius:5px; cursor:pointer;">
            Pay
          </button>
          <button class="reject-btn" data-id="${id}" 
            style="background:#f44336; color:#fff; border:none; padding:5px 8px; border-radius:5px; cursor:pointer;">
            Reject
          </button>
        `;
      }

      tableHTML += `
        <tr>
          <td>${sn++}</td>
          <td>${w.email || "N/A"}</td>
          <td>${w.type || "—"}</td>
          <td>${w.amount || 0}</td>
          <td>${detailsStr}</td>
          <td style="text-transform:capitalize;">${w.status || "pending"}</td>
          <td>${dateRequested}</td>
          <td>${actionHTML}</td>
        </tr>`;
    });

    table.innerHTML = tableHTML;

    // Attach Pay / Reject button event listeners
    document.querySelectorAll(".pay-btn").forEach((btn) =>
      btn.addEventListener("click", () => updateWithdrawalStatus(btn.dataset.id, "completed"))
    );
    document.querySelectorAll(".reject-btn").forEach((btn) =>
      btn.addEventListener("click", () => updateWithdrawalStatus(btn.dataset.id, "canceled"))
    );
  });
}

// ==========================================
// ✅ Update withdrawal status (completed or canceled)
// ==========================================
async function updateWithdrawalStatus(id, status) {
  try {
    await updateDoc(doc(db, "withdrawals", id), { status });
    showPopup(`Withdrawal ${status}`, "success");
  } catch (err) {
    console.error(err);
    showPopup("Error updating withdrawal status", "error");
  }
}


// ==========================================
// 🏆 7. Leaderboard (Top 10 Earners)
// ==========================================
function getLeaderboard() {
  onSnapshot(
    query(collection(db, "users"), orderBy("points", "desc"), limit(10)),
    (snapshot) => {
      const list = document.getElementById("leaderboard");
      if (!list) return;
      list.innerHTML = "";
      let rank = 1;
      snapshot.forEach((doc) => {
        const u = doc.data();
        list.innerHTML += `
          <li><strong>#${rank++}</strong> ${u.fullName || "Unknown"} — ${u.points || 0} pts</li>`;
      });
    }
  );
}


// ==========================================
// 🔁 REFRESH BUTTON
// ==========================================
document.getElementById("refreshBtn")?.addEventListener("click", () => {
  showPopup("Refreshing dashboard...", "info");
  loadAdminDashboard();
});


// ==========================================
// 🚀 LOAD ALL DASHBOARD DATA
// ==========================================
function loadAdminDashboard() {
  getTotalUsers();
  getDailyActiveUsers();
  getPendingWithdrawals();
  getPointsSummary();
  getUsersList();
  getWithdrawals();
  getLeaderboard();
}