import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, MapPin, ShieldCheck, ShoppingBag } from "lucide-react";

import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRazorpayOrder, openRazorpayCheckout, verifyRazorpayPayment } from "@/lib/razorpay";
import { formatINR, FREE_SHIPPING_THRESHOLD, getCartTotals, GST_PERCENTAGE } from "@/lib/shop";
import { toast } from "sonner";

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, clearCart } = useAppState();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [customer, setCustomer] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });

  const { items, subtotal, shipping, gst, total } = useMemo(() => getCartTotals(cart), [cart]);

  useEffect(() => {
    if (!user) return;

    setCustomer((prev) => ({
      ...prev,
      name: prev.name || user.name,
      email: prev.email || user.email,
    }));
  }, [user]);

  if (items.length === 0) {
    return <Navigate to="/shop" replace />;
  }

  const handleInputChange = (field: keyof typeof customer, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!customer.name.trim()) return "Please enter your full name.";
    if (!customer.email.trim()) return "Please enter your email address.";
    if (!customer.phone.trim().match(/^\d{10}$/)) return "Please enter a valid 10-digit phone number.";
    if (!customer.address.trim()) return "Please enter your delivery address.";
    if (!customer.city.trim()) return "Please enter your city.";
    if (!customer.state.trim()) return "Please enter your state.";
    if (!customer.pincode.trim().match(/^\d{6}$/)) return "Please enter a valid 6-digit pincode.";

    return null;
  };

  const handlePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsPaying(true);

      const order = await createRazorpayOrder({
        amount: total,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          gstAmount: item.gstAmount,
          netPrice: item.netPrice,
        })),
        customer,
      });

      await openRazorpayCheckout({
        order,
        authUser: user,
        customer,
        onSuccess: async (paymentResponse) => {
          const verifiedPayment = await verifyRazorpayPayment(paymentResponse);
          clearCart();
          toast.success(`Payment verified. Razorpay payment id: ${verifiedPayment.paymentId}`);
          navigate("/shop", { replace: true });
        },
        onDismiss: () => {
          toast.message("Payment popup closed. Your cart is still saved.");
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment could not be started.";
      toast.error(message);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <Link to="/shop" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to shop
            </Link>
            <h1 className="text-4xl font-display font-bold text-foreground">Checkout</h1>
            <p className="mt-2 text-muted-foreground">Review your order, add delivery details, and pay securely with Razorpay.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Free shipping unlocks above <span className="font-semibold text-foreground">{formatINR(FREE_SHIPPING_THRESHOLD)}</span>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.form
            id="checkout-form"
            ref={formRef}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handlePayment}
            className="space-y-6"
          >
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MapPin className="h-5 w-5 text-primary" />
                  Delivery Details
                </CardTitle>
                <CardDescription>These details are also used to prefill the Razorpay checkout form.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={customer.name} onChange={(e) => handleInputChange("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={customer.email} onChange={(e) => handleInputChange("email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" inputMode="numeric" maxLength={10} value={customer.phone} onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" inputMode="numeric" maxLength={6} value={customer.pincode} onChange={(e) => handleInputChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" value={customer.address} onChange={(e) => handleInputChange("address", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={customer.city} onChange={(e) => handleInputChange("city", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={customer.state} onChange={(e) => handleInputChange("state", e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">Order notes</Label>
                  <Textarea id="notes" placeholder="Optional delivery instructions" value={customer.notes} onChange={(e) => handleInputChange("notes", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-primary/20 bg-primary/5">
              <CardContent className="flex items-start gap-3 p-6">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Secure test-ready checkout</p>
                  <p className="text-sm text-muted-foreground">
                    Payments are opened through Razorpay Standard Checkout. Make sure your Razorpay test key and server-side order endpoint are configured before testing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.form>

          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Order Summary
                </CardTitle>
                <CardDescription>{items.length} items ready for checkout</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-3">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.brand} • Qty {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatINR(item.lineTotal)}</p>
                        <p className="text-xs text-muted-foreground">incl. GST {formatINR(item.lineGst)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 rounded-xl bg-secondary/40 p-4 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Product cost</span>
                    <span>{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>GST ({GST_PERCENTAGE}%)</span>
                    <span>{formatINR(gst)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
                    <span>Net total</span>
                    <span>{formatINR(total)}</span>
                  </div>
                </div>

                <Button type="button" className="w-full rounded-xl text-base" size="lg" onClick={() => formRef.current?.requestSubmit()} disabled={isPaying}>
                  <CreditCard className="h-4 w-4" />
                  {isPaying ? "Opening Razorpay..." : `Pay ${formatINR(total)}`}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
