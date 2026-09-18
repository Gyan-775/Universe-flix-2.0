/*
 * Universe-flix frontend application layer.
 * Movie data belongs to the backend. This file owns state, services, and UI behavior.
 */

"use strict";

const APP_CONFIG = Object.freeze({
  API_BASE_URL: window.APP_CONFIG?.API_BASE_URL || "/api",
  USE_DEMO_API: window.APP_CONFIG?.USE_DEMO_API === true,
  SEARCH_DEBOUNCE_MS: 350,
  REQUEST_TIMEOUT_MS: 10000
});

const state = {
  movies: [],
  universes: [],
  filteredMovies: [],
  selectedUniverse: null,
  selectedGenre: "all",
  selectedYear: null,
  searchQuery: "",
  recommendations: [],
  tasteProfile: storageGet("universeflix_taste", null),
  currentMovie: null,
  watchOrder: [],
  favorites: storageGet("universeflix_favorites", []),
  watchHistory: storageGet("universeflix_history", []),
  loading: false,
  error: null,
  quizStep: 0,
  quizAnswers: {}
};

const apiCache = new Map();
const inFlightRequests = new Map();
const detailCache = new Map();
const $ = (id) => document.getElementById(id);

const els = {
  body: document.body,
  navbar: $("navbar"),
  search: $("search"),
  clearSearch: $("clear-search"),
  heroMovieCount: $("hero-movie-count"),
  browseBtn: $("browse-btn"),
  recommendationGrid: $("recommendation-grid"),
  recommendationEmpty: $("recommendation-empty"),
  tasteSummary: $("taste-summary"),
  retakeQuizBtn: $("retake-quiz-btn"),
  universeGrid: $("universe-grid"),
  catalogCount: $("catalog-count"),
  noResults: $("no-results"),
  catalogLoading: $("catalog-loading"),
  movieTemplate: $("movie-card-template"),
  movieModal: $("movie-modal"),
  movieModalPoster: $("movie-modal-poster"),
  movieModalPosterFallback: $("movie-modal-poster-fallback"),
  movieModalUniverse: $("movie-modal-universe"),
  movieModalTitle: $("movie-modal-title"),
  movieModalMeta: $("movie-modal-meta"),
  movieModalRatings: $("movie-modal-ratings"),
  movieModalGenres: $("movie-modal-genres"),
  movieModalOverview: $("movie-modal-overview"),
  movieImdbLink: $("movie-imdb-link"),
  movieTrailerBtn: $("movie-trailer-btn"),
  watchOrderBtn: $("watch-order-btn"),
  watchOrderModal: $("watch-order-modal"),
  watchOrderTitle: $("watch-order-title"),
  watchOrderSubtitle: $("watch-order-subtitle"),
  watchOrderList: $("watch-order-list"),
  quizModal: $("quiz-modal"),
  quizForm: $("taste-quiz-form"),
  quizQuestionTitle: $("quiz-question-title"),
  quizOptions: $("quiz-options"),
  quizProgressText: $("quiz-progress-text"),
  quizProgressBar: $("quiz-progress-bar"),
  quizBack: $("quiz-back"),
  quizNext: $("quiz-next"),
  quizSkip: $("quiz-skip"),
  toast: $("toast")
};

/* ----------------------------- Storage ----------------------------- */

function storageGet(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    showToast("Local storage is unavailable.", "warning");
  }
}

/* -------------------------- API and data --------------------------- */

