// ============================================
// storage.js - localStorage Wrapper
// ============================================

const Storage = {
  /**
   * Get a value from localStorage, parsed from JSON.
   * Returns defaultValue if key doesn't exist or parsing fails.
   */
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(`liftfuel_${key}`);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  },

  /**
   * Set a value in localStorage, serialized as JSON.
   */
  set(key, value) {
    try {
      localStorage.setItem(`liftfuel_${key}`, JSON.stringify(value));
      return true;
    } catch {
      console.warn(`Storage: failed to save key "${key}"`);
      return false;
    }
  },

  /**
   * Remove a key from localStorage.
   */
  remove(key) {
    try {
      localStorage.removeItem(`liftfuel_${key}`);
    } catch {
      // Silently fail
    }
  },

  /**
   * Get all saved workouts.
   */
  getWorkouts() {
    return this.get('workouts', []);
  },

  /**
   * Save a workout session.
   */
  saveWorkout(workout) {
    const workouts = this.getWorkouts();
    workout.id = workout.id || Date.now().toString();
    workout.date = workout.date || new Date().toISOString();
    workouts.push(workout);
    this.set('workouts', workouts);
    return workout;
  },

  /**
   * Get today's meal log.
   */
  getTodayMeals() {
    const today = new Date().toISOString().split('T')[0];
    const allMeals = this.get('meals', {});
    return allMeals[today] || [];
  },

  /**
   * Save a meal to today's log.
   */
  saveMeal(meal) {
    const today = new Date().toISOString().split('T')[0];
    const allMeals = this.get('meals', {});
    if (!allMeals[today]) allMeals[today] = [];
    meal.id = meal.id || Date.now().toString();
    allMeals[today].push(meal);
    this.set('meals', allMeals);
    return meal;
  },

  /**
   * Get saved routines (workout templates).
   */
  getRoutines() {
    return this.get('routines', []);
  },

  /**
   * Save a routine template.
   */
  saveRoutine(routine) {
    const routines = this.getRoutines();
    routine.id = routine.id || Date.now().toString();
    routines.push(routine);
    this.set('routines', routines);
    return routine;
  },

  /**
   * Get user goals.
   */
  getGoals() {
    return this.get('goals', {
      dailyCalories: null,
      dailyProtein: null,
      weeklyWorkouts: null
    });
  },

  /**
   * Save user goals.
   */
  saveGoals(goals) {
    this.set('goals', goals);
  },

  /**
   * Get workout count for the current week.
   */
  getWeeklyWorkoutCount() {
    const workouts = this.getWorkouts();
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return workouts.filter(w => new Date(w.date) >= startOfWeek).length;
  },

  /**
   * Get today's calorie and protein totals from meals.
   */
  getTodayTotals() {
    const meals = this.getTodayMeals();
    return meals.reduce((totals, meal) => {
      totals.calories += meal.calories || 0;
      totals.protein += meal.protein || 0;
      totals.carbs += meal.carbs || 0;
      totals.fat += meal.fat || 0;
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  },

  /**
   * Calculate the current workout streak (consecutive days).
   */
  getStreak() {
    const workouts = this.getWorkouts();
    if (workouts.length === 0) return 0;

    // Get unique dates sorted descending
    const dates = [...new Set(
      workouts.map(w => new Date(w.date).toISOString().split('T')[0])
    )].sort().reverse();

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Streak must start from today or yesterday
    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const curr = new Date(dates[i - 1]);
      const prev = new Date(dates[i]);
      const diffDays = Math.round((curr - prev) / 86400000);

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
};
