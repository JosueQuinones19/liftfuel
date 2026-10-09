// ============================================
// dashboard.js - Dashboard Page Logic
// ============================================

(function () {
  function init() {
    updateStats();
    updateRecentActivity();
  }

  /** Update the stat cards with real data from Storage */
  function updateStats() {
    const weeklyWorkouts = Storage.getWeeklyWorkoutCount();
    const todayTotals = Storage.getTodayTotals();
    const streak = Storage.getStreak();

    const statWorkouts = document.getElementById('statWorkouts');
    const statCalories = document.getElementById('statCalories');
    const statProtein = document.getElementById('statProtein');
    const statStreak = document.getElementById('statStreak');

    if (statWorkouts) statWorkouts.textContent = weeklyWorkouts;
    if (statCalories) {
      statCalories.textContent = todayTotals.calories > 0
        ? formatNumber(todayTotals.calories)
        : '--';
    }
    if (statProtein) {
      statProtein.textContent = todayTotals.protein > 0
        ? `${Math.round(todayTotals.protein)}g`
        : '--';
    }
    if (statStreak) statStreak.textContent = streak;
  }

  /** Show recent workout activity */
  function updateRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    const workouts = Storage.getWorkouts();
    const recent = workouts.slice(-5).reverse();

    if (recent.length === 0) {
      // Keep the placeholder message
      return;
    }

    const items = recent.map(w => `
      <div class="quick-action-item" style="cursor: default;">
        <span class="qa-icon">&#127947;</span>
        <div>
          <div class="qa-text">${w.name || 'Workout'}</div>
          <div class="text-muted" style="font-size: 0.8rem;">${formatDate(w.date)}</div>
        </div>
      </div>
    `).join('');

    container.innerHTML = items;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
