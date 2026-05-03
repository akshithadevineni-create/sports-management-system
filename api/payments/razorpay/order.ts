import { Buffer } from "node:buffer";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type OrderPayload = {
  amount?: number;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    gstAmount?: number;
    netPrice?: number;
  }>;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  const keyId = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    response.status(500).json({ message: "Missing Razorpay credentials. Set VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." });
    return;
  }

  const payload = request.body as OrderPayload;

  if (!payload.amount || payload.amount <= 0) {
    response.status(400).json({ message: "A valid order amount is required." });
    return;
  }

  try {
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const receipt = `sportsplus_${Date.now()}`;
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(payload.amount * 100),
        currency: "INR",
        receipt,
        notes: {
          customer_name: payload.customer?.name || "",
          customer_email: payload.customer?.email || "",
          customer_phone: payload.customer?.phone || "",
          items: JSON.stringify(payload.items || []).slice(0, 255),
        },
      }),
    });

    const responseText = await razorpayResponse.text();
    response.status(razorpayResponse.status);
    response.setHeader("Content-Type", "application/json");
    response.send(responseText);
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Unable to create Razorpay order." });
  }
}
