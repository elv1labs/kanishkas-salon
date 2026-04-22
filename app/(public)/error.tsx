"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PublicError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Public page error:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-full bg-rose-gold/10 flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">💫</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-espresso mb-3">
                    Something Went Wrong
                </h2>
                <p className="text-charcoal-lighter text-sm mb-6">
                    We apologize for the inconvenience. Please try again or contact us directly.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button onClick={reset} className="btn-gold text-sm">
                        Try Again
                    </button>
                    <Link href="/" className="btn-outline text-sm">
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
