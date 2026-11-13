(function () {
  "use strict";

  const profiles = {
    "ship-battle": { category:"Phonics", time:"5 rounds", level:"Word practice", icon:"🚢", question:"Which word starts with SH?", answer:"SHIP", focuses:["Letter sounds","Word recognition","Reading"], steps:["Read the clue","Choose the matching word","Fire your cannon with a correct answer"] },
    "alien-spelling": {
      category: "Spelling & phonics", time: "7–10 min", level: "Early spelling",
      icon: "🚀", question: "Which letter completes the word?  _ A T", answer: "C · CAT",
      steps: ["Listen to the vowel sound", "Choose the missing letter", "Launch the shuttle and build the word"],
      focuses: ["Vowel sounds", "Word building", "Listen & spell"],
      launchLabel: "Play Alien Spelling"
    },
    "claw-machine-toy-drop": {
      category: "Sight words", time: "Self-paced", level: "Vocabulary practice",
      icon: "🕹️", question: "Choose the word that matches the picture:  🐘", answer: "ELEPHANT",
      focuses: ["Sight words", "Picture matching", "Read & retry"],
      steps: ["Read the target word", "Guide the claw to the matching toy", "Try again whenever you need"]
    },
    "potion-lab-alchemy": {
      category: "Matching & vocabulary", time: "6–10 min", level: "Word connections",
      icon: "🧪", question: "Match the opposite words:  HOT ↔ ?", answer: "COLD",
      focuses: ["Word meanings", "Matching pairs", "Science vocabulary"],
      steps: ["Read each word pair", "Choose the matching meaning", "Mix the ingredients to finish a potion"]
    },
    "balloon-pop-math-sprint": {
      category: "Math fluency", time: "Short rounds", level: "Addition practice",
      icon: "🎈", question: "Pop the balloon with the right answer:  12 + 9 = ?", answer: "21",
      focuses: ["Addition", "Number bonds", "Quick sums"],
      steps: ["Read the number sentence", "Choose the balloon with the answer", "Keep practicing at your own pace"]
    }
  };

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function gameHeader(title) {
    document.querySelectorAll('body > header').forEach(header => { header.hidden=true; });
    let header=document.querySelector('qb-site-header');
    if(!header) { header=document.createElement('qb-site-header'); header.setAttribute('current','games'); document.body.prepend(header); }
    return header;
  }

  function render(gameKey, sourceCard) {
    const profile = profiles[gameKey];
    const main = document.querySelector("main");
    if (!profile || !main || !sourceCard) return false;

    const title = sourceCard.querySelector("h4")?.textContent?.trim() || "Learning game";
    const description = sourceCard.querySelector("p")?.textContent?.trim() || "Explore this learning activity.";
    document.title=title+" · Adventure Settings";
    gameHeader(title);
    const hero = make("section", "qb-detail-hero");
    const ribbon = make("div", "qb-detail-ribbon");
    const badges = make("div", "qb-detail-badges");
    [profile.category, profile.level, "Solo & classroom"].forEach((label) => badges.append(make("span", "qb-detail-badge", label)));
    ribbon.append(badges, make("h1", "", title), make("p", "", description));
    const chosenSet=new URLSearchParams(location.search).get('questionSet');
    if(chosenSet) ribbon.append(make('p','qb-detail-selection',`Selected question set: ${chosenSet}. This local practice round currently uses built-in questions.`));

    const layout = make("div", "qb-detail-layout");
    const boardCard = make("section", "qb-detail-board-card");
    const board = make("div", "qb-detail-board");
    const hud = make("div", "qb-detail-hud");
    hud.append(make("span", "", profile.category), make("span", "", profile.time));
    const scene = make("div", "qb-detail-scene");
    scene.append(make("span", "qb-detail-mascot", profile.icon), make("span", "qb-detail-spark", "✦"));
    const question = make("div", "qb-detail-question");
    question.append(make("span", "qb-detail-question-number", "Q1"), make("p", "", profile.question), make("strong", "qb-detail-answer", profile.answer));
    board.append(hud, scene, question);
    boardCard.append(board, make("p", "qb-detail-caption", "A preview of the activity flow"));

    const launch = make("aside", "qb-detail-launch");
    const launchIntro = make("div", "qb-detail-launch-intro");
    launchIntro.append(make("strong", "", "Ready to start?"), make("p", "", `Practice ${profile.category.toLowerCase()} in a short, friendly round.`));
    launch.append(launchIntro);
    if (profile.launchHref) {
      const action = make("a", "qb-detail-action qb-detail-action--primary", profile.launchLabel + " →");
      action.href = profile.launchHref;
      launch.append(action);
    } else {
      const action = make("button", "qb-detail-action qb-detail-action--primary", "Game screen coming soon");
      action.type = "button"; action.disabled = false; action.textContent = "Play practice round →";
      action.addEventListener("click", () => {
        let index = 0, score = 0;
        const rounds = gameKey.includes("math")
          ? Array.from({length:5}, (_, i) => ({q:`${i+3} + ${i+5} = ?`, choices:[String(2*i+7),String(2*i+8),String(2*i+9)], answer:String(2*i+8)}))
          : gameKey === "alien-spelling" ? [{q:"Complete the word: C _ T",choices:["A","O","I"],answer:"A"},{q:"Complete the word: D _ G",choices:["A","O","U"],answer:"O"},{q:"Complete the word: S _ N",choices:["E","I","U"],answer:"U"},{q:"Complete the word: P _ N",choices:["E","A","O"],answer:"E"},{q:"Complete the word: F _ SH",choices:["U","I","A"],answer:"I"}] : gameKey === "ship-battle" ? [{q:"Which word starts with SH?",choices:["SHIP","CAT","DOG"],answer:"SHIP"},{q:"Which word rhymes with BOAT?",choices:["GOAT","FISH","SUN"],answer:"GOAT"},{q:"Which word starts with F?",choices:["BOAT","FISH","SHIP"],answer:"FISH"},{q:"Complete the word: S _ A",choices:["E","O","U"],answer:"E"},{q:"Which word rhymes with WAVE?",choices:["SAVE","SHIP","CAT"],answer:"SAVE"}] : [{q:"Which word names an animal?",choices:["CAT","CUP","CAR"],answer:"CAT"},{q:"Choose the opposite of HOT",choices:["COLD","BIG","RED"],answer:"COLD"},{q:"Which word matches 🍎?",choices:["BALL","APPLE","SHIP"],answer:"APPLE"},{q:"Complete the word: C _ T",choices:["A","B","D"],answer:"A"},{q:"Choose the opposite of UP",choices:["IN","ON","DOWN"],answer:"DOWN"}];
        if(QBAdventureSetup.preferences(main).randomize)QBAdventureSetup.shuffle(rounds);
        function show() {
          board.replaceChildren();
          if(index === rounds.length) {
            board.append(make("h2", "", "Round complete!"), make("p", "", `${score} of ${rounds.length} correct`), make("p", "", "Practice round only — this score is not saved to your account."));
            const again=make("button","qb-detail-action","Play again"); again.onclick=()=>{index=0;score=0;show();}; board.append(again); again.focus(); return;
          }
          const round=rounds[index];QBAdventureSetup.speak(main,round.q);
          let answered=false;
          const scene=make("div","qb-round-scene"); scene.setAttribute("aria-hidden","true");
          const visual=make("span","qb-round-visual",profile.icon); scene.append(visual);
          if(gameKey === "potion-lab-alchemy") { const meter=make("progress","qb-potion-meter");meter.max=5;meter.value=score;meter.setAttribute("aria-label","Potion ingredients collected");scene.append(meter); }
          board.append(scene);
          const rewards=make("p","qb-round-rewards",`Collected: ${score}`);rewards.setAttribute("role","status"); rewards.setAttribute("aria-live","polite"); board.append(rewards);
          board.append(make("p","",`Question ${index+1} of ${rounds.length}`),make("h2","",round.q));
          round.choices.forEach(choice=>{
            const answer=make("button","qb-detail-action"+(gameKey === "balloon-pop-math-sprint" ? " qb-answer-balloon" : ""),choice); answer.type="button";
            answer.onclick=()=>{
              if(answered)return; answered=true;
              const correct=choice===round.answer; if(correct) {
                score++; window.QBCorrectConfetti?.play();
                if(gameKey === "ship-battle") {visual.textContent="💦";rewards.textContent=`Direct hit! ${score} correct answers`;}
                if(gameKey === "alien-spelling") {visual.textContent="🚀";rewards.textContent=`Launch successful! ${score} words completed`;}
                if(gameKey === "claw-machine-toy-drop") {visual.textContent="🧸";visual.classList.add("qb-toy-drop");rewards.textContent=`Toy collected! ${score} in your collection`;}
                if(gameKey === "potion-lab-alchemy") {scene.querySelector("progress").value=score;visual.textContent=score===5?"✨":"🧪";rewards.textContent=`${score} of 5 ingredients mixed`;}
                if(gameKey === "balloon-pop-math-sprint") {answer.classList.add("qb-balloon-popped");rewards.textContent=`Pop! ${score} balloons collected`;}
              }
              board.querySelectorAll("button").forEach(button=>button.disabled=true);
              const feedback=make("p","",correct?"Correct!":`The answer is ${round.answer}.`);feedback.setAttribute("role","status");board.append(feedback);
              const next=make("button","qb-detail-action","Continue →");next.onclick=()=>{index++;show();};board.append(next);next.focus();
            };board.append(answer);
          });
        }
        show(); board.scrollIntoView({behavior:"smooth",block:"center"});
      });
      launch.append(action);
    }
    const library = make("a", "qb-detail-action qb-detail-action--secondary", "Back to game library");
    library.href = "/02._qb_explore_games_catalog/code.html";
    launch.append(library);
    const facts = make("div", "qb-detail-facts");
    [["Players", "Solo or class"], ["Device", "Any browser"], ["Skill", profile.category]].forEach(([label, value]) => {
      const fact = make("div", "qb-detail-fact"); fact.append(make("span", "", label), make("strong", "", value)); facts.append(fact);
    });
    launch.append(facts);
    layout.append(boardCard, launch);

    const mechanics = make("section", "qb-detail-mechanics");
    const mechanicsHeading = make("div", "qb-detail-section-heading");
    mechanicsHeading.append(make("h2", "", "How this game works"), make("p", "", "Small steps keep practice clear and encouraging."));
    mechanics.append(mechanicsHeading);
    const steps = make("div", "qb-detail-steps");
    profile.steps.forEach((step, index) => {
      const item = make("article", "qb-detail-step");
      item.append(make("span", "qb-detail-step-number", String(index + 1)), make("p", "", step));
      steps.append(item);
    });
    mechanics.append(steps);

    const practice = make("section", "qb-detail-practice");
    const practiceHeading = make("div", "qb-detail-section-heading");
    practiceHeading.append(make("h2", "", "Game skills"), make("p", "", `Practice ${profile.category.toLowerCase()} through short activities.`));
    const focusGrid = make("div", "qb-detail-practice-grid");
    (profile.focuses || profile.steps).forEach((focus, index) => {
      const item = make("article", "qb-detail-focus");
      item.append(make("span", "qb-detail-focus-icon", profile.icon), make("h3", "", focus), make("p", "", profile.steps[index] || "Practice at your own pace."));
      focusGrid.append(item);
    });
    practice.append(practiceHeading, focusGrid);

    const journey=make("nav","qb-detail-journey"); journey.setAttribute("aria-label","Learning flow");
    [["1 · Pick Questions","/explore-questions.html#question-sets"],["2 · Choose a Game","/07._qb_game_library_arena_selection/code.html"]].forEach(([label,href])=>{const link=make("a","",label);link.href=href;journey.append(link);});
    const active=make("span","","3 · Play!");active.setAttribute("aria-current","step");journey.append(active);
    hero.append(journey, ribbon, layout, mechanics, practice);
    document.body.classList.add("qb-game-detail-view");
    main.replaceChildren(hero);
    const practiceAction=launch.querySelector('button.qb-detail-action--primary');
    if(practiceAction && gameKey!=='alien-spelling') {
      const settings=make('div','setup-fields');
      [['Learning activity',profile.category],['Game mode','Local practice'],['Difficulty','Standard · local practice'],['Questions','5 questions'],['Answer timer','No time limit']].forEach(([label,value])=>{const field=make('label','',label),select=make('select');select.append(make('option','',value));field.append(select);settings.append(field);});
      const actions=make('div');const play=make('button','qb-detail-action--primary','Play ▶');play.type='button';actions.append(play);
      const status=make('p','',profile.category+' · 5 local questions · Results are not saved to an account.');
      const setup=QBAdventureSetup.mount({root:main,title:'Choose your adventure · '+title,art:'/assets/game-art/'+gameKey+'.svg',instructions:['Read the question and choose an answer.','Complete five local practice questions at your own pace.'],settings,status,actions});
      play.onclick=()=>{practiceAction.click();const back=make('button','qb-detail-action','Adventure Settings');back.type='button';back.onclick=()=>render(gameKey,sourceCard);main.replaceChildren(back,boardCard);};
    }

    document.querySelectorAll('body > footer').forEach(node=>node.remove());
    document.body.insertAdjacentHTML('beforeend', "<footer class=\"page-footer\">\n    <div class=\"footer-inner\">\n      <div class=\"footer-brand\"><strong>QB Interactive Learning Kits</strong><p>Playful activities and classroom tools for curious young learners.</p></div>\n      <nav class=\"footer-links\" aria-label=\"Explore links\"><h2>Explore</h2><a href=\"/07._qb_game_library_arena_selection/code.html\">Game library</a><a href=\"/explore-questions.html\">Question sets</a></nav>\n      <nav class=\"footer-links\" aria-label=\"Teacher links\"><h2>Teacher tools</h2><a href=\"/04._qb_teacher_dashboard/code.html\">Dashboard</a><a href=\"/06._qb_create_edit_question_set/code.html\">Create questions</a></nav>\n      <div class=\"footer-actions\"><a class=\"card-action\" href=\"/04._qb_teacher_dashboard/code.html\">\u265f Teacher tools</a><a class=\"card-action\" href=\"/18._qb_user_profile_system_preferences/code.html\">\u2699 Settings</a></div>\n      <p class=\"copyright\">\u00a9 2026 QB Interactive Learning Kits</p>\n    </div>\n  </footer>");
    const oldNav=document.querySelector('.student-nav');if(oldNav)oldNav.hidden=true;
    return true;
  }

  function renderStandalone(gameKey, title, description) {
    const sourceCard = {
      querySelector(selector) {
        if (selector === "h4") return { textContent: title };
        if (selector === "p") return { textContent: description };
        return null;
      }
    };
    return render(gameKey, sourceCard);
  }

  window.QBGameDetailScreen = { render, renderStandalone };
})();
