(() => {
  const mascot = `<svg viewBox="0 0 96 96" role="img" aria-label="Friendly lion mascot" xmlns="http://www.w3.org/2000/svg"><path d="M48 5 57 13 69 10 74 22 87 27 83 40 91 50 82 60 84 73 70 77 64 89 51 84 40 91 31 81 18 82 16 68 5 61 12 49 6 37 18 29 20 16 34 17z" fill="#ffd76a" stroke="#253247" stroke-width="4" stroke-linejoin="round"/><path d="M48 20c18 0 28 13 28 31S66 78 48 78 20 69 20 51s10-31 28-31Z" fill="#fff" stroke="#253247" stroke-width="3"/><path d="M34 48a4 5 0 1 0 0-10 4 5 0 0 0 0 10Zm28 0a4 5 0 1 0 0-10 4 5 0 0 0 0 10Z" fill="#253247"/><path d="M42 55q6-6 12 0l-6 6z" fill="#ff9a8b" stroke="#253247" stroke-width="2" stroke-linejoin="round"/><path d="M48 61q-7 8-13 1m13-1q7 8 13 1" fill="none" stroke="#253247" stroke-width="2.5" stroke-linecap="round"/><path d="M24 53h14m-14 7h15m33-7H58m14 7H57" stroke="#253247" stroke-width="1.8" stroke-linecap="round"/></svg>`;


  const selectedSet = new URLSearchParams(location.search).get('questionSet');
  function preserveSelectedSet(scope) {
    if (!selectedSet) return;
    scope.querySelectorAll('a[href]').forEach(link => {
      const target = new URL(link.getAttribute('href'), location.href);
      if (target.origin === location.origin && ['/02._qb_explore_games_catalog/code.html', '/07._qb_game_library_arena_selection/code.html'].includes(target.pathname)) {
        target.searchParams.set('questionSet', selectedSet);
        link.href = target.pathname + target.search + target.hash;
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => preserveSelectedSet(document), { once: true });
  else preserveSelectedSet(document);

  class QBSiteHeader extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const current = this.getAttribute('current') || '';
      this.attachShadow({ mode: 'open' }).innerHTML = `
        <link rel="stylesheet" href="/assets/qb-design-system.css?v=20261104-shell-links">
        <header class="qb-header">
          <div class="qb-header-inner">
            <a class="qb-brand" href="/index.html" aria-label="QB Interactive Learning Kits home"><span class="qb-brand-mark"><img src="/qb_learning_kits_lion_mascot_logo/screen.png" alt=""></span><span>QB Interactive<br>Learning Kits</span></a>
            <button class="qb-menu-toggle" type="button" aria-expanded="false" aria-controls="qb-site-nav">Menu <span aria-hidden="true">☰</span></button>
            <nav class="qb-nav" id="qb-site-nav" aria-label="Main navigation" data-open="false">
              <a href="/index.html" ${current === 'home' ? 'aria-current="page"' : ''}>Home</a>
              <a href="/01._qb_public_homepage/code.html">Public homepage</a>
              <a href="/explore-questions.html" ${current === 'questions' ? 'aria-current="page"' : ''}>Explore questions</a>
              <a href="/07._qb_game_library_arena_selection/code.html" ${['games', 'play'].includes(current) ? 'aria-current="page"' : ''}>Game library</a>
              <a href="/04._qb_teacher_dashboard/code.html">Teacher tools</a>
              <a href="/18._qb_user_profile_system_preferences/code.html">Settings</a>
            </nav>
            ${current === 'home' ? '' : ['questions', 'games', 'play'].includes(current) ? `
              <div class="qb-header-start">
                <button class="qb-button qb-button--mint qb-header-cta qb-start-trigger" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="qb-start-menu">Get Started <span aria-hidden="true">⌄</span></button>
                <div class="qb-start-menu" id="qb-start-menu" aria-label="Get started" hidden>
                  <a href="/16._qb_unified_sign_in_sign_up/code.html?next=student">Log In</a>
                  <a href="/16._qb_unified_sign_in_sign_up/code.html?mode=signup">Sign Up</a>
                </div>
              </div>` : '<a class="qb-button qb-button--mint qb-header-cta" href="/explore-questions.html">Get started</a>'}
          </div>
        </header>`;
      preserveSelectedSet(this.shadowRoot);
      const menuButton = this.shadowRoot.querySelector('.qb-menu-toggle');
      const nav = this.shadowRoot.querySelector('.qb-nav');
      const startWrap = this.shadowRoot.querySelector('.qb-header-start');
      const startButton = this.shadowRoot.querySelector('.qb-start-trigger');
      const startMenu = this.shadowRoot.querySelector('.qb-start-menu');
      menuButton.addEventListener('click', () => {
        const open = menuButton.getAttribute('aria-expanded') !== 'true';
        menuButton.setAttribute('aria-expanded', String(open));
        nav.dataset.open = String(open);
      });
      if (startWrap && startButton && startMenu) {
        const closeStartMenu = () => {
          startMenu.hidden = true;
          startButton.setAttribute('aria-expanded', 'false');
        };
        startButton.addEventListener('click', () => {
          const open = startButton.getAttribute('aria-expanded') !== 'true';
          startButton.setAttribute('aria-expanded', String(open));
          startMenu.hidden = !open;
          if (open) startMenu.querySelector('a')?.focus();
        });
        startMenu.addEventListener('click', event => {
          if (event.target.closest('a')) closeStartMenu();
        });
        document.addEventListener('pointerdown', event => {
          if (!event.composedPath().includes(startWrap)) closeStartMenu();
        });
        startWrap.addEventListener('keydown', event => {
          if (event.key === 'Escape' && !startMenu.hidden) {
            closeStartMenu();
            startButton.focus();
          }
        });
      }
      nav.addEventListener('click', event => {
        if (event.target.closest('a')) {
          menuButton.setAttribute('aria-expanded', 'false');
          nav.dataset.open = 'false';
        }
      });
      this.shadowRoot.addEventListener('keydown', event => {
        if (event.key === 'Escape' && nav.dataset.open === 'true') {
          nav.dataset.open = 'false';
          menuButton.setAttribute('aria-expanded', 'false');
          menuButton.focus();
        }
      });
    }
  }
  if (!customElements.get('qb-site-header')) customElements.define('qb-site-header', QBSiteHeader);

  class QBMascot extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      this.attachShadow({ mode: 'open' }).innerHTML = `<link rel="stylesheet" href="/assets/qb-design-system.css?v=20261104-shell-links"><span class="qb-mascot">${mascot}</span>`;
      this.shadowRoot.querySelector("svg")?.setAttribute("aria-label", this.getAttribute("label") || "Friendly lion mascot");
    }
  }
  if (!customElements.get('qb-mascot')) customElements.define('qb-mascot', QBMascot);

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-qb-dialog]');
    if (trigger) document.getElementById(trigger.dataset.qbDialog)?.showModal();
    if (event.target.closest('[data-qb-dialog-close]')) event.target.closest('dialog')?.close();
    const toastTrigger = event.target.closest('[data-qb-toast]');
    if (toastTrigger) {
      const toast = document.getElementById(toastTrigger.dataset.qbToast);
      if (toast) { toast.hidden = false; window.setTimeout(() => { toast.hidden = true; }, 3200); }
    }
  });
})();
