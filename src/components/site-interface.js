(function(){
"use strict";
const startTrigger = document.querySelector('#get-started-trigger');
    const startMenu = document.querySelector('#get-started-menu');
    startMenu.tabIndex = -1;
    const closeStartMenu = () => {
      startMenu.hidden = true;
      startTrigger.setAttribute('aria-expanded', 'false');
    };
    startTrigger.addEventListener('click', () => {
      const open = startTrigger.getAttribute('aria-expanded') !== 'true';
      startTrigger.setAttribute('aria-expanded', String(open));
      startMenu.hidden = !open;
      if (open) (startMenu.querySelector('button:not(:disabled)') || startMenu).focus();
    });
    startMenu.addEventListener('click', event => {
      if (event.target.closest('button:not(:disabled)')) closeStartMenu();
    });
    document.addEventListener('pointerdown', event => {
      if (!event.composedPath().includes(startTrigger.parentElement)) closeStartMenu();
    });
    startMenu.parentElement.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !startMenu.hidden) {
        closeStartMenu();
        startTrigger.focus();
      }
    });

    const languageTrigger = document.querySelector('#language-trigger');
    const languageMenu = document.querySelector('#language-menu');
    const languageOptions = [...languageMenu.querySelectorAll('[data-language-option]')];
    const languageCurrent = document.querySelector('#language-current');
    const translations = {
  "en": {
    "title": "QB Interactive Learning Kits — Big Adventures. Little Learners.",
    "brandTag": "Playful learning for curious kids",
    "brandHome": "QB Interactive Learning Kits home",
    "brandLogo": "QB Learning Kits lion mascot",
    "heroAlt": "A friendly lion explorer mascot waving from a mint display stand, holding a book.",
    "description": "Playful English and Khmer learning adventures for children, families, and teachers.",
    "footerMenu": "Footer navigation",
    "login": "Log In",
    "signup": "Sign Up",
    "join": "Join class",
    "kicker": "A happy place for curious minds",
    "heroFirst": "Big Adventures.",
    "heroSecond": "Little Learners.",
    "heroLead": "Turn “what’s that?” into “I did it!” Explore words, numbers, nature, and playful adventures in English and Khmer.",
    "explore": "Explore Activities",
    "gamesTitle": "Pick a game. Start an adventure.",
    "gamesCopy": "Explore playful challenges for curious minds. Choose a game to begin your learning adventure.",
    "teamTitle": "A happy team around every learner",
    "teamCopy": "One playful learning space, with a helpful view for each grown-up.",
    "children": "For children",
    "childrenCopy": "Friendly challenges, gentle retries, and small wins help practice feel encouraging.",
    "joinPin": "Join with a class PIN →",
    "parents": "For parents",
    "parentsCopy": "Follow a child’s learning journey and find simple ideas for practice at home.",
    "familyView": "Explore the family view →",
    "teachers": "For teachers",
    "teachersCopy": "Prepare question sets, choose a game, and bring the activity to your class.",
    "teacherTools": "Explore teacher tools →",
    "howTitle": "How learning works",
    "howCopy": "A simple rhythm for classroom play or a little practice at home.",
    "step1Title": "Pick a question set",
    "step1Copy": "Choose a topic that fits the learner and the moment.",
    "step2Title": "Choose an activity",
    "step2Copy": "Turn the same learning goal into a game kids can explore.",
    "step3Title": "Play and celebrate",
    "step3Copy": "Practice, try again, and notice the progress along the way.",
    "finalTitle": "Ready for a little adventure?",
    "finalCopy": "Join a class activity or browse the learning games.",
    "footerCopy": "Playful English and Khmer learning for children, families, and teachers.",
    "footerLiteracy": "Literacy",
    "footerSignIn": "Sign in",
    "activities": "Activities",
    "games": "Games"
  },
  "km": {
    "title": "QB Interactive Learning Kits — ដំណើរផ្សងព្រេងដ៏អស្ចារ្យ សម្រាប់អ្នករៀនតូចៗ",
    "brandTag": "ការរៀនដ៏រីករាយសម្រាប់កុមារដែលចង់ស្វែងយល់",
    "brandHome": "ទំព័រដើម QB Interactive Learning Kits",
    "brandLogo": "រូបតោ mascot របស់ QB Learning Kits",
    "heroAlt": "តោដ៏រួសរាយកំពុងគ្រវីដៃ និងកាន់សៀវភៅលើជើងតាំងពណ៌បៃតង។",
    "description": "ដំណើរផ្សងព្រេងសិក្សាភាសាអង់គ្លេស និងខ្មែរដ៏រីករាយ សម្រាប់កុមារ គ្រួសារ និងគ្រូបង្រៀន។",
    "footerMenu": "ម៉ឺនុយបាតទំព័រ",
    "login": "ចូលគណនី",
    "signup": "បង្កើតគណនី",
    "join": "ចូលរួមថ្នាក់",
    "kicker": "⭐ បង្កើតសម្រាប់អ្នករៀនតូចៗ",
    "heroFirst": "ដំណើរផ្សងព្រេងដ៏អស្ចារ្យ។",
    "heroSecond": "សម្រាប់អ្នករៀនតូចៗ។",
    "heroLead": "ស្វែងយល់ពីអក្សរ រកឃើញពាក្យថ្មីៗ ហើយរៀនតាមរយៈសកម្មភាពលេងសប្បាយៗជាភាសាខ្មែរ និងអង់គ្លេស។",
    "explore": "ស្វែងយល់ពីសកម្មភាព",
    "gamesTitle": "ការរៀនមានភាពសប្បាយដូចការលេង",
    "gamesCopy": "ជ្រើសរើសហ្គេមមួយ ដើម្បីមើលសកម្មភាពដែលមាន។",
    "teamTitle": "ក្រុមរីករាយជួយអ្នករៀនគ្រប់រូប",
    "teamCopy": "កន្លែងរៀនលេងដ៏រីករាយ ជាមួយទិដ្ឋភាពមានប្រយោជន៍សម្រាប់មនុស្សធំគ្រប់រូប។",
    "children": "សម្រាប់កុមារ",
    "childrenCopy": "ល្បែងប្រកួតប្រជែងដ៏រួសរាយ ការសាកល្បងម្តងទៀត និងជោគជ័យតូចៗ ជួយឱ្យការហាត់រៀនកាន់តែរីករាយ។",
    "joinPin": "ចូលរួមដោយប្រើ PIN ថ្នាក់ →",
    "parents": "សម្រាប់មាតាបិតា",
    "parentsCopy": "តាមដានដំណើរការរៀនរបស់កូន និងស្វែងរកគំនិតងាយៗសម្រាប់ហាត់រៀននៅផ្ទះ។",
    "familyView": "មើលទំព័រគ្រួសារ →",
    "teachers": "សម្រាប់គ្រូបង្រៀន",
    "teachersCopy": "រៀបចំសំណុំសំណួរ ជ្រើសរើសហ្គេម ហើយនាំសកម្មភាពទៅកាន់ថ្នាក់រៀន។",
    "teacherTools": "ស្វែងយល់ពីឧបករណ៍គ្រូ →",
    "howTitle": "របៀបរៀន",
    "howCopy": "វិធីងាយៗសម្រាប់លេងនៅថ្នាក់រៀន ឬហាត់រៀនបន្តិចនៅផ្ទះ។",
    "step1Title": "ជ្រើសរើសសំណុំសំណួរ",
    "step1Copy": "ជ្រើសរើសប្រធានបទដែលសមស្របនឹងអ្នករៀន និងពេលវេលា។",
    "step2Title": "ជ្រើសរើសសកម្មភាព",
    "step2Copy": "បម្លែងគោលដៅសិក្សាទៅជាហ្គេមដែលកុមារអាចស្វែងយល់។",
    "step3Title": "លេង និងអបអរសាទរ",
    "step3Copy": "ហាត់រៀន សាកល្បងម្តងទៀត និងកត់សម្គាល់ការរីកចម្រើន។",
    "finalTitle": "ត្រៀមខ្លួនសម្រាប់ដំណើរផ្សងព្រេងហើយឬនៅ?",
    "finalCopy": "ចូលរួមសកម្មភាពក្នុងថ្នាក់ ឬរកមើលហ្គេមសិក្សា។",
    "footerCopy": "ការរៀនភាសាអង់គ្លេស និងខ្មែរដ៏រីករាយសម្រាប់កុមារ គ្រួសារ និងគ្រូបង្រៀន។",
    "footerLiteracy": "អក្ខរកម្ម",
    "footerSignIn": "ចូលគណនី",
    "activities": "សកម្មភាព",
    "games": "ហ្គេម"
  }
};
    const translationsBySelector = {
      '#get-started-trigger': 'getStarted', '#get-started-menu button:nth-child(1)': 'login', '#get-started-menu button:nth-child(2)': 'signup',
      '.lp-actions > .qb-button': 'join', '.lp-kicker': 'kicker', '.lp-lede': 'heroLead', '.lp-hero-actions .qb-button:nth-child(1)': 'explore',

      '#activities .lp-heading p': 'gamesCopy', '#games-title': 'gamesTitle', '#games .lp-heading p': 'gamesCopy',
      '#families-title': 'teamTitle', '#families .lp-heading p': 'teamCopy',
      '#how-title': 'howTitle', '#how-it-works .lp-heading p': 'howCopy', '#families .lp-benefit:nth-child(1) h3': 'children',
      '#families .lp-benefit:nth-child(1) p': 'childrenCopy', '#families .lp-benefit:nth-child(1) button': 'joinPin',
      '#families .lp-benefit:nth-child(2) h3': 'parents', '#families .lp-benefit:nth-child(2) p': 'parentsCopy',
      '#families .lp-benefit:nth-child(2) button': 'familyView', '#families .lp-benefit:nth-child(3) h3': 'teachers',
      '#families .lp-benefit:nth-child(3) p': 'teachersCopy', '#families .lp-benefit:nth-child(3) button': 'teacherTools',
      '.lp-final-cta h2': 'finalTitle', '.lp-final-cta p': 'finalCopy', '.lp-final-cta .lp-hero-actions .qb-button:nth-child(1)': 'explore',
      '.lp-final-cta .lp-hero-actions button:nth-child(2)': 'explore', '.lp-footer-inner > div > p': 'footerCopy',
      '.lp-footer-nav :is(a,button):nth-child(1)': 'activities', '.lp-footer-nav :is(a,button):nth-child(2)': 'games', '.lp-footer-nav :is(a,button):nth-child(3)': 'footerLiteracy',
      '.lp-footer-nav :is(a,button):nth-child(4)': 'familyView', '.lp-footer-nav :is(a,button):nth-child(5)': 'teacherTools', '.lp-footer-nav :is(a,button):nth-child(6)': 'footerSignIn'
    };
    const repeatedTranslations = [


      ['.lp-step h3', ['step1Title', 'step2Title', 'step3Title']],
      ['.lp-step p', ['step1Copy', 'step2Copy', 'step3Copy']]
    ];
    // Card content is authored once in index.html; cache it before language switches.
    const gameCards = [...document.querySelectorAll('.lp-game')].map(card => ({
      title: card.querySelector('h3').textContent,
      description: card.querySelector('p').textContent,
      tag: card.querySelector('.qb-badge').textContent
    }));
    function replaceVisibleText(node, value) {
      if (node.id === 'get-started-trigger') {
        const textNode = [...node.childNodes].find(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
        if (textNode) textNode.textContent = ` ${value} `;
      } else if (node.id === 'hero-title') {
        node.childNodes[0].textContent = `${value[0]} `;
        node.querySelector('span').textContent = value[1];
      } else if (node.children.length) {
        const textNode = [...node.childNodes].find(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
        if (textNode) textNode.textContent = `${value} `;
      } else node.textContent = value;
    }
    function applyInterfaceLanguage(language) {
      const strings = translations[language];
      document.documentElement.lang = language;
      if (document.querySelector('#hero-title')) document.title = strings.title;
      if (document.querySelector('#hero-title')) document.querySelector('meta[name="description"]').content = strings.description;
      for (const [selector, key] of Object.entries(translationsBySelector)) {
        const node = document.querySelector(selector);
        if (node && (strings[key] !== undefined || key === 'getStarted')) replaceVisibleText(node, key === 'getStarted' ? (language === 'km' ? 'ចាប់ផ្តើម' : 'Get Started') : strings[key]);
      }
      for (const [selector, keys] of repeatedTranslations) {
        document.querySelectorAll(selector).forEach((node, index) => strings[keys[index]] !== undefined && replaceVisibleText(node, strings[keys[index]]));
      }
      const headline = document.querySelector('#hero-title');
      if (headline) headline.childNodes[0].textContent = `${strings.heroFirst} `;
      if (headline) headline.querySelector('span').textContent = strings.heroSecond;
      document.querySelector('.lp-footer-nav').setAttribute('aria-label', strings.footerMenu);
      document.querySelectorAll('.lp-brand small').forEach(node => { node.textContent = strings.brandTag; });
      document.querySelectorAll('.lp-brand[aria-label]').forEach(node => { node.setAttribute('aria-label', strings.brandHome); });
      document.querySelectorAll('.lp-brand img').forEach(node => { node.alt = node.alt ? strings.brandLogo : ''; });
      const heroMascot=document.querySelector('.lp-generated-hero');if(heroMascot)heroMascot.alt=strings.heroAlt;
      document.querySelectorAll('.lp-game').forEach((card,index)=>{
        const game=gameCards[index];card.querySelector('h3').textContent=game.title;
        card.querySelector('p').textContent=game.description;
        card.querySelector('.qb-badge').textContent=game.tag;
        card.querySelector('.qb-button').textContent=strings.explore;
      });
      document.querySelectorAll('.lp-game img').forEach(node => {
        const title=node.closest('.lp-game').querySelector('h3')?.textContent || 'Learning game';
        node.alt=title+' game illustration';
      });
      document.querySelector('.lp-start-menu').setAttribute('aria-label', language === 'km' ? 'ចាប់ផ្តើម' : 'Get started');
      document.querySelector('.lp-final-cta')?.closest('section').setAttribute('aria-label', strings.explore);
      languageTrigger.setAttribute('aria-label', language === 'km' ? 'ជ្រើសរើសភាសាចំណុចប្រទាក់' : 'Choose interface language');
      languageMenu.setAttribute('aria-label', language === 'km' ? 'ភាសាចំណុចប្រទាក់' : 'Interface language');
      document.querySelector('#language-name').textContent = language === 'km' ? 'ខ្មែរ' : 'English';
      languageOptions.forEach(option => {
        const selected = option.dataset.languageOption === language;
        option.setAttribute('aria-checked', String(selected));
        option.querySelector('.lp-language-check').hidden = !selected;
      });
      try { localStorage.setItem('qb-interactive-learning-kits.language', language); } catch {}
    }
    const previousLanguage = (() => {
      try { return localStorage.getItem('qb-interactive-learning-kits.language'); }
      catch { return null; }
    })();
    let currentLanguage = previousLanguage === 'km' ? 'km' : 'en';
    const closeLanguageMenu = (restoreFocus = false) => {
      languageMenu.hidden = true;
      languageTrigger.setAttribute('aria-expanded', 'false');
      if (restoreFocus) languageTrigger.focus();
    };
    languageTrigger.addEventListener('click', () => {
      const open = languageTrigger.getAttribute('aria-expanded') !== 'true';
      languageTrigger.setAttribute('aria-expanded', String(open));
      languageMenu.hidden = !open;
      if (open) languageOptions.find(option => option.dataset.languageOption === currentLanguage)?.focus();
    });
    languageOptions.forEach(option => option.addEventListener('click', () => {
      currentLanguage = option.dataset.languageOption;
      applyInterfaceLanguage(currentLanguage);
      closeLanguageMenu(true);
    }));
    languageMenu.addEventListener('keydown', event => {
      const index = languageOptions.indexOf(document.activeElement);
      if (event.key === 'Escape') { event.preventDefault(); closeLanguageMenu(true); }
      else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        languageOptions[(index + (event.key === 'ArrowDown' ? 1 : languageOptions.length - 1)) % languageOptions.length].focus();
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault(); languageOptions[event.key === 'Home' ? 0 : languageOptions.length - 1].focus();
      }
    });
    document.addEventListener('pointerdown', event => {
      if (!event.composedPath().includes(document.querySelector('#language-control'))) closeLanguageMenu();
    });
    applyInterfaceLanguage(currentLanguage);
})();
