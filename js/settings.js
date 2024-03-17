
// settings.js

// Funktio asetusten lataamiseen localStoragesta
export const loadSettings = () => {
  return {
    expensivePriceThreshold: parseInt(localStorage.getItem('expensivePriceThreshold'), 10),
    moderatePriceThreshold: parseInt(localStorage.getItem('moderatePriceThreshold'), 10),
    includeTax: localStorage.getItem('includeTax') === 'true',
  };
};



// Funktio asetusten tallentamiseen validoinnin jälkeen
const saveSettings = (expensivePriceThreshold, moderatePriceThreshold, includeTax) => {
  // Validoidaan rajat
  if (parseInt(moderatePriceThreshold, 10) >= parseInt(expensivePriceThreshold, 10)) {
    displayNotification('Kohtuullisen hinnan raja on oltava pienempi kuin kalliin hinnan raja.', 'red');
  } else {
    // Tallennetaan asetukset localStorageen
    localStorage.setItem('expensivePriceThreshold', expensivePriceThreshold.toString());
    localStorage.setItem('moderatePriceThreshold', moderatePriceThreshold.toString());
    localStorage.setItem('includeTax', includeTax.toString());

    // Näytetään onnistumisilmoitus
    displayNotification('Asetukset tallennettu!', 'green');

    // Poistetaan tallenna-nappulan käyttö ja muutetaan sen tyyliä
    const saveButton = document.getElementById('save');
    saveButton.disabled = true;
    saveButton.style.backgroundColor = 'grey';

    // Päivitetään peruuta-napin teksti
    document.getElementById('cancel').textContent = 'Palaa takaisin';
  }
};
// Funktio ilmoitusviestien näyttämiseen
const displayNotification = (message, backgroundColor) => {
  const notificationArea = document.getElementById('confirmMessageArea');
  notificationArea.textContent = message;
  notificationArea.style.backgroundColor = backgroundColor;
  notificationArea.style.display = 'block';
};


// DOM-sisällön lataus -tapahtuman kuuntelija
document.addEventListener('DOMContentLoaded', () => {
  const settings = loadSettings();

  // Täytetään lomakkeen kentät ladatuilla asetuksilla
  document.getElementById('expensivePriceThreshold').value = settings.expensivePriceThreshold;
  document.getElementById('moderatePriceThreshold').value = settings.moderatePriceThreshold;
  document.querySelector('#includeTax').checked = settings.includeTax;

  // Tallenna-napin tapahtuma
  document.getElementById('save').addEventListener('click', () => {
    const expensivePriceThreshold = document.getElementById('expensivePriceThreshold').value;
    const moderatePriceThreshold = document.getElementById('moderatePriceThreshold').value;
    const includeTax = document.querySelector('#includeTax').checked;

    saveSettings(expensivePriceThreshold, moderatePriceThreshold, includeTax);
  });

  // Peruuta-napin tapahtuma
  document.getElementById('cancel').addEventListener('click', () => {
    window.history.back();
  });
});

// Tapahtumakuuntelija asetuslomakkeen muutoksille
document.getElementById('settingsGrid').addEventListener('input', (event) => {
  if (['expensivePriceThreshold', 'moderatePriceThreshold', 'includeTax'].includes(event.target.id)) {
    const saveButton = document.getElementById('save');
    saveButton.disabled = false;
    saveButton.style.backgroundColor = '#007bff';
    document.getElementById('cancel').textContent = 'Peruuta';
    document.getElementById('confirmMessageArea').style.display = 'none';
  }
});
