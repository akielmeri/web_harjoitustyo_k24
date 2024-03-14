import { key } from "./api-key.js";
// const key = "FILL_API_KEY";

let jsonData = [];
let myChart = null;
const expensivePrice = 15;
const moderatePrice = 5;
const currentDate = new Date();
let selectedDate = "today";
const dateOffset = {
  yesterday: -1,
  today: 0,
  tomorrow: 1,
};

const createApiTimeInterval = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const startDay = (date.getDate() - 3).toString().padStart(2, "0");
  const endDay = (date.getDate() + 1).toString().padStart(2, "0");
  const startPeriod = `${year}${month}${startDay}0000`;
  const endPeriod = `${year}${month}${endDay}0100`;
  return { startPeriod, endPeriod };
};

function fetchData() {
  if (key === "YOUR_API_KEY") {
    showNotification("Lisää API-avain tiedostoon js/main.js");
    return;
  }
  const { startPeriod, endPeriod } = createApiTimeInterval(currentDate);
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
    .catch(showNotification("Virhe API-kutsussa"));
}

function processData(xmlData) {
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
      let formattedPrice = ((parseFloat(priceAmount) / 10) * 1.24).toFixed(2);
      let pointDateTime = new Date(startDateTime.getTime());
      pointDateTime.setHours(pointDateTime.getHours() + parseInt(position) - 1);
      let dateTimeString = extractDateTimeStrings(pointDateTime);
      jsonData.push({
        date: dateTimeString.dateStr,
        hour: dateTimeString.hoursStr,
        price: parseFloat(formattedPrice),
      });
    }
  }
  handleDateSelection(dateOffset[selectedDate]);
  let currentPrice = getCurrentPrice(jsonData);
  document.getElementById("currentPrice").textContent = currentPrice
    .toFixed(2)
    .replace(".", ",");
}

function extractDateTimeStrings(date) {
  let year = date.getFullYear();
  let month = ("0" + (date.getMonth() + 1)).slice(-2);
  let day = ("0" + date.getDate()).slice(-2);
  let hours = ("0" + date.getHours()).slice(-2);
  let dateStr = `${year}-${month}-${day}`;
  let hoursStr = `${hours}`;
  return { dateStr, hoursStr };
}

function formatAndDisplayData(jsonData) {
  let { averagePrice, lowestPrice, highestPrice } = calculateStats(jsonData);
  document.getElementById("averagePrice").textContent = averagePrice
    .toFixed(2)
    .replace(".", ",");
  document.getElementById("lowestPrice").textContent = lowestPrice
    .toFixed(2)
    .replace(".", ",");
  document.getElementById("highestPrice").textContent = highestPrice
    .toFixed(2)
    .replace(".", ",");
  let tableDate = new Date(jsonData[0].date).toLocaleDateString("fi-FI");
  let table = document.createElement("table");
  let headerRow = table.insertRow();
  headerRow.innerHTML = `<th>${tableDate}</th><th>Hinta (c/kWh)</th>`;
  jsonData.forEach((item) => {
    let row = table.insertRow();
    let hour = item.hour;
    let endhour = parseInt(hour) + 1;
    let hourCell = row.insertCell();
    // hourCell.textContent = hour;
    hourCell.textContent = "klo " + hour + " - " + ("0" + endhour).slice(-2);
    let priceCell = row.insertCell();
    let priceString = item.price.toFixed(2).replace(".", ",");
    priceCell.textContent = priceString;
    let priceValue = parseFloat(item.price);
    if (priceValue <= moderatePrice) {
      priceCell.classList.add("price-low");
    } else if (priceValue > moderatePrice && priceValue <= expensivePrice) {
      priceCell.classList.add("price-medium");
    } else if (priceValue > expensivePrice) {
      priceCell.classList.add("price-high");
    }
  });
  let container = document.getElementById("priceTable");
  var notificationArea = document.getElementById("notificationArea");
  notificationArea.style.display = "none"; // Tehdään näkyväksi
  container.innerHTML = "";
  container.appendChild(table);
}

function filterDataByDate(jsonData, date) {
  let dateString = extractDateTimeStrings(date).dateStr;
  let filteredData = jsonData.filter((item) => {
    let itemDate = item.date;
    return itemDate === dateString;
  });
  return filteredData;
}

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

function getCurrentPrice(dataArray) {
  let currentHour = extractDateTimeStrings(new Date()).hoursStr;
  let currentPrice = dataArray.find((item) => item.hour === currentHour);
  return currentPrice.price;
}

function plotGraph(dataArray) {
  var canvasContainer = document.getElementById("priceCanvas").parentElement;
  canvasContainer.style.display = "block"; // Palauta näkyviin
  const labels = dataArray.map(
    (item) => new Date(item.dateTime).getUTCHours() + ":00"
  );
  const dataPoints = dataArray.map((item) => item.price);
  const data = {
    labels: labels,
    datasets: [
      {
        label: "c/KWh",
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
}

document
  .getElementById("dateSelection")
  .addEventListener("click", function (e) {
    if (e.target.tagName === "BUTTON") {
      selectedDate = e.target.id;
      document
        .querySelectorAll("#dateSelection button")
        .forEach((btn) => btn.classList.remove("selected"));
      e.target.classList.add("selected");
      handleDateSelection(dateOffset[selectedDate]);
    }
  });

function showNotification(message) {
  var canvasContainer = document.getElementById("priceCanvas").parentElement;
  canvasContainer.style.display = "none"; // Voit piilottaa elementin
  let container = document.getElementById("priceTable");
  container.innerHTML = "";
  if (myChart) {
    myChart.destroy();
  }
  var notificationArea = document.getElementById("notificationArea");
  notificationArea.textContent = message; // Asetetaan viesti
  notificationArea.style.display = "block"; // Tehdään näkyväksi
}

function handleDateSelection(daysOffset) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysOffset);
  const filteredData = filterDataByDate(jsonData, targetDate);
  if (filteredData.length !== 24) {
    showNotification("Huomisen hintoja ei vielä saatavilla!");
    return;
  }
  formatAndDisplayData(filteredData);
  plotGraph(filteredData);
}

fetchData();
