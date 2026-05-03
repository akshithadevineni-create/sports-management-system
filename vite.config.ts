import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const getRazorpayCredentials = (env: Record<string, string>) => ({
  keyId: env.VITE_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID,
  keySecret: env.RAZORPAY_KEY_SECRET,
});

const readRequestBody = (req: IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer | string) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });

const sendJson = (
  res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body: string) => void },
  statusCode: number,
  body: unknown,
) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

const razorpayOrderPlugin = (env: Record<string, string>): Plugin => ({
  name: "razorpay-order-endpoint",
  configureServer(server) {
    server.middlewares.use("/api/payments/razorpay/order", async (req, res) => {
      if (req.method !== "POST") {
        sendJson(res, 405, { message: "Method not allowed" });
        return;
      }

      const { keyId, keySecret } = getRazorpayCredentials(env);

      if (!keyId || !keySecret) {
        sendJson(res, 500, { message: "Missing Razorpay credentials. Set VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." });
        return;
      }

      try {
        const rawBody = await readRequestBody(req);

        const parsedBody = JSON.parse(rawBody || "{}") as {
          amount?: number;
          customer?: { name?: string; email?: string; phone?: string };
          items?: Array<{ id: string; name: string; quantity: number; price: number; gstAmount?: number; netPrice?: number }>;
        };

        if (!parsedBody.amount || parsedBody.amount <= 0) {
          sendJson(res, 400, { message: "A valid order amount is required." });
          return;
        }

        const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const receipt = `sportsplus_${Date.now()}`;
        const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Math.round(parsedBody.amount * 100),
            currency: "INR",
            receipt,
            notes: {
              customer_name: parsedBody.customer?.name || "",
              customer_email: parsedBody.customer?.email || "",
              customer_phone: parsedBody.customer?.phone || "",
              items: JSON.stringify(parsedBody.items || []).slice(0, 255),
            },
          }),
        });

        const responseText = await razorpayResponse.text();
        res.statusCode = razorpayResponse.status;
        res.setHeader("Content-Type", "application/json");
        res.end(responseText);
      } catch (error) {
        sendJson(res, 500, { message: error instanceof Error ? error.message : "Unable to create Razorpay order." });
      }
    });

    server.middlewares.use("/api/payments/razorpay/verify", async (req, res) => {
      if (req.method !== "POST") {
        sendJson(res, 405, { message: "Method not allowed" });
        return;
      }

      const { keySecret } = getRazorpayCredentials(env);

      if (!keySecret) {
        sendJson(res, 500, { message: "Missing Razorpay secret. Set RAZORPAY_KEY_SECRET." });
        return;
      }

      try {
        const rawBody = await readRequestBody(req);
        const parsedBody = JSON.parse(rawBody || "{}") as {
          razorpay_order_id?: string;
          razorpay_payment_id?: string;
          razorpay_signature?: string;
        };

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsedBody;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          sendJson(res, 400, { message: "Payment verification requires order id, payment id, and signature." });
          return;
        }

        const expectedSignature = createHmac("sha256", keySecret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest("hex");

        const expected = Buffer.from(expectedSignature);
        const received = Buffer.from(razorpay_signature);
        const verified = expected.length === received.length && timingSafeEqual(expected, received);

        if (!verified) {
          sendJson(res, 400, { verified: false, message: "Razorpay payment signature verification failed." });
          return;
        }

        sendJson(res, 200, {
          verified: true,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
        });
      } catch (error) {
        sendJson(res, 500, { message: error instanceof Error ? error.message : "Unable to verify Razorpay payment." });
      }
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger(), razorpayOrderPlugin(env)].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
