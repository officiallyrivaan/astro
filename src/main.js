import './style.css';

const API_KEY = import.meta.env.VITE_NASA_API_KEY;
const APOD_URL = "https://api.nasa.gov/planetary/apod";

const app = document.querySelector("#app");

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function randomDate() {
  const start = new Date("1995-06-16").getTime();
  const end = new Date().getTime();
  const random = new Date(start + Math.random() * (end - start));
  return random.toISOString().split("T")[0];
}

function renderShell(selectedDate) {
  const now = new Date();
  const issueLabel = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  app.innerHTML = `
    <div class="page">
      <header class="masthead">
        <div class="masthead-top">
          <span class="issue-info">nasa apod — daily edition</span>
          <span class="issue-info">${issueLabel}</span>
        </div>
        <span class="brand">today in space<span class="dot">.</span></span>
        <div class="topbar">
          <span class="issue-info">astronomy picture of the day</span>
          <div class="controls">
            <button id="randombtn" class="random-btn">random day</button>
            <input type="date" id="datepicker" class="datepicker"
              value="${selectedDate}" max="${todayISO()}" min="1995-06-16" />
          </div>
        </div>
      </header>
      <main id="content"></main>
      <footer class="footer">
        <span>data — nasa apod api</span>
        <span>est. 1995</span>
      </footer>
    </div>
  `;

  document.querySelector("#datepicker").addEventListener("change", (e) => {
    loadApod(e.target.value);
  });

  document.querySelector("#randombtn").addEventListener("click", () => {
    const date = randomDate();
    document.querySelector("#datepicker").value = date;
    loadApod(date);
  });
}

function renderLoading(date) {
  const content = document.querySelector("#content");
  if (!content) return;
  const isToday = date === todayISO();
  const label = isToday ? "today's sky" : formatDate(date);
  content.innerHTML = `
    <div class="state-loading">
      <div class="loading-bar-wrap"><div class="loading-bar"></div></div>
      <p>fetching ${label}...</p>
    </div>
  `;
}

function renderError(message) {
  const content = document.querySelector("#content");
  if (!content) return;
  content.innerHTML = `
    <div class="state-error">
      <p class="error-title">something broke</p>
      <p class="error-message">${message}</p>
    </div>
  `;
}

function getYoutubeEmbed(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function renderApod(data) {
  const content = document.querySelector("#content");
  if (!content) return;

  let media;
  const ytEmbed = data.media_type === "video" ? getYoutubeEmbed(data.url) : null;

  if (data.media_type === "image") {
    const src = data.hdurl || data.url;
    media = `<img class="media" src="${src}" alt="${data.title}" loading="lazy" />`;
  } else if (ytEmbed) {
    media = `<iframe class="media media-frame" src="${ytEmbed}" title="${data.title}" allowfullscreen></iframe>`;
  } else {
    media = `<video class="media" src="${data.url}" controls></video>`;
  }

  content.innerHTML = `
    <article class="card">
      <div class="media-wrap">${media}</div>
      <div class="info">
        <p class="date">${formatDate(data.date)}</p>
        <h1>${data.title}</h1>
        <p class="explanation">${data.explanation}</p>
        ${data.copyright ? `<p class="copyright">&copy; ${data.copyright.trim()}</p>` : ""}
      </div>
    </article>
  `;
}

function loadApod(date) {
  renderLoading(date);

  if (!API_KEY) {
    renderError("missing VITE_NASA_API_KEY — check your .env file and restart the dev server.");
    return;
  }

  fetch(`${APOD_URL}?api_key=${API_KEY}&date=${date}`)
    .then((response) => {
      if (!response.ok) throw new Error(`api responded with ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (data.error) throw new Error(data.error.message || "unknown api error");
      renderApod(data);
    })
    .catch((err) => {
      renderError(err.message);
    });
}

const initialDate = todayISO();
renderShell(initialDate);
loadApod(initialDate);
