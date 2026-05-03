import type { AuthUser } from "@/contexts/AuthContext";

export type CheckoutCustomer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
};

export type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
};

export type RazorpayVerificationResponse = {
  verified: boolean;
  orderId: string;
  paymentId: string;
};

type CreateOrderPayload = {
  amount: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    gstAmount?: number;
    netPrice?: number;
  }>;
  customer: CheckoutCustomer;
};

let razorpayLoader: Promise<boolean> | null = null;

const getOrderApiUrl = () => import.meta.env.VITE_RAZORPAY_ORDER_API_URL || "/api/payments/razorpay/order";
const getVerifyApiUrl = () => import.meta.env.VITE_RAZORPAY_VERIFY_API_URL || "/api/payments/razorpay/verify";

export const loadRazorpayScript = () => {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (!razorpayLoader) {
    razorpayLoader = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return razorpayLoader;
};

export const createRazorpayOrder = async (payload: CreateOrderPayload) => {
  const response = await fetch(getOrderApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to create Razorpay order.");
  }

  return (await response.json()) as RazorpayOrderResponse;
};

export const verifyRazorpayPayment = async (response: RazorpayHandlerResponse) => {
  const verificationResponse = await fetch(getVerifyApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(response),
  });

  const payload = await verificationResponse.json().catch(() => null);

  if (!verificationResponse.ok || !payload?.verified) {
    throw new Error(payload?.message || "Unable to verify Razorpay payment.");
  }

  return payload as RazorpayVerificationResponse;
};

export const openRazorpayCheckout = async ({
  order,
  authUser,
  customer,
  onSuccess,
  onDismiss,
}: {
  order: RazorpayOrderResponse;
  authUser: AuthUser | null;
  customer: CheckoutCustomer;
  onSuccess: (response: RazorpayHandlerResponse) => void | Promise<void>;
  onDismiss?: () => void;
}) => {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!key) {
    throw new Error("Missing VITE_RAZORPAY_KEY_ID. Add your Razorpay key to continue.");
  }

  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded || !window.Razorpay) {
    throw new Error("Unable to load Razorpay Checkout. Check your connection and try again.");
  }

  const checkout = new window.Razorpay({
    key,
    amount: order.amount,
    currency: order.currency,
    name: import.meta.env.VITE_RAZORPAY_BUSINESS_NAME || "Sports+",
    description: "Sports equipment purchase",
    order_id: order.id,
    handler: (response: RazorpayHandlerResponse) => {
      void onSuccess(response);
    },
    prefill: {
      name: customer.name || authUser?.name || "",
      email: customer.email || authUser?.email || "",
      contact: customer.phone,
    },
    notes: {
      address: `${customer.address}, ${customer.city}, ${customer.state} ${customer.pincode}`,
      customer_notes: customer.notes || "",
    },
    theme: {
      color: "#16a34a",
    },
    modal: {
      ondismiss: onDismiss,
      confirm_close: true,
    },
  });

  checkout.open();
};
