import { render as orderRenderer } from '@dropins/storefront-order/render.js';
import { OrderProductList } from '@dropins/storefront-order/containers/OrderProductList.js';
import GiftOptions from '@dropins/storefront-cart/containers/GiftOptions.js';
import { render as CartProvider } from '@dropins/storefront-cart/render.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';

// Initialize
import '../../scripts/initializers/order.js';
import { getProductLink } from '../../scripts/commerce.js';
import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  const createProductLink = (product) => getProductLink(product.productUrlKey, product.productSku);

  // Load fulfillment data for badges (Req 13.2 — order details show fulfillment)
  const fulfillmentEnabled = await isFeatureEnabled('fulfillment-options');
  const globalFulfillment = sessionStorage.getItem('selected-fulfillment') || 'ship';
  let itemFulfillments = {};
  try {
    itemFulfillments = JSON.parse(sessionStorage.getItem('cart-item-fulfillments') || '{}');
  } catch { /* ignore */ }
  const itemIds = Object.keys(itemFulfillments);
  let itemIndex = 0;

  const fulfillmentMeta = {
    ship: { icon: '\u{1F4E6}', label: 'Ship to Address', css: 'ship' },
    pickup: { icon: '\u{1F3EA}', label: 'Pick Up at Dealer', css: 'pickup' },
    installation: { icon: '\u{1F527}', label: 'Dealer Installation', css: 'installation' },
  };

  await orderRenderer.render(OrderProductList, {
    slots: {
      CartSummaryItemImage: (ctx) => {
        const { data, defaultImageProps } = ctx;
        const anchor = document.createElement('a');
        anchor.href = createProductLink(data);

        tryRenderAemAssetsImage(ctx, {
          alias: data.product.sku,
          imageProps: defaultImageProps,
          wrapper: anchor,

          params: {
            width: defaultImageProps.width,
            height: defaultImageProps.height,
          },
        });
      },
      Footer: (ctx) => {
        // Fulfillment badge per line item
        if (fulfillmentEnabled) {
          const itemId = itemIds[itemIndex] || null;
          const ff = (itemId && itemFulfillments[itemId]) || globalFulfillment;
          const meta = fulfillmentMeta[ff] || fulfillmentMeta.ship;
          itemIndex += 1;

          const badge = document.createElement('div');
          badge.className = `oce__line-badge oce__line-badge--${meta.css}`;
          badge.innerHTML = `<span class="oce__line-badge-icon">${meta.icon}</span> ${meta.label}`;
          ctx.appendChild(badge);
        }

        // Gift options
        const giftOptions = document.createElement('div');

        CartProvider.render(GiftOptions, {
          item: ctx.item,
          view: 'product',
          dataSource: 'order',
          isEditable: false,
          slots: {
            SwatchImage: (swatchCtx) => {
              const { defaultImageProps, imageSwatchContext } = swatchCtx;
              tryRenderAemAssetsImage(swatchCtx, {
                alias: imageSwatchContext.label,
                imageProps: defaultImageProps,
                wrapper: document.createElement('span'),

                params: {
                  width: defaultImageProps.width,
                  height: defaultImageProps.height,
                },
              });
            },
          },
        })(giftOptions);

        ctx.appendChild(giftOptions);
      },
    },
    routeProductDetails: createProductLink,
  })(block);
}
