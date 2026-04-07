/**
 * Custom Product Card custom element.
 * Handles add-to-cart button click, posting to /cart/add.js.
 */
class CustomProductCard extends HTMLElement {
  connectedCallback() {
    this.atcBtn = this.querySelector('.custom-product-card__atc-btn');
    if (!this.atcBtn) return;

    this.atcBtn.addEventListener('click', this.handleAddToCart.bind(this));
  }

  disconnectedCallback() {
    if (this.atcBtn) {
      this.atcBtn.removeEventListener('click', this.handleAddToCart.bind(this));
    }
  }

  async handleAddToCart(event) {
    event.preventDefault();

    const variantId = this.atcBtn.dataset.variantId;
    if (!variantId) return;

    const originalText = this.atcBtn.textContent;
    this.atcBtn.disabled = true;
    this.atcBtn.textContent = 'ADDING...';

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(variantId, 10), quantity: 1 })
      });

      if (!response.ok) throw new Error('Add to cart failed');

      this.atcBtn.textContent = 'ADDED!';

      const cartBubble = document.querySelector('.cart-bubble, [data-cart-count]');
      if (cartBubble) {
        const current = parseInt(cartBubble.textContent, 10) || 0;
        cartBubble.textContent = current + 1;
      }

      setTimeout(() => {
        this.atcBtn.textContent = originalText;
        this.atcBtn.disabled = false;
      }, 2000);
    } catch (error) {
      console.error('Add to cart error:', error);
      this.atcBtn.textContent = 'ERROR';
      setTimeout(() => {
        this.atcBtn.textContent = originalText;
        this.atcBtn.disabled = false;
      }, 2000);
    }
  }
}

customElements.define('custom-product-card', CustomProductCard);
