// main.js

// Tuo kaikki tarvittavat moduulit
import { fetchData } from "./dataFetcher.js";
import { formatDateTimeComponents, filterPricesByDate } from "./utilities.js";
import { showNotification, displayPriceStats, fillAndDisplayTable, plotGraph, showContent } from "./uiController.js";
import { appState, priceStats, settings } from "./appState.js";


const calculateStats = (pricePoints) => {
  if (pricePoints.length != 24) return;
  const taxMultiplier = settings.includeTax ? 1.24 : 1;

  // Lasketaan tilastot päivitetyistä hintatiedoista
  priceStats.highestPrice = Math.max(...pricePoints.map((item) => item.price * taxMultiplier));
  priceStats.lowestPrice = Math.min(...pricePoints.map((item) => item.price * taxMultiplier));
  priceStats.averagePrice = pricePoints.reduce((acc, item) => acc + item.price * taxMultiplier, 0) / pricePoints.length;


  priceStats.highestPriceHour = pricePoints.find((item) => item.price * taxMultiplier === priceStats.highestPrice).hour;
  priceStats.lowestPriceHour = pricePoints.find((item) => item.price * taxMultiplier === priceStats.lowestPrice).hour;
};



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
