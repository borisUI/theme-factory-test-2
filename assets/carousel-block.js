import { Component } from '@theme/component';

const SWIPER_CSS_CDN = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
const SWIPER_JS_CDN = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.mjs';

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

  /** @type {MediaQueryList | null} */
  #mqlTablet = null;

  /** @type {MediaQueryList | null} */
  #mqlDesktop = null;

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
    this.#removeBreakpointListeners();
  }

  async #loadAndInit() {
    try {
      this.#loadCSS();
      const SwiperModule = await import(/* webpackIgnore: true */ SWIPER_JS_CDN);
      const Swiper = SwiperModule.default || SwiperModule.Swiper;

      if (!Swiper) return;

      this.#initSwiper(Swiper);
      this.#setupBreakpointListeners();
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
   * Determines the current breakpoint name based on viewport width.
   * @returns {'mobile' | 'tablet' | 'desktop'}
   */
  #getCurrentBreakpoint() {
    if (window.matchMedia('(min-width: 990px)').matches) return 'desktop';
    if (window.matchMedia('(min-width: 750px)').matches) return 'tablet';
    return 'mobile';
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

    const autoplayDelayMobile = this.#parseInt('data-autoplay-delay-mobile', 5) * 1000;
    const autoplayDelayTablet = this.#parseInt('data-autoplay-delay-tablet', 5) * 1000;
    const autoplayDelayDesktop = this.#parseInt('data-autoplay-delay-desktop', 5) * 1000;

    const showArrowsMobile = this.dataset.showArrowsMobile === 'true';
    const showArrowsTablet = this.dataset.showArrowsTablet === 'true';
    const showArrowsDesktop = this.dataset.showArrowsDesktop === 'true';

    const externalArrowsMobile = this.dataset.externalArrowsMobile === 'true';
    const externalArrowsTablet = this.dataset.externalArrowsTablet === 'true';
    const externalArrowsDesktop = this.dataset.externalArrowsDesktop === 'true';

    const showDotsMobile = this.dataset.showDotsMobile === 'true';
    const showDotsTablet = this.dataset.showDotsTablet === 'true';
    const showDotsDesktop = this.dataset.showDotsDesktop === 'true';

    const shouldAutoplay = autoplayMobile || autoplayTablet || autoplayDesktop;
    const anyArrows = showArrowsMobile || showArrowsTablet || showArrowsDesktop;
    const anyDots = showDotsMobile || showDotsTablet || showDotsDesktop;

    const breakpoint = this.#getCurrentBreakpoint();
    const currentAutoplayDelay = breakpoint === 'desktop' ? autoplayDelayDesktop
      : breakpoint === 'tablet' ? autoplayDelayTablet
      : autoplayDelayMobile;

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
        delay: currentAutoplayDelay,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      };
    }

    if (anyArrows) {
      const prevExternal = this.querySelector('.carousel-block__arrow--prev');
      const nextExternal = this.querySelector('.carousel-block__arrow--next');
      const prevInternal = container.querySelector('.swiper-button-prev');
      const nextInternal = container.querySelector('.swiper-button-next');

      const prevEl = prevExternal || prevInternal;
      const nextEl = nextExternal || nextInternal;

      if (prevEl && nextEl) {
        config.navigation = {
          prevEl,
          nextEl,
        };
      }
    }

    if (anyDots) {
      config.pagination = {
        el: container.querySelector('.swiper-pagination'),
        clickable: true,
      };
    }

    this.#swiperInstance = new Swiper(container, config);

    this.#updateVisibility();
  }

  /**
   * Updates visibility of arrows and dots based on per-breakpoint settings.
   */
  #updateVisibility() {
    const breakpoint = this.#getCurrentBreakpoint();

    const showArrows = this.dataset[`showArrows${this.#capitalize(breakpoint)}`] === 'true';
    const externalArrows = this.dataset[`externalArrows${this.#capitalize(breakpoint)}`] === 'true';
    const showDots = this.dataset[`showDots${this.#capitalize(breakpoint)}`] === 'true';

    const externalPrev = this.querySelector('.carousel-block__arrow--prev');
    const externalNext = this.querySelector('.carousel-block__arrow--next');
    const internalPrev = this.querySelector('.swiper-button-prev');
    const internalNext = this.querySelector('.swiper-button-next');
    const pagination = this.querySelector('.swiper-pagination');

    if (externalPrev) externalPrev.hidden = !(showArrows && externalArrows);
    if (externalNext) externalNext.hidden = !(showArrows && externalArrows);
    if (internalPrev) internalPrev.hidden = !(showArrows && !externalArrows);
    if (internalNext) internalNext.hidden = !(showArrows && !externalArrows);
    if (pagination) pagination.hidden = !showDots;
  }

  /**
   * Sets up breakpoint change listeners to update visibility.
   */
  #setupBreakpointListeners() {
    this.#mqlTablet = window.matchMedia('(min-width: 750px)');
    this.#mqlDesktop = window.matchMedia('(min-width: 990px)');

    this.#mqlTablet.addEventListener('change', this.#handleBreakpointChange);
    this.#mqlDesktop.addEventListener('change', this.#handleBreakpointChange);
  }

  #removeBreakpointListeners() {
    if (this.#mqlTablet) {
      this.#mqlTablet.removeEventListener('change', this.#handleBreakpointChange);
    }
    if (this.#mqlDesktop) {
      this.#mqlDesktop.removeEventListener('change', this.#handleBreakpointChange);
    }
  }

  /** @type {() => void} */
  #handleBreakpointChange = () => {
    this.#updateVisibility();

    if (this.#swiperInstance) {
      const breakpoint = this.#getCurrentBreakpoint();
      const autoplayEnabled = this.dataset[`autoplay${this.#capitalize(breakpoint)}`] === 'true';
      const delayAttr = `data-autoplay-delay-${breakpoint}`;
      const delay = this.#parseInt(delayAttr, 5) * 1000;

      if (autoplayEnabled && this.#swiperInstance.autoplay) {
        this.#swiperInstance.params.autoplay = {
          delay,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        };
        this.#swiperInstance.autoplay.start();
      } else if (this.#swiperInstance.autoplay) {
        this.#swiperInstance.autoplay.stop();
      }
    }
  };

  #destroySwiper() {
    if (this.#swiperInstance) {
      this.#swiperInstance.destroy(true, true);
      this.#swiperInstance = null;
    }
  }

  /**
   * @param {string} str
   * @returns {string}
   */
  #capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
