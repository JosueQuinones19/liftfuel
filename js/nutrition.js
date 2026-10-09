// ============================================
// nutrition.js - Food Search & Daily Meal Log
// ============================================

(function () {
  // DOM references
  const foodSearchInput = document.getElementById('foodSearch');
  const foodSearchBtn = document.getElementById('foodSearchBtn');
  const foodResultsDiv = document.getElementById('foodResults');
  const foodLoading = document.getElementById('foodLoading');
  const foodError = document.getElementById('foodError');
  const foodErrorMsg = document.getElementById('foodErrorMsg');

  // Modal references
  const addFoodModal = document.getElementById('addFoodModal');
  const addFoodModalClose = document.getElementById('addFoodModalClose');
  const addFoodName = document.getElementById('addFoodName');
  const addFoodMacros = document.getElementById('addFoodMacros');
  const servingInput = document.getElementById('servingInput');
  const mealTypeSelect = document.getElementById('mealTypeSelect');
  const confirmAddFoodBtn = document.getElementById('confirmAddFoodBtn');

  // State
  let searchResults = [];
  let selectedFood = null;

  // --- Search ---
  foodSearchBtn.addEventListener('click', performSearch);
  foodSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  async function performSearch() {
    const query = foodSearchInput.value.trim();
    if (!query) {
      foodSearchInput.focus();
      return;
    }

    // Show loading
    foodResultsDiv.innerHTML = '';
    foodResultsDiv.style.display = 'none';
    foodError.style.display = 'none';
    foodLoading.style.display = '';

    try {
      const data = await UsdaAPI.searchFoods(query);
      searchResults = data.foods;
      foodLoading.style.display = 'none';
      renderSearchResults();
    } catch (err) {
      console.error('Food search error:', err);
      foodLoading.style.display = 'none';
      foodErrorMsg.textContent = `Search failed: ${err.message}`;
      foodError.style.display = '';
    }
  }

  function renderSearchResults() {
    foodResultsDiv.style.display = '';

    if (searchResults.length === 0) {
      foodResultsDiv.innerHTML = `
        <div class="empty-inline">
          No foods found. Try a different search term.
        </div>
      `;
      return;
    }

    foodResultsDiv.innerHTML = searchResults.map((food, i) => `
      <div class="food-result-item" data-index="${i}">
        <div class="food-result-info">
          <div class="food-result-name">${capitalize(food.name.toLowerCase())}</div>
          ${food.brand ? `<div class="food-result-brand">${food.brand}</div>` : ''}
          <div class="food-result-macros">
            <span><span class="macro-label">Cal:</span> ${food.calories}</span>
            <span><span class="macro-label">P:</span> ${food.protein}g</span>
            <span><span class="macro-label">C:</span> ${food.carbs}g</span>
            <span><span class="macro-label">F:</span> ${food.fat}g</span>
            <span class="text-muted">(per 100g)</span>
          </div>
        </div>
        <button class="btn btn-primary btn-sm add-food-btn" data-index="${i}">Add</button>
      </div>
    `).join('');

    // Add button listeners
    foodResultsDiv.querySelectorAll('.add-food-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        openAddFoodModal(searchResults[idx]);
      });
    });
  }

  // --- Add Food Modal ---
  function openAddFoodModal(food) {
    selectedFood = food;
    addFoodName.textContent = capitalize(food.name.toLowerCase());

    // Set default serving
    servingInput.value = food.servingSize || 100;
    updateMacroPreview();

    openModal('addFoodModal');
  }

  // Update macro preview when serving changes
  servingInput.addEventListener('input', updateMacroPreview);

  function updateMacroPreview() {
    if (!selectedFood) return;
    const grams = parseFloat(servingInput.value) || 100;
    const scaled = UsdaAPI.scaleToServing(selectedFood, grams);

    addFoodMacros.innerHTML = `
      <span><span class="macro-label">Calories:</span> ${scaled.calories}</span>
      <span><span class="macro-label">Protein:</span> ${scaled.protein}g</span>
      <span><span class="macro-label">Carbs:</span> ${scaled.carbs}g</span>
      <span><span class="macro-label">Fat:</span> ${scaled.fat}g</span>
    `;
  }

  // Close modal
  addFoodModalClose.addEventListener('click', () => closeModal('addFoodModal'));

  // Confirm add food
  confirmAddFoodBtn.addEventListener('click', () => {
    if (!selectedFood) return;

    const grams = parseFloat(servingInput.value) || 100;
    const mealType = mealTypeSelect.value;
    const scaled = UsdaAPI.scaleToServing(selectedFood, grams);

    const meal = {
      name: selectedFood.name,
      fdcId: selectedFood.fdcId,
      servingGrams: grams,
      mealType,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat
    };

    Storage.saveMeal(meal);

    closeModal('addFoodModal');
    selectedFood = null;

    renderMealSections();
    updateMacroTotals();
  });

  // --- Meal Sections ---
  function renderMealSections() {
    const meals = Storage.getTodayMeals();
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];

    mealTypes.forEach(type => {
      const container = document.querySelector(`.meal-items[data-meal="${type}"]`);
      if (!container) return;

      const items = meals.filter(m => m.mealType === type);

      if (items.length === 0) {
        container.innerHTML = `<div class="empty-inline">No foods logged yet</div>`;
        return;
      }

      container.innerHTML = items.map(item => `
        <div class="meal-item">
          <div class="meal-item-name">
            ${capitalize(item.name.toLowerCase())}
            <span class="text-muted" style="font-size:0.75rem;">(${item.servingGrams}g)</span>
          </div>
          <div class="meal-item-macros">
            <span>${item.calories} cal</span>
            <span>${item.protein}g P</span>
            <span>${item.carbs}g C</span>
            <span>${item.fat}g F</span>
          </div>
        </div>
      `).join('');
    });
  }

  // --- Macro Totals ---
  function updateMacroTotals() {
    const totals = Storage.getTodayTotals();

    document.getElementById('totalCalories').textContent = formatNumber(totals.calories);
    document.getElementById('totalProtein').textContent = `${Math.round(totals.protein)}g`;
    document.getElementById('totalCarbs').textContent = `${Math.round(totals.carbs)}g`;
    document.getElementById('totalFat').textContent = `${Math.round(totals.fat)}g`;
  }

  // --- Init ---
  function init() {
    renderMealSections();
    updateMacroTotals();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
