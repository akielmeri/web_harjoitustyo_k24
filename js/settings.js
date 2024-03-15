// Määritellään oletusasetukset
const defaultSettings = {
  highPrice: 20,
  moderatePrice: 10,
  includeTax: true,
};

// Funktio oletusasetusten tarkistamiseksi ja tallentamiseksi LocalStorageen
function initializeSettings() {
  if (localStorage.getItem("highPrice") === null) {
    localStorage.setItem("highPrice", defaultSettings.highPrice);
  }
  if (localStorage.getItem("moderatePrice") === null) {
    localStorage.setItem("moderatePrice", defaultSettings.moderatePrice);
  }
  if (localStorage.getItem("includeTax") === null) {
    localStorage.setItem("includeTax", defaultSettings.includeTax);
  }
}

// Funktio asetusten lataamiseksi
function loadSettings() {
  initializeSettings(); // Varmistetaan, että oletusasetukset on asetettu

  return {
    highPrice: parseInt(localStorage.getItem('highPrice'), 10),
    moderatePrice: parseInt(localStorage.getItem("moderatePrice"), 10),
    includeTax: localStorage.getItem("includeTax") === "true",
  };
}

// Funktio asetusten tallentamiseksi
function saveSettings(highPrice, moderatePrice, includeTax) {
    if (parseInt(moderatePrice, 10) >= parseInt(highPrice, 10)) {
      var notificationArea = document.getElementById("confirmMessageArea");
      notificationArea.textContent = "Kohtuullisen hinnan raja on oltava pienempi kuin kalliin hinnan raja.";
      notificationArea.style.backgroundColor = "red"; 
      notificationArea.style.display = "block";
    } else {
      // Jos tarkistus menee läpi, tallenna arvot normaalisti
      localStorage.setItem("highPrice", highPrice.toString());
      localStorage.setItem("moderatePrice", moderatePrice.toString());
      localStorage.setItem("includeTax", includeTax.toString());
  
      
      var notificationArea = document.getElementById("confirmMessageArea");
      notificationArea.textContent = "Asetukset tallennettu!";
      notificationArea.style.backgroundColor = "green"; 
        notificationArea.style.display = "block";
       
        document.getElementById("save").disabled = true;
        document.getElementById("save").style.backgroundColor = "grey";

       
        document.getElementById("cancel").textContent = "Palaa takaisin";

        
    }
  }


document.addEventListener("DOMContentLoaded", () => {
  const settings = loadSettings();

  document.getElementById("highPrice").value = settings.highPrice;
  document.getElementById("moderatePrice").value = settings.moderatePrice;
  document.querySelector("#includeTax").checked = settings.includeTax;

  document.getElementById("save").addEventListener("click", () => {
    const highPrice = document.getElementById("highPrice").value;
    const moderatePrice = document.getElementById("moderatePrice").value;
    const includeTax = document.querySelector("#includeTax").checked;

    saveSettings(highPrice, moderatePrice, includeTax);

  });

  document.getElementById("cancel").addEventListener("click", () => {
    window.history.back();
  });
});


document.getElementById('settingsGrid').addEventListener('input', function(event) {
    // Tarkista, onko muutettu elementti jokin halutuista input-kentistä
    if (event.target.id === 'highPrice' || event.target.id === 'moderatePrice' || event.target.id === 'includeTax') {
        document.getElementById('save').disabled = false;
        document.getElementById('save').style.backgroundColor = '#007bff';
        document.getElementById('cancel').textContent = 'Peruuta';
        document.getElementById('confirmMessageArea').style.display = 'none';
    }
}
);
    