function normalizeMovie(raw = {}) {
  const releaseDate = raw.releaseDate || raw.release_date || null;
  const universe = typeof raw.universe === "object" ? raw.universe : null;
  const directors = Array.isArray(raw.directors) ? raw.directors : raw.director ? [raw.director] : [];
  return {
    id: raw.id ?? raw.tmdbId ?? raw.tmdb_id ?? raw.imdbId ?? null,
    imdbId: raw.imdbId ?? raw.imdb_id ?? null,
    tmdbId: raw.tmdbId ?? raw.tmdb_id ?? null,
    title: raw.title || raw.name || "Untitled movie",
    originalTitle: raw.originalTitle || raw.original_title || raw.title || "",
    year: raw.year ?? (releaseDate ? Number.parseInt(releaseDate.slice(0, 4), 10) : null),
    releaseDate,
    universe: universe?.name || raw.universeName || raw.franchise || "",
    universeId: universe?.id || raw.universeId || raw.franchiseId || null,
    genres: Array.isArray(raw.genres) ? raw.genres.map((genre) => typeof genre === "string" ? genre : genre.name).filter(Boolean) : [],
    overview: raw.overview || "",
    runtime: raw.runtime ?? null,
    imdbRating: raw.imdbRating ?? raw.imdb_rating ?? null,
    tmdbRating: raw.tmdbRating ?? raw.tmdb_rating ?? raw.vote_average ?? null,
    voteCount: raw.voteCount ?? raw.vote_count ?? null,
    posterPath: raw.posterPath ?? raw.poster_path ?? null,
    backdropPath: raw.backdropPath ?? raw.backdrop_path ?? null,
    trailerKey: raw.trailerKey ?? raw.trailer_key ?? null,
    trailerUrl: raw.trailerUrl ?? raw.trailer_url ?? null,
    cast: Array.isArray(raw.cast) ? raw.cast : [],
    directors,
    prerequisites: Array.isArray(raw.prerequisites) ? raw.prerequisites : [],
    recommendedBefore: Array.isArray(raw.recommendedBefore) ? raw.recommendedBefore : [],
    popularity: raw.popularity ?? null,
    metadataLoaded: raw.metadataLoaded === true,
    source: raw.source || { tmdb: Boolean(raw.tmdbId || raw.tmdb_id), omdb: false }
  };
}

function getMediaUrl(path) {
  if (!path) return null;
  return /^https?:\/\//i.test(path) ? path : `${APP_CONFIG.API_BASE_URL}/images/${String(path).replace(/^\//, "")}`;
}

async function request(path, options = {}) {
  const url = `${APP_CONFIG.API_BASE_URL}${path}`;
  const key = `${options.method || "GET"}:${url}:${options.body || ""}`;
  if (apiCache.has(key)) return apiCache.get(key);
  if (inFlightRequests.has(key)) return inFlightRequests.get(key);
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), APP_CONFIG.REQUEST_TIMEOUT_MS);
  const promise = fetch(url, {
    ...options,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...(options.headers || {}) },
    signal: controller.signal
  }).then(async (response) => {
    if (!response.ok) {
      const error = new Error(`API request failed with ${response.status}`);
      error.status = response.status;
      throw error;
    }
    const data = await response.json();
    apiCache.set(key, data);
    return data;
  }).finally(() => {
    window.clearTimeout(timer);
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, promise);
  return promise;
}

const movieService = {
  async getCatalog() {
    if (APP_CONFIG.USE_DEMO_API) return { movies: [], universes: [] };
    const data = await request("/catalog");
    return { movies: (data.movies || data.results || []).map(normalizeMovie), universes: Array.isArray(data.universes) ? data.universes : [] };
  },
  async getMovie(id) {
    if (detailCache.has(id)) return detailCache.get(id);
    const movie = normalizeMovie(await request(`/movies/${encodeURIComponent(id)}`));
    detailCache.set(id, movie);
    return movie;
  },
  async search(query) {
    if (!query.trim() || APP_CONFIG.USE_DEMO_API) return [];
    const data = await request(`/search?q=${encodeURIComponent(query.trim())}`);
    return (data.results || data.movies || []).map(normalizeMovie);
  }
};

/* ----------------------- Pure business logic ----------------------- */

