
// utilities.js

import { settings } from "./appState.js";

export const formatDateTimeComponents = (date) => {
    // Apufunktio, joka lisää nollan yksittäisen numeron eteen
    const pad = (num) => ("0" + num).slice(-2);
  
    const hourString = pad(date.getHours());
    const dateString = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return { dateString, hourString };
  };
  
  
  
  export function applyPulseEffect(element) {
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

  export const determinePriceLevel = (price) => {
    if (price >= settings.expensive) {
      return "price-high";
    } else if (price >= settings.moderate) {
      return "price-moderate";
    } else if (price < settings.moderate) {
      return "price-low";
    }
  };

  export const filterPricesByDate = (pricePoints, date) => {
    let dateString = formatDateTimeComponents(date).dateString;
    let filteredData = pricePoints.filter((item) => {
      let itemDate = item.date;
      return itemDate === dateString;
    });
    console.log(filteredData);
    return filteredData;
  };