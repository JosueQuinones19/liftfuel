// ============================================
// ui.js - Shared UI Components & Navigation
// ============================================
 
/** Initialize the mobile navigation toggle */
function initMobileNav() {
  const toggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
 
  if (!toggle || !mobileNav) return;
 
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    mobileNav.classList.toggle('open');
  });
 
  // Close mobile nav when a link is clicked
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      mobileNav.classList.remove('open');
    });
  });
 
  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
      toggle.classList.remove('open');
      mobileNav.classList.remove('open');
    }
  });
}
 
/** Show a specific state element and hide others */
function showState(stateId, containerIds) {
  containerIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById(stateId);
  if (target) target.style.display = '';
}
 
/** Create an exercise card element */
function createExerciseCard(exercise) {
  const card = document.createElement('div');
  card.className = 'exercise-card';
  card.dataset.id = exercise.id;
 
  const categoryBadge = exercise.category
    ? `<span class="badge badge-primary">${exercise.category}</span>`
    : '';
 
  const muscleBadges = (exercise.muscles || [])
    .map(m => `<span class="badge badge-accent">${m}</span>`)
    .join('');
 
  card.innerHTML = `
    <h3>${exercise.name}</h3>
    <div class="exercise-meta">
      ${categoryBadge}
      ${muscleBadges}
    </div>
  `;
 
  return card;
}
 
/** Open a modal with content */
function openModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
 
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
 
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(modalId);
  });
 
  // Close on Escape
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal(modalId);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}
 
/** Close a modal */
function closeModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
 
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}
 
/** Strip HTML tags for safe text rendering */
function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}
 
/** Format a date string to a readable format */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
 
// Initialize nav on every page
document.addEventListener('DOMContentLoaded', initMobileNav);
 