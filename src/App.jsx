
import { useEffect, useState } from "react";
import {
  Cloud, CloudRain, CloudSun, Sun, CloudSnow,
  CloudLightning, Wind, Droplets, MapPin, Search,
  Sunrise, Sunset, RefreshCw, Clock3, CalendarDays,
  Eye, Thermometer, Menu
} from "lucide-react";
import "./App.css";

const weatherInfo = (code) => {
  if (code === 0) return { text: "Clear sky", Icon: Sun };
  if ([1, 2].includes(code)) return { text: "Partly cloudy", Icon: CloudSun };
  if (code === 3) return { text: "Overcast", Icon: Cloud };
  if ([45, 48].includes(code)) return { text: "Foggy", Icon: Cloud };
  if ([51, 53, 55, 56, 57].includes(code)) return { text: "Drizzle", Icon: CloudRain };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { text: "Rainy", Icon: CloudRain };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { text: "Snow", Icon: CloudSnow };
  if ([95, 96, 99].includes(code)) return { text: "Thunderstorm", Icon: CloudLightning };
  return { text: "Weather", Icon: CloudSun };
};

const getHour = (value) =>
  new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true
  });

const getDay = (value) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short"
  });

export default function App() {
  const [city, setCity] = useState("Dhaka");
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState({
    name: "Dhaka",
    country: "Bangladesh",
    latitude: 23.8103,
    longitude: 90.4125,
    timezone: "Asia/Dhaka"
  });
  const [weather, setWeather] = useState(null);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("celsius");
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      setLoading(true);
      setError("");

      try {
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.search = new URLSearchParams({
          latitude: String(place.latitude),
          longitude: String(place.longitude),
          current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "weather_code",
            "wind_speed_10m"
          ].join(","),
          hourly: "temperature_2m,weather_code",
          daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "sunrise",
            "sunset"
          ].join(","),
          forecast_days: "7",
          timezone: "auto"
        }).toString();

        const response = await fetch(url);
        if (!response.ok) throw new Error("Weather service unavailable");

        const data = await response.json();
        if (!cancelled) setWeather(data);
      } catch {
        if (!cancelled) setError("Weather load হয়নি। Internet connection চেক করে আবার চেষ্টা করো।");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadWeather();
    return () => { cancelled = true; };
  }, [place]);

  async function searchCity(event) {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;

    setLoading(true);
    setError("");

    try {
      const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
      url.search = new URLSearchParams({
        name: term,
        count: "1",
        language: "en",
        format: "json"
      }).toString();

      const response = await fetch(url);
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      const result = data.results?.[0];

      if (!result) throw new Error("City not found");

      setCity(result.name);
      setPlace({
        name: result.name,
        country: result.country || "",
        latitude: result.latitude,
        longitude: result.longitude,
        timezone: result.timezone || "auto"
      });
      setQuery("");
    } catch (err) {
      setError(err.message === "City not found"
        ? "City পাওয়া যায়নি। সঠিক নাম দিয়ে চেষ্টা করো।"
        : "City search করা যাচ্ছে না। আবার চেষ্টা করো।");
      setLoading(false);
    }
  }

  const current = weather?.current;
  const daily = weather?.daily;
  const hourly = weather?.hourly;
  const condition = current ? weatherInfo(current.weather_code) : weatherInfo(1);
  const WeatherIcon = condition.Icon;

  const temperature = (value) =>
    value == null ? "--" : Math.round(unit === "celsius" ? value : value * 9 / 5 + 32);

  const time = (value) =>
    value ? new Date(value).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: place.timezone === "auto" ? undefined : place.timezone
    }) : "--:--";

  const localTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: place.timezone === "auto" ? undefined : place.timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(now);

  const localDate = new Intl.DateTimeFormat("en-US", {
    timeZone: place.timezone === "auto" ? undefined : place.timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(now);

  return (
    <main className={`app ${dark ? "dark" : "light"}`}>
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-icon"><CloudSun size={25} /></span>
          <span>Atmos<span className="brand-accent">Time</span></span>
        </a>

        <div className="top-actions">
          <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">
            {dark ? <Sun size={19} /> : <Cloud size={19} />}
          </button>
          <button className="unit-button" onClick={() => setUnit(unit === "celsius" ? "fahrenheit" : "celsius")}>
            °{unit === "celsius" ? "C" : "F"}
          </button>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <span className="eyebrow"><span className="live-dot" /> LIVE WEATHER & LOCAL TIME</span>
          <h1>Your world,<br /><span>in perfect time.</span></h1>
          <p>Weather, forecasts and time — all in one place.</p>

          <form className="search-form" onSubmit={searchCity}>
            <Search size={20} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any city..."
              aria-label="Search city"
            />
            <button type="submit" disabled={!query.trim() || loading}>
              Search
            </button>
          </form>

          <div className="location-line">
            <MapPin size={16} />
            {place.name}, {place.country}
          </div>
        </div>

        <div className="weather-orb" aria-hidden="true">
          <div className="orb-glow" />
          <WeatherIcon className="orb-icon" size={112} strokeWidth={1.2} />
          <span className="orb-star star-one">✦</span>
          <span className="orb-star star-two">✧</span>
        </div>
      </section>

      {error && (
        <div className="error-message" role="alert">
          {error}
          <button onClick={() => setPlace({ ...place })}>Retry</button>
        </div>
      )}

      <section className="dashboard">
        <div className="section-heading">
          <div>
            <span className="eyebrow">YOUR DASHBOARD</span>
            <h2>Today's overview</h2>
          </div>
          <button className="refresh-button" onClick={() => setPlace({ ...place })}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {loading && !weather ? (
          <div className="loading-card">Loading live weather...</div>
        ) : (
          <>
            <div className="main-grid">
              <article className="card current-card">
                <div className="card-top">
                  <span className="card-label">CURRENT WEATHER</span>
                  <span className="status-pill"><span className="live-dot" /> LIVE</span>
                </div>
                <div className="temperature-row">
                  <div>
                    <div className="temperature">
                      {temperature(current?.temperature_2m)}°
                    </div>
                    <div className="condition">{condition.text}</div>
                    <div className="feels-like">
                      Feels like {temperature(current?.apparent_temperature)}°
                    </div>
                  </div>
                  <WeatherIcon className="current-icon" size={82} strokeWidth={1.4} />
                </div>
                <div className="weather-stats">
                  <div className="stat">
                    <Droplets size={19} />
                    <div><span>Humidity</span><strong>{current?.relative_humidity_2m ?? "--"}%</strong></div>
                  </div>
                  <div className="stat">
                    <Wind size={19} />
                    <div><span>Wind speed</span><strong>{current?.wind_speed_10m ?? "--"} km/h</strong></div>
                  </div>
                  <div className="stat">
                    <Eye size={19} />
                    <div><span>Precipitation</span><strong>{current?.precipitation ?? "--"} mm</strong></div>
                  </div>
                </div>
              </article>

              <article className="card clock-card">
                <span className="card-label">LOCAL TIME</span>
                <div className="clock-face"><Clock3 size={20} /> YOUR CLOCK</div>
                <div className="digital-time">{localTime}</div>
                <div className="clock-date"><CalendarDays size={17} /> {localDate}</div>
                <div className="clock-location"><MapPin size={15} /> {place.name} local time</div>
              </article>
            </div>

            <article className="card forecast-card">
              <div className="section-heading compact-heading">
                <div><span className="card-label">THE NEXT HOURS</span><h2>Hourly forecast</h2></div>
              </div>
              <div className="hourly-list">
                {hourly?.time
                  .map((timeValue, index) => ({ timeValue, index }))
                  .filter(({ timeValue }) => timeValue >= (current?.time || ""))
                  .slice(0, 8)
                  .map(({ timeValue, index }) => {
                    const info = weatherInfo(hourly.weather_code[index]);
                    const Icon = info.Icon;
                    return (
                      <div className="hour-item" key={timeValue}>
                        <span>{index === 0 ? "Now" : getHour(timeValue)}</span>
                        <Icon size={26} />
                        <strong>{temperature(hourly.temperature_2m[index])}°</strong>
                      </div>
                    );
                  })}
              </div>
            </article>

            <article className="card forecast-card">
              <div className="section-heading compact-heading">
                <div><span className="card-label">PLAN AHEAD</span><h2>7-day forecast</h2></div>
              </div>
              <div className="daily-list">
                {daily?.time.map((day, index) => {
                  const info = weatherInfo(daily.weather_code[index]);
                  const Icon = info.Icon;
                  return (
                    <div className="day-item" key={day}>
                      <span className="day-name">{index === 0 ? "Today" : getDay(day)}</span>
                      <div className="day-condition"><Icon size={22} /><span>{info.text}</span></div>
                      <div className="day-temperatures">
                        <strong>{temperature(daily.temperature_2m_max[index])}°</strong>
                        <span>{temperature(daily.temperature_2m_min[index])}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <div className="sun-grid">
              <article className="card sun-card">
                <Sunrise size={27} />
                <div><span>Sunrise</span><strong>{time(daily?.sunrise?.[0])}</strong></div>
              </article>
              <article className="card sun-card sunset">
                <Sunset size={27} />
                <div><span>Sunset</span><strong>{time(daily?.sunset?.[0])}</strong></div>
              </article>
            </div>
          </>
        )}
      </section>

      <footer className="footer">
        <a className="brand footer-brand" href="#home"><CloudSun size={21} /> AtmosTime</a>
        <span>Weather data by Open-Meteo</span>
        <span>Made for your everyday</span>
      </footer>
    </main>
  );
}
