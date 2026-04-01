/**
 * Video Testimonial custom element.
 * Opens a fullscreen modal with a video player when the play button is clicked.
 */
class VideoTestimonial extends HTMLElement {
  connectedCallback() {
    this.playBtn = this.querySelector('.video-testimonial__play-btn');
    if (!this.playBtn) return;

    this.videoUrl = this.dataset.videoUrl || '';
    this.modal = null;

    this.playBtn.addEventListener('click', this.openModal.bind(this));
  }

  disconnectedCallback() {
    if (this.playBtn) {
      this.playBtn.removeEventListener('click', this.openModal.bind(this));
    }
    this.closeModal();
  }

  openModal(event) {
    event.preventDefault();
    if (!this.videoUrl) return;

    this.modal = document.createElement('div');
    this.modal.className = 'video-testimonial__modal';
    this.modal.innerHTML = `
      <div class="video-testimonial__modal-backdrop"></div>
      <div class="video-testimonial__modal-content">
        <button class="video-testimonial__modal-close" type="button" aria-label="Close video">&times;</button>
        <video class="video-testimonial__modal-video" src="${this.videoUrl}" controls autoplay playsinline></video>
      </div>
    `;

    document.body.appendChild(this.modal);
    document.body.style.overflow = 'hidden';

    const closeBtn = this.modal.querySelector('.video-testimonial__modal-close');
    const backdrop = this.modal.querySelector('.video-testimonial__modal-backdrop');

    closeBtn.addEventListener('click', () => this.closeModal());
    backdrop.addEventListener('click', () => this.closeModal());

    this._escHandler = (e) => {
      if (e.key === 'Escape') this.closeModal();
    };
    document.addEventListener('keydown', this._escHandler);

    closeBtn.focus();
  }

  closeModal() {
    if (!this.modal) return;

    const video = this.modal.querySelector('video');
    if (video) {
      video.pause();
      video.src = '';
    }

    this.modal.remove();
    this.modal = null;
    document.body.style.overflow = '';

    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }

    if (this.playBtn) this.playBtn.focus();
  }
}

customElements.define('video-testimonial', VideoTestimonial);
