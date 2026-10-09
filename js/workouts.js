// ============================================
// workouts.js - Workout Builder, Logging & History
// ============================================

(function () {
  // --- Tab switching ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${target}`).classList.add('active');

      // Refresh data when switching tabs
      if (target === 'history') renderHistory();
      if (target === 'log') populateRoutineSelect();
    });
  });

  // =====================
  // ROUTINE BUILDER
  // =====================

  const routineNameInput = document.getElementById('routineName');
  const daySelector = document.getElementById('daySelector');
  const exerciseNameInput = document.getElementById('exerciseNameInput');
  const exerciseSets = document.getElementById('exerciseSets');
  const exerciseReps = document.getElementById('exerciseReps');
  const exerciseWeight = document.getElementById('exerciseWeight');
  const addExerciseBtn = document.getElementById('addExerciseBtn');
  const routineExercisesDiv = document.getElementById('routineExercises');
  const saveRoutineBtn = document.getElementById('saveRoutineBtn');
  const savedRoutinesDiv = document.getElementById('savedRoutines');

  let currentRoutineExercises = [];
  let selectedDays = [];

  // Day selector toggles
  daySelector.addEventListener('click', (e) => {
    const badge = e.target.closest('.day-badge');
    if (!badge) return;
    badge.classList.toggle('selected');
    updateSelectedDays();
  });

  function updateSelectedDays() {
    selectedDays = [];
    daySelector.querySelectorAll('.day-badge.selected').forEach(b => {
      selectedDays.push(b.dataset.day);
    });
  }

  // Add exercise to current routine
  addExerciseBtn.addEventListener('click', () => {
    const name = exerciseNameInput.value.trim();
    const sets = parseInt(exerciseSets.value) || 3;
    const reps = parseInt(exerciseReps.value) || 10;
    const weight = parseFloat(exerciseWeight.value) || 0;

    if (!name) {
      exerciseNameInput.focus();
      return;
    }

    currentRoutineExercises.push({
      name,
      sets,
      reps,
      weight
    });

    // Clear inputs
    exerciseNameInput.value = '';
    exerciseSets.value = '';
    exerciseReps.value = '';
    exerciseWeight.value = '';
    exerciseNameInput.focus();

    renderRoutinePreview();
  });

  // Enter key on exercise name adds it
  exerciseNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addExerciseBtn.click();
  });

  function renderRoutinePreview() {
    if (currentRoutineExercises.length === 0) {
      routineExercisesDiv.innerHTML = '';
      return;
    }

    routineExercisesDiv.innerHTML = currentRoutineExercises.map((ex, i) => `
      <div class="exercise-item">
        <div class="exercise-item-info">
          <div class="exercise-item-name">${ex.name}</div>
          <div class="exercise-item-detail">${ex.sets} sets x ${ex.reps} reps${ex.weight > 0 ? ` @ ${ex.weight} lb` : ''}</div>
        </div>
        <button class="btn-remove" data-index="${i}" title="Remove">&times;</button>
      </div>
    `).join('');

    // Remove buttons
    routineExercisesDiv.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        currentRoutineExercises.splice(parseInt(btn.dataset.index), 1);
        renderRoutinePreview();
      });
    });
  }

  // Save routine
  saveRoutineBtn.addEventListener('click', () => {
    const name = routineNameInput.value.trim();
    if (!name) {
      routineNameInput.focus();
      return;
    }
    if (currentRoutineExercises.length === 0) {
      exerciseNameInput.focus();
      return;
    }

    const routine = {
      name,
      days: [...selectedDays],
      exercises: [...currentRoutineExercises]
    };

    Storage.saveRoutine(routine);

    // Reset form
    routineNameInput.value = '';
    currentRoutineExercises = [];
    selectedDays = [];
    daySelector.querySelectorAll('.day-badge').forEach(b => b.classList.remove('selected'));
    renderRoutinePreview();
    renderSavedRoutines();
  });

  function renderSavedRoutines() {
    const routines = Storage.getRoutines();
    const noRoutines = document.getElementById('noRoutines');

    if (routines.length === 0) {
      savedRoutinesDiv.innerHTML = '';
      if (noRoutines) savedRoutinesDiv.appendChild(noRoutines);
      noRoutines.style.display = '';
      return;
    }

    if (noRoutines) noRoutines.style.display = 'none';

    savedRoutinesDiv.innerHTML = routines.map((r, idx) => `
      <div class="routine-card">
        <div class="routine-card-header">
          <h3>${r.name}</h3>
          <button class="btn btn-outline btn-sm delete-routine-btn" data-index="${idx}">Delete</button>
        </div>
        ${r.days && r.days.length > 0 ? `
          <div class="routine-days" style="margin-bottom: var(--space-md);">
            ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d =>
              `<span class="day-badge${r.days.includes(d) ? ' active' : ''}">${d.charAt(0)}</span>`
            ).join('')}
          </div>
        ` : ''}
        <div class="routine-exercises">
          ${r.exercises.map(ex => `
            <div class="exercise-item">
              <div class="exercise-item-info">
                <div class="exercise-item-name">${ex.name}</div>
                <div class="exercise-item-detail">${ex.sets} sets x ${ex.reps} reps${ex.weight > 0 ? ` @ ${ex.weight} lb` : ''}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Delete routine buttons
    savedRoutinesDiv.querySelectorAll('.delete-routine-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        const routines = Storage.getRoutines();
        routines.splice(idx, 1);
        Storage.set('routines', routines);
        renderSavedRoutines();
      });
    });
  }

  // =====================
  // WORKOUT LOGGING
  // =====================

  const logRoutineSelect = document.getElementById('logRoutineSelect');
  const logExerciseName = document.getElementById('logExerciseName');
  const addLogExerciseBtn = document.getElementById('addLogExerciseBtn');
  const logExercisesDiv = document.getElementById('logExercises');
  const saveSessionBtn = document.getElementById('saveSessionBtn');

  let loggedExercises = []; // { name, sets: [{ reps, weight }] }

  function populateRoutineSelect() {
    const routines = Storage.getRoutines();
    logRoutineSelect.innerHTML = '<option value="">-- Select a routine --</option>';
    routines.forEach((r, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = r.name;
      logRoutineSelect.appendChild(opt);
    });
  }

  // Load routine into log
  logRoutineSelect.addEventListener('change', () => {
    const idx = parseInt(logRoutineSelect.value);
    if (isNaN(idx)) return;

    const routines = Storage.getRoutines();
    const routine = routines[idx];
    if (!routine) return;

    loggedExercises = routine.exercises.map(ex => ({
      name: ex.name,
      sets: Array.from({ length: ex.sets }, () => ({
        reps: ex.reps,
        weight: ex.weight
      }))
    }));

    renderLogExercises();
  });

  // Add manual exercise to log
  addLogExerciseBtn.addEventListener('click', () => {
    const name = logExerciseName.value.trim();
    if (!name) {
      logExerciseName.focus();
      return;
    }

    loggedExercises.push({
      name,
      sets: [{ reps: 10, weight: 0 }]
    });

    logExerciseName.value = '';
    renderLogExercises();
  });

  logExerciseName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addLogExerciseBtn.click();
  });

  function renderLogExercises() {
    if (loggedExercises.length === 0) {
      logExercisesDiv.innerHTML = '<div class="empty-inline">No exercises added yet</div>';
      return;
    }

    logExercisesDiv.innerHTML = loggedExercises.map((ex, exIdx) => `
      <div class="session-card" style="margin-bottom: var(--space-md);">
        <div class="session-header">
          <h3 style="font-size:0.95rem;">${ex.name}</h3>
          <div style="display:flex; gap:var(--space-xs);">
            <button class="btn btn-outline btn-sm add-set-btn" data-ex="${exIdx}">+ Set</button>
            <button class="btn-remove remove-exercise-btn" data-ex="${exIdx}" title="Remove">&times;</button>
          </div>
        </div>
        <div class="session-exercises">
          ${ex.sets.map((set, setIdx) => `
            <div class="log-set-row">
              <span class="set-number">${setIdx + 1}</span>
              <div class="form-group">
                <input type="number" class="log-reps" data-ex="${exIdx}" data-set="${setIdx}"
                       value="${set.reps}" min="1" max="100" placeholder="Reps">
              </div>
              <span class="text-muted" style="font-size:0.8rem;">x</span>
              <div class="form-group">
                <input type="number" class="log-weight" data-ex="${exIdx}" data-set="${setIdx}"
                       value="${set.weight}" min="0" step="2.5" placeholder="lb">
              </div>
              <span class="text-muted" style="font-size:0.8rem;">lb</span>
              ${ex.sets.length > 1 ? `<button class="btn-remove remove-set-btn" data-ex="${exIdx}" data-set="${setIdx}" title="Remove set" style="font-size:0.9rem;">&times;</button>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Event listeners for inputs
    logExercisesDiv.querySelectorAll('.log-reps').forEach(input => {
      input.addEventListener('change', () => {
        const ex = parseInt(input.dataset.ex);
        const set = parseInt(input.dataset.set);
        loggedExercises[ex].sets[set].reps = parseInt(input.value) || 0;
      });
    });

    logExercisesDiv.querySelectorAll('.log-weight').forEach(input => {
      input.addEventListener('change', () => {
        const ex = parseInt(input.dataset.ex);
        const set = parseInt(input.dataset.set);
        loggedExercises[ex].sets[set].weight = parseFloat(input.value) || 0;
      });
    });

    // Add set buttons
    logExercisesDiv.querySelectorAll('.add-set-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const exIdx = parseInt(btn.dataset.ex);
        const lastSet = loggedExercises[exIdx].sets[loggedExercises[exIdx].sets.length - 1];
        loggedExercises[exIdx].sets.push({ reps: lastSet.reps, weight: lastSet.weight });
        renderLogExercises();
      });
    });

    // Remove set buttons
    logExercisesDiv.querySelectorAll('.remove-set-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const exIdx = parseInt(btn.dataset.ex);
        const setIdx = parseInt(btn.dataset.set);
        loggedExercises[exIdx].sets.splice(setIdx, 1);
        renderLogExercises();
      });
    });

    // Remove exercise buttons
    logExercisesDiv.querySelectorAll('.remove-exercise-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        loggedExercises.splice(parseInt(btn.dataset.ex), 1);
        renderLogExercises();
      });
    });
  }

  // Save session
  saveSessionBtn.addEventListener('click', () => {
    if (loggedExercises.length === 0) return;

    // Read current values from inputs
    logExercisesDiv.querySelectorAll('.log-reps').forEach(input => {
      const ex = parseInt(input.dataset.ex);
      const set = parseInt(input.dataset.set);
      loggedExercises[ex].sets[set].reps = parseInt(input.value) || 0;
    });
    logExercisesDiv.querySelectorAll('.log-weight').forEach(input => {
      const ex = parseInt(input.dataset.ex);
      const set = parseInt(input.dataset.set);
      loggedExercises[ex].sets[set].weight = parseFloat(input.value) || 0;
    });

    const routineIdx = parseInt(logRoutineSelect.value);
    const routines = Storage.getRoutines();
    const routineName = !isNaN(routineIdx) && routines[routineIdx]
      ? routines[routineIdx].name
      : 'Freestyle Workout';

    const session = {
      name: routineName,
      exercises: loggedExercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.map(s => ({ reps: s.reps, weight: s.weight }))
      }))
    };

    Storage.saveWorkout(session);

    // Reset
    loggedExercises = [];
    logRoutineSelect.value = '';
    renderLogExercises();

    // Switch to history tab
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    document.querySelector('[data-tab="history"]').classList.add('active');
    document.getElementById('tab-history').classList.add('active');
    renderHistory();
  });

  // =====================
  // SESSION HISTORY
  // =====================

  function renderHistory() {
    const workouts = Storage.getWorkouts();
    const noHistory = document.getElementById('noHistory');
    const container = document.getElementById('sessionHistory');

    if (workouts.length === 0) {
      container.innerHTML = '';
      if (noHistory) container.appendChild(noHistory);
      return;
    }

    // Show most recent first
    const sorted = [...workouts].reverse();

    container.innerHTML = sorted.map(w => `
      <div class="session-card">
        <div class="session-header">
          <h3>${w.name || 'Workout'}</h3>
          <span class="session-date">${formatDate(w.date)}</span>
        </div>
        <div class="session-exercises">
          ${(w.exercises || []).map(ex => `
            <div class="exercise-item">
              <div class="exercise-item-info">
                <div class="exercise-item-name">${ex.name}</div>
                <div class="exercise-item-detail">
                  ${(ex.sets || []).map((s, i) =>
                    `Set ${i + 1}: ${s.reps} reps @ ${s.weight} lb`
                  ).join(' | ')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // --- Init ---
  function init() {
    renderSavedRoutines();
    populateRoutineSelect();
    renderLogExercises();
    renderHistory();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
