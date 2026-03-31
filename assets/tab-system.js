/**
 * Tab System Custom Element
 *
 * Groups tab navigation and tab content elements by data-tab-group attribute.
 * Handles tab switching, active states, and theme editor reinitialization.
 *
 * @example
 * <tab-system>
 *   <button data-tab-nav data-tab-group="group-1" data-tab-target="tab-a">Tab A</button>
 *   <button data-tab-nav data-tab-group="group-1" data-tab-target="tab-b">Tab B</button>
 *   <div data-tab-content data-tab-group="group-1" data-tab-id="tab-a">Content A</div>
 *   <div data-tab-content data-tab-group="group-1" data-tab-id="tab-b">Content B</div>
 * </tab-system>
 */
class TabSystem extends HTMLElement {
  /** @type {MutationObserver|null} */
  #observer = null;

  /** @type {number|null} */
  #debounceTimer = null;

  connectedCallback() {
    this.#initializeTabs();
    this.#setupClickListeners();
    this.#setupMutationObserver();

    document.addEventListener('shopify:section:load', this.#handleSectionLoad);
  }

  disconnectedCallback() {
    document.removeEventListener('shopify:section:load', this.#handleSectionLoad);

    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }

    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
  }

  /**
   * Initialize all tab groups — activate the first tab in each group
   */
  #initializeTabs() {
    const navItems = this.querySelectorAll('[data-tab-nav]');
    const contentItems = this.querySelectorAll('[data-tab-content]');

    /** @type {Map<string, boolean>} */
    const initializedGroups = new Map();

    for (const nav of navItems) {
      const groupId = nav.getAttribute('data-tab-group');
      if (!groupId || initializedGroups.has(groupId)) continue;

      initializedGroups.set(groupId, true);

      const activeNav = this.querySelector(`[data-tab-nav][data-tab-group="${groupId}"][data-tab-active="true"]`);
      const defaultNav = activeNav || this.querySelector(`[data-tab-nav][data-tab-group="${groupId}"]`);
      if (!defaultNav) continue;

      const targetId = defaultNav.getAttribute('data-tab-target');
      this.#activateTab(groupId, targetId);
    }

    // Hide content blocks that have no matching active nav
    for (const content of contentItems) {
      const groupId = content.getAttribute('data-tab-group');
      if (!groupId) continue;

      if (!initializedGroups.has(groupId)) {
        content.classList.remove('tab-content--active');
      }
    }
  }

  /**
   * Activate a specific tab within a group
   * @param {string} groupId - The group identifier
   * @param {string} targetId - The target tab identifier
   */
  #activateTab(groupId, targetId) {
    const groupNavs = this.querySelectorAll(`[data-tab-nav][data-tab-group="${groupId}"]`);
    const groupContents = this.querySelectorAll(`[data-tab-content][data-tab-group="${groupId}"]`);

    for (const nav of groupNavs) {
      const isActive = nav.getAttribute('data-tab-target') === targetId;
      nav.classList.toggle('tab-nav--active', isActive);
      nav.setAttribute('aria-selected', isActive ? 'true' : 'false');
      nav.setAttribute('tabindex', isActive ? '0' : '-1');
    }

    for (const content of groupContents) {
      const isActive = content.getAttribute('data-tab-id') === targetId;
      content.classList.toggle('tab-content--active', isActive);
    }
  }

  /**
   * Set up click listeners using event delegation
   */
  #setupClickListeners() {
    this.addEventListener('click', (event) => {
      const navButton = event.target.closest('[data-tab-nav]');
      if (!navButton) return;

      const groupId = navButton.getAttribute('data-tab-group');
      const targetId = navButton.getAttribute('data-tab-target');
      if (!groupId || !targetId) return;

      this.#activateTab(groupId, targetId);
    });

    this.addEventListener('keydown', (event) => {
      const navButton = event.target.closest('[data-tab-nav]');
      if (!navButton) return;

      const groupId = navButton.getAttribute('data-tab-group');
      if (!groupId) return;

      const groupNavs = [...this.querySelectorAll(`[data-tab-nav][data-tab-group="${groupId}"]`)];
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
        this.#activateTab(groupId, targetId);
      }
    });
  }

  /**
   * Set up MutationObserver for theme editor block changes
   */
  #setupMutationObserver() {
    this.#observer = new MutationObserver(() => {
      if (this.#debounceTimer) {
        clearTimeout(this.#debounceTimer);
      }

      this.#debounceTimer = setTimeout(() => {
        this.#initializeTabs();
      }, 100);
    });

    this.#observer.observe(this, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Handle shopify:section:load event for theme editor reinitialization
   * @param {CustomEvent} event
   */
  #handleSectionLoad = (event) => {
    if (this.closest(`[id="${event.detail.sectionId}"]`)) {
      this.#initializeTabs();
    }
  };
}

customElements.define('tab-system', TabSystem);
