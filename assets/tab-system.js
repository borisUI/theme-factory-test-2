/**
 * Tab System — Document-Level Module
 *
 * Groups tab navigation and tab content elements by data-tab-group attribute.
 * Handles tab switching, active states, and theme editor reinitialization.
 * Operates at document level — no custom element wrapper required.
 *
 * @example
 * <button data-tab-nav data-tab-group="group-1" data-tab-target="tab-a">Tab A</button>
 * <button data-tab-nav data-tab-group="group-1" data-tab-target="tab-b">Tab B</button>
 * <div data-tab-content data-tab-group="group-1" data-tab-id="tab-a">Content A</div>
 * <div data-tab-content data-tab-group="group-1" data-tab-id="tab-b">Content B</div>
 */

/** @type {number|null} */
let debounceTimer = null;

/** @type {Set<string>} Track groups where the user has clicked or keyboard-navigated */
const userInteractedGroups = new Set();

/**
 * Initialize all tab groups — activate the first tab in each group
 * (or the one marked data-tab-active="true").
 * Skips groups the user has already interacted with (unless in designMode).
 */
const initializeTabs = () => {
  const navItems = document.querySelectorAll('[data-tab-nav]');
  const contentItems = document.querySelectorAll('[data-tab-content]');

  /** @type {Map<string, boolean>} */
  const initializedGroups = new Map();

  for (const nav of navItems) {
    const groupId = nav.getAttribute('data-tab-group');
    if (!groupId || initializedGroups.has(groupId)) continue;

    // Skip user-interacted groups on the storefront to prevent race conditions.
    // In designMode, always reinitialize so editor block changes take effect.
    if (!Shopify.designMode && userInteractedGroups.has(groupId)) {
      initializedGroups.set(groupId, true);
      continue;
    }

    initializedGroups.set(groupId, true);

    const activeNav = document.querySelector(`[data-tab-nav][data-tab-group="${groupId}"][data-tab-active="true"]`);
    const defaultNav = activeNav || document.querySelector(`[data-tab-nav][data-tab-group="${groupId}"]`);
    if (!defaultNav) continue;

    const targetId = defaultNav.getAttribute('data-tab-target');
    activateTab(groupId, targetId);
  }

  // Hide content blocks that have no matching active nav
  for (const content of contentItems) {
    const groupId = content.getAttribute('data-tab-group');
    if (!groupId) continue;

    if (!initializedGroups.has(groupId)) {
      content.classList.remove('tab-content--active');
    }
  }
};

/**
 * Activate a specific tab within a group
 * @param {string} groupId - The group identifier
 * @param {string} targetId - The target tab identifier
 */
const activateTab = (groupId, targetId) => {
  const groupNavs = document.querySelectorAll(`[data-tab-nav][data-tab-group="${groupId}"]`);
  const groupContents = document.querySelectorAll(`[data-tab-content][data-tab-group="${groupId}"]`);

  for (const nav of groupNavs) {
    const isActive = nav.getAttribute('data-tab-target') === targetId;
    nav.classList.toggle('tab-nav--active', isActive);
    nav.setAttribute('aria-selected', isActive ? 'true' : 'false');
    nav.setAttribute('tabindex', isActive ? '0' : '-1');

    // Persist active state so initializeTabs() respects user selection on re-run
    if (isActive) {
      nav.setAttribute('data-tab-active', 'true');
    } else {
      nav.removeAttribute('data-tab-active');
    }
  }

  for (const content of groupContents) {
    const isActive = content.getAttribute('data-tab-id') === targetId;
    content.classList.toggle('tab-content--active', isActive);
  }
};

/**
 * Document-level click handler for tab navigation
 * @param {MouseEvent} event
 */
const handleClick = (event) => {
  const navButton = event.target.closest('[data-tab-nav]');
  if (!navButton) return;

  const groupId = navButton.getAttribute('data-tab-group');
  const targetId = navButton.getAttribute('data-tab-target');
  if (!groupId || !targetId) return;

  userInteractedGroups.add(groupId);
  activateTab(groupId, targetId);
};

/**
 * Document-level keydown handler for tab keyboard navigation
 * @param {KeyboardEvent} event
 */
const handleKeydown = (event) => {
  const navButton = event.target.closest('[data-tab-nav]');
  if (!navButton) return;

  const groupId = navButton.getAttribute('data-tab-group');
  if (!groupId) return;

  const groupNavs = [...document.querySelectorAll(`[data-tab-nav][data-tab-group="${groupId}"]`)];
  const currentIndex = groupNavs.indexOf(navButton);

  let nextIndex = -1;

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault();
    nextIndex = (currentIndex + 1) % groupNavs.length;
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault();
    nextIndex = (currentIndex - 1 + groupNavs.length) % groupNavs.length;
  } else if (event.key === 'Home') {
    event.preventDefault();
    nextIndex = 0;
  } else if (event.key === 'End') {
    event.preventDefault();
    nextIndex = groupNavs.length - 1;
  }

  if (nextIndex >= 0) {
    const nextNav = groupNavs[nextIndex];
    nextNav.focus();
    const targetId = nextNav.getAttribute('data-tab-target');
    userInteractedGroups.add(groupId);
    activateTab(groupId, targetId);
  }
};

/**
 * Handle shopify:section:load event for theme editor reinitialization
 */
const handleSectionLoad = () => {
  initializeTabs();
};

// Set up document-level event listeners
document.addEventListener('click', handleClick);
document.addEventListener('keydown', handleKeydown);
document.addEventListener('shopify:section:load', handleSectionLoad);

// Set up MutationObserver only in the theme editor — its sole purpose is
// handling editor block additions/removals. Storefront DOM churn (analytics,
// lazy images, deferred scripts) no longer triggers reinitialization.
if (Shopify.designMode) {
  const observer = new MutationObserver(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      initializeTabs();
    }, 100);
  });

  // Initialize and start observing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeTabs();
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  } else {
    initializeTabs();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
} else {
  // Storefront: initialize tabs once, no observer needed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTabs);
  } else {
    initializeTabs();
  }
}