function movieSearchText(movie) {
  return [movie.title, movie.originalTitle, movie.universe, ...movie.genres, ...movie.cast.map((person) => person.name || person), ...movie.directors.map((person) => person.name || person)].join(" ").toLowerCase();
}

function filterMovies(movies, filters = state) {
  const query = filters.searchQuery.trim().toLowerCase();
  return movies.filter((movie) => {
    const matchesQuery = !query || movieSearchText(movie).includes(query);
    const matchesGenre = filters.selectedGenre === "all" || movie.genres.some((genre) => genre.toLowerCase() === filters.selectedGenre.toLowerCase());
    const matchesUniverse = !filters.selectedUniverse || movie.universeId === filters.selectedUniverse || movie.universe.toLowerCase() === String(filters.selectedUniverse).toLowerCase();
    const matchesYear = !filters.selectedYear || movie.year === Number(filters.selectedYear);
    return matchesQuery && matchesGenre && matchesUniverse && matchesYear;
  });
}

const recommendationWeights = Object.freeze({ genre: 30, universe: 10, rating: 10, runtime: 5, novelty: 10, popularity: 5 });

function scoreMovie(movie, profile = state.tasteProfile) {
  if (!profile) return 0;
  const likedGenres = Array.isArray(profile.genres) ? profile.genres : [];
  const genreMatches = movie.genres.filter((genre) => likedGenres.includes(genre.toLowerCase())).length;
  const genreScore = likedGenres.length ? Math.min(1, genreMatches / likedGenres.length) : 0;
  const universeScore = profile.universe && movie.universe.toLowerCase() === profile.universe.toLowerCase() ? 1 : 0;
  const rating = Number(movie.tmdbRating || movie.imdbRating || 0);
  const ratingScore = rating ? Math.min(1, rating / 10) : 0;
  const runtimeScore = !profile.runtime || !movie.runtime ? 0.5 : Math.max(0, 1 - Math.abs(movie.runtime - profile.runtime) / 120);
  const noveltyScore = state.watchHistory.includes(movie.id) ? 0 : 1;
  return genreScore * recommendationWeights.genre + universeScore * recommendationWeights.universe + ratingScore * recommendationWeights.rating + runtimeScore * recommendationWeights.runtime + noveltyScore * recommendationWeights.novelty + Math.min(1, Number(movie.popularity || 0) / 100) * recommendationWeights.popularity;
}

function getRecommendations() {
  if (!state.tasteProfile) return [];
  return state.movies.map((movie) => ({ movie, score: scoreMovie(movie) })).sort((a, b) => b.score - a.score).slice(0, 12);
}

function buildWatchOrder(target, mode = "essential") {
  const byId = new Map(state.movies.map((movie) => [String(movie.id), movie]));
  const result = [];
  const visiting = new Set();
  const visited = new Set();
  const visit = (id) => {
    const key = String(typeof id === "object" ? id.id : id);
    if (visited.has(key)) return;
    if (visiting.has(key)) { console.warn("Watch-order relationship cycle detected", key); return; }
    const movie = byId.get(key);
    if (!movie) return;
    visiting.add(key);
    const links = mode === "essential" ? movie.prerequisites : [...movie.prerequisites, ...movie.recommendedBefore];
    links.forEach(visit);
    visiting.delete(key);
    visited.add(key);
    result.push(movie);
  };
  if (mode === "release") return state.movies.filter((movie) => !target.universeId || movie.universeId === target.universeId).sort((a, b) => String(a.releaseDate || "").localeCompare(String(b.releaseDate || "")));
  visit(target.id);
  return result;
}

/* ----------------------------- Rendering ---------------------------- */

function safeText(value, fallback = "") { return value === null || value === undefined || value === "" ? fallback : String(value); }

