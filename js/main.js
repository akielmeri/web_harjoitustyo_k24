import { fetchData } from "./dataFetcher.js";

// Initial Setup and Constants


let priceData = [];
let priceChart = null;
const highPrice = localStorage.getItem("highPrice");
const moderatePrice = localStorage.getItem("moderatePrice");
const includeTax = localStorage.getItem("includeTax") === "true";
let currentSelectedDay = "today";

const initializeApp = async () => {
  try {
    priceData = await fetchData();
    handleDateSelection(currentSelectedDay)
    
  } catch (error) {
    console.error("Virhe datan käsittelyssä:", error);
  }
};


export const formatDateTimeComponents = (date) => {
  // Apufunktio, joka lisää nollan yksittäisen numeron eteen
  const pad = (num) => ("0" + num).slice(-2);

  const hourString = pad(date.getHours());
  const dateString = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  return { dateString, hourString };
};


const calculateStats = (priceData) => {
  if (priceData.length === 0) return { averagePrice: 0, lowestPrice: 0, highestPrice: 0 };

  const sum = priceData.reduce((acc, item) => acc + item.price, 0);
  const lowestPrice = Math.min(...priceData.map(item => item.price));
  const highestPrice = Math.max(...priceData.map(item => item.price));
  const averagePrice = Number((sum / priceData.length).toFixed(2));

  return { averagePrice, lowestPrice, highestPrice };
};




// DOM Manipulation and Event Handling
const displayPriceData = (priceData) => {
  let { averagePrice, lowestPrice, highestPrice } = calculateStats(priceData);
  document.getElementById("averagePrice").textContent = averagePrice.toFixed(2).replace(".", ",");
  document.getElementById("lowestPrice").textContent = lowestPrice.toFixed(2).replace(".", ",");
  document.getElementById("highestPrice").textContent = highestPrice.toFixed(2).replace(".", ",");
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
    if (priceValue <= localStorage.getItem("moderatePriceThreshold")) {
      priceCell.classList.add("price-low");
    } else if (priceValue > localStorage.getItem("moderatePriceThreshold") && priceValue <= localStorage.getItem("expensivePriceThreshold")) {
      priceCell.classList.add("price-medium");
    } else if (priceValue > localStorage.getItem("expensivePriceThreshold")) {
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
  if (priceChart) {
    priceChart.destroy();
  }
  var notificationArea = document.getElementById("notificationArea");
  notificationArea.textContent = message;
  notificationArea.style.display = "block";
};

// Main Functionality
const handleDateSelection = (currentSelectedDay) => {
  const targetDate = new Date();

  if (currentSelectedDay === "yesterday") {
    targetDate.setDate(targetDate.getDate() - 1);
  } else if (currentSelectedDay === "tomorrow") {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const filteredData = filterPricesByDate(priceData, targetDate);
  if (filteredData.length !== 24) {
    showNotification("Huomisen hintoja ei vielä saatavilla!");
    return;
  }
  displayPriceData(filteredData);
  plotGraph(filteredData);
};

const getCurrentPrice = (priceData) => {
  let currentHour = formatDateTimeComponents(new Date()).hourString;
  let currentDay = formatDateTimeComponents(new Date()).dateString;
  console.log(currentHour);
  console.log(currentDay);
  let currentPrice = priceData.find((item) => item.hour === currentHour && item.date === currentDay);
  if (currentPrice) {
    console.log(currentPrice);
    let priceWithoutTax = currentPrice.price.toFixed(2).replace(".", ",");
    let priceWithTax = (currentPrice.price * 1.24).toFixed(2).replace(".", ",");
    if (includeTax) {
      document.getElementById("currentPrice").textContent = priceWithTax;
      return priceWithTax;
    } else {
      document.getElementById("currentPrice").textContent = priceWithoutTax;
      return priceWithoutTax;
    }
  } else {
    document.getElementById("currentPrice").textContent = "Ei saatavilla";
    return null;
  }
};

const filterPricesByDate = (priceData, date) => {
  let dateString = formatDateTimeComponents(date).dateString;
  let filteredData = priceData.filter((item) => {
    let itemDate = item.date;
    return itemDate === dateString;
  });
  return filteredData;
};

const plotGraph = (priceData) => {
  var canvasContainer = document.getElementById("priceCanvas").parentElement;
  canvasContainer.style.display = "block"; // Palautetaan näkyviin
  const labels = priceData.map((item) => item.hour);
  const dataPoints = priceData.map((item) => item.price);
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
  if (priceChart) {
    priceChart.destroy();
  }
  priceChart = new Chart(document.getElementById("priceCanvas"), config);
};

// // Initial Setup
document.addEventListener("DOMContentLoaded", async (event) => {
  await initializeApp();
  getCurrentPrice(priceData);
});

console.log(priceData);

// Event Listeners
document.getElementById("dateSelection").addEventListener("click", function (e) {
  let currentSelectedButton = document.querySelector("#dateSelection .selected");
  if (e.target.tagName === "BUTTON") {
    currentSelectedDay = e.target.id;

    if (currentSelectedButton) {
      currentSelectedButton.classList.remove("selected");
    }
    e.target.classList.add("selected");
console.log(currentSelectedDay);
    handleDateSelection(currentSelectedDay);
  }
});
