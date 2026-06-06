const STORAGE_KEY = "cinema-vault-local-v1";
const seedMovies = window.seedMovies || [];

const statusLabels = {
  All: "All",
  Favorite: "Favorite",
  Watched: "Watched",
  "To Watch": "To Watch"
};

const sortLabels = {
  rating: "Highest rating",
  year: "Newest",
  runtime: "Longest runtime",
  title: "Title"
};

const genreLabels = {
  Action: "Action",
  Adventure: "Adventure",
  Animation: "Animation",
  Biography: "Biography",
  Comedy: "Comedy",
  Crime: "Crime",
  Drama: "Drama",
  Fantasy: "Fantasy",
  Horror: "Horror",
  Music: "Music",
  Musical: "Musical",
  Mystery: "Mystery",
  Noir: "Noir",
  Romance: "Romance",
  "Sci-Fi": "Sci-Fi",
  Thriller: "Thriller",
  War: "War"
};

const state = {
  movies: loadMovies(),
  query: "",
  genre: "All",
  status: "All",
  sort: "rating",
  selectedId: null
};

const app = document.querySelector("#app");

function loadMovies() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const seeded = seedMovies.map((movie, index) => ({ ...movie, id: `seed-${index}` }));
  if (!saved) return seeded;
  try {
    const custom = JSON.parse(saved);
    return [...seeded, ...custom];
  } catch {
    return seeded;
  }
}

function saveCustomMovies() {
  const custom = state.movies.filter((movie) => movie.id.startsWith("custom-"));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}

