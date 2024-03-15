// Määritellään oletusasetukset
const defaultSettings = {
  expensivePriceThreshold: 20,
  moderatePriceThreshold: 10,
  includeTax: true,
};

// Funktio oletusasetusten tarkistamiseksi ja tallentamiseksi LocalStorageen
function initializeSettings() {
  if (localStorage.getItem("expensivePriceThreshold") === null) {
    localStorage.setItem("expensivePriceThreshold", defaultSettings.expensivePriceThreshold);
  }
  if (localStorage.getItem("moderatePriceThreshold") === null) {
    localStorage.setItem("moderatePriceThreshold", defaultSettings.moderatePriceThreshold);
  }
  if (localStorage.getItem("includeTax") === null) {
    localStorage.setItem("includeTax", defaultSettings.includeTax);
  }
}

// Funktio asetusten lataamiseksi
function loadSettings() {
  initializeSettings(); // Varmistetaan, että oletusasetukset on asetettu

  return {
    expensivePriceThreshold: parseInt(localStorage.getItem('expensivePriceThreshold'), 10),
    moderatePriceThreshold: parseInt(localStorage.getItem("moderatePriceThreshold"), 10),
    includeTax: localStorage.getItem("includeTax") === "true",
  };
}

// Funktio asetusten tallentamiseksi
function saveSettings(expensivePriceThreshold, moderatePriceThreshold, includeTax) {
    if (parseInt(moderatePriceThreshold, 10) >= parseInt(expensivePriceThreshold, 10)) {
      var notificationArea = document.getElementById("confirmMessageArea");
      notificationArea.textContent = "Kohtuullisen hinnan raja on oltava pienempi kuin kalliin hinnan raja.";
      notificationArea.style.backgroundColor = "red"; 
      notificationArea.style.display = "block";
    } else {
      // Jos tarkistus menee läpi, tallenna arvot normaalisti
      localStorage.setItem("expensivePriceThreshold", expensivePriceThreshold.toString());
      localStorage.setItem("moderatePriceThreshold", moderatePriceThreshold.toString());
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

  document.getElementById("expensivePriceThreshold").value = settings.expensivePriceThreshold;
  document.getElementById("moderatePriceThreshold").value = settings.moderatePriceThreshold;
  document.querySelector("#includeTax").checked = settings.includeTax;

  document.getElementById("save").addEventListener("click", () => {
    const expensivePriceThreshold = document.getElementById("expensivePriceThreshold").value;
    const moderatePriceThreshold = document.getElementById("moderatePriceThreshold").value;
    const includeTax = document.querySelector("#includeTax").checked;

    saveSettings(expensivePriceThreshold, moderatePriceThreshold, includeTax);

  });

  document.getElementById("cancel").addEventListener("click", () => {
    window.history.back();
  });
});


document.getElementById('settingsGrid').addEventListener('input', function(event) {
    // Tarkista, onko muutettu elementti jokin halutuista input-kentistä
    if (event.target.id === 'expensivePriceThreshold' || event.target.id === 'moderatePriceThreshold' || event.target.id === 'includeTax') {
        document.getElementById('save').disabled = false;
        document.getElementById('save').style.backgroundColor = '#007bff';
        document.getElementById('cancel').textContent = 'Peruuta';
        document.getElementById('confirmMessageArea').style.display = 'none';
    }
}
);
    


