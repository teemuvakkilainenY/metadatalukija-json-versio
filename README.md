# Musiikin metatietolukija
(Koeversio, ei tuotantokäytössä Ylessä!)

Sovellus lukee tiedoston metatiedot ja täyttää kentät sen perusteella. Käyttäjä voi muokata ja lisätä loput metatiedot. Lopuksi tämä tallennetaan JSON-tiedostoksi, jonka voi syöttää Tempo CMS:ään. JSON:n rakenteen olen kopioinut suoraan CMS:n output-tiedostosta, koska virallista dokumentaatiota CMS:n osalta en ole nähnyt. Sovellus ei toimi täydellisesti, esimerkiksi levy-yhtiön tieto ei siirry Tempo CMS:ään. Sovellus ei muutenkaan ole käytössä normaalissa työssä Yle Arkistossa, sillä tämä on lähinnä "proof of concept" siitä, että metatiedot voidaan viedä automatisoidummin Tempo CMS:ään JSON-tiedostona.

## Käyttö

1. Valitse tai pudota audiotiedosto lomakkeelle.
2. Tarkista tiedot ja täydennä puuttuvat kentät. Esiintyjät ja tekijät erotellaan omille riveilleen. Tekijöiden roolit jätetään tyhjiksi käyttäjän täytettäviksi. Pakolliset kentät: kartuntatunnus (esimerkiksi `DIGI-12345`), uranumero ja kappaleen nimi.
4. Valitse **Luo JSON** ja lataa tiedosto.

## Käynnistys

Tarvitset Node.js:n ja npm:n. Suorita projektikansiossa:

```sh
npm install
npm start
```

Avaa selaimessa `http://localhost:3000`