function posterData(movie) {
  const canvas = document.createElement("canvas");
  canvas.width = 520;
  canvas.height = 780;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 520, 780);
  grad.addColorStop(0, movie.colorA || "#263238");
  grad.addColorStop(1, movie.colorB || "#f2a65a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 520, 780);

  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 9; i += 1) {
    ctx.beginPath();
    ctx.arc(80 + i * 58, 160 + (i % 3) * 120, 90 + i * 4, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 7;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.fillRect(42, 52, 436, 676);
  ctx.fillStyle = "rgba(10,15,20,0.88)";
  ctx.fillRect(58, 68, 404, 644);

  ctx.fillStyle = movie.colorB || "#f2a65a";
  ctx.fillRect(58, 68, 404, 14);
  ctx.fillRect(58, 698, 404, 14);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 48px Arial";
  wrapText(ctx, movie.title.toUpperCase(), 88, 180, 350, 54, 4);
  ctx.font = "500 25px Arial";
  ctx.fillStyle = "rgba(248,250,252,0.78)";
  ctx.fillText(`${movie.year} / ${movie.director}`, 88, 510);
  ctx.font = "600 28px Arial";
  ctx.fillText(movie.genres.slice(0, 2).join(" + "), 88, 565);
  ctx.fillStyle = movie.colorB || "#f2a65a";
  ctx.font = "700 68px Arial";
  ctx.fillText(String(movie.rating.toFixed(1)), 88, 660);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(" ");
  let line = "";
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
      lines += 1;
      if (lines >= maxLines - 1) break;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}

function getFilteredMovies() {
  return state.movies
    .filter((movie) => {
      const genreText = movie.genres.map((genre) => `${genre} ${displayGenre(genre)}`).join(" ");
      const haystack = `${movie.title} ${movie.director} ${movie.country} ${genreText} ${movie.tags.join(" ")}`.toLowerCase();
      const matchesQuery = haystack.includes(state.query.toLowerCase());
      const matchesGenre = state.genre === "All" || movie.genres.includes(state.genre);
      const matchesStatus = state.status === "All" || movie.status === state.status;
      return matchesQuery && matchesGenre && matchesStatus;
    })
    .sort((a, b) => {
      if (state.sort === "year") return b.year - a.year;
      if (state.sort === "runtime") return b.runtime - a.runtime;
      if (state.sort === "title") return a.title.localeCompare(b.title);
      return b.rating - a.rating;
    });
}

function render() {
  const filtered = getFilteredMovies();
  const genres = ["All", ...new Set(state.movies.flatMap((movie) => movie.genres))].sort((a, b) => {
    if (a === "All") return -1;
    if (b === "All") return 1;
    return a.localeCompare(b);
  });
  const selected = filtered.find((movie) => movie.id === state.selectedId) || filtered[0];
  app.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">Local movie database</p>
        <h1>Cinema Vault</h1>
      </div>
      <button class="icon-button" id="openAdd" title="Add movie" aria-label="Add movie">+</button>
    </header>
    <main class="shell">
      <section class="controls">
        <label class="search">
          <span>Search</span>
          <input id="query" value="${escapeHtml(state.query)}" placeholder="Search title, director, genre, or tag" />
        </label>
        <label>
          <span>Genre</span>
          <select id="genre">${genres.map((genre) => `<option value="${genre}" ${genre === state.genre ? "selected" : ""}>${genre === "All" ? "All" : displayGenre(genre)}</option>`).join("")}</select>
        </label>
        <label>
          <span>Status</span>
          <select id="status">${["All", "Favorite", "Watched", "To Watch"].map((status) => `<option value="${status}" ${status === state.status ? "selected" : ""}>${statusLabels[status]}</option>`).join("")}</select>
        </label>
        <label>
          <span>Sort</span>
          <select id="sort">
            ${Object.entries(sortLabels).map(([value, label]) => `<option value="${value}" ${state.sort === value ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </label>
      </section>

      <section class="stats">
        ${stat("Saved movies", state.movies.length)}
        ${stat("Showing", filtered.length)}
        ${stat("Favorites", state.movies.filter((movie) => movie.status === "Favorite").length)}
        ${stat("Average rating", average(state.movies.map((movie) => movie.rating)).toFixed(1))}
      </section>

      <section class="workspace">
        <div class="grid" aria-label="Movie list">
          ${filtered.map(card).join("") || `<p class="empty">No movies match the current filters.</p>`}
        </div>
        ${selected ? detail(selected) : ""}
      </section>
    </main>

    <dialog id="movieDialog">
      <form method="dialog" id="movieForm">
        <div class="dialog-head">
          <h2>Add movie</h2>
          <button class="ghost" value="cancel" aria-label="Close">x</button>
        </div>
        <div class="form-grid">
          ${input("title", "Title", true)}
          ${input("year", "Year", true, "number", "2026")}
          ${input("director", "Director", true)}
          ${input("runtime", "Runtime", true, "number", "120")}
          ${input("rating", "Rating", true, "number", "8.0", "0.1")}
          ${input("country", "Country", true)}
          ${input("genres", "Genres", true, "text", "Drama, Sci-Fi")}
          ${input("cast", "Cast", false, "text", "Actor A, Actor B")}
          ${input("tags", "Tags", false, "text", "dreams, family")}
          <label>
            <span>Status</span>
            <select name="status">
              <option value="To Watch">To Watch</option>
              <option value="Watched">Watched</option>
              <option value="Favorite">Favorite</option>
            </select>
          </label>
          <label class="wide">
            <span>Logline</span>
            <textarea name="logline" required placeholder="Write a short logline"></textarea>
          </label>
        </div>
        <menu>
          <button class="ghost" value="cancel">Cancel</button>
          <button class="primary" value="default">Add movie</button>
        </menu>
      </form>
    </dialog>
  `;
  bind();
}

function stat(label, value) {
  return `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`;
}

function card(movie) {
  return `
    <article class="movie-card ${movie.id === state.selectedId ? "active" : ""}" data-id="${movie.id}">
      <img src="${posterData(movie)}" alt="${escapeHtml(movie.title)} poster" />
      <div>
        <h3>${escapeHtml(movie.title)}</h3>
        <p>${movie.year} / ${escapeHtml(movie.director)}</p>
        <div class="chips">${movie.genres.map((genre) => `<span>${escapeHtml(displayGenre(genre))}</span>`).join("")}</div>
      </div>
      <strong>${movie.rating.toFixed(1)}</strong>
    </article>
  `;
}

function detail(movie) {
  return `
    <aside class="detail">
      <img src="${posterData(movie)}" alt="${escapeHtml(movie.title)} poster large" />
      <div class="detail-body">
        <div class="title-row">
          <h2>${escapeHtml(movie.title)}</h2>
          <button class="status-button" data-status="${movie.id}" title="Change status">${statusLabels[movie.status] || escapeHtml(movie.status)}</button>
        </div>
        <p class="meta">${movie.year} / ${movie.runtime} min / ${escapeHtml(movie.country)}</p>
        <p class="logline">${escapeHtml(movie.logline)}</p>
        <dl>
          <dt>Director</dt><dd>${escapeHtml(movie.director)}</dd>
          <dt>Cast</dt><dd>${movie.cast.map(escapeHtml).join(", ")}</dd>
          <dt>Genres</dt><dd>${movie.genres.map((genre) => escapeHtml(displayGenre(genre))).join(", ")}</dd>
          <dt>Tags</dt><dd>${movie.tags.map((tag) => `#${escapeHtml(tag)}`).join(" ")}</dd>
        </dl>
        ${movie.id.startsWith("custom-") ? `<button class="danger" id="deleteMovie">Delete added movie</button>` : ""}
      </div>
    </aside>
  `;
}

function input(name, label, required, type = "text", placeholder = "", step = "") {
  return `<label><span>${label}</span><input name="${name}" type="${type}" ${required ? "required" : ""} placeholder="${placeholder}" ${step ? `step="${step}"` : ""} /></label>`;
}

function bind() {
  document.querySelector("#query").addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
    const queryInput = document.querySelector("#query");
    queryInput.focus();
    queryInput.setSelectionRange(queryInput.value.length, queryInput.value.length);
  });
  document.querySelector("#genre").addEventListener("change", (event) => {
    state.genre = event.target.value;
    render();
  });
  document.querySelector("#status").addEventListener("change", (event) => {
    state.status = event.target.value;
    render();
  });
  document.querySelector("#sort").addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });
  document.querySelectorAll(".movie-card").forEach((cardEl) => {
    cardEl.addEventListener("click", () => {
      state.selectedId = cardEl.dataset.id;
      render();
    });
  });
  document.querySelector("#openAdd").addEventListener("click", () => {
    document.querySelector("#movieDialog").showModal();
  });
  document.querySelector("#movieForm").addEventListener("submit", addMovie);
  document.querySelector(".status-button")?.addEventListener("click", cycleStatus);
  document.querySelector("#deleteMovie")?.addEventListener("click", deleteMovie);
}

function addMovie(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const movie = {
    id: `custom-${Date.now()}`,
    title: String(form.get("title")).trim(),
    year: Number(form.get("year")),
    director: String(form.get("director")).trim(),
    runtime: Number(form.get("runtime")),
    rating: Number(form.get("rating")),
    country: String(form.get("country")).trim(),
    status: String(form.get("status")),
    genres: splitList(form.get("genres")),
    cast: splitList(form.get("cast")),
    tags: splitList(form.get("tags")),
    logline: String(form.get("logline")).trim(),
    colorA: randomColor(),
    colorB: randomColor()
  };
  state.movies.push(movie);
  state.selectedId = movie.id;
  saveCustomMovies();
  document.querySelector("#movieDialog").close();
  render();
}

function cycleStatus(event) {
  const movie = state.movies.find((item) => item.id === event.currentTarget.dataset.status);
  const statuses = ["To Watch", "Watched", "Favorite"];
  movie.status = statuses[(statuses.indexOf(movie.status) + 1) % statuses.length];
  saveCustomMovies();
  render();
}

function deleteMovie() {
  state.movies = state.movies.filter((movie) => movie.id !== state.selectedId);
  state.selectedId = null;
  saveCustomMovies();
  render();
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function displayGenre(genre) {
  return genreLabels[genre] || genre;
}

function randomColor() {
  const colors = ["#0f766e", "#be123c", "#4338ca", "#b45309", "#155e75", "#7c2d12", "#4d7c0f", "#7e22ce"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

render();
