const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city-input");
const weatherContainer = document.getElementById("weather-container");

// List of Swedish cities (very temporary)
const swedishCities = [
  // Major cities
  "Stockholm",
  "Göteborg",
  "Malmö",
  "Uppsala",
  "Västerås",
  "Örebro",
  "Linköping",
  "Helsingborg",
  "Jönköping",
  "Norrköping",
  "Lund",

  // Mid-sized cities
  "Umeå",
  "Gävle",
  "Borås",
  "Södertälje",
  "Eskilstuna",
  "Halmstad",
  "Växjö",
  "Karlstad",
  "Sundsvall",
  "Östersund",
  "Trollhättan",
  "Lidingö",
  "Borlänge",
  "Tumba",
  "Kristianstad",
  "Kalmar",
  "Falun",
  "Skövde",
  "Karlskrona",
  "Skellefteå",
  "Uddevalla",
  "Varberg",

  // Smaller cities and towns
  "Åre",
  "Kiruna",
  "Visby",
  "Ystad",
  "Mora",
  "Kungälv",
  "Lerum",
  "Alingsås",
  "Landskrona",
  "Motala",
  "Trelleborg",
  "Ängelholm",
  "Karlshamn",
  "Lidköping",
  "Mariestad",
  "Värnamo",
  "Falkenberg",
  "Karlskoga",
  "Mjölby",
  "Höganäs",
  "Sandviken",
  "Vallentuna",

  // Stockholm suburbs
  "Solna",
  "Nacka",
  "Bromma",
  "Täby",
  "Sundbyberg",
  "Huddinge",
  "Järfälla",
  "Danderyd",
  "Sollentuna",
  "Åkersberga",
  "Upplands Väsby",

  // Gothenburg suburbs
  "Mölndal",
  "Partille",
  "Kungsbacka",
  "Härryda",
  "Ale",
];

let currentSuggestion = "";

searchBtn.addEventListener("click", getWeather);
cityInput.addEventListener("keydown", handleKeyDown);
cityInput.addEventListener("input", handleInput);

// Wrap the input field
wrapInput();

function wrapInput() {
  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  wrapper.style.display = "inline-block";
  wrapper.style.width = "100%";
  cityInput.parentNode.insertBefore(wrapper, cityInput);
  wrapper.appendChild(cityInput);

  const suggestionSpan = document.createElement("span");
  suggestionSpan.id = "suggestion-span";
  suggestionSpan.style.position = "absolute";
  suggestionSpan.style.left = "0";
  suggestionSpan.style.top = "0";
  suggestionSpan.style.color = "rgba(255, 255, 255, 0.5)";
  suggestionSpan.style.pointerEvents = "none";
  suggestionSpan.style.whiteSpace = "pre";
  suggestionSpan.style.overflow = "hidden";
  suggestionSpan.style.paddingLeft = getComputedStyle(cityInput).paddingLeft;
  suggestionSpan.style.paddingTop = getComputedStyle(cityInput).paddingTop;
  suggestionSpan.style.font = getComputedStyle(cityInput).font;
  wrapper.appendChild(suggestionSpan);
}

function handleKeyDown(event) {
  if (event.key === "Enter") {
    getWeather();
  } else if (event.key === "Tab") {
    event.preventDefault();
    if (currentSuggestion) {
      cityInput.value = currentSuggestion;
      currentSuggestion = "";
      updateSuggestionDisplay();
    }
  }
}

function handleInput() {
  const input = cityInput.value.toLowerCase();
  currentSuggestion = "";

  if (input) {
    const suggestion = swedishCities.find((city) =>
      city.toLowerCase().startsWith(input)
    );
    if (suggestion) {
      currentSuggestion = suggestion;
    }
  }
  updateSuggestionDisplay();
}

function updateSuggestionDisplay() {
  const suggestionSpan = document.getElementById("suggestion-span");
  if (currentSuggestion && cityInput.value) {
    const inputValue = cityInput.value;
    suggestionSpan.textContent =
      inputValue + currentSuggestion.slice(inputValue.length);
  } else {
    suggestionSpan.textContent = "";
  }
}

async function getWeather() {
  const city = cityInput.value;
  if (!city) return;

  try {
    const { latitude, longitude, name, country } = await getCoordinates(city);
    const weatherData = await fetchWeatherData(latitude, longitude);

    // Show the weather container
    weatherContainer.style.display = "block";

    displayWeather(weatherData, name, country);
  } catch (error) {
    console.error("Error:", error);
    alert(`Error: ${error.message}`);
  }
}

