// ============================================
// api/usda.js - USDA FoodData Central API
// https://fdc.nal.usda.gov/api-guide
// ============================================

const UsdaAPI = {
  BASE_URL: 'https://api.nal.usda.gov/fdc/v1',
  API_KEY: 'DEMO_KEY',

  /**
   * Search for foods by name.
   * @param {string} query - Search term
   * @param {number} pageSize - Results per page
   * @returns {Promise<Object>} { foods: [...], totalHits }
   */
  async searchFoods(query, pageSize = 15) {
    if (!query || !query.trim()) {
      return { foods: [], totalHits: 0 };
    }

    const url = `${this.BASE_URL}/foods/search?api_key=${this.API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query.trim(),
        pageSize,
        dataType: ['Foundation', 'SR Legacy', 'Branded'],
        sortBy: 'dataType.keyword',
        sortOrder: 'asc'
      })
    });

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const foods = (data.foods || []).map(food => this._transformFood(food));

    return {
      foods,
      totalHits: data.totalHits || 0
    };
  },

  /**
   * Get detailed nutrient info for a food item.
   * @param {string} fdcId - FoodData Central ID
   * @returns {Promise<Object>} Food detail with nutrients
   */
  async getFoodDetail(fdcId) {
    const url = `${this.BASE_URL}/food/${fdcId}?api_key=${this.API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this._transformFood(data);
  },

  /**
   * Scale nutrients to a given serving size in grams.
   * USDA reports nutrients per 100g, so we scale proportionally.
   * @param {Object} food - Transformed food object
   * @param {number} servingGrams - Desired serving size in grams
   * @returns {Object} Scaled nutrient values
   */
  scaleToServing(food, servingGrams) {
    const factor = servingGrams / 100;
    return {
      calories: Math.round((food.calories || 0) * factor),
      protein: Math.round((food.protein || 0) * factor * 10) / 10,
      carbs: Math.round((food.carbs || 0) * factor * 10) / 10,
      fat: Math.round((food.fat || 0) * factor * 10) / 10
    };
  },

  /**
   * Extract a nutrient value by nutrient number from a food's nutrient array.
   * @param {Array} nutrients - Array of nutrient objects
   * @param {string} nutrientNumber - USDA nutrient number
   * @returns {number} Nutrient value per 100g (or 0)
   */
  _getNutrient(nutrients, nutrientNumber) {
    if (!nutrients) return 0;
    const found = nutrients.find(n =>
      (n.nutrientNumber || n.number || (n.nutrient && n.nutrient.number)) === nutrientNumber
    );
    if (found) {
      return found.value || found.amount || 0;
    }
    return 0;
  },

  /**
   * Transform raw USDA food data into a clean object.
   * Nutrient numbers: 208 = Energy (kcal), 203 = Protein, 205 = Carbs, 204 = Fat
   */
  _transformFood(raw) {
    const nutrients = raw.foodNutrients || [];

    // Try different nutrient data shapes (search vs detail endpoints differ)
    let calories = 0, protein = 0, carbs = 0, fat = 0;

    for (const n of nutrients) {
      const num = n.nutrientNumber || n.number || (n.nutrient && n.nutrient.number) || '';
      const val = n.value || n.amount || 0;

      if (num === '208') calories = Math.round(val);
      else if (num === '203') protein = Math.round(val * 10) / 10;
      else if (num === '205') carbs = Math.round(val * 10) / 10;
      else if (num === '204') fat = Math.round(val * 10) / 10;
    }

    // Determine a reasonable serving size
    let servingSize = 100; // default per 100g
    let servingUnit = 'g';

    if (raw.servingSize) {
      servingSize = raw.servingSize;
      servingUnit = raw.servingSizeUnit || 'g';
    } else if (raw.foodPortions && raw.foodPortions.length > 0) {
      const portion = raw.foodPortions[0];
      servingSize = portion.gramWeight || 100;
      servingUnit = 'g';
    }

    return {
      fdcId: raw.fdcId,
      name: raw.description || raw.lowercaseDescription || 'Unknown',
      brand: raw.brandName || raw.brandOwner || '',
      dataType: raw.dataType || '',
      // Values per 100g
      calories,
      protein,
      carbs,
      fat,
      servingSize,
      servingUnit
    };
  }
};
