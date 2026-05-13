// Auto-generated from new service list — Part 1: Hair Styling, Hair Treatments, Hair Colouring

export function getHairServices(hairCat: any, treatCat: any, colorCat: any) {
  const H = "HAIR_STYLING" as const;
  const T = "HAIR_TREATMENTS" as const;
  const C = "HAIR_COLORING" as const;
  return [
    // ── Hair Styling & Cuts ──────────────────────────────────────────
    { name: "Hair Cut",               slug: "hair-cut",                categoryId: hairCat.id, category: H, price: 350,  priceMale: 300,  duration: 30,  isPopular: true },
    { name: "Advance Hair Cut",        slug: "advance-hair-cut",       categoryId: hairCat.id, category: H, price: 400,  priceMale: 350,  duration: 30  },
    { name: "Junior Hair Cut",        slug: "junior-hair-cut",         categoryId: hairCat.id, category: H, price: 300,  priceMale: 150,  duration: 20  },
    { name: "Beard Trim",             slug: "beard-trim",             categoryId: hairCat.id, category: H, price: 100,                   duration: 15  },
    { name: "Shave",                 slug: "shave",                  categoryId: hairCat.id, category: H, price: 100,                   duration: 15  },
    { name: "Shampoo + Conditioner",  slug: "shampoo-conditioner",    categoryId: hairCat.id, category: H, price: 250,  priceMale: 150,  duration: 20  },
    { name: "Hair Style",            slug: "hair-style",              categoryId: hairCat.id, category: H, price: 500,  priceMale: 100,  duration: 30  },
    { name: "Blow Dry",             slug: "blow-dry",               categoryId: hairCat.id, category: H, price: 350,                   duration: 20  },
    { name: "Ironing",              slug: "ironing",                categoryId: hairCat.id, category: H, price: 500,  priceMale: 300,  duration: 30  },

    // ── Hair Texture ─────────────────────────────────────────────────
    { name: "Hair Smoothening",     slug: "hair-smoothening",       categoryId: treatCat.id, category: T, price: 2999, priceMale: 1999, duration: 120, note: "For shoulder length" },
    { name: "Hair Straightening",    slug: "hair-straightening",      categoryId: treatCat.id, category: T, price: 2999, priceMale: 1999, duration: 120, note: "For shoulder length" },
    { name: "Hair Rebonding",        slug: "hair-rebonding",          categoryId: treatCat.id, category: T, price: 2999, priceMale: 1999, duration: 120, note: "For shoulder length" },
    { name: "Hair Perming",          slug: "hair-perming",            categoryId: treatCat.id, category: T, price: 3999, priceMale: 2999, duration: 120, note: "For shoulder length" },

    // ── Hair Treatment ───────────────────────────────────────────────
    { name: "Keratin",              slug: "keratin-treatment",       categoryId: treatCat.id, category: T, price: 2999, priceMale: 1999, duration: 120, note: "For shoulder length" },
    { name: "Cysteine",             slug: "cysteine-treatment",      categoryId: treatCat.id, category: T, price: 3499,                   duration: 120, note: "For shoulder length" },
    { name: "Botox",                slug: "hair-botox",              categoryId: treatCat.id, category: T, price: 4999,                   duration: 90,  note: "For shoulder length" },
    { name: "Kera Shine",           slug: "kera-shine",              categoryId: treatCat.id, category: T, price: 4999,                   duration: 90,  note: "For shoulder length" },
    { name: "Smoothing Keratin",     slug: "smoothing-keratin",       categoryId: treatCat.id, category: T, price: 4999,                   duration: 90,  note: "For shoulder length" },

    // ── Hair Spa ────────────────────────────────────────────────────
    { name: "Nourishing Hair Spa",   slug: "nourishing-hair-spa",   categoryId: treatCat.id, category: T, price: 1000, priceMale: 700,  duration: 45,  isFeatured: true },
    { name: "Colour Shine Hair Spa", slug: "colour-shine-hair-spa", categoryId: treatCat.id, category: T, price: 1000, priceMale: 700,  duration: 45  },

    // ── Advance Hair Treatment ────────────────────────────────────────
    { name: "Dandruff Spa",          slug: "dandruff-spa",           categoryId: treatCat.id, category: T, price: 1200, priceMale: 800,  duration: 60  },
    { name: "Hair Full Spa",         slug: "hair-full-spa",          categoryId: treatCat.id, category: T, price: 1200, priceMale: 800,  duration: 60  },
    { name: "Dry & Damaged Spa",      slug: "dry-damaged-spa",        categoryId: treatCat.id, category: T, price: 1200, priceMale: 800,  duration: 60  },

    // ── Health Hair Treatment ─────────────────────────────────────────
    { name: "Power Mix",             slug: "power-mix",              categoryId: treatCat.id, category: T, price: 1800, priceMale: 1000, duration: 60  },
    { name: "Smart Bond",           slug: "smart-bond",             categoryId: treatCat.id, category: T, price: 500,  priceMale: 300,  duration: 30  },

    // ── Head Massage ─────────────────────────────────────────────────
    { name: "Normal Head Massage",   slug: "head-massage-normal",     categoryId: treatCat.id, category: T, price: 300,  priceMale: 300,  duration: 20,  isPopular: true },
    { name: "Advance Head Massage",  slug: "head-massage-advance",   categoryId: treatCat.id, category: T, price: 350,  priceMale: 350,  duration: 30  },

    // ── Hair Colour ──────────────────────────────────────────────────
    { name: "Colour Global Natural",  slug: "colour-global-natural",   categoryId: colorCat.id, category: C, price: 2500, priceMale: 700,  duration: 90  },
    { name: "Colour Global Fashion",  slug: "colour-global-fashion",  categoryId: colorCat.id, category: C, price: 2500, priceMale: 700,  duration: 90  },
    { name: "INOA Colour Natural",    slug: "inoa-colour-natural",     categoryId: colorCat.id, category: C, price: 3000, priceMale: 800,  duration: 90  },
    { name: "INOA Colour Fashion",   slug: "inoa-colour-fashion",    categoryId: colorCat.id, category: C, price: 3000, priceMale: 900,  duration: 90  },
    { name: "Highlights (Per Stick)", slug: "highlights",              categoryId: colorCat.id, category: C, price: 400,  priceMale: 200,  duration: 30 },
    { name: "Colour Touchup Normal",  slug: "colour-touchup-normal",  categoryId: colorCat.id, category: C, price: 700,                    duration: 45  },
    { name: "Colour Touchup INOA",    slug: "colour-touchup-inoa",    categoryId: colorCat.id, category: C, price: 800,                    duration: 45  },
  ];
}
