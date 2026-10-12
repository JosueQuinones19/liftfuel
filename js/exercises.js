// ============================================
// exercises.js - Exercise Search Page Logic
// ============================================

(function () {
  // DOM references
  const searchInput = document.getElementById('exerciseSearch');
  const searchBtn = document.getElementById('searchBtn');
  const categoryFilters = document.getElementById('categoryFilters');
  const muscleFilters = document.getElementById('muscleFilters');
  const resultsContainer = document.getElementById('exerciseResults');
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const errorMessage = document.getElementById('errorMessage');
  const initialState = document.getElementById('initialState');

  // Modal references
  const exerciseModal = document.getElementById('exerciseModal');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  // State
  let activeCategory = 'all';
  let activeMuscle = null;
  let currentResults = [];

  const allStates = ['exerciseResults', 'loadingState', 'errorState', 'initialState'];

  // --- Initialize ---
  async function init() {
    await loadFilters();
    setupEventListeners();
  }

  // --- Load filter pills ---
  async function loadFilters() {
    // Show loading indicator while filters load
    categoryFilters.insertAdjacentHTML('beforeend',
      '<span class="filter-loading"><span class="spinner" style="width:16px;height:16px;border-width:2px;"></span> Loading filters...</span>'
    );

    try {
      const [categories, muscles] = await Promise.all([
        WgerAPI.getCategories(),
        WgerAPI.getMuscles()
      ]);

      // Remove loading indicator
      const loadingEl = categoryFilters.querySelector('.filter-loading');
      if (loadingEl) loadingEl.remove();

      // Add category pills
      categories.forEach(cat => {
        const pill = document.createElement('button');
        pill.className = 'filter-pill';
        pill.textContent = cat.name;
        pill.dataset.category = cat.id;
        categoryFilters.appendChild(pill);
      });

      // Add muscle pills
      muscles.forEach(m => {
        const pill = document.createElement('button');
        pill.className = 'filter-pill';
        pill.textContent = m.name;
        pill.dataset.muscle = m.id;
        muscleFilters.appendChild(pill);
      });
    } catch (err) {
      console.warn('Failed to load filters:', err);
      const loadingEl = categoryFilters.querySelector('.filter-loading');
      if (loadingEl) {
        loadingEl.innerHTML = '<span style="color:var(--color-text-muted);font-size:0.85rem;">Could not load filters &mdash; <button class="btn-link" id="retryFiltersBtn">retry</button></span>';
        const retryBtn = document.getElementById('retryFiltersBtn');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => {
            loadingEl.remove();
            loadFilters();
          });
        }
      }
    }
  }

  // --- Event listeners ---
  function setupEventListeners() {
    // Search button
    searchBtn.addEventListener('click', () => performSearch());

    // Enter key in search
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch();
    });

    // Category filter clicks
    categoryFilters.addEventListener('click', (e) => {
      const pill = e.target.closest('.filter-pill');
      if (!pill) return;

      categoryFilters.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.dataset.category;
      performSearch();
    });

    // Muscle filter clicks
    muscleFilters.addEventListener('click', (e) => {
      const pill = e.target.closest('.filter-pill');
      if (!pill) return;

      // Toggle muscle filter
      if (pill.classList.contains('active')) {
        pill.classList.remove('active');
        activeMuscle = null;
      } else {
        muscleFilters.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeMuscle = pill.dataset.muscle;
      }
      performSearch();
    });

    // Modal close
    if (modalClose) {
      modalClose.addEventListener('click', () => closeModal('exerciseModal'));
    }

    // Click on exercise card -> show detail
    resultsContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.exercise-card');
      if (card && card.dataset.id) {
        showExerciseDetail(parseInt(card.dataset.id));
      }
    });
  }

  // --- Perform search ---
  async function performSearch() {
    const query = searchInput.value.trim();

    // Show loading
    showState('loadingState', allStates);

    try {
      const data = await WgerAPI.getExercises({
        query,
        category: activeCategory !== 'all' ? activeCategory : null,
        muscle: activeMuscle,
        limit: 30
      });

      currentResults = data.results;
      renderResults(currentResults);
    } catch (err) {
      console.error('Search error:', err);
      const isOffline = !navigator.onLine;
      errorMessage.innerHTML = isOffline
        ? 'You appear to be offline. Check your connection and <button class="btn-link" id="retrySearchBtn">try again</button>.'
        : `Failed to search exercises. <button class="btn-link" id="retrySearchBtn">Try again</button>`;
      showState('errorState', allStates);

      const retryBtn = document.getElementById('retrySearchBtn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => performSearch());
      }
    }
  }

  // --- Render results ---
  function renderResults(exercises) {
    if (exercises.length === 0) {
      resultsContainer.innerHTML = `
        <div class="state-message">
          <div class="state-icon">&#128269;</div>
          <p>No exercises found. Try a different search term or filter.</p>
        </div>
      `;
      showState('exerciseResults', allStates);
      return;
    }

    const list = document.createElement('div');
    list.className = 'exercise-list';

    exercises.forEach(ex => {
      list.appendChild(createExerciseCard(ex));
    });

    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(list);
    showState('exerciseResults', allStates);
  }

  // --- Show exercise detail modal ---
  async function showExerciseDetail(exerciseId) {
    modalTitle.textContent = 'Loading...';
    modalBody.innerHTML = '<div class="state-message"><div class="spinner"></div></div>';
    openModal('exerciseModal');

    try {
      const exercise = await WgerAPI.getExerciseDetail(exerciseId);

      modalTitle.textContent = exercise.name;

      let bodyHtml = '';

      // Category
      if (exercise.category) {
        bodyHtml += `
          <div class="detail-section">
            <h4>Category</h4>
            <p>${exercise.category}</p>
          </div>
        `;
      }

      // Description
      if (exercise.description) {
        bodyHtml += `
          <div class="detail-section">
            <h4>Description</h4>
            <p>${exercise.description}</p>
          </div>
        `;
      }

      // Muscles
      if (exercise.muscles.length > 0) {
        bodyHtml += `
          <div class="detail-section">
            <h4>Primary Muscles</h4>
            <div class="exercise-meta">
              ${exercise.muscles.map(m => `<span class="badge badge-primary">${m}</span>`).join('')}
            </div>
          </div>
        `;
      }

      // Secondary Muscles
      if (exercise.secondaryMuscles.length > 0) {
        bodyHtml += `
          <div class="detail-section">
            <h4>Secondary Muscles</h4>
            <div class="exercise-meta">
              ${exercise.secondaryMuscles.map(m => `<span class="badge badge-accent">${m}</span>`).join('')}
            </div>
          </div>
        `;
      }

      // Equipment
      if (exercise.equipment.length > 0) {
        bodyHtml += `
          <div class="detail-section">
            <h4>Equipment</h4>
            <p>${exercise.equipment.join(', ')}</p>
          </div>
        `;
      }

      // Images
      if (exercise.images.length > 0) {
        bodyHtml += `
          <div class="detail-section">
            <h4>Images</h4>
            ${exercise.images.map(img =>
              `<img src="${img.url}" alt="${exercise.name}" loading="lazy">`
            ).join('')}
          </div>
        `;
      }

      // If no details available
      if (!bodyHtml) {
        bodyHtml = '<p class="text-muted">No additional details available for this exercise.</p>';
      }

      modalBody.innerHTML = bodyHtml;
    } catch (err) {
      console.error('Detail error:', err);
      modalBody.innerHTML = `
        <div class="state-message">
          <div class="state-icon">&#9888;</div>
          <p>Could not load exercise details. Please try again.</p>
        </div>
      `;
    }
  }

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', init);
})();