async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=1&language=en&format=json`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("City not found");
  }

  return data.results[0];
}

async function fetchWeatherData(latitude, longitude) {
  const today = new Date();
  const thirtyTwoDaysAgo = new Date(today);
  thirtyTwoDaysAgo.setDate(thirtyTwoDaysAgo.getDate() - 32);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const currentUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,cloudcover_mean,sunrise,sunset&current_weather=true&timezone=auto&start_date=${formatDate(
    thirtyTwoDaysAgo
  )}&end_date=${formatDate(tomorrow)}`;

  const historicalUrls = [];
  for (let i = 1; i <= 5; i++) {
    const yearStart = new Date(today);
    yearStart.setFullYear(yearStart.getFullYear() - i);
    yearStart.setDate(yearStart.getDate() - 1);
    const yearEnd = new Date(yearStart);
    yearEnd.setDate(yearEnd.getDate() + 2);

    historicalUrls.push(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,cloudcover_mean,sunrise,sunset&timezone=auto&start_date=${formatDate(
        yearStart
      )}&end_date=${formatDate(yearEnd)}`
    );
  }

  const [currentResponse, ...historicalResponses] = await Promise.all([
    fetch(currentUrl),
    ...historicalUrls.map((url) => fetch(url)),
  ]);

  const currentData = await currentResponse.json();
  const historicalData = await Promise.all(
    historicalResponses.map((response) => response.json())
  );

  return { current: currentData, historical: historicalData };
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function displayWeather(data, cityName, country) {
  const days = ["Yesterday", "Today", "Tomorrow"];
  let html = `<h2 class="location-header">${cityName}, ${country}</h2>`;
  html += '<div class="weather-cards">';

  for (let i = 0; i < 3; i++) {
    const currentDayData = {
      temp:
        i === 1
          ? data.current.current_weather.temperature
          : (data.current.daily.temperature_2m_max[i + 1] +
              data.current.daily.temperature_2m_min[i + 1]) /
            2,
      weatherCode:
        i === 1
          ? data.current.current_weather.weathercode
          : data.current.daily.weather_code[i + 1],
      cloudiness: data.current.daily.cloudcover_mean[i + 1],
      sunrise: new Date(data.current.daily.sunrise[i + 1]),
      sunset: new Date(data.current.daily.sunset[i + 1]),
    };

    const yesterdayForecast =
      i === 1
        ? {
            temp:
              (data.current.daily.temperature_2m_max[1] +
                data.current.daily.temperature_2m_min[1]) /
              2,
          }
        : null;

    const dayBeforeYesterdayForecast =
      i === 0
        ? {
            temp:
              (data.current.daily.temperature_2m_max[0] +
                data.current.daily.temperature_2m_min[0]) /
              2,
          }
        : null;

    const tomorrowForecast =
      i === 2
        ? {
            temp:
              (data.current.daily.temperature_2m_max[3] +
                data.current.daily.temperature_2m_min[3]) /
              2,
          }
        : null;

    // Calculate accuracy for Today, Yesterday, and Tomorrow
    let tempAccuracy = "";
    if (i === 1 && yesterdayForecast) {
      const tempAccuracyValue =
        100 -
        Math.abs(
          ((currentDayData.temp - yesterdayForecast.temp) /
            currentDayData.temp) *
            100
        );
      tempAccuracy = `(${Math.round(tempAccuracyValue)}% accurate)`;
    } else if (i === 0 && dayBeforeYesterdayForecast) {
      const tempAccuracyValue =
        100 -
        Math.abs(
          ((currentDayData.temp - dayBeforeYesterdayForecast.temp) /
            currentDayData.temp) *
            100
        );
      tempAccuracy = `(${Math.round(tempAccuracyValue)}% accurate)`;
    } else if (i === 2 && tomorrowForecast) {
      tempAccuracy = "(Forecast)";
    }

    // Calculate historical data
    const historicalTemps = data.historical.map(
      (year) =>
        (year.daily.temperature_2m_max[i] + year.daily.temperature_2m_min[i]) /
        2
    );
    const historicalCodes = data.historical.map(
      (year) => year.daily.weather_code[i]
    );
    const medianTemp = calculateMedian(historicalTemps);
    const medianCode = calculateMedian(historicalCodes);

    html += `
            <div class="weather-card">
                <h3>${days[i]}</h3>
                <div class="temp">${Math.round(currentDayData.temp)}°C</div>
                <div class="description">${getWeatherDescription(
                  currentDayData.weatherCode
                )}</div>
                <div class="cloudiness">Cloudiness: ${Math.round(
                  currentDayData.cloudiness
                )}%</div>
                <div class="sun-times">
                    Sunrise: ${currentDayData.sunrise.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    Sunset: ${currentDayData.sunset.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </div>
                ${
                  i === 1
                    ? `
                <div class="yesterday-forecast">
                    <h4>Yesterday's Forecast</h4>
                    <div>${Math.round(
                      yesterdayForecast.temp
                    )}°C ${tempAccuracy}</div>
                </div>
                `
                    : ""
                }
                ${
                  i === 0
                    ? `
                <div class="yesterday-forecast">
                    <h4>Day Before's Forecast</h4>
                    <div>${Math.round(
                      dayBeforeYesterdayForecast.temp
                    )}°C ${tempAccuracy}</div>
                </div>
                `
                    : ""
                }
                ${
                  i === 2
                    ? `
                <div class="tomorrow-forecast">
                    <h4>Today's Forecast</h4>
                    <div>${Math.round(
                      tomorrowForecast.temp
                    )}°C ${tempAccuracy}</div>
                </div>
                `
                    : ""
                }
                <div class="historical-data">
                    <h4>5-Year Median</h4>
                    <div>${Math.round(medianTemp)}°C</div>
                    <div>${getWeatherDescription(Math.round(medianCode))}</div>
                </div>
            </div>
        `;
  }

  html += "</div>"; // Close weather-cards div

  // Update the clothing recommendations section in displayWeather function
  const clothingRecs = getClothingRecommendations(data);
  html += `
        <h2>What to Wear Today</h2>
        <div class="clothing-cards">
            <div class="clothing-card">
                <h4>Clothing Layers</h4>
                <div class="clothing-list">
                    ${clothingRecs.layers
                      .map(
                        (item) => `
                        <div class="clothing-item">${item}</div>
                    `
                      )
                      .join("")}
                </div>
            </div>
            <div class="clothing-card">
                <h4>Accessories</h4>
                <div class="clothing-list">
                    ${
                      clothingRecs.accessories.length > 0
                        ? clothingRecs.accessories
                            .map(
                              (item) => `
                            <div class="clothing-item">${item}</div>
                        `
                            )
                            .join("")
                        : '<div class="clothing-item">No accessories needed</div>'
                    }
                </div>
            </div>
            <div class="clothing-card">
                <h4>Footwear</h4>
                <div class="clothing-list">
                    ${clothingRecs.footwear
                      .map(
                        (item) => `
                        <div class="clothing-item">${item}</div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        </div>
    `;

  // THEN add rain information cards
  const rainInfo = getRainInfo(data);
  html += `
        <h2>Rain</h2>
        <div class="rain-cards">
            <div class="rain-card">
                <h4>Past Month</h4>
                <div class="rain-value">${rainInfo.pastMonth}</div>
                <div class="info-label">days with rain</div>
            </div>
            <div class="rain-card">
                <h4>Last Rain</h4>
                <div class="rain-value">${rainInfo.lastRain}</div>
                <div class="info-label">since last rain</div>
            </div>
            <div class="rain-card">
                <h4>Next Rain</h4>
                <div class="rain-value">${rainInfo.nextRain}</div>
                <div class="info-label">until next likely rain</div>
            </div>
        </div>
    `;

  // THEN add thunder information cards
  const thunderInfo = getThunderInfo(data);
  html += `
        <h2>Thunder</h2>
        <div class="thunder-cards">
            <div class="thunder-card">
                <h4>Past Month</h4>
                <div class="thunder-value">${thunderInfo.pastMonth}</div>
                <div class="info-label">days with thunder</div>
            </div>
            <div class="thunder-card">
                <h4>Last Thunder</h4>
                <div class="thunder-value">${thunderInfo.lastThunder}</div>
                <div class="info-label">since last thunder</div>
            </div>
            <div class="thunder-card">
                <h4>Next Thunder</h4>
                <div class="thunder-value">${thunderInfo.nextThunder}</div>
                <div class="info-label">until next likely thunder</div>
            </div>
        </div>
    `;

  weatherContainer.innerHTML = html;
}

function getWeatherDescription(code) {
  if (code <= 3) return "Clear";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snowy";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  return "Thunderstorm";
}

function calculateMedian(numbers) {
  const sorted = numbers.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function getRainInfo(data) {
  const lastRainDate = getLastRainDate(data.current.daily.precipitation_sum);
  const rainDaysCount = countRainDays(data.current.daily.precipitation_sum);
  const nextRainForecast = getNextRainForecast(data.historical);

  return {
    pastMonth: rainDaysCount,
    lastRain: lastRainDate,
    nextRain: nextRainForecast,
  };
}

function getLastRainDate(precipitationData) {
  for (let i = precipitationData.length - 1; i >= 0; i--) {
    if (precipitationData[i] > 0) {
      const daysAgo = precipitationData.length - 1 - i;
      if (daysAgo === 0) {
        return "Today";
      } else if (daysAgo === 1) {
        return "1d ago";
      } else {
        return `${daysAgo}d ago`;
      }
    }
  }
  return "30d+";
}

function countRainDays(precipitationData) {
  return precipitationData.filter((precipitation) => precipitation > 0).length;
}

function getNextRainForecast(historicalData) {
  const rainProbabilities = new Array(7).fill(0);

  historicalData.forEach((yearData) => {
    yearData.daily.precipitation_sum
      .slice(0, 7)
      .forEach((precipitation, index) => {
        if (precipitation > 0) {
          rainProbabilities[index]++;
        }
      });
  });

  const highestProbabilityIndex = rainProbabilities.indexOf(
    Math.max(...rainProbabilities)
  );
  const daysFromNow = highestProbabilityIndex + 1;

  return `+${daysFromNow}d`;
}

function getThunderInfo(data) {
  const lastThunderDate = getLastThunderDate(data.current.daily.weather_code);
  const thunderDaysCount = countThunderDays(data.current.daily.weather_code);
  const nextThunderForecast = getNextThunderForecast(data.historical);

  return {
    pastMonth: thunderDaysCount,
    lastThunder: lastThunderDate,
    nextThunder: nextThunderForecast,
  };
}

function getLastThunderDate(weatherCodes) {
  for (let i = weatherCodes.length - 1; i >= 0; i--) {
    if (weatherCodes[i] >= 95 && weatherCodes[i] <= 99) {
      const daysAgo = weatherCodes.length - 1 - i;
      if (daysAgo === 0) {
        return "Today";
      } else if (daysAgo === 1) {
        return "1d ago";
      } else {
        return `${daysAgo}d ago`;
      }
    }
  }
  return "30d+";
}

function countThunderDays(weatherCodes) {
  return weatherCodes.filter((code) => code >= 95 && code <= 99).length;
}

function getNextThunderForecast(historicalData) {
  const thunderProbabilities = new Array(7).fill(0);

  historicalData.forEach((yearData) => {
    yearData.daily.weather_code.slice(0, 7).forEach((code, index) => {
      if (code >= 95 && code <= 99) {
        thunderProbabilities[index]++;
      }
    });
  });

  const highestProbabilityIndex = thunderProbabilities.indexOf(
    Math.max(...thunderProbabilities)
  );
  const daysFromNow = highestProbabilityIndex + 1;

  return `+${daysFromNow}d`;
}

// Add this function to get clothing recommendations
function getClothingRecommendations(data) {
  const currentTemp = data.current.current_weather.temperature;
  const precipitation = data.current.daily.precipitation_sum[0];
  const weatherCode = data.current.current_weather.weathercode;

  let layers = [];
  let accessories = [];
  let footwear = [];

  // Temperature based recommendations
  if (currentTemp < 0) {
    layers = ["Heavy winter clothing"];
    accessories = ["Winter accessories"];
    footwear = ["Winter boots"];
  } else if (currentTemp < 10) {
    layers = ["Warm winter clothing"];
    accessories = ["Light winter accessories"];
    footwear = ["Warm shoes"];
  } else if (currentTemp < 15) {
    layers = ["Light jacket and long sleeves"];
    accessories = [];
    footwear = ["Comfortable shoes"];
  } else if (currentTemp < 20) {
    layers = ["Light layers"];
    footwear = ["Light shoes"];
  } else if (currentTemp < 25) {
    layers = ["Light clothing"];
    footwear = ["Light shoes"];
  } else {
    layers = ["Summer clothing"];
    accessories = ["Sun protection"];
    footwear = ["Summer shoes"];
  }

  // Add weather-specific items
  if (precipitation > 0 || (weatherCode >= 51 && weatherCode <= 67)) {
    accessories.push("Rain protection");
    footwear = ["Water-resistant footwear"];
  }

  return { layers, accessories, footwear };
}
