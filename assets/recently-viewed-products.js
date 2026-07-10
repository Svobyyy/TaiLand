/**
 * Updates the recently viewed products in localStorage.
 */
export class RecentlyViewed {
  /** @static @constant {string} The key used to store the viewed products in session storage */
  static #STORAGE_KEY = 'viewedProducts';
  /**
   * @static @constant {number} The maximum number of products to store.
   * 5, not 4: the product page's "Recently Viewed" grid
   * (sections/tailand-product.liquid) excludes the product being viewed —
   * which is always slot 0 by the time it reads this list — and still needs
   * 4 others to fill its 4 cards. Lowering this back to 4 silently drops
   * that grid to 3 cards.
   */
  static #MAX_PRODUCTS = 5;

  /**
   * Adds a product to the recently viewed products list.
   * @param {string} productId - The ID of the product to add.
   */
  static addProduct(productId) {
    let viewedProducts = this.getProducts();

    viewedProducts = viewedProducts.filter((/** @type {string} */ id) => id !== productId);
    viewedProducts.unshift(productId);
    viewedProducts = viewedProducts.slice(0, this.#MAX_PRODUCTS);

    localStorage.setItem(this.#STORAGE_KEY, JSON.stringify(viewedProducts));
  }

  static clearProducts() {
    localStorage.removeItem(this.#STORAGE_KEY);
    // The product page keeps a render cache (title/price/image, keyed by the
    // same product ids) in 'tcRecentlyViewedData' — clearing "recently viewed"
    // must clear that trail too, or the data outlives the user's clear action.
    // 'tcRecentlyViewed' is the legacy pre-consolidation key (July 2026).
    localStorage.removeItem('tcRecentlyViewedData');
    localStorage.removeItem('tcRecentlyViewed');
  }

  /**
   * Retrieves the list of recently viewed products from session storage.
   * @returns {string[]} The list of viewed products.
   */
  static getProducts() {
    // localStorage can hold corrupt or non-array JSON (partial write, another
    // script's leftovers) — a bad value must not break every consumer of this
    // class (predictive search, product-page grid).
    try {
      const parsed = JSON.parse(localStorage.getItem(this.#STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
