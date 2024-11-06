// alternativ för fetchen (GET behövs för att vi ska hämta data)
const options = { method: "GET" };

// target diven med id "temperature" (id används bara en gång per element så funkar bra med getElementById)
const temperature = document.getElementById("temperature");
const todayDate = document.getElementById("todayDate");
const sun = document.getElementById("sun");
const relHum = document.getElementById("relHum");
const prec = document.getElementById("prec");
const rain = document.getElementById("rain");
const showers = document.getElementById("showers");
const wind = document.getElementById("wind");

// sparar aktuell timme i en variabel (för att få rätt tid i datan)
const hour = new Date().getHours(); // timmen vi hämtar data för, t.ex. om kl är 14 så är hour = 14

// funktion som körs när man klickar på "Sök"-knappen
function fetchWeather() {
  // hämtar stadens namn som användaren skrivit in i inputfältet
  const city = document.getElementById("cityInput").value;

  // anropar Open Meteo geokodnings-API för att få latitud och longitud för staden
  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`)
    .then((response) => {
      // om vi får fel, kasta ett felmeddelande, annars omvandla till json
      if (!response.ok) throw new Error("Kunde inte hitta staden");
      return response.json(); // omvandlar svaret till json-format
    })
    .then((data) => {
      // om data finns, hämtar vi latitud och longitud från första resultatet, annars varnas användaren
      if (data.results && data.results.length > 0) {
        const { latitude, longitude } = data.results[0]; // får koordinater för staden
        getWeatherData(latitude, longitude); // skickar dessa till funktionen för att hämta väder
      } else {
        alert("Staden kunde inte hittas."); // meddelande om ingen stad hittas
      }
    })
    .catch((err) => console.error("Geocoding error:", err)); // felmeddelande om geokodning misslyckas
}

// funktion som hämtar väderdata från Open Meteo med hjälp av latitud och longitud vi fått tidigare
function getWeatherData(latitude, longitude) {
  // API-urlen ändras för att inkludera staden vi valt med rätt koordinater
  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,visibility,wind_speed_10m,wind_direction_10m&daily=sunrise,sunset&timezone=Europe%2FBerlin&forecast_days=1`;

  // fetchar väderdata
  fetch(apiUrl, options)
    .then((response) => {
      // om vi inte får en ok respons, kasta ett felmeddelande, annars omvandla till json
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json(); // omvandlar till json-format om allt fungerar
    })
    .then((data) => viewWeather(data)) // omvandlar data till ett format och skickar till funktionen viewWeather
    .catch((err) => console.error("Fetch error:", err)); // felmeddelande om hämtningen misslyckas
}

// funktion för att logga och visa väderdata vi hämtat
function viewWeather(data) {
  console.log(data); // loggar allt för att se datan och dess keys

  // tempen för aktuell timme visas, och apparent temp visas så användaren ser det som känns
  temperature.innerHTML = data.hourly.apparent_temperature[hour] + "&deg;C";

  // dagens datum skrivs ut (vi använder arrayens första värde eftersom vi bara hämtat en dags data)
  todayDate.innerHTML = data.daily.time[0];

  // visar soluppgång och solnedgång från API-datan och använder `` för att skriva båda tiderna på en rad
  const sunriseTime = data.daily.sunrise[0].substring(11, 16); // får bara ut tiden från API-datan
  const sunsetTime = data.daily.sunset[0].substring(11, 16); // får bara ut tiden från API-datan
  sun.innerHTML = `Solen går upp vid kl ${sunriseTime} - Och solen går ned vid kl. ${sunsetTime}`;

  // visar luftfuktigheten (relativ) för den aktuella timmen
  relHum.innerHTML = `${data.hourly.relative_humidity_2m[hour]}%`;

  // visar sannolikheten för nederbörd och dess mängd för nuvarande timme
  prec.innerHTML = `${data.hourly.precipitation[hour]} mm, ${data.hourly.precipitation_probability[hour]}%`;

  // visar mängden regn och eventuella skurar för den aktuella timmen
  rain.innerHTML = data.hourly.rain[hour] + " mm";
  showers.innerHTML = data.hourly.showers[hour] + " mm";

  // vindriktning och vindhastighet visas för aktuell timme
  wind.innerHTML = `${data.hourly.wind_direction_10m[hour]}°, ${data.hourly.wind_speed_10m[hour]} m/s`;
}
