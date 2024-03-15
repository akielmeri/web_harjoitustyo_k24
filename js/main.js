// Initial Setup and Constants
import { key } from "./api-key.js";

const priceData = [];
let priceChart = null;
const highPrice = localStorage.getItem("highPrice");
const moderatePrice = localStorage.getItem("moderatePrice");
const includeTax = localStorage.getItem("includeTax") === "true";

let currentSelectedDay = "today";


const createApiTimeInterval = (date = new Date()) => {

  // Apufunktio, joka lisää nollan yksittäisen numeron eteen
  const pad = (num) => num.toString().padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const startDay = pad(date.getDate() - 2);
  const endDay = pad(date.getDate() + 1);

  const startPeriod = `${year}${month}${startDay}0000`;
  const endPeriod = `${year}${month}${endDay}2300`;

  return { startPeriod, endPeriod };
};

const formatDateTimeComponents = (date) => {
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


const fetchData = async () => {
  if (key === "YOUR_API_KEY") {
    console.error("Please add your API key."); // Muutettu alertista console.erroriin paremman kehityskokemuksen saavuttamiseksi
    return;
  }

  const { startPeriod, endPeriod } = createApiTimeInterval();
  const proxyUrl = "https://corsproxy.io/?";
  const apiUrl = `https://web-api.tp.entsoe.eu/api?${new URLSearchParams({
    documentType: "A44",
    in_Domain: "10YFI-1--------U",
    out_Domain: "10YFI-1--------U",
    periodStart: startPeriod,
    periodEnd: endPeriod,
    securityToken: key,
  }).toString()}`; // Lisätty toString() selkeyden vuoksi, vaikkakin URLSearchParamsin string-muunnos on automaattinen.
const completeUrl = proxyUrl + apiUrl;

  try {
    const response = await fetch(completeUrl, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }
    const xmlData = await response.text();
    parseAndStorePriceData(xmlData);
  } catch (error) {
    console.error("API call error:", error.message); // Täsmennetään, että tulostetaan error-olion message-ominaisuus.
  }
};


const parseAndStorePriceData = (xmlData) => {
  const xmlDoc = new DOMParser().parseFromString(xmlData, "text/xml");

  // Etsitään kaikki period-elementit (1 per vuorokausi)
  const dayElements = xmlDoc.getElementsByTagName("Period");

  // Käydään läpi jokainen period-elementti
  for (let dayIndex = 0; dayIndex < dayElements.length; dayIndex++) {
    // Etsitään ajankohta (start) ja muodostetaan siitä uusi Date-olio
    const timeInterval = dayElements[dayIndex].getElementsByTagName("timeInterval")[0];
    let start = timeInterval.getElementsByTagName("start")[0].textContent;
    let startDateTime = new Date(start); // Vuorokauden ensimmäisen hintapisteen aika
    let hourOffSet = startDateTime.getHours(); // Tällä voimme määrittää ajat lopuille hintapisteille kasvattamalla sitä loopissa
    console.log("startDateTime: ", startDateTime);

    // Etsitään kaikki hintapisteet (point-elementit) tästä ajanjaksosta
    // point-elementit sisältävät sähkön hinnan ja position-elementin, josta voidaan laskea tunti
    const priceElements = dayElements[dayIndex].getElementsByTagName("Point");

    // Käydään läpi jokainen hintapiste
    for (let priceIndex = 0; priceIndex < priceElements.length; priceIndex++) {
      // Etsi hintapisteiden sijainti ja hinta
      let position = priceElements[priceIndex].getElementsByTagName("position")[0].textContent;
      let priceAmount = priceElements[priceIndex].getElementsByTagName("price.amount")[0].textContent;

      // Muunna hinta(€/MWh -> c/kWh) ja luo uusi päivämäärä ja aika hintapisteelle
      let priceInCents = (parseFloat(priceAmount) / 10).toFixed(2);
      let pricePointDateTime = new Date(startDateTime.getTime());

      // Aseta hintapisteelle oikea tunti
      pricePointDateTime.setHours(hourOffSet);
      // console.log("pricePointDateTime: ", pricePointDateTime);

      // Erotellaan hintapisteen päivämäärä ja aika omiin muuttujiin
      let dateTimeString = formatDateTimeComponents(pricePointDateTime);
      

      // Lisää muodostettu hintatieto priceData-taulukkoon
      priceData.push({
        date: dateTimeString.dateString,
        hour: dateTimeString.hourString,
        price: parseFloat(priceInCents),
      });
      hourOffSet++; // Kasvatetaan tuntia seuraavaa hintapistettä varten
      console.log(priceData[priceData.length - 1]);
    }
  }
  
  // Käsittele valittu päivämäärä ja hae nykyinen hinta
  handleDateSelection(currentSelectedDay);
  getCurrentPrice(priceData);
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
  let currentPrice = priceData.find((item) => item.hour === currentHour && item.date === currentDay);
  if (currentPrice) {
    let priceWithoutTax = currentPrice.price.toFixed(2).replace(".", ",");
    let priceWithTax = (currentPrice.price * 1.24).toFixed(2).replace(".", ",");
    if (includeTax) {
      document.getElementById("currentPrice").textContent = priceWithTax;
    } else {
      document.getElementById("currentPrice").textContent = priceWithoutTax;
    }
    // document.getElementById("currentPrice").textContent = currentPrice.price
    //   .toFixed(2)
    //   .replace(".", ",");
    return currentPrice.price;
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
document.addEventListener("DOMContentLoaded", (event) => {
  fetchData();
});

console.log(localStorage.getItem("highPrice"));

// Event Listeners
document.getElementById("dateSelection").addEventListener("click", function (e) {
  let currentSelectedButton = document.querySelector("#dateSelection .selected");
  if (e.target.tagName === "BUTTON") {
    currentSelectedDay = e.target.id;

    if (currentSelectedButton) {
      currentSelectedButton.classList.remove("selected");
    }
    e.target.classList.add("selected");

    handleDateSelection(currentSelectedDay);
  }
});
