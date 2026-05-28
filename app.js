import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  onValue
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0Ext1VtgzjC5imQ6tLlQdRuBl7TmgN5U",
  authDomain: "wedding-nfc-stamp.firebaseapp.com",
  databaseURL: "https://wedding-nfc-stamp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wedding-nfc-stamp",
  storageBucket: "wedding-nfc-stamp.firebasestorage.app",
  messagingSenderId: "982842589372",
  appId: "1:982842589372:web:f31ab7b0e4893a33fb50b9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const STAFF_DELETE_PASSWORD = "loho6666";

const stations = ["checkin", "photo", "voice", "wall"];

const stationNames = {
  checkin: "簽到",
  photo: "拍貼機",
  voice: "留聲電話亭",
  wall: "交往照片牆"
};

const stationIcons = {
  checkin: "🖊️",
  photo: "📸",
  voice: "☎️",
  wall: "🖼️"
};

const registerArea = document.getElementById("registerArea");
const cardArea = document.getElementById("cardArea");
const guestNameInput = document.getElementById("guestName");
const phoneLast3Input = document.getElementById("phoneLast3");
const startBtn = document.getElementById("startBtn");
const helloText = document.getElementById("helloText");
const progressText = document.getElementById("progressText");
const messageText = document.getElementById("messageText");

const stampModal = document.getElementById("stampModal");
const modalIcon = document.getElementById("modalIcon");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalCloseBtn = document.getElementById("modalCloseBtn");

const adminPage = document.getElementById("adminPage");
const normalPage = document.getElementById("normalPage");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResult = document.getElementById("searchResult");
const deleteAllBtn = document.getElementById("deleteAllBtn");

let currentGuestId = localStorage.getItem("weddingGuestId");

const params = new URLSearchParams(window.location.search);
const isStaff = params.get("staff");

if (isStaff === "1") {
  normalPage.classList.add("hidden");
  adminPage.classList.remove("hidden");
}

startBtn.addEventListener("click", createGuestCard);
searchBtn.addEventListener("click", searchGuest);
deleteAllBtn.addEventListener("click", deleteAllGuests);

modalCloseBtn.addEventListener("click", () => {
  stampModal.classList.add("hidden");
});

async function createGuestCard() {
  const name = guestNameInput.value.trim();
  const phoneLast3 = phoneLast3Input.value.trim();

  if (!name) {
    alert("請輸入姓名");
    return;
  }

  if (!/^\d{3}$/.test(phoneLast3)) {
    alert("請輸入手機末三碼");
    return;
  }

  const snapshot = await get(ref(db, "guests"));
  let foundGuestId = null;

  if (snapshot.exists()) {
    const allGuests = snapshot.val();

    Object.entries(allGuests).forEach(([id, guest]) => {
      if (
        guest.name === name &&
        guest.phoneLast3 === phoneLast3
      ) {
        foundGuestId = id;
      }
    });
  }

  if (foundGuestId) {
    currentGuestId = foundGuestId;
    localStorage.setItem("weddingGuestId", foundGuestId);
    listenGuestData();
    collectStamp();
    return;
  }

  const guestId = "guest_" + Date.now();

  await set(ref(db, "guests/" + guestId), {
    name: name,
    phoneLast3: phoneLast3,
    checkin: false,
    photo: false,
    voice: false,
    wall: false,
    redeemed: false,
    createdAt: Date.now()
  });

  localStorage.setItem("weddingGuestId", guestId);
  currentGuestId = guestId;

  listenGuestData();
  collectStamp();
}

function listenGuestData() {
  if (!currentGuestId) return;

  onValue(ref(db, "guests/" + currentGuestId), (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    renderCard(data);
  });
}

function renderCard(data) {
  registerArea.classList.add("hidden");
  cardArea.classList.remove("hidden");

  helloText.innerText = `${data.name}，歡迎蒐集幸福印章 💙`;

  let count = 0;

  stations.forEach((station) => {
    const stamp = document.getElementById("stamp-" + station);

    if (data[station]) {
      stamp.classList.add("done");
      count++;
    } else {
      stamp.classList.remove("done");
    }
  });

  progressText.innerText = `目前完成：${count} / 4`;

  if (data.redeemed) {
    messageText.innerHTML = `
      <div class="complete-box">
        <div class="complete-title">已兌換完成 ✨</div>
      </div>
    `;
  } else if (count === 4) {
    messageText.innerHTML = `
      <div class="complete-box">
        <div class="complete-title">🎁 集點完成 🎁</div>
        <div class="complete-text">請至兌換區領取小禮物 ✨</div>
      </div>
    `;
  } else {
    messageText.innerHTML = "";
  }
}

