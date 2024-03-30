const inputBox = document.querySelector(".input");
const location_not_found = document.querySelector(".location-not-found");
const temperature = document.querySelector(".temperature");
const weatherData = document.querySelector(".weather-data");
const humidity = document.getElementById("humidity");
const wind_speed = document.getElementById("wind-speed");
const forecastContainer = document.querySelector(".forecast-container");
const description = document.querySelector(".description");
const locationTitle = document.getElementById("locationTitle");
const weather_pic = document.querySelector(".weather-pic");
const weather_body = document.querySelector(".weather-body");

async function fetchWeather(city) {
  const api_key = "32e727c7767d7e70711658af037ca6fc"; //openweatherapi api key
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${api_key}`;

  const weather_data = await fetch(`${url}`).then((response) =>
    response.json()
  );

  // if location cannot be found => 404.png will pop up to show that there was an error
  if (weather_data.cod === `404`) {
    location_not_found.style.display = "flex";
    weather_body.style.display = "none";
    console.log("error");
    return;
  }

  console.log("run");
  location_not_found.style.display = "none";
  weather_body.style.display = "flex";
  const celsius = Math.round(weather_data.list[0].main.temp - 273.15); // temp was in kelvin
  const fahrenheit = Math.round((celsius * 9) / 5 + 32);

  const dailyForecasts = {};
  weather_data.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const day = date.getDate();
    const time = date.getHours();

    // temp highs and lows
    if (!dailyForecasts[day]) {
      dailyForecasts[day] = {
        high: Number.MIN_SAFE_INTEGER,
        low: Number.MAX_SAFE_INTEGER,
      };
    }
    if (item.main.temp > dailyForecasts[day].high) {
      dailyForecasts[day].high = item.main.temp;
    }
    if (item.main.temp < dailyForecasts[day].low) {
      dailyForecasts[day].low = item.main.temp;
    }
  });
  let maxTemp = Number.MIN_SAFE_INTEGER;
  let minTemp = Number.MAX_SAFE_INTEGER;
  for (const day in dailyForecasts) {
    if (dailyForecasts[day].high > maxTemp) {
      maxTemp = dailyForecasts[day].high;
    }
    if (dailyForecasts[day].low < minTemp) {
      minTemp = dailyForecasts[day].low;
    }
  }

  const highTempCelsius = Math.round(maxTemp - 273.15);
  const highTempFahrenheit = Math.round((highTempCelsius * 9) / 5 + 32);
  const lowTempCelsius = Math.round(minTemp - 273.15);
  const lowTempFahrenheit = Math.round((lowTempCelsius * 9) / 5 + 32);

  /*
  how I want the below to look
  __ degrees
  sunny/cloudy/etc
  highs | lows
  */
  weatherData.innerHTML = `
    <p class="current-temp"><span class="temp-value">${fahrenheit}°F (${celsius}°C)</span></p>
    <p class="description"><span class="description-value">${weather_data.list[0].weather[0].description}</span></p>
    <p class="high-low">H: <span class="high-value">${highTempFahrenheit}°F (${highTempCelsius}°C)</span> | L: <span class="low-value">${lowTempFahrenheit}°F (${lowTempCelsius}°C)</span></p>
    `;
  description.innerHTML = `${weather_data.list[0].weather[0].description}`;
  humidity.innerHTML = `${weather_data.list[0].main.humidity}%`; // humidity
  wind_speed.innerHTML = `${weather_data.list[0].wind.speed}Km/H`; // wind
  locationTitle.innerHTML = city;

  const weatherIcon = weather_data.list[0].weather[0].icon;
  weather_pic.src = `https://openweathermap.org/img/wn/${weatherIcon}.png`;

  displayForecast(weather_data.list);
}

// temperature should be displayed in fahrenheit and celsius so convert from C to F
function tempConversion(celsius) {
  return Math.round((celsius * 9) / 5 + 32);
}

// displays the forecast => weather data
function displayForecast(forecastData) {
  forecastContainer.innerHTML = "";

  // stuff was showing up on the landing page without entering anything
  const forecastTitle = document.getElementById("forecastTitle");
  forecastTitle.style.display = "block";

  const dailyForecasts = {};
  forecastData.forEach((item) => {
    const date = new Date(item.dt * 1000).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!dailyForecasts[date]) {
      dailyForecasts[date] = [];
    }
    dailyForecasts[date].push(item);
  });

  for (const date in dailyForecasts) {
    const dailyForecastData = dailyForecasts[date];
    const forecastCard = document.createElement("div");
    forecastCard.classList.add("forecast-card");
    forecastCard.innerHTML = `
          <div class="forecast-date">${date}</div>
      `;

    const hrforecastContainer = document.createElement("div");
    hrforecastContainer.classList.add("forecast-3hr-container");

    dailyForecastData.forEach((item) => {
      const time = new Date(item.dt * 1000).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
      });
      const tempCelsius = Math.round(item.main.temp - 273.15);
      const tempFahrenheit = tempConversion(tempCelsius);
      const icon = item.weather[0].icon;
      const description = item.weather[0].description;

      const hrforecastItem = document.createElement("div");
      hrforecastItem.classList.add("forecast-3hr-item");
      hrforecastItem.innerHTML = `
              <p class="forecast-3hr-time">${time}</p>
              <img src="http://openweathermap.org/img/wn/${icon}.png" 
                  alt="${description}" class="hrforecast-icon"> 
              <p class="hrforecast-temp">${tempFahrenheit}°F</p> 
          `;
      hrforecastContainer.appendChild(hrforecastItem);
    });

    forecastCard.appendChild(hrforecastContainer);
    forecastContainer.appendChild(forecastCard);
  }
}

// geolocation => asks user for permision to get their location using long, lat, and api
async function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=32e727c7767d7e70711658af037ca6fc`
        );
        const data = await response.json();
        const city = data.name;

        fetchWeather(city);
      },
      (error) => {
        console.error("Error getting location:", error); // error location doesnt exist
      }
    );
  } else {
    console.error("Error Geolocation is not supported."); // error cant geolocate
  }
}

getCurrentLocation();

function searchBar() {
  const city = inputBox.value;
  if (city.trim() !== "") {
    fetchWeather(city);
  }
}

inputBox.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    searchBar();
  }
});
