// Initial Setup and Constants
import { key } from "./api-key.js";

let priceData = [];
let myChart = null;
const highPrice = localStorage.getItem('highPrice');
const moderatePrice = localStorage.getItem('moderatePrice');
const includeTax = localStorage.getItem('includeTax') === 'true';
console.log(highPrice, moderatePrice, includeTax);
let selectedDay = "today";

// Utility Functions
const createApiTimeInterval = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const startDay = (date.getDate() - 2).toString().padStart(2, "0");
  const endDay = (date.getDate() + 1).toString().padStart(2, "0");
  const startPeriod = `${year}${month}${startDay}0000`;
  const endPeriod = `${year}${month}${endDay}2300`;
  console.log(startPeriod, endPeriod);
  return { startPeriod, endPeriod };
};

const extractDateTimeStrings = (date) => {
  let year = date.getFullYear();
  let month = ("0" + (date.getMonth() + 1)).slice(-2);
  let day = ("0" + date.getDate()).slice(-2);
  let hours = ("0" + date.getHours()).slice(-2);
  let dateStr = `${year}-${month}-${day}`;
  let hoursStr = `${hours}`;
  return { dateStr, hoursStr };
};

const calculateStats = (dataArray) => {
  let sum = 0;
  let lowestPrice = Infinity;
  let highestPrice = 0;
  dataArray.forEach((item) => {
    sum += item.price;
    if (item.price < lowestPrice) {
      lowestPrice = item.price;
    }
    if (item.price > highestPrice) {
      highestPrice = item.price;
    }
  });
  const averagePrice = (sum / dataArray.length).toFixed(2);
  return {
    averagePrice: Number(averagePrice),
    lowestPrice,
    highestPrice,
  };
};

// API Handling and Data Processing
const fetchData = () => {
  if (key === "YOUR_API_KEY") {
    showNotification("Lisää API-avain tiedostoon js/main.js");
    return;
  }

  const { startPeriod, endPeriod } = createApiTimeInterval(new Date());
  const proxyUrl = "https://corsproxy.io/?";
  const apiUrl = "https://web-api.tp.entsoe.eu/api";
  const params = {
    documentType: "A44",
    in_Domain: "10YFI-1--------U",
    out_Domain: "10YFI-1--------U",
    periodStart: startPeriod,
    periodEnd: endPeriod,
    securityToken: key,
  };
  const query = new URLSearchParams(params).toString();
  const fullUrl = `${proxyUrl}${apiUrl}?${query}`;
  fetch(fullUrl)
    .then((response) => response.text())
    .then(processData)
    .catch(() => showNotification("Virhe API-kutsussa"));
};

const processData = (xmlData) => {
  const xmlDoc = new DOMParser().parseFromString(xmlData, "text/xml");
  const periodElements = xmlDoc.getElementsByTagName("Period");
  for (let p = 0; p < periodElements.length; p++) {
    const timeInterval =
      periodElements[p].getElementsByTagName("timeInterval")[0];
    let start = timeInterval.getElementsByTagName("start")[0].textContent;
    let startDateTime = new Date(start);
    const points = periodElements[p].getElementsByTagName("Point");
    for (let i = 0; i < points.length; i++) {
      let position = points[i].getElementsByTagName("position")[0].textContent;
      let priceAmount =
        points[i].getElementsByTagName("price.amount")[0].textContent;
      let formattedPrice = ((parseFloat(priceAmount) / 10)).toFixed(2);
      let pointDateTime = new Date(startDateTime.getTime());
      pointDateTime.setHours(pointDateTime.getHours() + parseInt(position) - 1);
      let dateTimeString = extractDateTimeStrings(pointDateTime);
      priceData.push({
        date: dateTimeString.dateStr,
        hour: dateTimeString.hoursStr,
        price: parseFloat(formattedPrice),
      });
    }
  }
  handleDateSelection(selectedDay);
  getCurrentPrice(priceData);
};

