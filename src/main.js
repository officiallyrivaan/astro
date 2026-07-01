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

function renderShell(selectedDate) {
  app.innerHTML = `
    <div class="page">
      <header class="topbar">
        <span class="brand">today in space<span class="dot">.</span></span>
        <input type="date" id="datepicker" class="datepicker"
          value="${selectedDate}" max="${todayISO()}" min="1995-06-16" />
      </header>
      <main id="content" class="content"></main>
      <footer class="footer">data from nasa apod api</footer>
    </div>
  `;

  document.querySelector("#datepicker").addEventListener("change", (e) => {
    loadApod(e.target.value);
  });
}

function renderLoading() {
  const content = document.querySelector("#content");
  if (!content) return;
  content.innerHTML = `
    <div class="state-loading">
      <div class="orbit"><div class="planet"></div></div>
      <p>fetching today's sky...</p>
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
  renderLoading();

  if (!API_KEY) {
    renderError("missing VITE_NASA_API_KEY — check your .env file and restart the dev server.");
    return;
  }

  fetch(`${APOD_URL}?api_key=${API_KEY}&date=${date}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`api responded with ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        throw new Error(data.error.message || "unknown api error");
      }
      renderApod(data);
    })
    .catch((err) => {
      renderError(err.message);
    });
}

const initialDate = todayISO();
renderShell(initialDate);
loadApod(initialDate);
