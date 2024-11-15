// alternativ för fetchen (GET behövs för att vi ska hämta data)
const options = { method: "GET" };
let defaultCity = ""; //kommer ändras nedan, drf let ist för const. Tom sträng initiellt

// target diven med id "temp" (id används bara en gång per element så funkar bra med getElementById)
const temp = document.getElementById("temp");
const appTemp = document.getElementById("appTemp");
const todayDate = document.getElementById("todayDate");
const weatherHours = document.getElementById("weatherHours");
const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");
const relHum = document.getElementById("relHum");
const prec = document.getElementById("prec");
const rain = document.getElementById("rain");
const showers = document.getElementById("showers");
const wind = document.getElementById("wind");

// sparar aktuell timme i en variabel (för att få rätt tid i datan)
const hour = new Date().getHours(); // timmen vi hämtar data för, t.ex. om kl är 14 så är hour = 14
// date hämtar dagens datum, getHours hämtar timmen

// DOM triggas här av addEventListener, och den prioriterar då att läsa hela HTML-dokumentet innan den läser javascriptet
// så addEventListener lyssnar efter ett event, DOM i detta fall, och låter oss specifisera att funktionen körs efter eventet skett
document.addEventListener("DOMContentLoaded", function () {
  loadFromStorage(); // kör funktionen nedan, så initiella sidan som visas kommer vara cityHistory, den du sökt på sist. Om du ej sökt på något så ?? "Stockholm" blir initial
  console.log("Senast sökta stad", defaultCity);

  // om det användaren skriver in i sökfältet finns, spara det annars är standardstaden sthlm
  document.getElementById("cityInput").value = defaultCity;
  fetchWeather(defaultCity); // fetchar Stockholm i detta fall pga funktionen nedan -> loadFromStorage

  document
    .getElementById("search")
    .addEventListener("submit", function (event) {
      // lyssnar efter submit, triggas av 'enter' eller klick
      event.preventDefault(); // default med form är att sidan reloadas om man trycker enter. Tar bort detta
      fetchWeather(); // anropar fetchweather igen baserat på användarens input
    });
});
// laddar från localStorage första vi gör, fyller historiken (under DOMcontent). denna körs innan saveToStorage(searchHistory) för att det KAN finnas data i localStorage (....)
function loadFromStorage() {
  // hämta och visa info från storage
  defaultCity = localStorage.getItem("cityHistory") ?? "Stockholm"; // här får jag en array med alla städer jag sökt på. för den parse
}
function saveToStorage(defaultCity) {
  // när detta körs blir det en lista av arrays, så i funktionen ovan så parse till strängar för vi behöver strängar i localStorage
  // spara från storage

  localStorage.setItem("cityHistory", defaultCity);
}
// funktion som körs när man klickar på "Sök"-knappen
function fetchWeather(defaultCity) {
  // hämtar stadens namn som användaren skrivit in i inputfältet
  const city = defaultCity || document.getElementById("cityInput").value;

  // om ingen stad matas in, avsluta funktionen
  if (!city) {
    return; //return utan något efter avbryter funktionen
  }

  defaultCity = city;
  // push lägger in city i history, då blir det en array för vi gjorde history = []
  saveToStorage(defaultCity); //sparar historiken till storage

  // ok så det såg skitfult ut när jag skrev "berlin" och det returnerade liten bokstav, så fick köra en uppercase/lowercase samt slice

  // charAt får tag på ett tecken i strängen, här på index 0. lowercase delen får dock med sig resten av ordet, pga SLICE. kan göra m substring oxå men jag föredrog detta
  const uppercaseCity =
    city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

  // uppdaterar stadens namn på sidan, men med stor bokstav först och resten lowercase. Detta behöver ej matas in i api och hålla på cus it doesnt make any difference
  document.getElementById("cityName").innerHTML = uppercaseCity;

  document.getElementById("cityInput").value = ""; //gör att sökrutan reset:ar efter man sökt på stad

  // anropar Open Meteo geokodnings-API för att få latitud och longitud för staden
  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`)
    .then((response) => {
      // om vi får fel av responsen, skicka ett felmeddelande, annars omvandla till json
      if (!response.ok)
        throw new Error(
          "Something went wrong. Please check the city name or try again later."
        );
      return response.json(); // omvandlar svaret till json-format
    })
    .then((data) => {
      // om data finns, hämtar vi latitud och longitud från första resultatet, annars varnas användaren
      if (data.results && data.results.length > 0) {
        const { latitude, longitude } = data.results[0]; // får koordinater för staden
        getWeatherData(latitude, longitude); // skickar dessa till funktionen för att hämta väder
      } else {
        alert("City could not be found."); // meddelande om ingen stad hittas
      }
    })
    .catch((err) => console.error("Geocoding error:", err)); // felmeddelande om geokodning misslyckas
}

// funktion som hämtar väderdata från Open Meteo med hjälp av latitud och longitud vi fått tidigare
function getWeatherData(latitude, longitude) {
  // API-urlen ändras för att inkludera staden som blivit vald, med rätt koordinater bla bla
  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,visibility,wind_speed_10m,wind_direction_10m,weather_code,snowfall,snow_depth&daily=sunrise,sunset&timezone=Europe%2FBerlin&forecast_days=1`;

  // fetchar väderdata
  fetch(apiUrl, options)
    .then((response) => {
      // om vi inte får en ok respons, kasta ett felmeddelande, annars omvandla till json
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json(); // omvandlar till json-format om allt fungerar
    })
    .then((data) => viewWeather(data)) // skickar värdet till sidan
    .catch((err) => console.error("Fetch error:", err)); // felmeddelande om hämtningen misslyckas
}
// funktion för att logga och visa väderdata vi hämtat
function viewWeather(data) {
  console.log(data); // loggar allt för att se datan och dess keys

  // tempen för aktuell timme visas, och apparent temp visas så användaren ser det som känns
  temp.innerHTML = data.hourly.temperature_2m[hour] + "&deg;C";
  appTemp.innerHTML =
    `Feels like ${data.hourly.apparent_temperature[hour]}` + "&deg;C";
  // dagens datum skrivs ut (vi använder arrayens första värde eftersom vi bara hämtat en dags data)
  todayDate.innerHTML = data.daily.time[0];

  // visar soluppgång och solnedgång från API-datan och använder `` för att skriva båda tiderna på en rad
  const sunriseTime = data.daily.sunrise[0].substring(11, 16); // får bara ut tiden från API-datan
  const sunsetTime = data.daily.sunset[0].substring(11, 16); // får bara ut tiden från API-datan
  sunrise.innerHTML = `Sunrise by ${sunriseTime}`;
  sunset.innerHTML = `Sunset by ${sunsetTime}`;

  // visar relativ luftfuktigheten (relativ(?)) [hour] är aktuella timmen
  relHum.innerHTML = `Rel. Humidity: ${data.hourly.relative_humidity_2m[hour]}%`;

  // visar sannolikheten för nederbörd och mängd
  prec.innerHTML = `Precipitation: ${data.hourly.precipitation[hour]} mm, ${data.hourly.precipitation_probability[hour]}%`;

  // visar mängden regn och eventuella skurar
  rain.innerHTML = `Rainfall: ${data.hourly.rain[hour]} +  mm`;
  showers.innerHTML = `Showers: ${data.hourly.showers[hour]} mm`;

  // vindriktning och vindhastighet
  wind.innerHTML = `Wind: ${data.hourly.wind_direction_10m[hour]}°, Speed: ${data.hourly.wind_speed_10m[hour]} m/s`;

  // visar beskrivningen för vädret just nu genom att göra om väderkoden till en beskrivande text
  const weatherCode = data.hourly.weather_code[hour]; // koden för vädret vid den aktuella timmen vi hämtar
  const weatherDescription = getWeatherDescription(weatherCode); // kallar på funktionen nedan för att få en beskrivning som är lite lättare att förstå för användaren

  // referens till diven som ska visa väderbeskrivningen och skriver ut den
  const weatherDescriptionElement =
    document.getElementById("weatherDescription");
  weatherDescriptionElement.innerHTML = `Weather currently: ${weatherDescription}`; // skriver ut en enkel text för vädret, så användaren snabbt fattar vad som pågår

  // Visar väderikonen (weatherIcon) baserat på väderbeskrivningen vi fått från väderkoden

  const weatherIcon = document.getElementById("icon");
  const bodyBackground = document.getElementById("body"); // targetar body genom id:n för att ändra hela sidans bakgrund

  // så IF description är clear, visa ikonen clear. else if och -||- på resten.
  if (weatherDescription === "Clear") {
    weatherIcon.src = "media/weatherIcons/clear.png"; // ikon för klar himmel
    bodyBackground.style.backgroundImage = "url('media/backgrounds/clear.jpg')"; // bakgrund för klar himmel
  } else if (weatherDescription === "Foggy") {
    weatherIcon.src = "media/weatherIcons/foggy.png"; // ikon för dimma
    bodyBackground.style.backgroundImage = "url('media/backgrounds/foggy.jpg')"; // dimmig bakgrund
  } else if (
    weatherDescription === "Rainy" || // regn || eller showers
    weatherDescription === "Rain showers"
  ) {
    weatherIcon.src = "media/weatherIcons/rain.png"; // ikon för regn
    bodyBackground.style.backgroundImage = "url('media/backgrounds/rain.jpg')"; // bakgrund för regnigt väder
  } else if (
    weatherDescription === "Snowy" ||
    weatherDescription === "Snow showers"
  ) {
    weatherIcon.src = "media/weatherIcons/snowy.png"; // ikon för snö
    bodyBackground.style.backgroundImage = "url('media/backgrounds/snow1.jpg')"; // bakgrund för snöväder
  } else if (weatherDescription === "Thunderstorm") {
    weatherIcon.src = "media/weatherIcons/thunder1.jpg"; // ikon för åska
    bodyBackground.style.backgroundImage =
      "url('media/backgrounds/thunder.jpg')"; // bakgrund för åskväder
  }
}

// omvandlar väderkoden (weather_code) till respektive returvärde
function getWeatherDescription(code) {
  if (code <= 3) return "Clear"; // Kod 0-3 är klart väder, ingen nederbörd eller annat
  if (code <= 48) return "Foggy"; // Kod 4-48 är dimmigt väder, t.ex. dis eller tjock dimma
  if (code <= 67) return "Rainy"; // Kod 49-67 är regnigt, kan vara lätt eller måttligt regn
  if (code <= 77) return "Snowy"; // Kod 68-77 är snö, från lätt till mer ordentligt snöfall
  if (code <= 82) return "Rain showers"; // Kod 78-82 är regnskurar, oftast lite mer sporadiskt
  if (code <= 86) return "Snow showers"; // Kod 83-86 är snöskurar, snöfall i omgångar
  return "Thunderstorm"; // Övriga koder över 86 är olika typer av åska eller kraftiga stormar
}
