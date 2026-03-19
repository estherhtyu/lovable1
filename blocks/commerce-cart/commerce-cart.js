import { events } from '@dropins/tools/event-bus.js';
import { render as provider } from '@dropins/storefront-cart/render.js';
import * as Cart from '@dropins/storefront-cart/api.js';
import { h } from '@dropins/tools/preact.js';
import {
  InLineAlert,
  Icon,
  Button,
  provider as UI,
} from '@dropins/tools/components.js';

// Dropin Containers
import CartSummaryList from '@dropins/storefront-cart/containers/CartSummaryList.js';
import OrderSummary from '@dropins/storefront-cart/containers/OrderSummary.js';
import EstimateShipping from '@dropins/storefront-cart/containers/EstimateShipping.js';
import Coupons from '@dropins/storefront-cart/containers/Coupons.js';
import GiftCards from '@dropins/storefront-cart/containers/GiftCards.js';
import GiftOptions from '@dropins/storefront-cart/containers/GiftOptions.js';
import { render as wishlistRender } from '@dropins/storefront-wishlist/render.js';
import { WishlistToggle } from '@dropins/storefront-wishlist/containers/WishlistToggle.js';
import { WishlistAlert } from '@dropins/storefront-wishlist/containers/WishlistAlert.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';

// API
import { publishShoppingCartViewEvent } from '@dropins/storefront-cart/api.js';

// Modal and Mini PDP
import createMiniPDP from '../../scripts/components/commerce-mini-pdp/commerce-mini-pdp.js';
import createModal from '../modal/modal.js';

// Initializers
import '../../scripts/initializers/cart.js';
import '../../scripts/initializers/wishlist.js';

