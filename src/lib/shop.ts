import { products } from "@/data/sportsData";

export const SHIPPING_FEE = 149;
export const FREE_SHIPPING_THRESHOLD = 5000;
export const GST_RATE = 0.18;
export const GST_PERCENTAGE = GST_RATE * 100;

export const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const getGstAmount = (price: number) => Math.round(price * GST_RATE);

export const getNetPrice = (price: number) => price + getGstAmount(price);

export const getCartProducts = (cart: { productId: string; quantity: number }[]) =>
  cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return null;

      return {
        ...product,
        quantity: item.quantity,
        gstAmount: getGstAmount(product.price),
        netPrice: getNetPrice(product.price),
        lineSubtotal: product.price * item.quantity,
        lineGst: getGstAmount(product.price) * item.quantity,
        lineTotal: getNetPrice(product.price) * item.quantity,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

export const getCartTotals = (cart: { productId: string; quantity: number }[]) => {
  const items = getCartProducts(cart);
  const subtotal = items.reduce((sum, item) => sum + item.lineSubtotal, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const gst = items.reduce((sum, item) => sum + item.lineGst, 0);
  const total = subtotal + gst + shipping;

  return {
    items,
    subtotal,
    shipping,
    gst,
    total,
  };
};
