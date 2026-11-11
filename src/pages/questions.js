(() => {
      const cards = [...document.querySelectorAll('.question-card')];
      const search = document.querySelector('#search');
      const empty = document.querySelector('#empty');
      const emptyTitle = document.querySelector('#empty-title');
      const emptyDetail = document.querySelector('#empty-detail');
      const createLink = document.querySelector('#create-link');
      const dialog = document.querySelector('#preview-dialog');
      let activeCategory = 'all';
      let activeCollection = 'all';

      function update() {
        const query = search.value.trim().toLocaleLowerCase();
        let visible = 0;
        for (const card of cards) {
          const matchesQuery = `${card.dataset.name} ${card.dataset.description} ${card.dataset.category}`.toLocaleLowerCase().includes(query);
          const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
          const matchesCollection = activeCollection === 'all'
            || (activeCollection === 'mine' && card.dataset.owner === 'mine')
            || (activeCollection === 'favorites' && card.querySelector('.favorite').getAttribute('aria-pressed') === 'true');
          const show = matchesQuery && matchesCategory && matchesCollection;
          card.hidden = !show;
          if (show) visible += 1;
        }
        empty.hidden = visible > 0 || activeCollection === 'mine';
        document.querySelector('#personal-library').hidden = activeCollection !== 'mine';
        const personalEmpty = activeCollection === 'mine' || activeCollection === 'favorites';
        emptyTitle.textContent = activeCollection === 'mine' ? 'Your question sets will show up here.' : activeCollection === 'favorites' ? 'No favorites yet.' : 'No question sets match your search.';
        emptyDetail.textContent = activeCollection === 'mine' ? 'Create a set to start building your own library.' : activeCollection === 'favorites' ? 'Tap the heart on a set to save it here.' : 'Try another search or subject.';
        createLink.hidden = !personalEmpty || activeCollection === 'favorites';
      }

      let favorites = [];
      try { const value = JSON.parse(localStorage.getItem('qb-interactive-learning-kits.favorites') || '[]'); if (Array.isArray(value)) favorites = value; } catch {}
      cards.forEach(card => { const button=card.querySelector('.favorite'); const saved=favorites.includes(card.dataset.name); button.setAttribute('aria-pressed',String(saved)); button.setAttribute('aria-label',`${saved ? 'Remove' : 'Add'} ${card.dataset.name} ${saved ? 'from' : 'to'} favorites`); });
      search.addEventListener('input', update);
      document.querySelector('#filter-toggle').addEventListener('click', event => {
        const button = event.currentTarget;
        const expanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!expanded));
        document.querySelector('#category-filters').hidden = expanded;
      });
      document.querySelectorAll('.filter-chip').forEach(button => button.addEventListener('click', () => {
        activeCategory = button.dataset.filter;
        document.querySelectorAll('.filter-chip').forEach(chip => chip.setAttribute('aria-pressed', String(chip === button)));
        update();
      }));
      document.querySelectorAll('.collection-tab').forEach(button => button.addEventListener('click', () => {
        activeCollection = button.dataset.collection;
        search.value = ''; activeCategory = 'all';
        document.querySelectorAll('.filter-chip').forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.filter === 'all')));
        document.querySelectorAll('.collection-tab').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
        button.prepend(document.querySelector('#tab-selected'));
        document.body.dataset.collection = activeCollection;
        document.querySelector('#list-title').textContent = activeCollection === 'mine' ? 'My question sets' : activeCollection === 'favorites' ? 'Favorite question sets' : 'Question sets to explore';
        update();
      }));
      document.querySelectorAll('.favorite').forEach(button => button.addEventListener('click', () => {
        const isFavorite = button.getAttribute('aria-pressed') === 'true';
        button.setAttribute('aria-pressed', String(!isFavorite));
        button.setAttribute('aria-label', `${isFavorite ? 'Add' : 'Remove'} ${button.closest('.question-card').dataset.name} ${isFavorite ? 'to' : 'from'} favorites`);
        try { localStorage.setItem('qb-interactive-learning-kits.favorites', JSON.stringify(cards.filter(c => c.querySelector('.favorite').getAttribute('aria-pressed') === 'true').map(c => c.dataset.name))); } catch {}
        update();
      }));
      document.querySelectorAll('.preview').forEach(button => button.addEventListener('click', () => {
        const card = button.closest('.question-card');
        document.querySelector('#preview-title').textContent = card.dataset.name;
        document.querySelector('#preview-description').textContent = card.dataset.description;
        document.querySelector('#preview-kind').textContent = card.dataset.kind;
        document.querySelector('#preview-meta').textContent = `${card.dataset.questions} questions · ${card.dataset.level}`;
        const previewTags = document.querySelector('#preview-tags');
        previewTags.replaceChildren(...[...card.querySelectorAll('.card-tag')].map(tag => {
          const chip = document.createElement('span');
          chip.className = 'card-tag';
          chip.textContent = tag.textContent;
          return chip;
        }));
        document.querySelector('#preview-choose-game').href = '/games/?' + new URLSearchParams({questionSet:card.dataset.name}).toString();
        dialog.showModal();
      }));
      document.querySelector('#close-preview').addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
      update();
    })();