function createMovieCard(movie, matchScore = null) {
  if (!els.movieTemplate) return null;
  const card = els.movieTemplate.content.cloneNode(true).firstElementChild;
  card.dataset.movieId = movie.id || "";
  card.querySelector(".movie-title").textContent = safeText(movie.title, "Untitled movie");
  card.querySelector(".movie-meta").textContent = [movie.year, movie.universe, movie.runtime ? `${movie.runtime} min` : ""].filter(Boolean).join(" · ") || "Metadata pending";
  const poster = card.querySelector(".movie-poster");
  const fallback = card.querySelector(".poster-fallback");
  const posterUrl = getMediaUrl(movie.posterPath);
  poster.alt = movie.title;
  poster.loading = "lazy";
  poster.hidden = !posterUrl;
  fallback.hidden = Boolean(posterUrl);
  if (posterUrl) { poster.src = posterUrl; poster.addEventListener("error", () => { poster.hidden = true; fallback.hidden = false; }, { once: true }); }
  const tags = card.querySelector(".movie-tags");
  tags.replaceChildren(...movie.genres.slice(0, 3).map((genre) => { const tag = document.createElement("span"); tag.textContent = genre; return tag; }));
  card.querySelector(".movie-rating").textContent = movie.tmdbRating ? `TMDB ${Number(movie.tmdbRating).toFixed(1)}` : "Rating unavailable";
  const match = card.querySelector(".movie-match");
  if (matchScore !== null) { match.hidden = false; match.textContent = `${Math.round(matchScore)}% match`; }
  return card;
}

function renderMovieGrid(movies, container, scores = new Map()) {
  if (!container) return;
  container.replaceChildren(...movies.map((movie) => createMovieCard(movie, scores.get(movie.id) ?? null)).filter(Boolean));
}

function renderCatalog() {
  state.filteredMovies = filterMovies(state.movies);
  renderMovieGrid(state.filteredMovies, els.universeGrid);
  if (els.catalogCount) els.catalogCount.textContent = `${state.filteredMovies.length} ${state.filteredMovies.length === 1 ? "story" : "stories"}`;
  if (els.heroMovieCount) els.heroMovieCount.textContent = state.movies.length ? `${state.movies.length}` : "0";
  if (els.noResults) els.noResults.hidden = state.filteredMovies.length !== 0 || state.loading;
}

function renderRecommendations() {
  const ranked = getRecommendations();
  state.recommendations = ranked.map(({ movie }) => movie);
  if (!state.tasteProfile || !ranked.length) { els.recommendationEmpty?.removeAttribute("hidden"); return; }
  els.recommendationEmpty?.setAttribute("hidden", "hidden");
  const scores = new Map(ranked.map(({ movie, score }) => [movie.id, Math.min(99, Math.max(1, score))]));
  renderMovieGrid(state.recommendations, els.recommendationGrid, scores);
  if (els.tasteSummary) els.tasteSummary.textContent = "Matched from your taste profile and the metadata available in the archive.";
}

function renderDetails(movie) {
  const posterUrl = getMediaUrl(movie.posterPath);
  els.movieModalPoster.src = posterUrl || "";
  els.movieModalPoster.alt = movie.title;
  els.movieModalPoster.hidden = !posterUrl;
  els.movieModalPosterFallback.hidden = Boolean(posterUrl);
  els.movieModalUniverse.textContent = movie.universe || "Universe pending";
  els.movieModalTitle.textContent = movie.title;
  els.movieModalMeta.textContent = [movie.year, movie.runtime ? `${movie.runtime} min` : ""].filter(Boolean).join(" · ") || "Release metadata unavailable";
  els.movieModalRatings.replaceChildren(...[["TMDB", movie.tmdbRating], ["IMDb", movie.imdbRating]].filter(([, value]) => value !== null && value !== undefined).map(([label, value]) => { const item = document.createElement("span"); item.textContent = `${label} ${value}`; return item; }));
  els.movieModalGenres.replaceChildren(...movie.genres.map((genre) => { const tag = document.createElement("span"); tag.textContent = genre; return tag; }));
  els.movieModalOverview.textContent = movie.overview || "Overview unavailable from the data provider.";
  els.movieImdbLink.href = movie.imdbId ? `https://www.imdb.com/title/${encodeURIComponent(movie.imdbId)}/` : "#";
  els.movieImdbLink.hidden = !movie.imdbId;
  els.movieTrailerBtn.hidden = !(movie.trailerUrl || movie.trailerKey);
}

