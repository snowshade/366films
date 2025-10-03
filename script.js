async function loadMovies() {
	const res = await fetch("data/movies.json");
	const movies = await res.json();

	const container = document.getElementById("movies");
	const genreFilter = document.getElementById("filter-genre");

	// build genre filter
	// const genres = [...new Set(movies.map(m => m.genre))];
	// genreFilter.innerHTML = `<option value="">All Genres</option>` +
	// 	genres.map(g => `<option value="${g}">${g}</option>`).join("");

	// render
	function render(list) {
		container.innerHTML = list.map(m => `
			<div class="movie">
				<div class="movie-info">
					<p style="flex: 1; font-weight: bold; text-transform: uppercase; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${m.title}</p>
					<p>${m.director}</p>
				</div>
				<div class="movie-info">
					<p style="text-align:left;">${m.year}</p>
					<p style="flex: 1; text-align:center;">${m.genre.join(" • ")}</p>
					<p style="text-align:right;">${m.length}m</p>
				</div>
				<div class="movie-video-container">
					<video class="movie-video" muted loop preload="metadata">
						${m.clip ? `<source src="${m.clip}" type="video/mp4">` : ""}
					</video>
				</div>
				<div style="margin-top: 16px">
					
					<div class="movie-info">
						<p style="text-align:justify; color: #f0f6f0; opacity: 0.4">${m.synopsis}</p>
					</div>
				</div>
			</div>
			</div>
		`).join("");

		document.querySelectorAll(".movie-video").forEach(video => {
			const parent = video.closest(".movie");

			parent.addEventListener("mouseenter", () => {
				video.play();
			});

			parent.addEventListener("mouseleave", () => {
				video.pause();
			});
		});

		const movies = document.querySelectorAll(".movie");
		let resetTimer = null;

		movies.forEach(movie => {
			movie.addEventListener("mouseenter", () => {
				// cancel any pending reset
				if (resetTimer) {
					clearTimeout(resetTimer);
					resetTimer = null;
				}

				// restore all movies first
				movies.forEach(m => m.style.opacity = "1");

				// set background and fade others
				movies.forEach(m => {
					if (m !== movie) m.style.opacity = "0.3";
				});
			});

			movie.addEventListener("mouseleave", () => {
				// start a short timer before reverting everything
				resetTimer = setTimeout(() => {
					movies.forEach(m => m.style.opacity = "1");
					resetTimer = null;
				}, 80); // debounce duration
			});
		});
	}
	
	render(movies);

	// search + filter
	const fuse = new Fuse(movies, { keys: ["title", "year", "genre"] });

	document.getElementById("search").addEventListener("input", e => {
		let results = e.target.value ? fuse.search(e.target.value).map(r => r.item) : movies;
		const genre = genreFilter.value;
		if (genre) results = results.filter(m => m.genre === genre);
		render(results);
	});

	genreFilter.addEventListener("change", () => {
		const term = document.getElementById("search").value;
		let results = term ? fuse.search(term).map(r => r.item) : movies;
		const genre = genreFilter.value;
		if (genre) results = results.filter(m => m.genre === genre);
		render(results);
	});
}

loadMovies();