(function () {
  "use strict";
  const main = document.querySelector("main");
  if (!main) return;





  document.body.classList.add("qb-catalog-loading", "qb-catalog-app");

  const categories = [
    ["alphabet_learning", "Alphabet Learning"], ["phonics", "Phonics"], ["spelling", "Spelling"],
    ["vocabulary", "Vocabulary"], ["picture_games", "Picture Games"], ["memory_games", "Memory Games"],
    ["matching", "Matching"], ["quizzes", "Quizzes"], ["flashcards", "Flashcards"], ["reading", "Reading"],
    ["math", "Math"], ["khmer", "Khmer"], ["other", "Other"]
  ];
  const categoryNames = new Map(categories);
  const fallbackIcons = { alphabet_learning: "🔤", phonics: "🔤", spelling: "🚀", vocabulary: "📚", reading: "📖", matching: "🧩", quizzes: "❓", flashcards: "🃏", math: "🔢", khmer: "🇰🇭", other: "🎮" };
  const engineNames = { picture_guessing: "Picture guessing", multiple_choice: "Multiple-choice quiz", matching_pairs: "Matching pairs", flashcards: "Flashcards" };
  const homepageScreenGames = [
    { slug: "rabbit-racing", title: "Rabbit Racing", short_description: "Answer 30 maths questions. Correct answers move your rabbit; incorrect answers move the opponent.", category: "math", language: "en", game_type: "solo", thumbnail_url: "/games/rabbit-racing/thumbnail.svg", route: "/games/rabbit-racing/?ui=20261104-rabbit-racing-v1", homepageScreen: true },
    { slug: "ship-battle", title: "Ship Battle", short_description: "Read, listen, and guide your ship through a word challenge.", category: "phonics", language: "dual", thumbnail_url: "/assets/game-art/ship-battle.svg", route: "/03._qb_game_details_ship_battle/code.html", homepageScreen: true },
    { slug: "alien-spelling", title: "Alien Spelling Shuttle", short_description: "Choose the correct spelling from four answers to power a shuttle toward Blossom Planet.", category: "spelling", language: "en", thumbnail_url: "/assets/game-art/alien-spelling.svg", route: "/11._qb_student_game_selection_arena/code.html?game=alien-spelling&ui=20261104-alien-mission", homepageScreen: true },
    { slug: "wheel-spin-carnival", thumbnail_url: "/assets/game-art/wheel-spin-carnival.svg", title: "Wheel Spin Carnival", short_description: "Solve quick-fire arithmetic puzzles to spin the carnival prize wheel and win treasure chests.", category: "math", language: "en", icon: "🎡", route: "/11._qb_student_game_selection_arena/code.html?game=wheel-spin-carnival&ui=20261030-game-screen", playLabel: "View game preview →", homepageScreen: true },
    { slug: "claw-machine-toy-drop", thumbnail_url: "/assets/game-art/claw-machine-toy-drop.svg", title: "Claw Machine Toy Drop", short_description: "Guide the arcade claw to collect plush toys by matching sight words.", category: "vocabulary", language: "en", icon: "🕹️", route: "/11._qb_student_game_selection_arena/code.html?game=claw-machine-toy-drop&ui=20261030-game-screen", playLabel: "View game preview →", homepageScreen: true },
    { slug: "potion-lab-alchemy", thumbnail_url: "/assets/game-art/potion-lab-alchemy.svg", title: "Potion Lab Alchemy", short_description: "Mix colorful ingredients by matching science terms, animal habitats, and definitions.", category: "matching", language: "en", icon: "🧪", route: "/11._qb_student_game_selection_arena/code.html?game=potion-lab-alchemy&ui=20261030-game-screen", playLabel: "View game preview →", homepageScreen: true },
    { slug: "balloon-pop-math-sprint", thumbnail_url: "/assets/game-art/balloon-pop-math-sprint.svg", title: "Balloon Pop Math Sprint", short_description: "Pop glowing number balloons by solving sums before they float away.", category: "math", language: "en", icon: "🎈", route: "/11._qb_student_game_selection_arena/code.html?game=balloon-pop-math-sprint&ui=20261030-game-screen", playLabel: "View game preview →", homepageScreen: true }
  ];
  const filters = { search: "", category: "", language: "", age: "", difficulty: "", gameType: "" };
  let games = [];
  let gameView = "all";

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className.split(" ").map((name) => ({"qb-practice-steps": "journey", "qb-practice-step-number": "journey-icon", "qb-practice-step-badge": "step-number", "qb-practice-arrow": "journey-arrow", "qb-catalog-hero": "page-title", "qb-practice-prompt": "subtitle", "qb-catalog-search-row": "search-row", "qb-catalog-search": "search", "qb-catalog-filter-button": "filter-toggle", "qb-catalog-tabs": "collection-tabs", "qb-catalog-tab": "collection-tab", "qb-catalog-tab-icon": "collection-icon", "qb-catalog-tab-label": "collection-name", "qb-catalog-community": "community", "qb-catalog-community-icon": "community-icon", "qb-catalog-community-copy": "community-copy", "qb-catalog-shelf-heading": "list-heading", "qb-catalog-section-hint": "selected-count", "qb-catalog-grid": "question-grid", "qb-game-card": "question-card", "qb-live-pill": "card-kind", "qb-game-meta": "card-tags", "qb-catalog-play": "card-action card-action--play"})[name] || name).join(" ");
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  };
  const option = (select, value, text) => {
    const item = el("option", "", text); item.value = value; select.append(item);
  };
  const root = () => {
    main.replaceChildren(); main.className = "page-wrap";
  };
  const empty = (message, error) => el("div", `qb-game-empty${error ? " qb-game-error" : ""}`, message);

  function buildPage() {
    root();
    const steps = el("nav", "qb-practice-steps"); steps.setAttribute("aria-label", "Practice steps");
    const makePracticeStep = (tag, label, number, symbol) => {
      const step = el(tag, "qb-practice-step");
      const tile = el("span", "qb-practice-step-number"); tile.setAttribute("aria-hidden", "true");
      tile.append(el("span", "qb-practice-step-badge", String(number)), el("span", "qb-practice-step-symbol", symbol));
      const text = el("span", "qb-practice-step-label");
      if (number === 1) text.append(document.createTextNode("Pick or create"), document.createElement("br"), document.createTextNode("questions"));
      else text.textContent = label;
      step.append(tile, text); return step;
    };
    const step1 = makePracticeStep("a", "Pick or create questions", 1, "▱"); step1.href = "/explore-questions.html#question-sets";
    const arrow = el("span", "qb-practice-arrow", "›"); arrow.setAttribute("aria-hidden", "true");
    const step2 = makePracticeStep("a", "Choose a game", 2, "♧"); step2.href = "/07._qb_game_library_arena_selection/code.html"; step2.setAttribute("aria-current", "step");
    const arrow2 = el("span", "qb-practice-arrow", "›"); arrow2.setAttribute("aria-hidden", "true");
    const step3 = makePracticeStep("span", "Play!", 3, "▷"); step3.classList.add("journey-step"); step3.setAttribute("aria-disabled", "true");
    steps.append(step1, arrow, step2, arrow2, step3); main.append(steps);

    const hero = el("section", "qb-catalog-hero");
    hero.append(el("h1", "", "Choose a Game!"));
    const chosenSet = new URLSearchParams(window.location.search).get("questionSet");
    hero.append(el("p", "qb-practice-prompt", chosenSet ? `⭐ Questions: ${chosenSet}` : "🎮 PICK A GAME TO START PLAYING!"));

    main.append(hero);

    const searchRow = el("div", "qb-catalog-search-row");
    const searchInput = document.createElement("input");
    searchInput.className = "search"; searchInput.type = "search"; searchInput.id = "qb-filter-search";
    searchInput.name = "search"; searchInput.placeholder = "Search games..."; searchInput.autocomplete = "off";
    searchInput.setAttribute("aria-label", "Search games");
    searchInput.addEventListener("input", () => { filters.search = searchInput.value; renderGames(); });
    searchRow.append(searchInput);

    const form = el("form", "qb-catalog-filters");
    form.setAttribute("role", "search"); form.addEventListener("submit", (event) => event.preventDefault());
    const addField = (labelText, name, values, placeholder) => {
      const wrap = el("div", "qb-catalog-field");
      const label = el("label", "", labelText); label.htmlFor = `qb-filter-${name}`;
      let input;
      if (name === "search") {
        input = document.createElement("input"); input.type = "search"; input.placeholder = placeholder;
        input.autocomplete = "off";
      } else {
        input = document.createElement("select");
        option(input, "", name === "category" ? "All categories" : name === "language" ? "Any language" : name === "age" ? "Any age" : name === "difficulty" ? "Any difficulty" : "Any game type");
        values.forEach(([value, text]) => option(input, value, text));
      }
      input.id = `qb-filter-${name}`; input.name = name;
      input.addEventListener(name === "search" ? "input" : "change", () => { filters[name] = input.value; renderGames(); });
      wrap.append(label, input); form.append(wrap);
    };
    addField("Learning category", "category", categories, "");
    addField("Language", "language", [["en", "English"], ["km", "Khmer"]], "");
    addField("Age range", "age", [["4-5", "Ages 4–5"], ["6-7", "Ages 6–7"], ["4-7", "Ages 4–7"]], "");
    addField("Difficulty", "difficulty", [["beginner", "Beginner"], ["easy", "Easy"], ["medium", "Medium"], ["advanced", "Advanced"]], "");
    addField("Game type", "gameType", [["solo", "Solo"], ["classroom", "Classroom"], ["multiplayer", "Multiplayer"]], "");
    const filterPanel = el("details", "qb-filter-panel");
    const filterSummary = el("summary", "qb-catalog-filter-button", "Filters");
    const filterIcon = el("span", "qb-filter-icon", "☰"); filterIcon.setAttribute("aria-hidden", "true"); filterSummary.prepend(filterIcon);
    filterPanel.append(filterSummary, form);
    searchRow.append(filterPanel); main.append(searchRow);

    const tabs = el("div", "qb-catalog-tabs"); tabs.setAttribute("role", "group"); tabs.setAttribute("aria-label", "Game categories");
    [["all", "🎮", "All Games"], ["literacy", "📖", "Literacy Games"], ["more", "⭐", "Math & More"]].forEach(([view, icon, label]) => {
      const button = el("button", "qb-catalog-tab"); button.type = "button"; button.dataset.view = view;
      button.setAttribute("aria-pressed", String(view === gameView));
      button.append(el("span", "qb-catalog-tab-icon", icon), el("span", "qb-catalog-tab-label", label));
      button.addEventListener("click", () => {
        gameView = view;
        tabs.querySelectorAll(".collection-tab").forEach((tab) => tab.setAttribute("aria-pressed", String(tab.dataset.view === gameView)));
        renderGames();
      });
      tabs.append(button);
    });
    main.append(tabs);
    const community = el("aside", "qb-catalog-community");
    community.append(el("span", "qb-catalog-community-icon", "🎮"));
    const communityCopy = el("span", "qb-catalog-community-copy");
    communityCopy.append(el("strong", "", "PICK YOUR NEXT ADVENTURE"), el("small", "", "Choose your adventure settings before you play."));
    community.append(communityCopy); main.append(community);

    const resultBar = el("div", "qb-catalog-results");
    const count = el("p", "qb-catalog-count", ""); count.id = "qb-catalog-count"; count.setAttribute("aria-live", "polite");
    const reset = el("button", "qb-catalog-reset", "Clear filters"); reset.type = "button";
    reset.addEventListener("click", () => {
      Object.keys(filters).forEach((key) => { filters[key] = ""; });
      gameView = "all"; searchInput.value = ""; form.reset();
      tabs.querySelectorAll(".collection-tab").forEach((tab) => tab.setAttribute("aria-pressed", String(tab.dataset.view === gameView)));
      renderGames();
    });
    resultBar.append(count); filterPanel.append(reset);
    const shelf = el("section", "qb-catalog-shelf"); shelf.setAttribute("aria-label", "Published games");
    const shelfHeading = el("div", "qb-catalog-shelf-heading");
    shelfHeading.append(el("h2", "", "GAMES TO EXPLORE"), el("span", "qb-catalog-section-hint", "CHOOSE A GAME TO BEGIN"));
    shelf.append(shelfHeading);
    shelf.append(resultBar);
    const grid = el("div", "qb-catalog-grid"); grid.id = "qb-catalog-grid"; shelf.append(grid);
    main.append(shelf);
  }

  function matches(game) {
    const literacyCategories = ["alphabet_learning", "phonics", "spelling", "vocabulary", "reading"];
    if (gameView === "literacy" && !literacyCategories.includes(game.category)) return false;
    if (gameView === "more" && literacyCategories.includes(game.category)) return false;
    const term = filters.search.trim().toLocaleLowerCase();
    const languageName = { en: "english en", km: "khmer khm", dual: "english khmer bilingual" }[game.language] || "";
    const engineName = engineNames[game.engine_type] || "";
    if (term && ![game.title, game.short_description, categoryNames.get(game.category), game.language, languageName, game.difficulty, game.game_type, engineName]
      .filter(Boolean).join(" ").toLocaleLowerCase().includes(term)) return false;
    if (filters.category && game.category !== filters.category) return false;
    if (filters.language && ![filters.language, "dual"].includes(game.language)) return false;
    if (filters.difficulty && game.difficulty !== filters.difficulty) return false;
    if (filters.gameType && game.game_type !== filters.gameType) return false;
    if (filters.age) {
      const [min, max] = filters.age.split("-").map(Number);
      if (game.min_age == null || game.max_age == null || game.max_age < min || game.min_age > max) return false;
    }
    return true;
  }

  function withQuestionSet(route) {
    const chosen=new URLSearchParams(location.search).get('questionSet');
    const destination=new URL(route,location.origin);destination.searchParams.set('ui',destination.pathname.startsWith('/games/rabbit-racing')?'20261105-rabbit-ui-r2':'20261105-main-flow');if(chosen)destination.searchParams.set('questionSet',chosen);
    return destination.pathname+destination.search+destination.hash;
  }
  function gamePlayHref(game) {
    if (game.homepageScreen && typeof game.route === "string" && game.route.startsWith("/") && !game.route.includes("..")) return withQuestionSet(game.route);
    if (engineNames[game.engine_type] && game.id) return withQuestionSet(`/game-player.html?activity_id=${encodeURIComponent(game.id)}`);
    if (typeof game.route === "string" && game.route.startsWith("/") && !game.route.includes("..")) return withQuestionSet(game.route);
    return "";
  }

  function gameCard(game) {
    const card = el("article", "qb-game-card"); card.dataset.slug = game.slug || "";
    const art = el("div", "qb-game-art");
    const fallback = el("span", "", game.icon || fallbackIcons[game.category] || "🎮"); fallback.setAttribute("aria-hidden", "true");
    art.append(fallback);
    const localArt = { "ship-battle": "/assets/game-art/ship-battle.svg", "alien-spelling": "/assets/game-art/alien-spelling.svg" }[game.slug];
    const artwork = window.QBGameThumbnails?.[game.slug] || game.thumbnail_url || localArt;
    const playHref = gamePlayHref(game);
    if (artwork) {
      const image = document.createElement("img");
      image.src = artwork; image.alt = ""; image.className = artwork.endsWith(".svg") ? "qb-game-illustration" : "";
      image.loading = "lazy"; image.addEventListener("load", () => fallback.remove(), { once: true });
      image.addEventListener("error", () => image.remove(), { once: true });
      if (playHref) {
        const thumbnailLink = el("a", "qb-game-art-link"); thumbnailLink.href = playHref;
        thumbnailLink.setAttribute("aria-label", `${game.title || "Game"}: ${engineNames[game.engine_type] ? "play" : "open game"}`);
        thumbnailLink.append(image); art.append(thumbnailLink);
      } else art.append(image);
    } else if (playHref) {
      const thumbnailLink = el("a", "qb-game-art-link"); thumbnailLink.href = playHref;
      thumbnailLink.setAttribute("aria-label", `${game.title || "Game"}: open game`); art.append(thumbnailLink);
    }
    const content = el("div", "qb-game-content");
    content.append(el("span", "qb-live-pill", categoryNames.get(game.category) || "Learning game"));
    content.append(el("h3", "", game.title || "Learning game"));
    content.append(el("p", "", game.short_description || "Explore this learning activity."));
    const meta = el("div", "qb-game-meta");
    const language = { en: "English", km: "Khmer", dual: "English + Khmer" }[game.language];
    meta.append(el("span", "", language || "Language not listed"));
    if (engineNames[game.engine_type]) meta.append(el("span", "", engineNames[game.engine_type]));
    if (game.min_age != null && game.max_age != null) meta.append(el("span", "", `Ages ${game.min_age}–${game.max_age}`));
    else if (game.min_age != null) meta.append(el("span", "", `Ages ${game.min_age}+`));
    else if (game.max_age != null) meta.append(el("span", "", `Up to age ${game.max_age}`));
    if (game.difficulty) meta.append(el("span", "", game.difficulty[0].toUpperCase() + game.difficulty.slice(1)));
    if (game.duration_minutes != null) meta.append(el("span", "", `${game.duration_minutes} min`));
    if (game.game_type) meta.append(el("span", "", { solo: "Solo", classroom: "Classroom", multiplayer: "Multiplayer" }[game.game_type]));
    content.append(meta);
    if (game.homepageScreen && playHref) {
      const play = el("a", "qb-catalog-play", "Adventure Settings →");
      play.href = playHref; content.append(play);
    } else if (engineNames[game.engine_type] && game.id && playHref) {
      const play = el("a", "qb-catalog-play", "Adventure Settings →");
      play.href = playHref; content.append(play);
    } else if (playHref) {
      const play = el("a", "qb-catalog-play", "Adventure Settings →");
      play.href = playHref; content.append(play);
    } else {
      const unavailable = el("span", "qb-game-empty", "This activity is listed, but its interactive player is not available yet.");
      unavailable.setAttribute("role", "status"); content.append(unavailable);
    }
    card.append(art, content); return card;
  }

  function renderGames() {
    const grid = document.getElementById("qb-catalog-grid");
    const count = document.getElementById("qb-catalog-count");
    if (!grid || !count) return;
    document.getElementById("qb-library-more-note")?.remove();
    const filtered = games.filter(matches);
    const firstTen = filtered.slice(0, 10);
    count.textContent = filtered.length > 10
      ? `Showing the first 10 of ${filtered.length} games`
      : `${firstTen.length} ${firstTen.length === 1 ? "game" : "games"}`;
    grid.replaceChildren();
    if (!filtered.length) {
      grid.append(empty(games.length ? "No games match those filters. Try changing or clearing a filter." : "No published games are available to this account yet."));
      return;
    }
    grid.append(...firstTen.map(gameCard));
    if (games.length > 0 && games.length <= 10 && !filters.search && !filters.category && !filters.language && !filters.age && !filters.difficulty && !filters.gameType && gameView === "all") {
      const note = el("p", "qb-game-coming-note", "More adventures will appear here as new activities are published.");
      note.id = "qb-library-more-note"; grid.after(note);
    }
  }

  function includeHomepageScreens(publishedGames = []) {
    const bySlug = new Map(homepageScreenGames.map((game) => [game.slug, game]));
    for (const published of publishedGames) {
      const featured = bySlug.get(published.slug);
      bySlug.set(published.slug, featured ? { ...published, ...featured, id: published.id, engine_type: published.engine_type } : published);
    }
    return Array.from(bySlug.values());
  }

  function showHomepageScreens(message) {
    games = homepageScreenGames;
    renderGames();
    const grid = document.getElementById("qb-catalog-grid");
    document.getElementById("qb-homepage-screens-note")?.remove();
    const notice = el("p", "qb-game-coming-note", message);
    notice.id = "qb-homepage-screens-note";
    grid.after(notice);
  }

  async function load() {
    buildPage();
    const grid = document.getElementById("qb-catalog-grid");
    grid.setAttribute("aria-busy", "true");
    games = homepageScreenGames;
    renderGames();
    try {
      if (!window.QBSupabase?.configured) {
        showHomepageScreens("The published game library is not connected yet. These existing activities are ready to explore.");
        return;
      }
      const result = await QBSupabase.getGameLibrary();
      if (!result.authenticated) {
        if (result.authorized) {
          games = includeHomepageScreens(Array.from(new Map(result.games.map((game) => [game.id, game])).values()));
          renderGames();
          return;
        }
        throw new Error("The public game list is unavailable.");
      }
      if (!result.authorized) {
        root(); main.append(empty("We couldn’t confirm this account’s library access. Please sign in again or contact your administrator.", true)); return;
      }
      const accountLink = document.querySelector(".qb-library-header #qb-catalog-account");
      if (accountLink) {
        accountLink.hidden = false;
        document.getElementById("qb-start-wrap")?.setAttribute("hidden", "");
        accountLink.addEventListener("click", async (event) => {
          event.preventDefault();
          try { await QBSupabase.signOut(); location.assign("/16._qb_unified_sign_in_sign_up/code.html"); }
          catch (error) { root(); main.append(empty(error?.message || "Sign out failed. Please try again.", true)); }
        });
      }
      games = includeHomepageScreens(Array.from(new Map(result.games.map((game) => [game.id, game])).values()));
      renderGames();
    } catch (error) {
      const missingPublicCatalog = /get_public_game_library|schema cache/i.test(error?.message || "");
      const message = missingPublicCatalog
        ? "We’re getting the public game shelf ready. Please try again shortly."
        : (error && error.message ? `We couldn’t load the game library: ${error.message}` : "We couldn’t load the game library. Please try again.");
      showHomepageScreens(`${message} The existing homepage activities are still available below.`);
      document.getElementById("qb-library-retry")?.remove();
      const retry = el("button", "qb-catalog-reset", "Try again"); retry.type = "button"; retry.id = "qb-library-retry"; retry.addEventListener("click", load); main.append(retry);
    } finally {
      document.body.classList.remove("qb-catalog-loading");
      main.removeAttribute("aria-busy");
      document.querySelector("#qb-catalog-grid")?.removeAttribute("aria-busy");
    }
  }

  load();
})();