import { readBlockConfig } from '../../scripts/aem.js';
import { fetchPlaceholders, rootLink, getProductLink } from '../../scripts/commerce.js';
import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  // Configuration
  const {
    'hide-heading': hideHeading = 'false',
    'max-items': maxItems,
    'hide-attributes': hideAttributes = '',
    'enable-item-quantity-update': enableUpdateItemQuantity = 'false',
    'enable-item-remove': enableRemoveItem = 'true',
    'enable-estimate-shipping': enableEstimateShipping = 'false',
    'start-shopping-url': startShoppingURL = '',
    'checkout-url': checkoutURL = '',
    'enable-updating-product': enableUpdatingProduct = 'false',
    'undo-remove-item': undo = 'false',
  } = readBlockConfig(block);

  const placeholders = await fetchPlaceholders();

  // Fulfillment per line item (Req 9.3)
  const fulfillmentEnabled = await isFeatureEnabled('fulfillment-options');
  let itemFulfillments = {};
  try {
    itemFulfillments = JSON.parse(sessionStorage.getItem('cart-item-fulfillments') || '{}');
  } catch { /* ignore */ }

  // Dealer locator modal for cart (Req 9.6)
  let dealerModal = null;
  let dealerData = null;

  async function loadDealerData() {
    if (dealerData) return dealerData;
    const resp = await fetch('/mock-data/dealers.json');
    dealerData = await resp.json();
    return dealerData;
  }

  function openDealerModal() {
    if (!dealerModal) {
      dealerModal = document.createElement('div');
      dealerModal.className = 'cart-dealer-modal';
      dealerModal.innerHTML = `
        <div class="cart-dealer-modal__backdrop"></div>
        <div class="cart-dealer-modal__content">
          <div class="cart-dealer-modal__header">
            <h4>Select a Dealer</h4>
            <button class="cart-dealer-modal__close">&times;</button>
          </div>
          <div class="cart-dealer-modal__search">
            <input type="text" class="cart-dealer-modal__input" placeholder="Enter ZIP code" maxlength="5" />
            <button class="cart-dealer-modal__search-btn">Search</button>
          </div>
          <div class="cart-dealer-modal__results"></div>
        </div>
      `;

      dealerModal.querySelector('.cart-dealer-modal__backdrop').addEventListener('click', closeDealerModal);
      dealerModal.querySelector('.cart-dealer-modal__close').addEventListener('click', closeDealerModal);

      const searchBtn = dealerModal.querySelector('.cart-dealer-modal__search-btn');
      const searchInput = dealerModal.querySelector('.cart-dealer-modal__input');
      searchBtn.addEventListener('click', () => searchDealers());
      searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchDealers(); });

      document.body.append(dealerModal);
    }
    dealerModal.hidden = false;
    document.body.style.overflow = 'hidden';

    // Auto-search with existing dealers
    searchDealers();
  }

  function closeDealerModal() {
    if (dealerModal) {
      dealerModal.hidden = true;
      document.body.style.overflow = '';
    }
  }

  async function searchDealers() {
    const dealers = await loadDealerData();
    const resultsEl = dealerModal.querySelector('.cart-dealer-modal__results');
    const selectedDealer = JSON.parse(sessionStorage.getItem('selected-dealer') || 'null');
    resultsEl.innerHTML = '';

    dealers.forEach((d) => {
      const isSelected = d.id === selectedDealer?.id;
      const card = document.createElement('div');
      card.className = `cart-dealer-modal__card${isSelected ? ' cart-dealer-modal__card--selected' : ''}`;
      card.innerHTML = `
        <div class="cart-dealer-modal__card-row">
          <strong>${d.name}</strong>
          <span>${d.distance}</span>
        </div>
        <p>${d.address}</p>
        <p>${d.phone} &middot; ${d.hours}</p>
        <button class="cart-dealer-modal__select">${isSelected ? '\u2713 Selected' : 'Select'}</button>
      `;
      card.querySelector('.cart-dealer-modal__select').addEventListener('click', () => {
        sessionStorage.setItem('selected-dealer', JSON.stringify(d));
        document.dispatchEvent(new CustomEvent('dealer:selected', { detail: d }));
        // Update all dealer name labels in cart
        block.querySelectorAll('.cart-line-fulfillment__dealer-name').forEach((el) => {
          el.textContent = d.name;
        });
        closeDealerModal();
      });
      resultsEl.append(card);
    });
  }

  const _cart = Cart.getCartDataFromCache();

  // Modal state
  let currentModal = null;
  let currentNotification = null;

  // Layout
  const fragment = document.createRange().createContextualFragment(`
    <div class="cart__notification"></div>
    <div class="cart__wrapper">
      <div class="cart__left-column">
        <div class="cart__list"></div>
      </div>
      <div class="cart__right-column">
        <div class="cart__order-summary"></div>
        <div class="cart__gift-options"></div>
      </div>
    </div>

    <div class="cart__empty-cart"></div>
  `);

  const $wrapper = fragment.querySelector('.cart__wrapper');
  const $notification = fragment.querySelector('.cart__notification');
  const $list = fragment.querySelector('.cart__list');
  const $summary = fragment.querySelector('.cart__order-summary');
  const $emptyCart = fragment.querySelector('.cart__empty-cart');
  const $giftOptions = fragment.querySelector('.cart__gift-options');
  const $rightColumn = fragment.querySelector('.cart__right-column');

  block.innerHTML = '';
  block.appendChild(fragment);

  // Wishlist variables
  const routeToWishlist = '/wishlist';

  // Toggle Empty Cart
  function toggleEmptyCart(_state) {
    $wrapper.removeAttribute('hidden');
    $emptyCart.setAttribute('hidden', '');
  }

  // Handle Edit Button Click
  async function handleEditButtonClick(cartItem) {
    try {
      // Create mini PDP content
      const miniPDPContent = await createMiniPDP(
        cartItem,
        async (_updateData) => {
          // Show success message when mini-PDP updates item
          const productName = cartItem.name
            || cartItem.product?.name
            || placeholders?.Global?.CartUpdatedProductName;
          const message = placeholders?.Global?.CartUpdatedProductMessage?.replace(
            '{product}',
            productName,
          );

          // Clear any existing notifications
          currentNotification?.remove();

          currentNotification = await UI.render(InLineAlert, {
            heading: message,
            type: 'success',
            variant: 'primary',
            icon: h(Icon, { source: 'CheckWithCircle' }),
            'aria-live': 'assertive',
            role: 'alert',
            onDismiss: () => {
              currentNotification?.remove();
            },
          })($notification);

          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            currentNotification?.remove();
          }, 5000);
        },
        () => {
          if (currentModal) {
            currentModal.removeModal();
            currentModal = null;
          }
        },
      );

      // Create and show modal
      currentModal = await createModal([miniPDPContent]);

      if (currentModal.block) {
        currentModal.block.setAttribute('id', 'mini-pdp-modal');
      }

      currentModal.showModal();
    } catch (error) {
      console.error('Error opening mini PDP modal:', error);

      // Clear any existing notifications
      currentNotification?.remove();

      // Show error notification
      currentNotification = await UI.render(InLineAlert, {
        heading: placeholders?.Global?.ProductLoadError,
        type: 'error',
        variant: 'primary',
        icon: h(Icon, { source: 'AlertWithCircle' }),
        'aria-live': 'assertive',
        role: 'alert',
        onDismiss: () => {
          currentNotification?.remove();
        },
      })($notification);
    }
  }

  // Render Containers
  const createProductLink = (product) => getProductLink(product.url.urlKey, product.topLevelSku);
  await Promise.all([
    // Cart List
    provider.render(CartSummaryList, {
      hideHeading: hideHeading === 'true',
      routeProduct: createProductLink,
      routeEmptyCartCTA: startShoppingURL ? () => rootLink(startShoppingURL) : undefined,
      maxItems: parseInt(maxItems, 10) || undefined,
      attributesToHide: hideAttributes
        .split(',')
        .map((attr) => attr.trim().toLowerCase()),
      enableUpdateItemQuantity: enableUpdateItemQuantity === 'true',
      enableRemoveItem: enableRemoveItem === 'true',
      undo: undo === 'true',
      slots: {
        Thumbnail: (ctx) => {
          const { item, defaultImageProps } = ctx;
          const anchorWrapper = document.createElement('a');
          anchorWrapper.href = createProductLink(item);

          tryRenderAemAssetsImage(ctx, {
            alias: item.sku,
            imageProps: defaultImageProps,
            wrapper: anchorWrapper,

            params: {
              width: defaultImageProps.width,
              height: defaultImageProps.height,
            },
          });
        },

        Footer: (ctx) => {
          // Fulfillment Options per line item (Req 9.3)
          if (fulfillmentEnabled) {
            const itemId = ctx.item?.uid || ctx.item?.id || ctx.item?.sku;
            const currentFulfillment = itemFulfillments[itemId]
              || sessionStorage.getItem('selected-fulfillment') || 'ship';
            const dealer = JSON.parse(sessionStorage.getItem('selected-dealer') || 'null');

            const fulfillmentRow = document.createElement('div');
            fulfillmentRow.className = 'cart-line-fulfillment';

            const options = [
              { id: 'ship', icon: '\u{1F4E6}', label: 'Ship' },
              { id: 'pickup', icon: '\u{1F3EA}', label: 'Pickup' },
              { id: 'installation', icon: '\u{1F527}', label: 'Install' },
            ];

            fulfillmentRow.innerHTML = `
              <div class="cart-line-fulfillment__options">
                ${options.map((opt) => `<button class="cart-line-fulfillment__btn${opt.id === currentFulfillment ? ' cart-line-fulfillment__btn--active' : ''}" data-option="${opt.id}">${opt.icon} ${opt.label}</button>`).join('')}
              </div>
              <div class="cart-line-fulfillment__dealer" ${(currentFulfillment === 'pickup' || currentFulfillment === 'installation') && dealer ? '' : 'hidden'}>
                <span class="cart-line-fulfillment__dealer-name">${dealer?.name || ''}</span>
                <button class="cart-line-fulfillment__change-dealer">Change</button>
              </div>
            `;

            fulfillmentRow.querySelectorAll('.cart-line-fulfillment__btn').forEach((btn) => {
              btn.addEventListener('click', () => {
                fulfillmentRow.querySelectorAll('.cart-line-fulfillment__btn').forEach((b) => b.classList.remove('cart-line-fulfillment__btn--active'));
                btn.classList.add('cart-line-fulfillment__btn--active');
                itemFulfillments[itemId] = btn.dataset.option;
                sessionStorage.setItem('cart-item-fulfillments', JSON.stringify(itemFulfillments));
                const currentDealer = JSON.parse(sessionStorage.getItem('selected-dealer') || 'null');
                const dealerEl = fulfillmentRow.querySelector('.cart-line-fulfillment__dealer');
                const needsDealer = btn.dataset.option === 'pickup' || btn.dataset.option === 'installation';
                dealerEl.hidden = !(needsDealer && currentDealer);
                // If switching to pickup/install and no dealer, open dealer modal
                if (needsDealer && !currentDealer) openDealerModal();
              });
            });

            // Change dealer button opens modal
            const changeDealerBtn = fulfillmentRow.querySelector('.cart-line-fulfillment__change-dealer');
            if (changeDealerBtn) {
              changeDealerBtn.addEventListener('click', () => openDealerModal());
            }

            ctx.appendChild(fulfillmentRow);
          }

          // Edit Link
          if (ctx.item?.itemType === 'ConfigurableCartItem' && enableUpdatingProduct === 'true') {
            const editLink = document.createElement('div');
            editLink.className = 'cart-item-edit-link';

            UI.render(Button, {
              children: placeholders?.Global?.CartEditButton,
              variant: 'tertiary',
              size: 'medium',
              icon: h(Icon, { source: 'Edit' }),
              onClick: () => handleEditButtonClick(ctx.item),
            })(editLink);

            ctx.appendChild(editLink);
          }

          // Wishlist Button (if product is not configurable)
          const $wishlistToggle = document.createElement('div');
          $wishlistToggle.classList.add('cart__action--wishlist-toggle');

          wishlistRender.render(WishlistToggle, {
            product: ctx.item,
            size: 'medium',
            labelToWishlist: placeholders?.Global?.CartMoveToWishlist,
            labelWishlisted: placeholders?.Global?.CartRemoveFromWishlist,
            removeProdFromCart: Cart.updateProductsFromCart,
          })($wishlistToggle);

          ctx.appendChild($wishlistToggle);

          // Gift Options
          const giftOptions = document.createElement('div');

          provider.render(GiftOptions, {
            item: ctx.item,
            view: 'product',
            dataSource: 'cart',
            handleItemsLoading: ctx.handleItemsLoading,
            handleItemsError: ctx.handleItemsError,
            onItemUpdate: ctx.onItemUpdate,
            slots: {
              SwatchImage: swatchImageSlot,
            },
          })(giftOptions);

          ctx.appendChild(giftOptions);
        },
      },
    })($list),

    // Order Summary
    provider.render(OrderSummary, {
      routeProduct: createProductLink,
      routeCheckout: checkoutURL ? () => rootLink(checkoutURL) : undefined,
      slots: {
        EstimateShipping: async (ctx) => {
          if (enableEstimateShipping === 'true') {
            const wrapper = document.createElement('div');
            await provider.render(EstimateShipping, {})(wrapper);
            ctx.replaceWith(wrapper);
          }
        },
        Coupons: (ctx) => {
          const coupons = document.createElement('div');

          provider.render(Coupons)(coupons);

          ctx.appendChild(coupons);
        },
        GiftCards: (ctx) => {
          const giftCards = document.createElement('div');

          provider.render(GiftCards)(giftCards);

          ctx.appendChild(giftCards);
        },
      },
    })($summary),

    provider.render(GiftOptions, {
      view: 'order',
      dataSource: 'cart',

      slots: {
        SwatchImage: swatchImageSlot,
      },
    })($giftOptions),
  ]);

  let cartViewEventPublished = false;
  // Events
  events.on(
    'cart/data',
    (cartData) => {
      toggleEmptyCart(isCartEmpty(cartData));

      const isEmpty = !cartData || cartData.totalQuantity < 1;
      $giftOptions.style.display = isEmpty ? 'none' : '';
      $rightColumn.style.display = isEmpty ? 'none' : '';

      if (!cartViewEventPublished) {
        cartViewEventPublished = true;
        publishShoppingCartViewEvent();
      }
    },
    { eager: true },
  );

  events.on('wishlist/alert', ({ action, item }) => {
    wishlistRender.render(WishlistAlert, {
      action,
      item,
      routeToWishlist,
    })($notification);

    setTimeout(() => {
      $notification.innerHTML = '';
    }, 5000);
  });

  return Promise.resolve();
}

function isCartEmpty(cart) {
  return cart ? cart.totalQuantity < 1 : true;
}

function swatchImageSlot(ctx) {
  const { imageSwatchContext, defaultImageProps } = ctx;
  tryRenderAemAssetsImage(ctx, {
    alias: imageSwatchContext.label,
    imageProps: defaultImageProps,
    wrapper: document.createElement('span'),

    params: {
      width: defaultImageProps.width,
      height: defaultImageProps.height,
    },
  });
}
