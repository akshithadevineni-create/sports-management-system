import { motion } from "framer-motion";
import { useAppState } from "@/context/AppContext";
import { products, sports } from "@/data/sportsData";
import { ShoppingCart, Heart, Star, Filter, Package } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const Shop = () => {
  const { selectedSport, setSelectedSport, addToCart, wishlist, toggleWishlist } = useAppState();
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rating");

  const filteredProducts = useMemo(() => {
    let items = selectedSport ? products.filter((p) => p.sportId === selectedSport) : products;
    if (categoryFilter !== "all") items = items.filter((p) => p.category === categoryFilter);
    if (sortBy === "price-low") items = [...items].sort((a, b) => a.price - b.price);
    else if (sortBy === "price-high") items = [...items].sort((a, b) => b.price - a.price);
    else items = [...items].sort((a, b) => b.rating - a.rating);
    return items;
  }, [selectedSport, categoryFilter, sortBy]);

  const currentSport = sports.find((s) => s.id === selectedSport);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">
            {currentSport ? `${currentSport.name} Gear` : "All Sports Gear"}
          </h1>
          <p className="text-muted-foreground">Premium equipment for peak performance</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <Select value={selectedSport || "all"} onValueChange={(v) => setSelectedSport(v === "all" ? null : v)}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue placeholder="Sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {sports.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 h-9 text-sm">
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
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="price-low">Price: Low-High</SelectItem>
              <SelectItem value="price-high">Price: High-Low</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-display font-semibold text-foreground mb-2">No products found</h2>
            <p className="text-muted-foreground mb-4">Try selecting a sport from the home page first</p>
            <button onClick={() => navigate("/")} className="px-6 py-3 rounded-lg bg-gradient-primary text-primary-foreground font-medium">
              Choose a Sport
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product, i) => {
              const isWished = wishlist.includes(product.id);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group rounded-2xl border border-border bg-gradient-card overflow-hidden hover:border-primary/30 transition-colors"
                >
                  {/* Image placeholder */}
                  <div className="relative h-48 bg-secondary/50 flex items-center justify-center">
                    <Package className="w-12 h-12 text-muted-foreground/30" />
                    <span className="absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary capitalize">
                      {product.category}
                    </span>
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 flex items-center justify-center transition-colors hover:bg-card"
                    >
                      <Heart className={`w-4 h-4 ${isWished ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
                    <h3 className="font-display font-semibold text-foreground mb-1 text-sm">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                      <span className="text-xs font-medium text-foreground">{product.rating}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-display font-bold text-foreground">{formatINR(product.price)}</span>
                      <button
                        onClick={() => {
                          addToCart(product.id);
                          toast.success(`${product.name} added to cart`);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium hover:shadow-glow transition-shadow"
                      >
                        <ShoppingCart className="w-4 h-4" />
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
