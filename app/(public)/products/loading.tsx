export default function ProductsLoading() {
    return (
        <>
            <section className="bg-espresso py-16 sm:py-20">
                <div className="container-salon text-center px-4">
                    <div className="skeleton-gold h-4 w-16 mx-auto mb-4 rounded" />
                    <div className="skeleton-gold h-10 w-80 max-w-full mx-auto mb-4 rounded" />
                    <div className="skeleton-gold h-4 w-64 mx-auto rounded" />
                </div>
            </section>
            <section className="section-padding bg-cream">
                <div className="container-salon">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="card-luxury">
                                <div className="aspect-square skeleton-gold" />
                                <div className="p-4 space-y-2">
                                    <div className="skeleton-gold h-3 w-16 rounded" />
                                    <div className="skeleton-gold h-4 w-3/4 rounded" />
                                    <div className="skeleton-gold h-5 w-20 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
