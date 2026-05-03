/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RAZORPAY_KEY_ID?: string;
  readonly VITE_RAZORPAY_ORDER_API_URL?: string;
  readonly VITE_RAZORPAY_VERIFY_API_URL?: string;
  readonly VITE_RAZORPAY_BUSINESS_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