function openDialog(dialog) { if (dialog?.showModal && !dialog.open) dialog.showModal(); }
function closeDialog(dialog) { if (dialog?.open) dialog.close(); }

/* ------------------------- Quiz and storage ------------------------- */

const quizQuestions = [
  { id: "genres", title: "What genres pull you in?", type: "multi", options: ["action", "adventure", "animation", "comedy", "drama", "fantasy", "horror", "sci-fi", "thriller"] },
  { id: "pace", title: "How should the movie feel?", type: "single", options: ["fast", "balanced", "slow"] },
  { id: "runtime", title: "What runtime feels right?", type: "single", options: ["short", "standard", "long"] },
  { id: "franchise", title: "How deep should the rabbit hole go?", type: "single", options: ["standalone", "either", "franchise"] },
  { id: "era", title: "Do you have a release-era preference?", type: "single", options: ["classic", "modern", "any"] }
];

function renderQuizQuestion() {
  const question = quizQuestions[state.quizStep];
  if (!question) return;
  els.quizQuestionTitle.textContent = question.title;
  els.quizProgressText.textContent = `Question ${state.quizStep + 1} of ${quizQuestions.length}`;
  els.quizProgressBar.style.width = `${((state.quizStep + 1) / quizQuestions.length) * 100}%`;
  els.quizBack.disabled = state.quizStep === 0;
  els.quizNext.textContent = state.quizStep === quizQuestions.length - 1 ? "Save profile" : "Next";
  els.quizOptions.replaceChildren(...question.options.map((option) => {
    const label = document.createElement("label");
    label.className = "quiz-option";
    const input = document.createElement("input");
    input.type = question.type === "multi" ? "checkbox" : "radio";
    input.name = question.id;
    input.value = option;
    input.checked = question.type === "multi" ? (state.quizAnswers[question.id] || []).includes(option) : state.quizAnswers[question.id] === option;
    const text = document.createElement("span");
    text.textContent = option;
    label.append(input, text);
    return label;
  }));
}

function saveQuizAnswer() {
  const question = quizQuestions[state.quizStep];
  const selected = [...els.quizOptions.querySelectorAll("input:checked")].map((input) => input.value);
  state.quizAnswers[question.id] = question.type === "multi" ? selected : selected[0] || null;
}

function finishQuiz() {
  const genres = Array.isArray(state.quizAnswers.genres) ? state.quizAnswers.genres : [];
  state.tasteProfile = { ...state.quizAnswers, genres, runtime: state.quizAnswers.runtime === "short" ? 90 : state.quizAnswers.runtime === "long" ? 150 : 120 };
  storageSet("universeflix_taste", state.tasteProfile);
  renderRecommendations();
  closeDialog(els.quizModal);
  showToast("Taste profile saved.", "success");
}

/* -------------------------- Event handlers ------------------------- */

function debounce(callback, delay) {
  let timer;
  return (...args) => { window.clearTimeout(timer); timer = window.setTimeout(() => callback(...args), delay); };
}

function toggleFavorite(movieId) {
  state.favorites = state.favorites.includes(movieId) ? state.favorites.filter((id) => id !== movieId) : [...state.favorites, movieId];
  storageSet("universeflix_favorites", state.favorites);
}

function markWatched(movieId) {
  if (!state.watchHistory.includes(movieId)) state.watchHistory.push(movieId);
  storageSet("universeflix_history", state.watchHistory);
}

