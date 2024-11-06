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

// Om inget ändras använder vi dagens datum
const date = new Date();
let dateString = date.toString();

// sparar timmen just nu i en variabel (för att få rätt tid i datan)
const hour = date.getHours();
console.log(hour);
const minutes = date.getMinutes();
console.log(minutes); // logga för att kolla att vi har rätt timme o minuter

// variabel för att spara datan från API:et
let weather;
// Hämtar all data som är vald på Open Meteo API (de saker du markerat i boxarna)

// fetchar data från Open Meteo
function fetchWeather() {
  const city = document.getElementById("cityInput").value;

  // API-anrop för att få koordinater för den angivna staden
  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`)
    .then((response) => {
      if (!response.ok) throw new Error("Kunde inte hitta staden");
      return response.json();
    })
    .then((data) => {
      if (data.results && data.results.length > 0) {
        const { latitude, longitude } = data.results[0];
        getWeatherData(latitude, longitude);
      } else {
        alert("Staden kunde inte hittas.");
      }
    })
    .catch((err) => console.error("Geocoding error:", err));
}

// Hämtar väderdata från Open Meteo för specifik latitud och longitud
function getWeatherData(latitude, longitude) {
  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,visibility,wind_speed_10m,wind_direction_10m&daily=sunrise,sunset&timezone=Europe%2FBerlin&forecast_days=1`;

  fetch(apiUrl, options)
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => viewWeather(data))
    .catch((err) => console.error("Fetch error:", err));
}

// funktion för att logga och visa den väderdata vi hämtat
function viewWeather(data) {
  console.log(data); // loggar allt för att se datan och dess keys

  // tempen för aktuell timme visas, och apparent temp visas så användaren ser det som känns
  temperature.innerHTML = data.hourly.apparent_temperature[hour] + "&deg;C";

  // dagens datum skrivs ut (vi använder arrayens första värde eftersom vi bara hämtat en dags data)
  todayDate.innerHTML = data.daily.time[0];

  // visar soluppgång och solnedgång från API-datan och använder `` för att skriva båda tiderna på en rad
  //

  // datan. target första index i array, funkar ej annars

  // sen substring för att jag bara vill få ut tiden på sunset/sunrise. mellan tecken 11-16 var tiden

  const sunriseTime = data.daily.sunrise[0].substring(11, 16);
  const sunsetTime = data.daily.sunrise[0].substring(11, 16);

  /*
  // omvandla ISO till date-objekt
  const sunriseDate = new Date(sunriseTimeISO);
  const sunsetDate = new Date(sunsetTimeISO);
  const sunriseTime = sunriseTimeISO.getHours();
  const sunsetTime = sunsetTimeISO.getHours();*/

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