function getStationFromUrl() {
  return params.get("station");
}

async function collectStamp() {
  if (!currentGuestId) return;

  const station = getStationFromUrl();

  if (!station) return;
  if (!stations.includes(station)) return;

  const guestRef = ref(db, "guests/" + currentGuestId);
  const snapshot = await get(guestRef);
  const data = snapshot.val();

  if (!data) return;

  if (data.redeemed) {
    showModal("🎁", "已兌換完成", "此集點卡已核銷");
    return;
  }

  if (data[station]) {
    showModal(
      stationIcons[station],
      "已經蒐集過",
      `${stationNames[station]} 已完成`
    );
    return;
  }

  await update(guestRef, {
    [station]: true
  });

  showModal(
    stationIcons[station],
    `蒐集到${stationNames[station]}`,
    "幸福印章已加入 🩵"
  );
}

function showModal(icon, title, text) {
  modalIcon.innerText = icon;
  modalTitle.innerText = title;
  modalText.innerText = text;
  stampModal.classList.remove("hidden");
}

async function searchGuest() {
  const keyword = searchInput.value.trim();

  if (!keyword) return;

  const snapshot = await get(ref(db, "guests"));
  const data = snapshot.val();

  if (!data) {
    searchResult.innerHTML = `
      <div class="search-card">目前沒有資料</div>
    `;
    return;
  }

  const results = [];

  Object.entries(data).forEach(([id, guest]) => {
    if (guest.phoneLast3 === keyword) {
      results.push({ id, ...guest });
    }
  });

  if (results.length === 0) {
    searchResult.innerHTML = `
      <div class="search-card">查無資料</div>
    `;
    return;
  }

  let html = "";

  results.forEach((found) => {
    let doneCount = 0;

    stations.forEach((station) => {
      if (found[station]) doneCount++;
    });

    html += `
      <div class="search-card">
        <div class="search-name">${found.name}</div>
        <div class="search-phone">手機末三碼：${found.phoneLast3}</div>

        <div class="search-status">
          ${found.checkin ? "✓" : "✗"} 簽到<br>
          ${found.photo ? "✓" : "✗"} 拍貼機<br>
          ${found.voice ? "✓" : "✗"} 留聲電話亭<br>
          ${found.wall ? "✓" : "✗"} 交往照片牆<br><br>
          完成數：${doneCount}/4
        </div>
    `;

    if (found.redeemed) {
      html += `<div class="redeemed">已兌換完成 ✨</div>`;
    } else if (doneCount === 4) {
      html += `
        <button class="redeem-btn" onclick="redeemGuest('${found.id}')">
          確認核銷
        </button>
      `;
    } else {
      html += `<div class="redeemed">尚未完成集點</div>`;
    }

    html += `
      <button class="delete-btn" onclick="deleteGuest('${found.id}')">
        刪除此筆資料
      </button>
    `;

    html += `</div>`;
  });

  searchResult.innerHTML = html;
}

window.redeemGuest = async function (guestId) {
  await update(ref(db, "guests/" + guestId), {
    redeemed: true,
    redeemedAt: Date.now()
  });

  alert("核銷成功 ✨");
  searchGuest();
};

window.deleteGuest = async function (guestId) {
  const password = prompt("請輸入刪除密碼");

  if (password !== STAFF_DELETE_PASSWORD) {
    alert("密碼錯誤，無法刪除");
    return;
  }

  const yes = confirm("確定要刪除這筆資料嗎？");
  if (!yes) return;

  await remove(ref(db, "guests/" + guestId));

  alert("已刪除");
  searchGuest();
};

async function deleteAllGuests() {
  const password = prompt("請輸入刪除密碼");

  if (password !== STAFF_DELETE_PASSWORD) {
    alert("密碼錯誤，無法刪除");
    return;
  }

  const yes = confirm("確定要刪除全部資料嗎？");
  if (!yes) return;

  const yesAgain = confirm("再次確認：真的要全部刪除？");
  if (!yesAgain) return;

  await remove(ref(db, "guests"));

  searchResult.innerHTML = `
    <div class="search-card">已清空全部資料</div>
  `;

  alert("全部資料已刪除");
}

if (isStaff !== "1") {
  listenGuestData();
  collectStamp();
}