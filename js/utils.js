// ============================================
// utils.js - Helper / Utility Functions
// ============================================

/**
 * Debounce a function call. Useful for search inputs.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Milliseconds to wait
 * @returns {Function} Debounced function
 */
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Truncate text to a given length and add ellipsis.
 * @param {string} text - Text to truncate
 * @param {number} maxLen - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLen = 120) {
  if (!text || text.length <= maxLen) return text || '';
  return text.substring(0, maxLen).trimEnd() + '...';
}

/**
 * Capitalize the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate a simple unique ID.
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/**
 * Get today's date in YYYY-MM-DD format.
 * @returns {string}
 */
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format a number with commas (e.g., 1234 -> "1,234").
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  if (num === null || num === undefined) return '--';
  return num.toLocaleString('en-US');
}

/**
 * Clamp a number between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Check if a string is empty or only whitespace.
 * @param {string} str
 * @returns {boolean}
 */
function isEmpty(str) {
  return !str || str.trim().length === 0;
}

/**
 * Create an HTML element from a template string.
 * @param {string} html
 * @returns {HTMLElement}
 */
function htmlToElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}
