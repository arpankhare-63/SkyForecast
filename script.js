// --- Grab all the important HTML elements from the page ---
const cityinput = document.querySelector('.city');
const submitBtn = document.querySelector('.submit-btn');
const apikey = 'e7283852ef1a75b4af2afae5bffd4a2f';

// Sections we switch between (search, error, weather info)
const notfoundcity = document.querySelector('.not-found');
const searchcity = document.querySelector('.search-city');
const weatherinfo = document.querySelector('.info-weather');

// Weather details that change when user searches a city
const humidityvalue = document.querySelector('.humidity-value');
const windvalue = document.querySelector('.wind-value');
const temprature = document.querySelector('.temp-text');
const condition = document.querySelector('.condition-txt');
const Searchedcity = document.querySelector('.cityc');
const country = document.querySelector('.country');

// Date & Time elements
const current_date = document.querySelector('.current_date-txt');
const GMT = document.querySelector('.GMT');
const localtime = document.querySelector('.localtime');

// Weather icon
const weathersummary = document.querySelector('.weather-summary img');

// Forecast container
const forecastItemContainer = document.querySelector('.forecast-item-container');

// We’ll use this to keep track of the "live clock" interval
let clockInterval = null;


// --- When user clicks the search button ---
submitBtn.addEventListener('click', () => {
    if (cityinput.value === "") {
        // If they didn’t type anything, just alert them
        alert('Please enter a city');
        return;
    } else {
        // Otherwise fetch that city’s weather info
        updateWeatherinfo(cityinput.value);

        // Clear the input box after search
        cityinput.value = '';
        cityinput.blur(); // remove focus so keyboard closes (on mobile)
    }
});

// --- Support pressing "Enter" instead of clicking button ---
cityinput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        submitBtn.click();
    }
});


// --- A helper function to talk to OpenWeather API ---
async function getFetchData(endPoint, city) {
    try {
        const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apikey}&units=metric`;
        const response = await fetch(apiUrl);

        // If request fails (wrong city, no internet, etc.)
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        // Return actual JSON data
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        // Return a fake 404 object so rest of code knows city not found
        return { cod: 404 };
    }
}


// --- Main function: Update all weather info on page ---
async function updateWeatherinfo(city) {
    const weatherData = await getFetchData('weather', city);

    // If city not found, show the error section
    if (weatherData.cod != 200) {
        showDisplaySection(notfoundcity);
        return;
    }

    // Pull out all the useful data from API response
    const {
        name: cityName,
        main: { temp, humidity },
        weather: [{ icon, main }],
        wind: { speed },
        sys: { country: countryName },
        timezone
    } = weatherData;

    // Put that data into the page
    Searchedcity.textContent = cityName;
    country.textContent = countryName;
    humidityvalue.textContent = humidity + '%';
    windvalue.textContent = speed + ' m/s';
    temprature.textContent = Math.round(temp);
    condition.textContent = main;

    // Start a live ticking clock for this city (based on timezone)
    startLiveClock(timezone);

    // Update weather icon image
    weathersummary.src = `https://openweathermap.org/img/wn/${icon}@4x.png`;

    // Update the forecast section too
    await updateForecastInfo(city);

    // Finally show the weather section on screen
    showDisplaySection(weatherinfo);
}


// --- Helper: Only show one section at a time (hide others) ---
function showDisplaySection(section) {
    [weatherinfo, searchcity, notfoundcity].forEach(sec => sec.style.display = "none");
    section.style.display = "flex";
}


// --- Function that keeps city’s local time ticking every second ---
function startLiveClock(timezone) {
    // Stop the old clock if it was running (when user searches new city)
    if (clockInterval) {
        clearInterval(clockInterval);
    }

    function updateClock() {
        // Get current UTC time → then shift it by city’s timezone
        const utcTime = Date.now() + new Date().getTimezoneOffset() * 60000;
        const localDate = new Date(utcTime + timezone * 1000);

        // Format the date (like Mon, Aug 22 2025)
        const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        current_date.textContent = localDate.toLocaleDateString('en-US', dateOptions);

        // Show GMT offset (like GMT -4)
        GMT.textContent = `GMT ${timezone / 3600}`;

        // Show live time with hours, minutes, seconds
        localtime.textContent = localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    // Run immediately once so user doesn’t wait a sec
    updateClock();

    // Keep updating every second
    clockInterval = setInterval(updateClock, 1000);
}


// --- Forecast Section (next 5 days at 12:00 noon) ---
async function updateForecastInfo(city) {
    const forecastsdata = await getFetchData('forecast', city);
    const timeTaken = '12:00:00'; // we only want the "midday" forecasts
    const todayDate = new Date().toISOString().split('T')[0];

    // Clear old forecast items
    forecastItemContainer.innerHTML = '';

    // Loop through forecast list and pick only the needed times
    forecastsdata.list.forEach(forecastWeather => {
        if (forecastWeather.dt_txt.includes(timeTaken) &&
            !forecastWeather.dt_txt.includes(todayDate)) {
            updateForecastItems(forecastWeather);
        }
    });
}


// --- Creates and adds one forecast card (date + icon + temp) ---
function updateForecastItems(weatherData) {
    const {
        dt_txt: date,
        main: { temp },
        weather: [{ icon }]
    } = weatherData;

    // Format the date as "22 Aug"
    const dateTaken = new Date(date);
    const dateOption = { day: '2-digit', month: 'short' };
    const dateResult = dateTaken.toLocaleDateString('en-US', dateOption);

    // Build forecast card HTML
    const forecastItem = `
      <div class="forecast_item">
        <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
        <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="Weather icon" class="imgsize" />
        <h5 class="forecast_item-temperature regular-txt">${Math.round(temp)} &#x2103;</h5>
      </div>
    `;

    // Add it to the container
    forecastItemContainer.insertAdjacentHTML('beforeend', forecastItem);
}