// DOM Manipulation and Event Handling
const formatAndDisplayData = (priceData) => {
  let { averagePrice, lowestPrice, highestPrice } = calculateStats(priceData);
  document.getElementById("averagePrice").textContent = averagePrice
    .toFixed(2)
    .replace(".", ",");
  document.getElementById("lowestPrice").textContent = lowestPrice
    .toFixed(2)
    .replace(".", ",");
  document.getElementById("highestPrice").textContent = highestPrice
    .toFixed(2)
    .replace(".", ",");
  let tableDate = new Date(priceData[0].date).toLocaleDateString("fi-FI");
  let table = document.createElement("table");
  let headerRow = table.insertRow();
  headerRow.innerHTML = `<th>${tableDate}</th><th>Hinta (c/kWh)</th>`;
  priceData.forEach((item) => {
    let row = table.insertRow();
    let hour = item.hour;
    let endhour = parseInt(hour) + 1;
    let hourCell = row.insertCell();
    hourCell.textContent = "klo " + hour + " - " + ("0" + endhour).slice(-2);
    let priceCell = row.insertCell();
    let priceWithoutTax = item.price.toFixed(2).replace(".", ",");
    let priceWithTax = (item.price * 1.24).toFixed(2).replace(".", ",");
    if (includeTax) {
      priceCell.textContent = priceWithTax;
    } else {
      priceCell.textContent = priceWithoutTax;
    }
    let priceValue = parseFloat(item.price);
    if (priceValue <= localStorage.getItem('moderatePrice')) {
      priceCell.classList.add("price-low");
    } else if (priceValue > localStorage.getItem('moderatePrice') && priceValue <= localStorage.getItem('highPrice')) {
      priceCell.classList.add("price-medium");
    } else if (priceValue > localStorage.getItem('highPrice')) {
      priceCell.classList.add("price-high");
    }
  });
  let container = document.getElementById("priceTable");
  var notificationArea = document.getElementById("notificationArea");
  notificationArea.style.display = "none"; // Tehdään näkyväksi
  container.innerHTML = "";
  container.appendChild(table);
};

const showNotification = (message) => {
  var canvasContainer = document.getElementById("priceCanvas").parentElement;
  canvasContainer.style.display = "none";
  let container = document.getElementById("priceTable");
  container.innerHTML = "";
  if (myChart) {
    myChart.destroy();
  }
  var notificationArea = document.getElementById("notificationArea");
  notificationArea.textContent = message;
  notificationArea.style.display = "block";
};

// Main Functionality
const handleDateSelection = (selectedDay) => {
  const targetDate = new Date();

  if (selectedDay === "yesterday") {
    targetDate.setDate(targetDate.getDate() - 1);
  } else if (selectedDay === "tomorrow") {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const filteredData = filterDataByDate(priceData, targetDate);
  if (filteredData.length !== 24) {
    showNotification("Huomisen hintoja ei vielä saatavilla!");
    return;
  }
  formatAndDisplayData(filteredData);
  plotGraph(filteredData);
};

const getCurrentPrice = (dataArray) => {
  let currentHour = extractDateTimeStrings(new Date()).hoursStr;
  let currentDay = extractDateTimeStrings(new Date()).dateStr;
  let currentPrice = dataArray.find(
    (item) => item.hour === currentHour && item.date === currentDay
  );
  if (currentPrice) {
    document.getElementById("currentPrice").textContent = currentPrice.price
      .toFixed(2)
      .replace(".", ",");
    return currentPrice.price;
  } else {
    document.getElementById("currentPrice").textContent = "Ei saatavilla";
    return null;
  }
};

const filterDataByDate = (priceData, date) => {
  let dateString = extractDateTimeStrings(date).dateStr;
  let filteredData = priceData.filter((item) => {
    let itemDate = item.date;
    return itemDate === dateString;
  });
  return filteredData;
};

const plotGraph = (dataArray) => {
  var canvasContainer = document.getElementById("priceCanvas").parentElement;
  canvasContainer.style.display = "block"; // Palautetaan näkyviin
  const labels = dataArray.map((item) => item.hour);
  const dataPoints = dataArray.map((item) => item.price);
  const data = {
    labels: labels,
    datasets: [
      {
        label: "c/kWh",
        backgroundColor: "#2779A0",
        hoverBackgroundColor: "#2A8AB9",
        borderColor: "rgb(255, 99, 132)",
        data: dataPoints,
      },
    ],
  };
  const config = {
    type: "bar",
    data: data,
    options: {
      borderRadius: 10,
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: "Sähkön hinta (c/KWh)",
        },
      },
    },
  };
  if (myChart) {
    myChart.destroy();
  }
  myChart = new Chart(document.getElementById("priceCanvas"), config);
};

// // Initial Setup
document.addEventListener("DOMContentLoaded", (event) => {
  fetchData();
});

console.log(localStorage.getItem('highPrice'));

// Event Listeners
document.getElementById("dateSelection").addEventListener("click", function (e) {
    let currentSelectedButton = document.querySelector(
      "#dateSelection .selected"
    );
    if (e.target.tagName === "BUTTON") {
      selectedDay = e.target.id;

      if (currentSelectedButton) {
        currentSelectedButton.classList.remove("selected");
      }
      e.target.classList.add("selected");

      handleDateSelection(selectedDay);
    }
  });
