import { fetchData } from "./dataFetcher.js";

// Tila ja globaalit muuttujat

const appState = {
  priceData: [],
  priceChart: null,
  currentSelectedDay: "today",
};
const priceStats = {
  currentPrice: "",
  averagePrice: "",
  averagePriceHour: "",
  lowestPrice: "",
  lowestPriceHour: "",
  highestPrice: "",
  highestPriceHour: "",
};

const settings = {
  expensive: parseInt(localStorage.getItem("expensivePriceThreshold")) || 10,
  moderate: parseInt(localStorage.getItem("moderatePriceThreshold")) || 5,
  includeTax: localStorage.getItem("includeTax") !== null ? localStorage.getItem("includeTax") === "true" : true,
};

// Apufunktiot

export const formatDateTimeComponents = (date) => {
  // Apufunktio, joka lisää nollan yksittäisen numeron eteen
  const pad = (num) => ("0" + num).slice(-2);

  const hourString = pad(date.getHours());
  const dateString = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return { dateString, hourString };
};

const calculateStats = (pricePoints) => {
  if (pricePoints.length != 24) return;
  const taxMultiplier = settings.includeTax ? 1.24 : 1;

  // Lasketaan tilastot päivitetyistä hintatiedoista
  priceStats.highestPrice = Math.max(...pricePoints.map((item) => item.price * taxMultiplier));
  priceStats.lowestPrice = Math.min(...pricePoints.map((item) => item.price * taxMultiplier));
  priceStats.averagePrice = pricePoints.reduce((acc, item) => acc + item.price * taxMultiplier, 0) / pricePoints.length;

  // Etsitään korkeimman ja matalimman hinnan tunnit (esimerkki)
  priceStats.highestPriceHour = pricePoints.find((item) => item.price * taxMultiplier === priceStats.highestPrice).hour;
  priceStats.lowestPriceHour = pricePoints.find((item) => item.price * taxMultiplier === priceStats.lowestPrice).hour;
};

function applyPulseEffect(element) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.classList.add("pulse-effect");

  const animationDuration = 400;
  setTimeout(() => {
    element.classList.remove("pulse-effect");
    console.log("Pulse effect completed and class removed.");
  }, animationDuration);
}

// DOM-toiminnot
const displayPriceStats = () => {
  // Apufunktio, joka lisää asettaa kaksi desimaalia ja korvaa pisteen pilkulla
  const formatPrice = (price) => price.toFixed(2).replace(".", ",");
  const priceLevels = ["price-high", "price-moderate", "price-low"];

  // Haetaan elementit
  const lowestPriceLabel = document.getElementById("lowestPriceLabel");
  const highestPriceLabel = document.getElementById("highestPriceLabel");
  const averagePriceValue = document.getElementById("averagePrice");
  const lowestPriceValue = document.getElementById("lowestPrice");
  const highestPriceValue = document.getElementById("highestPrice");
  const currentPriceValue = document.getElementById("currentPrice");


  // Asetetaan kellonajat näkyviin
  highestPriceLabel.textContent = `${priceStats.highestPriceHour}-${(parseInt(priceStats.highestPriceHour) + 1)
    .toString()
    .padStart(2, "0")}`;
  lowestPriceLabel.textContent = `${priceStats.lowestPriceHour}-${(parseInt(priceStats.lowestPriceHour) + 1)
    .toString()
    .padStart(2, "0")}`;

  
  // Asetetaan tilastot näkyviin
  averagePriceValue.textContent = formatPrice(priceStats.averagePrice);
  priceLevels.forEach((level) => averagePriceValue.classList.remove(level));
  averagePriceValue.classList.add(determinePriceLevel(priceStats.averagePrice));

  lowestPriceValue.textContent = formatPrice(priceStats.lowestPrice);
  priceLevels.forEach((level) => lowestPriceValue.classList.remove(level));
  lowestPriceValue.classList.add(determinePriceLevel(priceStats.lowestPrice));

  highestPriceValue.textContent = formatPrice(priceStats.highestPrice);
  priceLevels.forEach((level) => highestPriceValue.classList.remove(level));
  highestPriceValue.classList.add(determinePriceLevel(priceStats.highestPrice));

  currentPriceValue.textContent = formatPrice(priceStats.currentPrice);
  priceLevels.forEach((level) => currentPriceValue.classList.remove(level));
  currentPriceValue.classList.add(determinePriceLevel(priceStats.currentPrice));
};

const fillAndDisplayTable = (pricePoints) => {
  let tableBody = document.querySelector("#priceTable tbody");
  let options = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
  let tableDate = new Date(pricePoints[0].date).toLocaleDateString("fi-FI", options);
  document.querySelector("#priceTable th:first-child").textContent = tableDate;
  document.querySelector("#priceTable tr:nth-child(2) th").textContent = "Klo";
  tableBody.innerHTML = ""; // Tyhjennetään mahdollinen olemassa oleva sisältö
  pricePoints.forEach((item) => {
    let row = tableBody.insertRow();
    let hour = item.hour;
    let endhour = parseInt(hour) + 1;
    let hourCell = row.insertCell();
    hourCell.textContent = "klo " + hour + " - " + ("0" + endhour).slice(-2);
    let priceCell = row.insertCell();
    let price = settings.includeTax ? item.price * 1.24 : item.price;
    priceCell.textContent = price.toFixed(2).replace(".", ",");
    priceCell.classList.add(determinePriceLevel(price));
  });
  let container = document.getElementById("priceTable");
  var notificationArea = document.getElementById("notificationArea");
  notificationArea.style.display = "none"; // Piilotetaan mahdollinen ilmoitus
  container.style.display = "block"; // Tehdään näkyväksi
  applyPulseEffect(container);
};

