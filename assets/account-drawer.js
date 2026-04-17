import { DialogComponent } from '@theme/dialog';

/**
 * A custom element that manages an account drawer.
 *
 * Provides a slide-out panel with account navigation links
 * for logged-in customers, or sign-in/register CTAs for guests.
 *
 * @typedef {object} Refs
 * @property {HTMLDialogElement} dialog - The dialog element.
 *
 * @extends {DialogComponent}
 */
class AccountDrawerComponent extends DialogComponent {
  /**
   * Opens the account drawer dialog.
   */
  open() {
    this.showDialog();
  }

  /**
   * Closes the account drawer dialog.
   */
  close() {
    this.closeDialog();
  }
}

if (!customElements.get('account-drawer-component')) {
  customElements.define('account-drawer-component', AccountDrawerComponent);
}