async function showMovie(movieId) {
  const existing = state.movies.find((movie) => String(movie.id) === String(movieId));
  if (!existing) return;
  state.currentMovie = existing;
  renderDetails(existing);
  openDialog(els.movieModal);
  try {
    const complete = await movieService.getMovie(movieId);
    state.currentMovie = complete;
    state.movies = state.movies.map((movie) => String(movie.id) === String(movieId) ? complete : movie);
    renderDetails(complete);
  } catch (error) {
    showToast("Full movie details are temporarily unavailable.", "warning");
  }
}

function attachEvents() {
  const filterButtons = [...document.querySelectorAll(".filter-btn")];
  filterButtons.forEach((button) => button.addEventListener("click", () => {
    state.selectedGenre = button.dataset.filter || "all";
    filterButtons.forEach((item) => { const active = item === button; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active)); });
    renderCatalog();
  }));
  const search = debounce(async () => {
    state.searchQuery = els.search.value;
    els.clearSearch.hidden = !state.searchQuery;
    renderCatalog();
    if (state.searchQuery.length >= 3) {
      try {
        const remoteMovies = await movieService.search(state.searchQuery);
        state.movies = [...new Map([...state.movies, ...remoteMovies].map((movie) => [movie.id, movie])).values()];
        renderCatalog();
      } catch (error) { showToast("Search service is unavailable.", "warning"); }
    }
  }, APP_CONFIG.SEARCH_DEBOUNCE_MS);
  els.search?.addEventListener("input", search);
  els.clearSearch?.addEventListener("click", () => { els.search.value = ""; state.searchQuery = ""; els.clearSearch.hidden = true; renderCatalog(); els.search.focus(); });
  els.browseBtn?.addEventListener("click", () => $("catalog")?.scrollIntoView({ behavior: "smooth" }));
  ["open-quiz-btn", "hero-quiz-btn", "empty-quiz-btn", "retake-quiz-btn"].forEach((id) => $(id)?.addEventListener("click", () => { state.quizStep = 0; state.quizAnswers = {}; renderQuizQuestion(); openDialog(els.quizModal); }));
  els.quizForm?.addEventListener("submit", (event) => { event.preventDefault(); saveQuizAnswer(); if (state.quizStep === quizQuestions.length - 1) finishQuiz(); else { state.quizStep += 1; renderQuizQuestion(); } });
  els.quizBack?.addEventListener("click", () => { saveQuizAnswer(); state.quizStep = Math.max(0, state.quizStep - 1); renderQuizQuestion(); });
  els.quizSkip?.addEventListener("click", () => { if (state.quizStep === quizQuestions.length - 1) finishQuiz(); else { state.quizStep += 1; renderQuizQuestion(); } });
  document.addEventListener("click", (event) => {
    const close = event.target.closest("[data-close-modal]");
    if (close) closeDialog($(close.dataset.closeModal));
    const card = event.target.closest(".movie-card");
    if (card && !event.target.closest("button")) showMovie(card.dataset.movieId);
    if (event.target.closest(".details-btn")) showMovie(event.target.closest(".movie-card")?.dataset.movieId);
  });
  els.movieTrailerBtn?.addEventListener("click", () => { const movie = state.currentMovie; const url = movie?.trailerUrl || (movie?.trailerKey ? `https://www.youtube.com/watch?v=${encodeURIComponent(movie.trailerKey)}` : null); if (url) window.open(url, "_blank", "noopener,noreferrer"); });
  els.watchOrderBtn?.addEventListener("click", () => { if (!state.currentMovie) return; state.watchOrder = buildWatchOrder(state.currentMovie); renderWatchOrder(); openDialog(els.watchOrderModal); });
  document.querySelectorAll(".order-mode-btn").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll(".order-mode-btn").forEach((item) => { const active = item === button; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active)); }); state.watchOrder = buildWatchOrder(state.currentMovie, button.dataset.orderMode); renderWatchOrder(); }));
}

