// ============================================
// api/wger.js - wger REST API Integration
// https://wger.de/api/v2/
// ============================================

const WgerAPI = {
  BASE_URL: 'https://wger.de/api/v2',
  LANGUAGE: 2, // English

  // Cache for categories and muscles (fetched once)
  _categories: null,
  _muscles: null,

  /**
   * Make a GET request to the wger API.
   * @param {string} endpoint - API endpoint path
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response data
   */
  async fetch(endpoint, params = {}) {
    const url = new URL(`${this.BASE_URL}/${endpoint}/`);
    url.searchParams.set('format', 'json');
    url.searchParams.set('language', this.LANGUAGE);

    Object.entries(params).forEach(([key, val]) => {
      if (val !== null && val !== undefined && val !== '') {
        url.searchParams.set(key, val);
      }
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`wger API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Search exercises by name, with optional category and muscle filters.
   * @param {Object} options
   * @param {string} options.query - Search term
   * @param {number} options.category - Category ID filter
   * @param {number} options.muscle - Muscle ID filter
   * @param {number} options.limit - Results per page
   * @param {number} options.offset - Pagination offset
   * @returns {Promise<Object>} { results, count, next, previous }
   */
  async searchExercises({ query = '', category = null, muscle = null, limit = 20, offset = 0 } = {}) {
    const params = { limit, offset };

    if (query) params.name = query;
    if (category) params.category = category;
    if (muscle) params.muscles = muscle;

    const data = await this.fetch('exercise/search', { term: query, language: this.LANGUAGE });

    // The search endpoint returns { suggestions: [...] }
    // We also try the exercise endpoint for filtering
    if (category || muscle || !query) {
      return this.getExercises({ query, category, muscle, limit, offset });
    }

    // Transform search results
    const suggestions = data.suggestions || [];
    const exercises = suggestions.map(s => ({
      id: s.data?.id || null,
      name: s.data?.name || s.value || '',
      category: s.data?.category?.name || '',
      categoryId: s.data?.category?.id || null,
      description: '',
      muscles: [],
      images: []
    }));

    return {
      results: exercises,
      count: exercises.length,
      next: null,
      previous: null
    };
  },

  /**
   * Get exercises list with filters (uses exerciseinfo for richer data).
   */
  async getExercises({ query = '', category = null, muscle = null, limit = 20, offset = 0 } = {}) {
    const params = { limit, offset, language: this.LANGUAGE };
    if (category && category !== 'all') params.category = category;
    if (muscle) params.muscles = muscle;

    const data = await this.fetch('exerciseinfo', params);

    const results = (data.results || [])
      .filter(ex => {
        // Filter to exercises with English translations
        const translation = ex.translations?.find(t => t.language === this.LANGUAGE);
        if (!translation) return false;
        if (query) {
          return translation.name.toLowerCase().includes(query.toLowerCase());
        }
        return true;
      })
      .map(ex => this._transformExercise(ex));

    return {
      results,
      count: data.count || results.length,
      next: data.next,
      previous: data.previous
    };
  },

  /**
   * Get detailed info for a single exercise.
   * @param {number} id - Exercise ID
   * @returns {Promise<Object>} Exercise detail object
   */
  async getExerciseDetail(id) {
    const data = await this.fetch(`exerciseinfo/${id}`);
    return this._transformExercise(data);
  },

  /**
   * Get all exercise categories.
   * @returns {Promise<Array>} Array of { id, name }
   */
  async getCategories() {
    if (this._categories) return this._categories;

    const data = await this.fetch('exercisecategory');
    this._categories = (data.results || []).map(c => ({
      id: c.id,
      name: c.name
    }));

    return this._categories;
  },

  /**
   * Get all muscles.
   * @returns {Promise<Array>} Array of { id, name, isFront }
   */
  async getMuscles() {
    if (this._muscles) return this._muscles;

    const data = await this.fetch('muscle');
    this._muscles = (data.results || []).map(m => ({
      id: m.id,
      name: m.name_en || m.name,
      isFront: m.is_front
    }));

    return this._muscles;
  },

  /**
   * Transform raw API exercise data into a clean object.
   */
  _transformExercise(raw) {
    const translation = raw.translations?.find(t => t.language === this.LANGUAGE) || {};

    const muscles = (raw.muscles || []).map(m => m.name_en || m.name);
    const secondaryMuscles = (raw.muscles_secondary || []).map(m => m.name_en || m.name);

    const images = (raw.images || []).map(img => ({
      url: img.image,
      isMain: img.is_main
    }));

    return {
      id: raw.id,
      name: translation.name || raw.name || 'Unknown Exercise',
      description: translation.description || '',
      category: raw.category?.name || '',
      categoryId: raw.category?.id || null,
      equipment: (raw.equipment || []).map(e => e.name),
      muscles,
      secondaryMuscles,
      images,
      variations: raw.variations || []
    };
  }
};
