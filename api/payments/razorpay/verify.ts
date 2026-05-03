import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type VerificationPayload = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    response.status(500).json({ message: "Missing Razorpay secret. Set RAZORPAY_KEY_SECRET." });
    return;
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = request.body as VerificationPayload;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    response.status(400).json({ message: "Payment verification requires order id, payment id, and signature." });
    return;
  }

  const expectedSignature = createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(razorpay_signature);
  const verified = expected.length === received.length && timingSafeEqual(expected, received);

  if (!verified) {
    response.status(400).json({ verified: false, message: "Razorpay payment signature verification failed." });
    return;
  }

  response.status(200).json({
    verified: true,
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
  });
}
