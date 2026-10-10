// ============================================
// dashboard.js - Dashboard Page Logic
// ============================================

(function () {
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function init() {
    updateStats();
    renderTodayRoutine();
    renderMacroProgress();
    updateRecentActivity();
  }

  // =====================
  // STAT CARDS
  // =====================

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

  // =====================
  // TODAY'S ROUTINE
  // =====================

  function renderTodayRoutine() {
    const noRoutineMsg = document.getElementById('noRoutineMsg');
    const contentDiv = document.getElementById('todayRoutineContent');
    if (!contentDiv) return;

    const routines = Storage.getRoutines();
    const todayName = DAY_NAMES[new Date().getDay()];

    // Find routines assigned to today
    const todayRoutines = routines.filter(r =>
      r.days && r.days.includes(todayName)
    );

    if (todayRoutines.length === 0) {
      if (noRoutineMsg) noRoutineMsg.style.display = '';
      contentDiv.style.display = 'none';
      return;
    }

    if (noRoutineMsg) noRoutineMsg.style.display = 'none';
    contentDiv.style.display = '';

    contentDiv.innerHTML = todayRoutines.map(routine => `
      <div class="routine-summary">
        <div class="routine-summary-header">
          <h3 class="routine-summary-name">${routine.name}</h3>
          <span class="badge badge-primary">${routine.exercises.length} exercise${routine.exercises.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="routine-exercise-list">
          ${routine.exercises.map(ex => `
            <div class="routine-exercise-row">
              <span class="routine-exercise-name">${ex.name}</span>
              <span class="routine-exercise-detail">${ex.sets} x ${ex.reps}${ex.weight > 0 ? ` @ ${ex.weight} lb` : ''}</span>
            </div>
          `).join('')}
        </div>
        <a href="workouts.html" class="btn btn-primary btn-sm" style="margin-top: var(--space-md);">
          Start Workout &#8594;
        </a>
      </div>
    `).join('');
  }

  // =====================
  // MACRO PROGRESS
  // =====================

  function renderMacroProgress() {
    const container = document.getElementById('macroProgressContent');
    if (!container) return;

    const totals = Storage.getTodayTotals();
    const meals = Storage.getTodayMeals();
    const goals = Storage.getGoals();

    // If no meals logged today, show empty state
    if (meals.length === 0) {
      container.innerHTML = `
        <div class="state-message">
          <div class="state-icon">&#127823;</div>
          <p>No meals logged today. <a href="nutrition.html">Log your first meal</a> to see your progress.</p>
        </div>
      `;
      return;
    }

    // Build macro bars (use goals if set, otherwise show totals without target)
    const macros = [
      {
        label: 'Calories',
        value: Math.round(totals.calories),
        goal: goals.dailyCalories,
        unit: '',
        color: 'var(--color-accent)'
      },
      {
        label: 'Protein',
        value: Math.round(totals.protein),
        goal: goals.dailyProtein,
        unit: 'g',
        color: 'var(--color-info)'
      },
      {
        label: 'Carbs',
        value: Math.round(totals.carbs),
        goal: null,
        unit: 'g',
        color: 'var(--color-success)'
      },
      {
        label: 'Fat',
        value: Math.round(totals.fat),
        goal: null,
        unit: 'g',
        color: 'var(--color-warning)'
      }
    ];

    container.innerHTML = `
      <div class="macro-progress-grid">
        ${macros.map(macro => {
          const hasGoal = macro.goal && macro.goal > 0;
          const percent = hasGoal ? Math.min(Math.round((macro.value / macro.goal) * 100), 100) : null;

          return `
            <div class="macro-progress-item">
              <div class="macro-progress-label">
                <span class="macro-progress-name">${macro.label}</span>
                <span class="macro-progress-value">
                  ${formatNumber(macro.value)}${macro.unit}${hasGoal ? ` / ${formatNumber(macro.goal)}${macro.unit}` : ''}
                </span>
              </div>
              ${hasGoal ? `
                <div class="progress-bar-track">
                  <div class="progress-bar-fill" style="width: ${percent}%; background: ${macro.color};"></div>
                </div>
                <div class="macro-progress-percent">${percent}%</div>
              ` : `
                <div class="progress-bar-track">
                  <div class="progress-bar-fill" style="width: 100%; background: ${macro.color}; opacity: 0.4;"></div>
                </div>
                <div class="macro-progress-percent text-muted">No goal set</div>
              `}
            </div>
          `;
        }).join('')}
      </div>
      <div style="margin-top: var(--space-md); font-size: 0.8rem; color: var(--color-text-muted);">
        ${meals.length} meal${meals.length !== 1 ? 's' : ''} logged today
      </div>
    `;
  }

  // =====================
  // RECENT ACTIVITY
  // =====================

  function updateRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    const workouts = Storage.getWorkouts();
    const recent = workouts.slice(-5).reverse();

    if (recent.length === 0) {
      // Keep the placeholder message
      return;
    }

    const items = recent.map(w => {
      const exerciseCount = (w.exercises || []).length;
      const totalSets = (w.exercises || []).reduce(
        (sum, ex) => sum + (ex.sets ? ex.sets.length : 0), 0
      );

      return `
        <div class="activity-item">
          <div class="activity-icon">&#127947;</div>
          <div class="activity-info">
            <div class="activity-name">${w.name || 'Workout'}</div>
            <div class="activity-detail">
              ${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}
              &middot; ${totalSets} set${totalSets !== 1 ? 's' : ''}
            </div>
            <div class="activity-date">${formatDate(w.date)}</div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = items;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
