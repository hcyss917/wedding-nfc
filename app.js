import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";



// Firebase 設定（換成你自己的）
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




// 關卡

const stations = ["checkin", "photo", "voice", "wall"];



const stationNames = {

  checkin: "簽到",

  photo: "關卡 1",

  voice: "關卡 2",

  wall: "關卡 3"

};



const stationIcons = {

  checkin: "🖊️",

  photo: "✨",

  voice: "✨",

  wall: "✨"

};




// HTML

const registerArea = document.getElementById("registerArea");

const cardArea = document.getElementById("cardArea");

const guestNameInput = document.getElementById("guestName");

const phoneLast3Input = document.getElementById("phoneLast3");

const startBtn = document.getElementById("startBtn");

const helloText = document.getElementById("helloText");

const progressText = document.getElementById("progressText");

const messageText = document.getElementById("messageText");

const resetBtn = document.getElementById("resetBtn");

const stampModal = document.getElementById("stampModal");

const modalIcon = document.getElementById("modalIcon");

const modalTitle = document.getElementById("modalTitle");

const modalText = document.getElementById("modalText");

const modalCloseBtn = document.getElementById("modalCloseBtn");




// staff

const adminPage = document.getElementById("adminPage");

const normalPage = document.getElementById("normalPage");

const searchInput = document.getElementById("searchInput");

const searchBtn = document.getElementById("searchBtn");

const searchResult = document.getElementById("searchResult");



let currentGuestId = localStorage.getItem("weddingGuestId");




// staff模式

const params = new URLSearchParams(window.location.search);

const isStaff = params.get("staff");



if (isStaff === "1") {

  normalPage.classList.add("hidden");

  adminPage.classList.remove("hidden");

}




// 建立賓客

startBtn.addEventListener("click", createGuestCard);



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



  const guestId = "guest_" + Date.now();



  await set(ref(db, "guests/" + guestId), {

    name: name,

    searchName: name.replace(/\s/g, ""),

    phoneLast3: phoneLast3,

    checkin: false,

    photo: false,

    voice: false,

    wall: false,

    redeemed: false

  });



  localStorage.setItem("weddingGuestId", guestId);

  currentGuestId = guestId;



  listenGuestData();

  collectStamp();

}




// 監聽

function listenGuestData() {

  if (!currentGuestId) return;



  onValue(ref(db, "guests/" + currentGuestId), (snapshot) => {

    const data = snapshot.val();

    if (!data) return;

    renderCard(data);

  });

}




// 顯示集點卡

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

    }

    else {

      stamp.classList.remove("done");

    }

  });



  progressText.innerText = `目前完成：${count} / 4`;



  if (data.redeemed) {

    messageText.innerHTML = `

      <div class="complete-box">

        <div class="complete-title">

          已兌換完成 🤍

        </div>

      </div>

    `;

  }



  else if (count === 4) {

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

  }



  else {

    messageText.innerHTML = "";

  }

}




// station

function getStationFromUrl() {

  return params.get("station");

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

    "幸福印章已加入 🤍"

  );

}




// 彈窗

function showModal(icon, title, text) {

  modalIcon.innerText = icon;

  modalTitle.innerText = title;

  modalText.innerText = text;

  stampModal.classList.remove("hidden");

}



modalCloseBtn.addEventListener("click", () => {

  stampModal.classList.add("hidden");

});




// 重置

resetBtn.addEventListener("click", () => {

  localStorage.removeItem("weddingGuestId");

  location.href = "index.html";

});




// staff搜尋

searchBtn.addEventListener("click", searchGuest);



async function searchGuest() {

  const keyword = searchInput.value.trim();



  if (!keyword) return;



  const snapshot = await get(ref(db, "guests"));



  const data = snapshot.val();



  if (!data) return;



  const results = [];



  Object.entries(data).forEach(([id, guest]) => {

    if (guest.phoneLast3 === keyword) {

      results.push({

        id,

        ...guest

      });

    }

  });



  if (results.length === 0) {

    searchResult.innerHTML = `

      <div class="search-card">

        查無資料

      </div>

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

        <div class="search-name">

          ${found.name}

        </div>

        <div class="search-phone">

          手機末三碼：${found.phoneLast3}

        </div>

        <div class="search-status">

          ${found.checkin ? "✓" : "✗"} 簽到<br>

          ${found.photo ? "✓" : "✗"} 關卡1<br>

          ${found.voice ? "✓" : "✗"} 關卡2<br>

          ${found.wall ? "✓" : "✗"} 關卡3<br><br>

          完成數：${doneCount}/4

        </div>

    `;



    if (found.redeemed) {

      html += `

        <div class="redeemed">

          已兌換完成 🤍

        </div>

      `;

    }



    else if (doneCount === 4) {

      html += `

        <button class="redeem-btn" onclick="redeemGuest('${found.id}')">

          確認核銷

        </button>

      `;

    }



    else {

      html += `

        <div class="redeemed">

          尚未完成集點

        </div>

      `;

    }



    html += `</div>`;

  });



  searchResult.innerHTML = html;

}




// 核銷

window.redeemGuest = async function (guestId) {

  await update(ref(db, "guests/" + guestId), {

    redeemed: true

  });



  alert("核銷成功 🤍");



  searchGuest();

};




// 啟動

if (isStaff !== "1") {

  listenGuestData();

  collectStamp();

}