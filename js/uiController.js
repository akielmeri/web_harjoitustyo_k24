// uiController.js

import { appState, priceStats, settings } from "./appState.js";
import { applyPulseEffect, determinePriceLevel } from "./utilities.js";

export const displayPriceStats = () => {
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
  
  export const fillAndDisplayTable = (pricePoints) => {
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

  export const plotGraph = (pricePoints) => {
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
  
  export const showContent = () => {
    const appContent = document.querySelector(".content-container");
    appContent.classList.remove("hidden");
  };