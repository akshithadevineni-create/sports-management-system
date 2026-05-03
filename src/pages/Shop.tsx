import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Filter, Heart, Minus, Package, Plus, ShoppingBag, ShoppingCart, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAppState } from "@/context/AppContext";
import { products, sports } from "@/data/sportsData";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR, getCartTotals, getGstAmount, getNetPrice, GST_PERCENTAGE } from "@/lib/shop";

const Shop = () => {
  const {
    selectedSport,
    setSelectedSport,
    cart,
    cartCount,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    wishlist,
    toggleWishlist,
  } = useAppState();
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [cartOpen, setCartOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    let items = selectedSport ? products.filter((p) => p.sportId === selectedSport) : products;
    if (categoryFilter !== "all") items = items.filter((p) => p.category === categoryFilter);
    if (sortBy === "price-low") items = [...items].sort((a, b) => a.price - b.price);
    else if (sortBy === "price-high") items = [...items].sort((a, b) => b.price - a.price);
    else items = [...items].sort((a, b) => b.rating - a.rating);
    return items;
  }, [selectedSport, categoryFilter, sortBy]);

  const currentSport = sports.find((sport) => sport.id === selectedSport);
  const { items: cartItems, subtotal, shipping, gst, total } = useMemo(() => getCartTotals(cart), [cart]);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <h1 className="mb-2 text-4xl font-display font-bold text-foreground">
              {currentSport ? `${currentSport.name} Gear` : "All Sports Gear"}
            </h1>
            <p className="text-muted-foreground">Premium equipment for peak performance, now with a full in-app cart and checkout flow.</p>
          </div>

          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button className="self-start rounded-xl lg:self-auto">
                <ShoppingBag className="h-4 w-4" />
                View Cart
                {cartCount > 0 && (
                  <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 text-xs text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Your Cart
                </SheetTitle>
                <SheetDescription>
                  {cartItems.length === 0 ? "Your cart is empty." : `${cartCount} items ready to check out.`}
                </SheetDescription>
              </SheetHeader>

              {cartItems.length === 0 ? (
                <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
                  <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground/40" />
                  <p className="font-medium text-foreground">Nothing in your cart yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">Add products from the grid and they’ll show up here instantly.</p>
                </div>
              ) : (
                <div className="mt-6 flex h-[calc(100%-7rem)] flex-col">
                  <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.brand}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="min-w-8 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">{formatINR(item.lineTotal)}</p>
                            <p className="text-xs text-muted-foreground">incl. GST {formatINR(item.lineGst)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl bg-secondary/40 p-4">
                    <div className="space-y-2 text-sm">
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

                    <Button
                      className="mt-4 w-full rounded-xl"
                      size="lg"
                      onClick={() => {
                        setCartOpen(false);
                        navigate("/checkout");
                      }}
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <Select value={selectedSport || "all"} onValueChange={(value) => setSelectedSport(value === "all" ? null : value)}>
            <SelectTrigger className="h-9 w-40 text-sm">
              <SelectValue placeholder="Sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {sports.map((sport) => (
                <SelectItem key={sport.id} value={sport.id}>
                  {sport.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="clothing">Clothing</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="price-low">Price: Low-High</SelectItem>
              <SelectItem value="price-high">Price: High-Low</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-display font-semibold text-foreground">No products found</h2>
            <p className="mb-4 text-muted-foreground">Try selecting a different sport or category.</p>
            <button
              onClick={() => navigate("/")}
              className="rounded-lg bg-gradient-primary px-6 py-3 font-medium text-primary-foreground"
            >
              Choose a Sport
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => {
              const isWished = wishlist.includes(product.id);
              const cartItem = cart.find((item) => item.productId === product.id);
              const gstAmount = getGstAmount(product.price);
              const netPrice = getNetPrice(product.price);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group overflow-hidden rounded-2xl border border-border bg-gradient-card transition-colors hover:border-primary/30"
                >
                  <div className="relative flex h-48 items-center justify-center bg-secondary/50">
                    <Package className="h-12 w-12 text-muted-foreground/30" />
                    <span className="absolute left-3 top-3 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                      {product.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(product.id)}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 transition-colors hover:bg-card"
                    >
                      <Heart className={`h-4 w-4 ${isWished ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="mb-1 text-xs text-muted-foreground">{product.brand}</p>
                    <h3 className="mb-1 text-sm font-display font-semibold text-foreground">{product.name}</h3>
                    <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
                    <div className="mb-3 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      <span className="text-xs font-medium text-foreground">{product.rating}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-lg font-display font-bold text-foreground">{formatINR(netPrice)}</span>
                        <p className="text-xs text-muted-foreground">
                          {formatINR(product.price)} + {GST_PERCENTAGE}% GST ({formatINR(gstAmount)})
                        </p>
                        {cartItem && <p className="text-xs text-muted-foreground">In cart: {cartItem.quantity}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(product.id);
                          toast.success(`${product.name} added to cart`);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-glow"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
