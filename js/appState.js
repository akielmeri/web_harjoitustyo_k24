// appState.js

export const appState = {
    priceData: [],
    priceChart: null,
    currentSelectedDay: "today",
  };
  export const priceStats = {
    currentPrice: "",
    averagePrice: "",
    averagePriceHour: "",
    lowestPrice: "",
    lowestPriceHour: "",
    highestPrice: "",
    highestPriceHour: "",
  };
  
  export const settings = {
    expensive: parseInt(localStorage.getItem("expensivePriceThreshold")) || 10,
    moderate: parseInt(localStorage.getItem("moderatePriceThreshold")) || 5,
    includeTax: localStorage.getItem("includeTax") !== null ? localStorage.getItem("includeTax") === "true" : true,
  };