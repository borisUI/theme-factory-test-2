import { Component } from '@theme/component';

/**
 * @typedef {Object} ShopcomHeaderRefs
 * @property {HTMLElement} headerMain - Main header row
 * @property {HTMLElement} sentinel - Intersection observer sentinel
 * @property {HTMLElement} menuDrawer - Mega menu drawer
 * @property {HTMLElement} menuOverlay - Menu overlay backdrop
 * @property {HTMLElement} menuToggle - Hamburger menu button
 * @property {HTMLElement[]} panelTrigger - Drill-down panel triggers
 * @property {HTMLElement[]} backButton - Back buttons in panels
 * @property {HTMLElement[]} closeButton - Close buttons
 * @property {HTMLElement[]} accordionToggle - Accordion toggles in brands panel
 */

/** @extends {Component<ShopcomHeaderRefs>} */
class ShopcomHeader extends Component {
  /** @type {IntersectionObserver|null} */
  #stickyObserver = null;

  /** @type {string[]} */
  #panelStack = ['main'];

  connectedCallback() {
    super.connectedCallback();
    this.#initSticky();
    this.#updateHeaderHeight();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.#stickyObserver) {
      this.#stickyObserver.disconnect();
      this.#stickyObserver = null;
    }
  }

  #initSticky() {
    if (!this.refs.sentinel) return;

    this.#stickyObserver = new IntersectionObserver(
      ([entry]) => {
        this.classList.toggle('is-sticky', !entry.isIntersecting);
      },
      { threshold: 0 }
    );

    this.#stickyObserver.observe(this.refs.sentinel);
  }

  #updateHeaderHeight() {
    requestAnimationFrame(() => {
      const height = this.offsetHeight;
      document.documentElement.style.setProperty('--shopcom-header-height', `${height}px`);
    });
  }

  /* ----------------------------------------------------------------
   * Menu open / close
   * ---------------------------------------------------------------- */

  handleMenuOpen() {
    if (!this.refs.menuDrawer) return;

    this.refs.menuDrawer.classList.add('is-open');

    if (this.refs.menuOverlay) {
      this.refs.menuOverlay.classList.add('is-visible');
    }

    document.body.style.overflow = 'hidden';
    this.#panelStack = ['main'];
    this.#showPanel('main');
  }

  handleMenuClose() {
    if (!this.refs.menuDrawer) return;

    this.refs.menuDrawer.classList.remove('is-open');

    if (this.refs.menuOverlay) {
      this.refs.menuOverlay.classList.remove('is-visible');
    }

    document.body.style.overflow = '';

    // Reset all panels after transition
    setTimeout(() => {
      this.#resetPanels();
    }, 300);
  }

  handleOverlayClick() {
    this.handleMenuClose();
  }

  /* ----------------------------------------------------------------
   * Drill-down navigation
   * ---------------------------------------------------------------- */

  handleDrillDown(panelId, event) {
    event.preventDefault();
    this.#panelStack.push(panelId);
    this.#showPanel(panelId);
  }

  handleBack() {
    if (this.#panelStack.length <= 1) return;

    this.#panelStack.pop();
    const previousPanel = this.#panelStack[this.#panelStack.length - 1];
    this.#showPanel(previousPanel);
  }

  #showPanel(panelId) {
    const panels = this.querySelectorAll('[data-menu-panel]');

    for (const panel of panels) {
      const id = panel.getAttribute('data-menu-panel');

      if (id === panelId) {
        panel.classList.add('is-active');
        panel.classList.remove('is-hidden-left');
      } else if (this.#panelStack.includes(id)) {
        panel.classList.remove('is-active');
        panel.classList.add('is-hidden-left');
      } else {
        panel.classList.remove('is-active');
        panel.classList.remove('is-hidden-left');
      }
    }
  }

  #resetPanels() {
    this.#panelStack = ['main'];
    const panels = this.querySelectorAll('[data-menu-panel]');

    for (const panel of panels) {
      panel.classList.remove('is-active', 'is-hidden-left');

      if (panel.getAttribute('data-menu-panel') === 'main') {
        panel.classList.add('is-active');
      }
    }
  }

  /* ----------------------------------------------------------------
   * Sub-category drill-down (dynamic panel)
   * ---------------------------------------------------------------- */

  handleSubCategory(handle, title, event) {
    event.preventDefault();
    const subPanel = this.querySelector('[data-menu-panel="sub-category"]');
    if (!subPanel) return;

    const titleEl = subPanel.querySelector('[data-subcategory-title]');
    if (titleEl) {
      titleEl.textContent = title;
    }

    const linksContainer = subPanel.querySelector('[data-subcategory-links]');
    if (!linksContainer) return;

    // Links are pre-rendered; show matching set, hide others
    const allSets = linksContainer.querySelectorAll('[data-parent-handle]');

    for (const set of allSets) {
      set.hidden = set.getAttribute('data-parent-handle') !== handle;
    }

    this.#panelStack.push('sub-category');
    this.#showPanel('sub-category');
  }

  /* ----------------------------------------------------------------
   * Accordion (Shop by Brands)
   * ---------------------------------------------------------------- */

  handleAccordionToggle(event) {
    const button = event.currentTarget;
    const content = button.nextElementSibling;
    if (!content) return;

    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!isExpanded));
    content.hidden = isExpanded;
  }
}

customElements.define('shopcom-header-component', ShopcomHeader);
