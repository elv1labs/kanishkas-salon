"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string | null;
    slug: string;
}

interface CartContextValue {
    items: CartItem[];
    itemCount: number;
    subtotal: number;
    addItem: (product: { id: string; name: string; price: string | number; thumbnailUrl?: string | null; slug: string }) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, delta: number) => void;
    clearCart: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "kfs_cart";

function readStorage(): CartItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeStorage(items: CartItem[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch { /* ignore quota errors */ }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    // Hydrate from localStorage once on mount (avoids SSR mismatch)
    useEffect(() => {
        setItems(readStorage());
    }, []);

    // Persist to localStorage whenever items change
    useEffect(() => {
        writeStorage(items);
        // Dispatch event so any non-context listeners (e.g. legacy code) also update
        window.dispatchEvent(new Event("cartUpdated"));
    }, [items]);

    // Cross-tab sync: listen for storage events from other tabs
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) {
                setItems(readStorage());
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    // ── Actions ───────────────────────────────────────────────────────────────

    const addItem = useCallback((product: {
        id: string;
        name: string;
        price: string | number;
        thumbnailUrl?: string | null;
        slug: string;
    }) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                return prev.map(i =>
                    i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [
                ...prev,
                {
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    quantity: 1,
                    image: product.thumbnailUrl ?? null,
                    slug: product.slug,
                },
            ];
        });
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    }, []);

    const updateQuantity = useCallback((id: string, delta: number) => {
        setItems(prev =>
            prev.map(i =>
                i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
            )
        );
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    // ── Derived values ────────────────────────────────────────────────────────

    const itemCount = useMemo(
        () => items.reduce((sum, i) => sum + i.quantity, 0),
        [items]
    );

    const subtotal = useMemo(
        () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        [items]
    );

    return (
        <CartContext.Provider value={{ items, itemCount, subtotal, addItem, removeItem, updateQuantity, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
    return ctx;
}
