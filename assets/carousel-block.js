import { Component } from '@theme/component';

const SWIPER_CSS_CDN = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
const SWIPER_JS_CDN = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.esm.browser.min.js';

/**
 * @typedef {Object} CarouselBlockRefs
 * @property {HTMLElement} swiperContainer - The .swiper container element
 */

/** @extends {Component<CarouselBlockRefs>} */
class CarouselBlock extends Component {
  /** @type {import('swiper').Swiper | null} */
  #swiperInstance = null;

  /** @type {boolean} */
  #initialized = false;

  connectedCallback() {
    super.connectedCallback();

    if (!this.#initialized) {
      this.#initialized = true;
      this.#loadAndInit();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#destroySwiper();
  }

  async #loadAndInit() {
    try {
      this.#loadCSS();
      const SwiperModule = await import(/* webpackIgnore: true */ SWIPER_JS_CDN);
      const Swiper = SwiperModule.default || SwiperModule.Swiper;

      if (!Swiper) return;

      this.#initSwiper(Swiper);
    } catch (error) {
      console.error('[carousel-block] Failed to load Swiper:', error);
    }
  }

  #loadCSS() {
    if (document.querySelector(`link[href="${SWIPER_CSS_CDN}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = SWIPER_CSS_CDN;
    document.head.appendChild(link);
  }

  /**
   * @param {Function} Swiper - Swiper constructor
   */
  #initSwiper(Swiper) {
    const container = this.refs.swiperContainer || this.querySelector('.swiper');

    if (!container) return;

    const slidesPerViewMobile = this.#parseFloat('data-slides-per-view-mobile', 1);
    const slidesPerViewTablet = this.#parseFloat('data-slides-per-view-tablet', 2);
    const slidesPerViewDesktop = this.#parseFloat('data-slides-per-view-desktop', 3);

    const gapMobile = this.#parseInt('data-gap-mobile', 16);
    const gapTablet = this.#parseInt('data-gap-tablet', 20);
    const gapDesktop = this.#parseInt('data-gap-desktop', 24);

    const autoplayMobile = this.dataset.autoplayMobile === 'true';
    const autoplayTablet = this.dataset.autoplayTablet === 'true';
    const autoplayDesktop = this.dataset.autoplayDesktop === 'true';
    const autoplayDelay = this.#parseInt('data-autoplay-delay', 5) * 1000;

    const showArrows = this.dataset.showArrows === 'true';
    const externalArrows = this.dataset.externalArrows === 'true';
    const showDots = this.dataset.showDots === 'true';

    const shouldAutoplay = autoplayMobile || autoplayTablet || autoplayDesktop;

    /** @type {Object} */
    const config = {
      slidesPerView: slidesPerViewMobile,
      spaceBetween: gapMobile,
      breakpoints: {
        750: {
          slidesPerView: slidesPerViewTablet,
          spaceBetween: gapTablet,
        },
        990: {
          slidesPerView: slidesPerViewDesktop,
          spaceBetween: gapDesktop,
        },
      },
    };

    if (shouldAutoplay) {
      config.autoplay = {
        delay: autoplayDelay,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      };
    }

    if (showArrows) {
      if (externalArrows) {
        const prevEl = this.querySelector('.carousel-block__arrow--prev');
        const nextEl = this.querySelector('.carousel-block__arrow--next');

        if (prevEl && nextEl) {
          config.navigation = {
            prevEl,
            nextEl,
          };
        }
      } else {
        config.navigation = {
          prevEl: container.querySelector('.swiper-button-prev'),
          nextEl: container.querySelector('.swiper-button-next'),
        };
      }
    }

    if (showDots) {
      config.pagination = {
        el: container.querySelector('.swiper-pagination'),
        clickable: true,
      };
    }

    this.#swiperInstance = new Swiper(container, config);
  }

  #destroySwiper() {
    if (this.#swiperInstance) {
      this.#swiperInstance.destroy(true, true);
      this.#swiperInstance = null;
    }
  }

  /**
   * @param {string} attr - Data attribute name
   * @param {number} fallback - Fallback value
   * @returns {number}
   */
  #parseFloat(attr, fallback) {
    const value = parseFloat(this.getAttribute(attr));
    return Number.isFinite(value) ? value : fallback;
  }

  /**
   * @param {string} attr - Data attribute name
   * @param {number} fallback - Fallback value
   * @returns {number}
   */
  #parseInt(attr, fallback) {
    const value = parseInt(this.getAttribute(attr), 10);
    return Number.isFinite(value) ? value : fallback;
  }
}

customElements.define('carousel-block', CarouselBlock);
