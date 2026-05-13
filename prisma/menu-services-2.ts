// Auto-generated from new service list — Part 2: Skin Care (Cleanup, Facial, Bleach, Under Eye, D-Tan, Threading), Makeup, Nail Care
import { ServiceCategory } from "@prisma/client";

export function getSkinMakeupNailServices(skinCat: any, makeupCat: any, nailCat: any, bridalCat: any) {
  const SK = "SKIN_CARE" as const;
  const MK = "MAKEUP" as const;
  const NC = "NAIL_CARE" as const;
  return [
    // ── Skin Care — Cleanup ──────────────────────────────────────────
    { name: "Regular Cleanup",         slug: "cleanup-regular",        categoryId: skinCat.id, category: SK, price: 400,  priceMale: 400,  duration: 30,  isPopular: true },
    { name: "Smooth Skin Cleanup",     slug: "cleanup-smooth-skin",   categoryId: skinCat.id, category: SK, price: 500,  priceMale: 500,  duration: 30  },
    { name: "Oil Control Cleanup",     slug: "cleanup-oil-control",   categoryId: skinCat.id, category: SK, price: 600,  priceMale: 600,  duration: 30  },
    { name: "Fresh Feel Cleanup",       slug: "cleanup-fresh-feel",   categoryId: skinCat.id, category: SK, price: 600,  priceMale: 600,  duration: 30  },
    { name: "O3+ Cleanup",             slug: "cleanup-o3plus",      categoryId: skinCat.id, category: SK, price: 800,  priceMale: 800,  duration: 45  },
    { name: "Cheryl's Cleanup",         slug: "cleanup-cheryls",     categoryId: skinCat.id, category: SK, price: 900,  priceMale: 900,  duration: 45  },

    // ── Skin Care — Facial ───────────────────────────────────────────
    { name: "Instant Glow Facial",      slug: "instant-glow-facial",   categoryId: skinCat.id, category: SK, price: 800,   priceMale: 800,   duration: 60  },
    { name: "Fresh Fruit Facial",       slug: "fresh-fruit-facial",   categoryId: skinCat.id, category: SK, price: 900,   priceMale: 900,   duration: 60  },
    { name: "Silver Facial",            slug: "silver-facial",        categoryId: skinCat.id, category: SK, price: 1000,  priceMale: 1000,  duration: 60  },
    { name: "Gold Facial",              slug: "gold-facial",         categoryId: skinCat.id, category: SK, price: 1200,  priceMale: 1200,  duration: 60,  isFeatured: true },
    { name: "Diamond Facial",           slug: "diamond-facial",      categoryId: skinCat.id, category: SK, price: 1400,  priceMale: 1400,  duration: 60  },
    { name: "Vitamin C Facial",         slug: "vitamin-c-facial",    categoryId: skinCat.id, category: SK, price: 1200,  priceMale: 1200,  duration: 60  },
    { name: "Pure Whitening Facial",    slug: "pure-whitening-facial",categoryId: skinCat.id, category: SK, price: 1400,  priceMale: 1400,  duration: 60  },
    { name: "Anti Wrinkle Facial",      slug: "anti-wrinkle-facial", categoryId: skinCat.id, category: SK, price: 1800,  priceMale: 1800,  duration: 75  },
    { name: "Tan Clear Facial",         slug: "tan-clear-facial",    categoryId: skinCat.id, category: SK, price: 1800,  priceMale: 1800,  duration: 75  },
    { name: "Sensi Glow Facial",        slug: "sensi-glow",          categoryId: skinCat.id, category: SK, price: 1800,  priceMale: 1800,  duration: 75  },
    { name: "Hydra Facial",             slug: "hydra-facial",        categoryId: skinCat.id, category: SK, price: 1800,  priceMale: 1800,  duration: 75,  isFeatured: true },
    { name: "Pura Vital Facial",        slug: "pura-vital-facial",   categoryId: skinCat.id, category: SK, price: 1800,  priceMale: 1800,  duration: 75  },
    { name: "Gold Radiance Magic Facial", slug: "gold-radiance-facial",categoryId: skinCat.id, category: SK, price: 2000,  priceMale: 2000,  duration: 75  },
    { name: "O2 C2 Facial",            slug: "o2-c2-facial",         categoryId: skinCat.id, category: SK, price: 2000,  priceMale: 2000,  duration: 75  },
    { name: "Diamond Facial (Advance)", slug: "diamond-facial-advance",categoryId: skinCat.id, category: SK, price: 2500,  priceMale: 2500,  duration: 90  },
    { name: "Insta Fair Facial",        slug: "insta-fair-facial",  categoryId: skinCat.id, category: SK, price: 2500,  priceMale: 2500,  duration: 90  },
    { name: "Face Spa",                 slug: "face-spa",           categoryId: skinCat.id, category: SK, price: 3500,  priceMale: 3500,  duration: 90,  isFeatured: true },
    { name: "Skin Tightening Facial",   slug: "skin-tightening-facial",categoryId: skinCat.id, category: SK, price: 3000,  priceMale: 3000,  duration: 90  },
    { name: "Kanpeki Facial",          slug: "kanpeki-facial",      categoryId: skinCat.id, category: SK, price: 3500,  priceMale: 3500,  priceMax: 4000, duration: 90  },
    { name: "Casmara",                  slug: "casmara-facial",      categoryId: skinCat.id, category: SK, price: 4000,  priceMale: 4000,  duration: 90  },

    // ── Bleach ───────────────────────────────────────────────────────
    { name: "Fruit Bleach",            slug: "bleach-fruit",         categoryId: skinCat.id, category: SK, price: 300,  priceMale: 300,  duration: 20  },
    { name: "Gold Bleach",             slug: "bleach-gold",          categoryId: skinCat.id, category: SK, price: 400,  priceMale: 400,  duration: 20  },
    { name: "Oxy Bleach",              slug: "bleach-oxy",           categoryId: skinCat.id, category: SK, price: 500,  priceMale: 500,  duration: 20  },
    { name: "Diamond Bleach",          slug: "bleach-diamond",       categoryId: skinCat.id, category: SK, price: 600,  priceMale: 600,  duration: 20  },

    // ── Under Eye Treatment ───────────────────────────────────────────
    { name: "Normal Under Eye Treatment",  slug: "under-eye-normal",   categoryId: skinCat.id, category: SK, price: 300,  priceMale: 300,  duration: 20  },
    { name: "Advance Under Eye Treatment",  slug: "under-eye-advance", categoryId: skinCat.id, category: SK, price: 500,  priceMale: 500,  duration: 30  },

    // ── D-Tan ────────────────────────────────────────────────────────
    { name: "D-Tan Face",              slug: "dtan-face",            categoryId: skinCat.id, category: SK, price: 400,  priceMale: 400,  duration: 30  },
    { name: "D-Tan Hand",              slug: "dtan-hand",            categoryId: skinCat.id, category: SK, price: 600,  priceMale: 600,  duration: 30  },
    { name: "D-Tan Foot",              slug: "dtan-foot",            categoryId: skinCat.id, category: SK, price: 1000, priceMale: 1000, duration: 30  },
    { name: "D-Tan Full Body",         slug: "dtan-full-body",       categoryId: skinCat.id, category: SK, price: 3500, priceMale: 3500, duration: 90  },
    { name: "D-Tan Half Body",         slug: "dtan-half-body",       categoryId: skinCat.id, category: SK, price: 2000, priceMale: 2000, duration: 60  },

    // ── Threading ────────────────────────────────────────────────────
    { name: "Eyebrow Threading",       slug: "threading-eyebrow",     categoryId: skinCat.id, category: SK, price: 30,   priceMale: 50,   duration: 10, isPopular: true },
    { name: "Upper Lip Threading",     slug: "threading-upper-lip",   categoryId: skinCat.id, category: SK, price: 20,                    duration: 5   },
    { name: "Chin Threading",          slug: "threading-chin",        categoryId: skinCat.id, category: SK, price: 30,                    duration: 5   },
    { name: "Forehead Threading",     slug: "threading-forehead",    categoryId: skinCat.id, category: SK, price: 20,   priceMale: 20,   duration: 5   },
    { name: "Jawline Threading",      slug: "threading-jawline",    categoryId: skinCat.id, category: SK, price: 30,                    duration: 5   },
    { name: "Full Face Threading",     slug: "threading-full-face",  categoryId: skinCat.id, category: SK, price: 150,                   duration: 20  },

    // ── Makeup ───────────────────────────────────────────────────────
    { name: "Light Makeup",            slug: "light-makeup",          categoryId: makeupCat.id, category: MK, price: 1500, priceMale: 1000, duration: 45 },
    { name: "Party Makeup",            slug: "party-makeup",         categoryId: makeupCat.id, category: MK, price: 2000, priceMale: 1500, duration: 60, isFeatured: true, isPopular: true },
    { name: "Engagement Makeup",       slug: "engagement-makeup",    categoryId: makeupCat.id, category: MK, price: 5000, priceMale: 2500, duration: 90, requiresDeposit: true, depositAmount: 500 },
    { name: "Reception Makeup",        slug: "reception-makeup",     categoryId: makeupCat.id, category: MK, price: 7000, priceMale: 3500, duration: 120, requiresDeposit: true, depositAmount: 1000 },
    { name: "Bridal Makeup",           slug: "bridal-makeup",        categoryId: bridalCat.id, category: MK, price: 7000,                    duration: 180, isFeatured: true, requiresDeposit: true, depositAmount: 2000 },
    { name: "Groom Makeup",            slug: "groom-makeup",          categoryId: makeupCat.id, category: MK, price: 5000,                   duration: 120 },
    { name: "Advance Bridal Makeup",   slug: "advance-bridal-makeup",categoryId: bridalCat.id, category: MK, price: 8000,                   duration: 180, requiresDeposit: true, depositAmount: 2000 },
    { name: "HD Makeup",              slug: "hd-makeup",             categoryId: makeupCat.id, category: MK, price: 10000,                  duration: 180, isFeatured: true },

    // ── Nail Care — Manicure & Pedicure ──────────────────────────────
    { name: "Regular Manicure",       slug: "manicure-regular",  categoryId: nailCat.id, category: NC, price: 300,  priceMale: 300,  duration: 30,  isPopular: true },
    { name: "French Manicure",         slug: "manicure-french",   categoryId: nailCat.id, category: NC, price: 400,  priceMale: 400,  duration: 30  },
    { name: "Advance Manicure",        slug: "manicure-advance",  categoryId: nailCat.id, category: NC, price: 600,  priceMale: 600,  duration: 45  },
    { name: "Regular Pedicure",        slug: "pedicure-regular",  categoryId: nailCat.id, category: NC, price: 400,  priceMale: 400,  duration: 30  },
    { name: "French Pedicure",         slug: "pedicure-french",   categoryId: nailCat.id, category: NC, price: 600,  priceMale: 600,  duration: 45  },
    { name: "Advance Pedicure",         slug: "pedicure-advance",  categoryId: nailCat.id, category: NC, price: 800,  priceMale: 800,  duration: 60  },
    { name: "Hand Spa",               slug: "hand-spa",          categoryId: nailCat.id, category: NC, price: 800,  priceMale: 800,  duration: 45  },
    { name: "Foot Spa",               slug: "foot-spa",          categoryId: nailCat.id, category: NC, price: 1000, priceMale: 1000, duration: 60  },

    // ── Nail Care — Removals & Re-fills ─────────────────────────────
    { name: "Gel Polish Removal",              slug: "gel-polish-removal",        categoryId: nailCat.id, category: NC, price: 150,  duration: 15  },
    { name: "Gel Nail Extension Removal",      slug: "gel-nail-ex-removal",       categoryId: nailCat.id, category: NC, price: 299,  duration: 20  },
    { name: "Acrylic Nail Extension Removal",  slug: "acrylic-nail-ex-removal",  categoryId: nailCat.id, category: NC, price: 399,  duration: 20  },
    { name: "Gel Nail Re-fills (Per Hand)",    slug: "gel-nail-refills",         categoryId: nailCat.id, category: NC, price: 499,  duration: 45  },
    { name: "Acrylic Nail Re-fills (Per Hand)",slug: "acrylic-nail-refills",     categoryId: nailCat.id, category: NC, price: 599,  duration: 45  },
    { name: "Fake / Press-on Nail (Per Hand)", slug: "fake-press-on-nail",       categoryId: nailCat.id, category: NC, price: 999,  duration: 30  },

    // ── Nail Care — Extensions ───────────────────────────────────────
    { name: "Gel Nail Extension",              slug: "gel-nail-extension",        categoryId: nailCat.id, category: NC, price: 2000, duration: 90,  isFeatured: true },
    { name: "Acrylic Nail Extension",          slug: "acrylic-nail-extension",    categoryId: nailCat.id, category: NC, price: 3000, duration: 90  },
    { name: "Gel Nail Extension (Bridal)",     slug: "gel-nail-extension-bridal", categoryId: nailCat.id, category: NC, price: 3000, duration: 120 },
    { name: "Acrylic Nail Extension (Bridal)",  slug: "acrylic-nail-ex-bridal",   categoryId: nailCat.id, category: NC, price: 4000, duration: 120 },

    // ── Nail Care — Nail Art ─────────────────────────────────────────
    { name: "Single Nail Art (Per Finger)",        slug: "nail-art",               categoryId: nailCat.id, category: NC, price: 100,  duration: 30, isPopular: true },
    { name: "Ombre Nail Art (Per Finger)",          slug: "ombre-nail-art",         categoryId: nailCat.id, category: NC, price: 129,  duration: 30 },
    { name: "Cat Eye Nail Art (Per Finger)",         slug: "cat-eye-nail",           categoryId: nailCat.id, category: NC, price: 149,  duration: 30 },
    { name: "Chrome / Metallic Nail (Per Finger)",  slug: "chrome-nail",           categoryId: nailCat.id, category: NC, price: 149,  duration: 30 },
    { name: "Cut / File",                           slug: "nail-cut-file",         categoryId: nailCat.id, category: NC, price: 100,  duration: 15 },
    { name: "3D Design",                           slug: "nail-3d-design",        categoryId: nailCat.id, category: NC, price: 199,  duration: 30 },
    { name: "Acrylic Nail Design",                 slug: "acrylic-nail-design",   categoryId: nailCat.id, category: NC, price: 199,  duration: 30 },
    { name: "Application of Nail Polish (Per Hand)",slug: "nail-polish-application",categoryId: nailCat.id, category: NC, price: 499, duration: 30 },
    { name: "Glitter Colour Change Polish",        slug: "glitter-nail-polish",   categoryId: nailCat.id, category: NC, price: 999, duration: 30 },
  ];
}
