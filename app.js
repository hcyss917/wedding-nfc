// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


// Firebase 設定：這裡請保留你自己的 firebaseConfig
const firebaseConfig = {
  apiKey: "AIzaSyA0Ext1VtgzjC5imQ6tLlQdRuBl7TmgN5U",
  authDomain: "wedding-nfc-stamp.firebaseapp.com",
  databaseURL: "https://wedding-nfc-stamp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wedding-nfc-stamp",
  storageBucket: "wedding-nfc-stamp.firebasestorage.app",
  messagingSenderId: "982842589372",
  appId: "1:982842589372:web:f31ab7b0e4893a33fb50b9"
};


// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

console.log("Firebase 已連線 🤍");


// 關卡設定
const stations = ["checkin", "photo", "voice", "wall"];

const stationNames = {
  checkin: "簽到桌",
  photo: "拍貼機",
  voice: "留聲機",
  wall: "照片牆"
};

const stationIcons = {
  checkin: "🖊️",
  photo: "📸",
  voice: "☎️",
  wall: "🖼️"
};


// HTML 元素
const registerArea = document.getElementById("registerArea");
const cardArea = document.getElementById("cardArea");
const guestNameInput = document.getElementById("guestName");
const startBtn = document.getElementById("startBtn");
const helloText = document.getElementById("helloText");
const progressText = document.getElementById("progressText");
const messageText = document.getElementById("messageText");

const stampModal = document.getElementById("stampModal");
const modalIcon = document.getElementById("modalIcon");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalCloseBtn = document.getElementById("modalCloseBtn");

let currentGuestId = localStorage.getItem("weddingGuestId");


// 按鈕事件
startBtn.addEventListener("click", createGuestCard);

modalCloseBtn.addEventListener("click", () => {
  stampModal.classList.add("hidden");
});


// 建立賓客 ID
function createGuestId() {
  return "guest_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
}


// 建立賓客集點卡
async function createGuestCard() {
  const name = guestNameInput.value.trim();

  if (!name) {
    alert("請先輸入姓名");
    return;
  }

  const guestId = createGuestId();

  const guestData = {
    name: name,
    searchName: name.replace(/\s/g, ""),
    checkin: false,
    photo: false,
    voice: false,
    wall: false,
    redeemed: false,
    createdAt: Date.now()
  };

  await set(ref(db, "guests/" + guestId), guestData);

  localStorage.setItem("weddingGuestId", guestId);
  currentGuestId = guestId;

  listenGuestData();
  collectStamp();
}


// 監聽賓客資料
function listenGuestData() {
  if (!currentGuestId) {
    registerArea.classList.remove("hidden");
    cardArea.classList.add("hidden");
    return;
  }

  const guestRef = ref(db, "guests/" + currentGuestId);

  onValue(guestRef, (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      localStorage.removeItem("weddingGuestId");
      currentGuestId = null;
      registerArea.classList.remove("hidden");
      cardArea.classList.add("hidden");
      return;
    }

    renderCard(data);
  });
}


// 顯示集點卡畫面
function renderCard(data) {
  registerArea.classList.add("hidden");
  cardArea.classList.remove("hidden");

  helloText.innerText = `${data.name}，歡迎來收集幸福印章 🤍`;

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
    messageText.innerText = "已兌換完成，謝謝你的參與 🤍";
  } else if (count === 4) {

  messageText.innerHTML = `
  
    <div class="complete-box">
    
      <div class="complete-title">
        🎁 集點完成 🎁
      </div>

      <div class="complete-text">
        請至兌換區領取小禮物 🤍
      </div>

    </div>
  
  `;
} else {
    messageText.innerText = "繼續收集其他幸福印章吧 ✨";
  }
}


// 取得網址中的 station
function getStationFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("station");
}


// 顯示蒐集成功彈窗
function showStampModal(station, type = "success") {
  const stationName = stationNames[station] || "幸福";

  modalIcon.innerText = stationIcons[station] || "🤍";

  if (type === "already") {
    modalTitle.innerText = "已經蒐集過囉";
    modalText.innerText = `${stationName}印章已完成 🤍`;
  } else {
    modalTitle.innerText = `蒐集到${stationName}`;
    modalText.innerText = "幸福印章已加入你的集點卡 ✨";
  }

  stampModal.classList.remove("hidden");
}


// 蒐集印章
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
    modalIcon.innerText = "🎁";
    modalTitle.innerText = "已兌換完成";
    modalText.innerText = "此集點卡已完成兌換，謝謝你的參與 🤍";
    stampModal.classList.remove("hidden");
    return;
  }

  if (data[station]) {
    showStampModal(station, "already");
    return;
  }

  await update(guestRef, {
    [station]: true
  });

  showStampModal(station, "success");
}


// 啟動
listenGuestData();
collectStamp();