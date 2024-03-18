// api.js

import { key } from "./api-key.js";    // Kommentoi pois, jos käytät omaa API-avainta
import { showNotification } from "./updateUI.js";
import { formatDateTimeComponents } from "./utilities.js";


// Lisää oma API-avain tähän ja poista kommentointi
// const key = "API-AVAIN"; 


// Luo API-kutsulle tarvittavat aikaväliparametrit kolmen päivän ajalta.
const createApiTimeInterval = (date = new Date()) => {
  // Apufunktio, joka lisää nollan yksittäisen numeron eteen
  const pad = (num) => num.toString().padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const startDay = pad(date.getDate() - 2);
  const endDay = pad(date.getDate() + 1);
  const hours = pad(date.getHours());

  const startPeriod = `${year}${month}${startDay}${hours}00`;
  const endPeriod = `${year}${month}${endDay}${hours}00`;
  return { startPeriod, endPeriod };
};

// Parsii XML-muotoisen datan ja tallentaa hintatiedot taulukkoon
const parseAndStorePriceData = (xmlData) => {
  const xmlDoc = new DOMParser().parseFromString(xmlData, "text/xml");
  const priceData = [];

  // Etsitään kaikki period-elementit (1 per vuorokausi)
  const dayElements = xmlDoc.getElementsByTagName("Period");

  // Käydään läpi jokainen period-elementti
  for (let dayIndex = 0; dayIndex < dayElements.length; dayIndex++) {
    // Etsitään ajankohta (start) ja muodostetaan siitä uusi Date-olio
    const timeInterval = dayElements[dayIndex].getElementsByTagName("timeInterval")[0];
    let start = timeInterval.getElementsByTagName("start")[0].textContent;
    let startDateTime = new Date(start); // Vuorokauden ensimmäisen hintapisteen aika
    let hourOffSet = startDateTime.getHours(); // Tällä voimme määrittää ajat lopuille hintapisteille kasvattamalla sitä loopissa

    // Etsitään kaikki hintapisteet (point-elementit) tästä ajanjaksosta
    // point-elementit sisältävät sähkön hinnan ja position-elementin, josta voidaan laskea tunti
    const priceElements = dayElements[dayIndex].getElementsByTagName("Point");

    // Käydään läpi jokainen hintapiste
    for (let priceIndex = 0; priceIndex < priceElements.length; priceIndex++) {
      // Etsi hintapisteiden sijainti ja hinta
      // let position = priceElements[priceIndex].getElementsByTagName("position")[0].textContent;
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
    }
  }

  return priceData;
};

// Suorittaa API-kutsun hakeakseen sähkön hintatiedot kolmelta päivältä.
export const fetchData = async () => {
  const { startPeriod, endPeriod } = createApiTimeInterval();
  const proxyUrl = "https://corsproxy.io/?";
  const apiUrl = `https://web-api.tp.entsoe.eu/api?${new URLSearchParams({
    documentType: "A44",
    in_Domain: "10YFI-1--------U",
    out_Domain: "10YFI-1--------U",
    periodStart: startPeriod,
    periodEnd: endPeriod,
    securityToken: key,
  }).toString()}`;
  const completeUrl = proxyUrl + apiUrl;

  try {
    const response = await fetch(completeUrl, { method: "GET", cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }
    let xmlData = await response.text();
    return parseAndStorePriceData(xmlData);
  } catch (error) {
    console.error("API call error:", error.message);
    showNotification(error.message);
  }
};