function renderWatchOrder() {
  els.watchOrderTitle.textContent = state.currentMovie ? `Before ${state.currentMovie.title}` : "Your watch order";
  els.watchOrderSubtitle.textContent = state.watchOrder.length ? "Relationships supplied by the archive database." : "No verified watch-order relationships are available yet.";
  els.watchOrderList.replaceChildren(...state.watchOrder.map((movie) => { const item = document.createElement("li"); item.textContent = [movie.title, movie.year].filter(Boolean).join(" · "); return item; }));
}

/* --------------------------- Cinematic UI -------------------------- */

function showToast(message, type = "info") {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.dataset.type = type;
  els.toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => { els.toast.hidden = true; }, 4200);
}

function initAnimations() {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("is-visible"); }), { threshold: 0.12 });
    document.querySelectorAll(".reveal-up").forEach((element) => observer.observe(element));
    document.addEventListener("mousemove", (event) => { document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`); document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`); });
  }
  let lastScroll = 0;
  window.addEventListener("scroll", () => { const current = window.scrollY; els.navbar?.classList.toggle("hide", current > lastScroll && current > 100); lastScroll = current; }, { passive: true });
}

function initParticleBackground() {
  const canvas = $("bg-canvas");
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let width = 0; let height = 0; let particles = []; let frame = 0; let running = !reduced;
  const resize = () => { const ratio = Math.min(window.devicePixelRatio || 1, 2); width = window.innerWidth; height = window.innerHeight; canvas.width = width * ratio; canvas.height = height * ratio; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; context.setTransform(ratio, 0, 0, ratio, 0, 0); const count = Math.max(40, Math.min(100, Math.round(width * height / 18000))); particles = Array.from({ length: count }, () => ({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18, size: Math.random() * 1.6 + 0.4 })); };
  const draw = () => { if (!running) return; context.clearRect(0, 0, width, height); particles.forEach((particle, index) => { particle.x += particle.vx; particle.y += particle.vy; if (particle.x < 0 || particle.x > width) particle.vx *= -1; if (particle.y < 0 || particle.y > height) particle.vy *= -1; context.fillStyle = "rgba(130,160,255,.65)"; context.fillRect(particle.x, particle.y, particle.size, particle.size); for (let next = index + 1; next < particles.length; next += 1) { const other = particles[next]; const distance = Math.hypot(particle.x - other.x, particle.y - other.y); if (distance < 130) { context.strokeStyle = `rgba(100,140,255,${0.15 * (1 - distance / 130)})`; context.beginPath(); context.moveTo(particle.x, particle.y); context.lineTo(other.x, other.y); context.stroke(); } } }); frame = requestAnimationFrame(draw); };
  resize(); window.addEventListener("resize", resize, { passive: true }); document.addEventListener("visibilitychange", () => { running = !document.hidden && !reduced; if (running && !frame) draw(); if (!running && frame) { cancelAnimationFrame(frame); frame = 0; } }); if (running) draw();
}

/* --------------------------- App bootstrap ------------------------- */

async function initializeApp() {
  state.loading = true;
  els.catalogLoading?.removeAttribute("hidden");
  initAnimations();
  initParticleBackground();
  attachEvents();
  renderQuizQuestion();
  try {
    const catalog = await movieService.getCatalog();
    state.movies = catalog.movies;
    state.universes = catalog.universes;
    state.error = null;
  } catch (error) {
    state.error = error;
    state.movies = [];
    showToast("The archive is offline. Connect the backend to load movies.", "error");
  } finally {
    state.loading = false;
    els.catalogLoading?.setAttribute("hidden", "hidden");
    renderCatalog();
    renderRecommendations();
  }
}

window.UniverseFlix = Object.freeze({ state, movieService, normalizeMovie, filterMovies, scoreMovie, buildWatchOrder, toggleFavorite, markWatched });
initializeApp();
