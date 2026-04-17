import { Component } from '@theme/component';

/**
 * @typedef {Object} ShopcomFooterRefs
 * @property {HTMLElement[]} accordionToggle - Accordion toggle buttons
 */

/** @extends {Component<ShopcomFooterRefs>} */
class ShopcomFooter extends Component {
  /** @type {MediaQueryList|null} */
  #mobileQuery = null;

  connectedCallback() {
    super.connectedCallback();
    this.#mobileQuery = window.matchMedia('(max-width: 749px)');
    this.#mobileQuery.addEventListener('change', this.#handleBreakpointChange.bind(this));
    this.#handleBreakpointChange();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.#mobileQuery) {
      this.#mobileQuery.removeEventListener('change', this.#handleBreakpointChange.bind(this));
      this.#mobileQuery = null;
    }
  }

  #handleBreakpointChange() {
    const isMobile = this.#mobileQuery?.matches ?? false;
    const accordions = this.querySelectorAll('[data-footer-accordion]');

    for (const accordion of accordions) {
      const button = accordion.querySelector('[data-footer-accordion-toggle]');
      const content = accordion.querySelector('[data-footer-accordion-content]');
      if (!button || !content) continue;

      if (isMobile) {
        const isDefault = accordion.hasAttribute('data-expanded-default');
        button.setAttribute('aria-expanded', String(isDefault));
        content.hidden = !isDefault;
      } else {
        button.setAttribute('aria-expanded', 'true');
        content.hidden = false;
      }
    }
  }

  handleAccordionToggle(event) {
    const isMobile = this.#mobileQuery?.matches ?? false;
    if (!isMobile) return;

    const button = event.currentTarget;
    const accordion = button.closest('[data-footer-accordion]');
    if (!accordion) return;

    const content = accordion.querySelector('[data-footer-accordion-content]');
    if (!content) return;

    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!isExpanded));
    content.hidden = isExpanded;
  }
}

customElements.define('shopcom-footer-component', ShopcomFooter);
