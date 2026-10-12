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
    initGoalsModal();
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
  // MACRO PROGRESS RINGS
  // =====================

  /**
   * Create an SVG progress ring.
   * @param {number} percent - 0 to 100
   * @param {string} color - CSS color for the ring
   * @param {number} size - diameter in px
   * @returns {string} SVG markup
   */
  function createProgressRing(percent, color, size = 100) {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

    return `
      <svg class="progress-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle
          class="progress-ring-bg"
          cx="${size / 2}" cy="${size / 2}" r="${radius}"
          stroke-width="${strokeWidth}"
        />
        <circle
          class="progress-ring-fill"
          cx="${size / 2}" cy="${size / 2}" r="${radius}"
          stroke-width="${strokeWidth}"
          stroke="${color}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${circumference}"
          data-target-offset="${offset}"
        />
      </svg>
    `;
  }

  function renderMacroProgress() {
    const container = document.getElementById('macroProgressContent');
    if (!container) return;

    const totals = Storage.getTodayTotals();
    const meals = Storage.getTodayMeals();
    const goals = Storage.getGoals();

    // If no meals logged today, show empty state
    if (meals.length === 0 && !goals.dailyCalories && !goals.dailyProtein) {
      container.innerHTML = `
        <div class="state-message">
          <div class="state-icon">&#127823;</div>
          <p>No meals logged today. <a href="nutrition.html">Log your first meal</a> to see your progress.</p>
        </div>
      `;
      return;
    }

    // Build macros config
    const macros = [
      {
        label: 'Calories',
        value: Math.round(totals.calories),
        goal: goals.dailyCalories,
        unit: '',
        color: 'var(--color-accent)',
        rawColor: '#E8853D'
      },
      {
        label: 'Protein',
        value: Math.round(totals.protein),
        goal: goals.dailyProtein,
        unit: 'g',
        color: 'var(--color-info)',
        rawColor: '#3B82C4'
      },
      {
        label: 'Carbs',
        value: Math.round(totals.carbs),
        goal: goals.dailyCarbs || null,
        unit: 'g',
        color: 'var(--color-success)',
        rawColor: '#22A75D'
      },
      {
        label: 'Fat',
        value: Math.round(totals.fat),
        goal: goals.dailyFat || null,
        unit: 'g',
        color: 'var(--color-warning)',
        rawColor: '#E8853D'
      }
    ];

    const hasAnyGoals = macros.some(m => m.goal && m.goal > 0);

    // If goals are set, show animated rings
    if (hasAnyGoals) {
      container.innerHTML = `
        <div class="progress-rings-grid">
          ${macros.map(macro => {
            const hasGoal = macro.goal && macro.goal > 0;
            const percent = hasGoal ? Math.round((macro.value / macro.goal) * 100) : 0;
            const displayPercent = Math.min(percent, 100);

            return `
              <div class="progress-ring-item${percent >= 100 ? ' goal-reached' : ''}">
                <div class="ring-container">
                  ${hasGoal ? createProgressRing(displayPercent, macro.rawColor, 100) : `
                    <div class="ring-placeholder">
                      <span class="ring-placeholder-text">--</span>
                    </div>
                  `}
                  ${hasGoal ? `<div class="ring-center-text">
                    <span class="ring-percent">${percent}%</span>
                  </div>` : ''}
                </div>
                <div class="ring-label">${macro.label}</div>
                <div class="ring-value">
                  ${formatNumber(macro.value)}${macro.unit}${hasGoal ? ` / ${formatNumber(macro.goal)}${macro.unit}` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top: var(--space-md); font-size: 0.8rem; color: var(--color-text-muted);">
          ${meals.length} meal${meals.length !== 1 ? 's' : ''} logged today
        </div>
      `;

      // Trigger ring animation after DOM paint
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          container.querySelectorAll('.progress-ring-fill').forEach(circle => {
            const targetOffset = circle.getAttribute('data-target-offset');
            circle.style.strokeDashoffset = targetOffset;
          });
        });
      });

    } else {
      // No goals set - show flat bars with prompt
      container.innerHTML = `
        <div class="macro-progress-grid">
          ${macros.map(macro => `
            <div class="macro-progress-item">
              <div class="macro-progress-label">
                <span class="macro-progress-name">${macro.label}</span>
                <span class="macro-progress-value">
                  ${formatNumber(macro.value)}${macro.unit}
                </span>
              </div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill" style="width: 100%; background: ${macro.color}; opacity: 0.4;"></div>
              </div>
              <div class="macro-progress-percent text-muted">No goal set</div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top: var(--space-md); text-align: center;">
          <button class="btn btn-outline btn-sm set-goals-prompt" id="setGoalsPromptBtn">
            Set goals to see animated progress rings
          </button>
        </div>
        ${meals.length > 0 ? `
          <div style="margin-top: var(--space-sm); font-size: 0.8rem; color: var(--color-text-muted);">
            ${meals.length} meal${meals.length !== 1 ? 's' : ''} logged today
          </div>
        ` : ''}
      `;

      // Wire up inline prompt button
      const promptBtn = document.getElementById('setGoalsPromptBtn');
      if (promptBtn) {
        promptBtn.addEventListener('click', () => openGoalsModal());
      }
    }
  }

  // =====================
  // GOALS MODAL
  // =====================

  function initGoalsModal() {
    const setGoalsBtn = document.getElementById('setGoalsBtn');
    const closeBtn = document.getElementById('goalsModalClose');
    const saveBtn = document.getElementById('saveGoalsBtn');

    if (setGoalsBtn) {
      setGoalsBtn.addEventListener('click', () => openGoalsModal());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal('goalsModal'));
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', saveGoals);
    }
  }

  function openGoalsModal() {
    const goals = Storage.getGoals();

    // Populate inputs with current values
    const calInput = document.getElementById('goalCalories');
    const proInput = document.getElementById('goalProtein');
    const carbInput = document.getElementById('goalCarbs');
    const fatInput = document.getElementById('goalFat');
    const workoutInput = document.getElementById('goalWorkouts');

    if (calInput) calInput.value = goals.dailyCalories || '';
    if (proInput) proInput.value = goals.dailyProtein || '';
    if (carbInput) carbInput.value = goals.dailyCarbs || '';
    if (fatInput) fatInput.value = goals.dailyFat || '';
    if (workoutInput) workoutInput.value = goals.weeklyWorkouts || '';

    openModal('goalsModal');
  }

  function saveGoals() {
    const calInput = document.getElementById('goalCalories');
    const proInput = document.getElementById('goalProtein');
    const carbInput = document.getElementById('goalCarbs');
    const fatInput = document.getElementById('goalFat');
    const workoutInput = document.getElementById('goalWorkouts');

    const goals = {
      dailyCalories: calInput && calInput.value ? parseInt(calInput.value) : null,
      dailyProtein: proInput && proInput.value ? parseInt(proInput.value) : null,
      dailyCarbs: carbInput && carbInput.value ? parseInt(carbInput.value) : null,
      dailyFat: fatInput && fatInput.value ? parseInt(fatInput.value) : null,
      weeklyWorkouts: workoutInput && workoutInput.value ? parseInt(workoutInput.value) : null
    };

    Storage.saveGoals(goals);
    closeModal('goalsModal');

    // Re-render with new goals
    renderMacroProgress();
    updateStats();
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
