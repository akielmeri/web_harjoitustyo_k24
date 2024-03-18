![HintaVirta](/images/readme-kuva.png)

# Tervetuloa HintaVirtaan - palveluun, joka tuo pörssisähkön hinnat suoraan näytöllesi!

## Mikä ihmeen HintaVirta?

HintaVirrasta tarkistat päivän hinnat helposti ja nopeasti! Tärkeimmät hintatiedot ovat heti sivun alussa, ja valitun päivän kaikki hintatiedot esitetään alempana taulukkona ja kuvaajana.
![Hintataulukko](/images/table.png)
![Hintakuvaaja](/images/chart.png)

## Omat asetukset

Asetusvalikossa voit asettaa henkilökohtaiset kipurajasi sähkön hinnoille. Kun hinta ylittää tai alittaa asettamasi rajat, hinnan esitysväri muuttuu. Näin näet yhdellä silmäyksellä, onko energian kulutus juuri nyt edullista vai ei.

## Mistä tiedot haetaan?

Sähköhintatiedot haetaan ENTSO-E:n Transparency Platformilta. ENTSO-E (European Network of Transmission System Operators for Electricity) on eurooppalaisten kantaverkkoyhtiöiden yhteistyöjärjestö, joka tarjoaa julkisen API-rajapinnan Transparency Platformin kautta. Tämän rajapinnan avulla tilastot ovat saatavilla.

[ENTSO-E:n Transparency Platformiin voit tutustua täällä](https://transparency.entsoe.eu/dashboard/show).

[ENTSO-E:n API-dokumentaatioon pääset tutustumaan tässä](https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html).

## Miten ottaa käyttöön?

Käyttöön tarvitset oman API-avaimen ENTSO-E:n Transparency Platformiin. Sen saa luomalla heille tilin, ja pyytämällä omaa avainta sähköpostilla.

Kun olet saanut API-avaimen, voit lisätä sen tämän projektin api.js tiedostoon.