const determinePriceLevel = (price) => {
  if (price >= settings.expensive) {
    return "price-high";
  } else if (price >= settings.moderate) {
    return "price-moderate";
  } else if (price < settings.moderate) {
    return "price-low";
  }
};

export const showNotification = (message) => {
  var priceChart = document.getElementById("priceCanvas").parentElement;
  priceChart.style.display = "none";
  let priceTable = document.getElementById("priceTable");
  priceTable.style.display = "none";

  if (appState.priceChart) {
    appState.priceChart.destroy();
  }
  var notificationArea = document.getElementById("notificationArea");
  notificationArea.textContent = message;
  notificationArea.style.display = "block";
};

// Päätoiminnot
const handleDateSelection = (selectedDay) => {
  const targetDate = new Date();

  if (selectedDay === "yesterday") {
    targetDate.setDate(targetDate.getDate() - 1);
  } else if (selectedDay === "tomorrow") {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const filteredData = filterPricesByDate(appState.priceData, targetDate);
  if (filteredData.length !== 24) {
    showNotification("Huomisen hintoja ei vielä saatavilla!");
    return;
  }
  getCurrentPrice(appState.priceData);
  calculateStats(filteredData);
  displayPriceStats(filteredData);
  fillAndDisplayTable(filteredData);
  plotGraph(filteredData);
};

const getCurrentPrice = (pricePoints) => {
  let currentHour = formatDateTimeComponents(new Date()).hourString;
  let currentDay = formatDateTimeComponents(new Date()).dateString;
  console.log(currentHour);
  console.log(currentDay);
  let currentPrice = pricePoints.find((item) => item.hour === currentHour && item.date === currentDay);
  if (currentPrice) {
    console.log(currentPrice);
    let priceWithoutTax = currentPrice.price;
    let priceWithTax = currentPrice.price * 1.24;
    if (settings.includeTax) {
      priceStats.currentPrice = priceWithTax;
    } else {
      priceStats.currentPrice = priceWithoutTax;
    }
  } else {
    document.getElementById("currentPrice").textContent = "Ei saatavilla";
  }
};

const filterPricesByDate = (pricePoints, date) => {
  let dateString = formatDateTimeComponents(date).dateString;
  let filteredData = pricePoints.filter((item) => {
    let itemDate = item.date;
    return itemDate === dateString;
  });
  console.log(filteredData);
  return filteredData;
};


const plotGraph = (pricePoints) => {
  const canvasContainer = document.getElementById("priceCanvas").parentElement;
  canvasContainer.style.display = "block"; // Palautetaan näkyviin
  const date = new Date(pricePoints[0].date).toLocaleDateString("fi-FI");

  const labels = [];
  const dataPoints = [];
  for (const item of pricePoints) {
    labels.push(item.hour);
    dataPoints.push(item.price);
  }

  const data = {
    labels,
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
    data,
    options: {
      borderRadius: 10,
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: "Sähkön hinta - " + date,
        },
        tooltip: {
          callbacks: {
            title: function (tooltipItems) {
              let hour = tooltipItems[0].label;
              return `klo ${hour}-${(parseInt(hour) + 1).toString().padStart(2, "0")}`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Kellonaika",
          },
          grid: {
            display: false, // Poistaa x-akselin ruudukon näkyvistä
          },
        },
        y: {
          title: {
            display: true,
            text: "c/KWh",
          },
          grid: {
            display: true, // Poistaa y-akselin ruudukon näkyvistä
          },
        },
      },
    },
  };

  // Tuhoaa vanhan kaavion, jos se on olemassa
  if (appState.priceChart) {
    appState.priceChart.destroy();
  }

  // Luo uuden kaavion
  appState.priceChart = new Chart(document.getElementById("priceCanvas"), config);
};

const showContent = () => {
  const appContent = document.querySelector(".content-container");
  appContent.classList.remove("hidden");
};

// Alustus
const initializeApp = async () => {
  try {
    appState.priceData = await fetchData();
    handleDateSelection(appState.currentSelectedDay);
    showContent();
  } catch (error) {
    console.error("Virhe datan käsittelyssä:", error);
  }
};

// Sovelluksen käynnistys
document.addEventListener("DOMContentLoaded", async (event) => {
  await initializeApp();
  console.log("Setting", settings);
});

console.log(appState.priceData);

// Päivän valintanappien kuuntelijat
document.getElementById("dateSelection").addEventListener("click", function (e) {
  let currentSelectedButton = document.querySelector("#dateSelection .selected");
  if (e.target.tagName === "BUTTON") {
    appState.currentSelectedDay = e.target.id;

    if (currentSelectedButton) {
      currentSelectedButton.classList.remove("selected");
    }
    e.target.classList.add("selected");
    console.log(appState.currentSelectedDay);
    handleDateSelection(appState.currentSelectedDay);
  }
});
