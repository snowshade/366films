let movies = [];
let originalMovies = [];

async function loadMovies() {
	const res = await fetch("data/movies.json");
	movies = await res.json();
	originalMovies = [...movies]; // copy for restoring

	const container = document.getElementById("movies");
	const genreFilter = document.getElementById("filter-genre");
	const directorFilter = document.getElementById("filter-director");
	const yearFilter = document.getElementById("filter-year");
	const lengthFilter = document.getElementById("filter-length");
	const ratingFilter = document.getElementById("filter-rating");
	const sortSelect = document.getElementById("sort");

	const genres = [...new Set(movies.flatMap(m => m.genre))].sort();
	const directors = [...new Set(movies.flatMap(m => m.director))].sort();
	const years = [...new Set(movies.map(m => m.year))].sort();
	const lengthOptions = [
		{ label: "All Lengths", value: "" },
		{ label: "≈1h", value: "1" },
		{ label: "≈1.5h", value: "1.5" },
		{ label: "≈2h", value: "2" },
		{ label: "≈2.5h", value: "2.5" },
		{ label: "3h+", value: "3" }
	];

	genreFilter.innerHTML = `<option value="">All Genres</option>` + genres.map(g => `<option value="${g}">${g}</option>`).join("");
	directorFilter.innerHTML = `<option value="">All Directors</option>` + directors.map(d => `<option value="${d}">${d}</option>`).join("");
	yearFilter.innerHTML = `<option value="">All Years</option>` + years.map(y => `<option value="${y}">${y}</option>`).join("");
	lengthFilter.innerHTML = lengthOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("");

	// const posters = [
	// 	"posters-mini/sep-mini-01.png",
	// 	"posters-mini/sep-mini-02.png"
	// ];

	// const randomIndex = Math.floor(Math.random() * posters.length);
	// document.getElementById("randomPoster").src = posters[randomIndex];

	// render
	function render(list) {
		container.innerHTML = list.map(m => {
			let star = "";
			if (m.rating === 2) star = `<span class="star favorite">★</span> `;
			else if (m.rating === 1) star = `<span class="star good">☆</span> `;

			return `
			<div class="movie">
				<div class="movie-info">
					<p style="flex: 1; font-weight: bold; text-transform: uppercase; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${m.title}</p>
					<p style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${m.director.join(", ")}</p>
				</div>
				<div class="movie-info">
					<p style="text-align:left;">${m.year} ${star}</p>
					<p style="flex: 1; text-align:center;">${m.genre.join("  •  ")}</p>
					<p style="text-align:right;">${m.length}m</p>
				</div>
				<div class="movie-video-container" data-clip="${m.clip}">
					<img class="thumb" src="${m.thumb}" alt="${m.title}">
				</div>
				<div style="margin-top: 16px">
					<div class="movie-info">
						<p style="text-align:justify; color: var(--text-secondary-color);">${m.synopsis}</p>
					</div>
				</div>
			</div>
			</div>
		`;
		}).join("");

		const movies = document.querySelectorAll(".movie");
		let resetTimer = null;

		movies.forEach(movie => {
			movie.addEventListener("mouseenter", () => {
				if (resetTimer) {
					clearTimeout(resetTimer);
					resetTimer = null;
				}
				movies.forEach(m => m.style.opacity = "1");
				movies.forEach(m => {
					if (m !== movie) m.style.opacity = "0.2";
				});
			});

			movie.addEventListener("mouseleave", () => {
				resetTimer = setTimeout(() => {
					movies.forEach(m => m.style.opacity = "1");
					resetTimer = null;
				}, 80);
			});
		});

		// Hover-swap behavior: triggers on the whole movie card
		const cards = document.querySelectorAll(".movie");

		const observer = new IntersectionObserver(entries => {
			for (const entry of entries) {
				const card = entry.target;
				const box = card.querySelector(".movie-video-container");
				const video = box.querySelector("video");
				if (!entry.isIntersecting && video) {
					video.pause();
					video.removeAttribute("src");
					video.load(); // unload when scrolled far away
				}
			}
		}, { threshold: 0, rootMargin: "600px 0px" });

		cards.forEach(card => {
			const box = card.querySelector(".movie-video-container");
			const clip = box.dataset.clip;
			let video = null;

			card.addEventListener("mouseenter", () => {
				if (!video) {
					video = document.createElement("video");
					video.src = clip;
					video.muted = true;
					video.loop = true;
					video.preload = "metadata";
					video.className = "movie-video";
					video.style.objectFit = "cover";
					box.appendChild(video); // sits on top of the image
					video.play();
					observer.observe(card);
				} else {
					// if video exists but has no src (was unloaded), reload it
					if (!video.src) {
						video.src = clip;
						video.load();
					}
					video.play();
				}
			});

			card.addEventListener("mouseleave", () => {
				if (video) video.pause();
			});
		});

		document.querySelectorAll("select").forEach(sel => {
			sel.addEventListener("change", () => {
				if (sel.selectedIndex > 0) sel.classList.add("active");
				else sel.classList.remove("active");
			});
		});
	}

	render(movies);

	// search + filter
	const fuse = new Fuse(movies, { keys: ["title", "year", "genre", "director", "synopsis"] });

	function updateResults() {
		const searchTerm = document.getElementById("search").value;
		let results = searchTerm ? fuse.search(searchTerm).map(r => r.item) : movies;

		const g = genreFilter.value;
		const d = directorFilter.value;
		const y = yearFilter.value;
		const l = lengthFilter.value;
		const r = ratingFilter.value;

		if (g) results = results.filter(m => m.genre.includes(g));
		if (d) results = results.filter(m => m.director.includes(d));
		if (y) results = results.filter(m => m.year == y);
		if (l) {
			results = results.filter(m => {
				const len = m.length;
				if (l === "1") return len <= 74;
				if (l === "1.5") return len >= 75 && len <= 104;
				if (l === "2") return len >= 105 && len <= 134;
				if (l === "2.5") return len >= 135 && len <= 164;
				if (l === "3") return len >= 165;
			});
		}
		if (r) {
			results = results.filter(m => {
				const rating = m.rating;
				if (r === "all") return rating >= 0;
				if (r === "positive") return rating > 0;
				if (r === "favorite") return rating == 2;
				if (r === "good") return rating == 1;
			});
		}

		// sorting
		switch (sortSelect.value) {
			case "original":
				results.sort((a, b) => {
					return originalMovies.indexOf(a) - originalMovies.indexOf(b);
				});
				break;
			case "title-asc":
				results.sort((a, b) => a.title.localeCompare(b.title));
				break;
			case "title-desc":
				results.sort((a, b) => b.title.localeCompare(a.title));
				break;
			case "year-asc":
				results.sort((a, b) => a.year - b.year);
				break;
			case "year-desc":
				results.sort((a, b) => b.year - a.year);
				break;
			case "length-asc":
				results.sort((a, b) => a.length - b.length);
				break;
			case "length-desc":
				results.sort((a, b) => b.length - a.length);
				break;
		}

		render(results);
	}

	document.getElementById("search").addEventListener("input", updateResults);
	genreFilter.addEventListener("change", updateResults);
	directorFilter.addEventListener("change", updateResults);
	yearFilter.addEventListener("change", updateResults);
	lengthFilter.addEventListener("change", updateResults);
	ratingFilter.addEventListener("change", updateResults);
	sortSelect.addEventListener("change", updateResults);

	const filters = document.querySelector('.filters');
	const sentinel = document.createElement('div');
	filters.parentNode.insertBefore(sentinel, filters); // place above it

	const observer = new IntersectionObserver(entries => {
		if (!entries[0].isIntersecting) {
			filters.classList.add('stuck');
		} else {
			filters.classList.remove('stuck');
		}
	});
	observer.observe(sentinel);

}

loadMovies();