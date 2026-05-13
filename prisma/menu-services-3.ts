// Auto-generated from new service list — Part 3: Waxing (Normal + Advance), Body, and non-gendered nail add-ons

export function getWaxingBodyServices(waxCat: any, handCat: any, bodyCat: any, bleachCat: any) {
  const WX = "WAXING" as const;
  const BD = "BODY_TREATMENTS" as const;
  const NC = "NAIL_CARE" as const;
  return [
    // ── Normal Waxing ────────────────────────────────────────────────
    { name: "Upper Lip Wax",              slug: "wax-upper-lip",            categoryId: waxCat.id, category: WX, price: 50,    duration: 10  },
    { name: "Chin Wax",                  slug: "wax-chin",                categoryId: waxCat.id, category: WX, price: 30,    duration: 10  },
    { name: "Under Arms Wax",             slug: "wax-under-arms",          categoryId: waxCat.id, category: WX, price: 100,                   duration: 10  },
    { name: "Legs Upto Knee Wax",         slug: "wax-legs-knee",           categoryId: waxCat.id, category: WX, price: 200,   priceMale: 250,  duration: 30  },
    { name: "Full Legs Wax",              slug: "wax-full-legs",           categoryId: waxCat.id, category: WX, price: 350,   priceMale: 400,  duration: 45  },
    { name: "Arms Upto Elbow Wax",        slug: "wax-arms-elbow",          categoryId: waxCat.id, category: WX, price: 250,                   duration: 20  },
    { name: "Full Arms Wax",               slug: "wax-full-arms",           categoryId: waxCat.id, category: WX, price: 250,   priceMale: 300,  duration: 30  },
    { name: "Full Face Wax",               slug: "wax-full-face",           categoryId: waxCat.id, category: WX, price: 200,                   duration: 20  },
    { name: "Back or Front Half Wax",      slug: "wax-back-front-half",     categoryId: waxCat.id, category: WX, price: 300,   priceMale: 400,  duration: 30  },
    { name: "Back or Front Full Wax",      slug: "wax-back-front-full",    categoryId: waxCat.id, category: WX, price: 500,   priceMale: 600,  duration: 45  },
    { name: "Stomach Wax",                slug: "wax-stomach",            categoryId: waxCat.id, category: WX, price: 250,   priceMale: 300,  duration: 20  },
    { name: "Bikini Line Wax",            slug: "wax-bikini-line",       categoryId: waxCat.id, category: WX, price: 800,                    duration: 20  },
    { name: "Full Body Wax",              slug: "wax-full-body",          categoryId: waxCat.id, category: WX, price: 2000,  priceMale: 2000, duration: 90  },

    // ── Advance Waxing ────────────────────────────────────────────────
    { name: "Upper Lip Advance Wax",       slug: "adv-wax-upper-lip",       categoryId: waxCat.id, category: WX, price: 50,    priceMale: 50,   duration: 10  },
    { name: "Chin Advance Wax",           slug: "adv-wax-chin",           categoryId: waxCat.id, category: WX, price: 50,    priceMale: 50,   duration: 10  },
    { name: "Under Arms Advance Wax",     slug: "adv-wax-under-arms",    categoryId: waxCat.id, category: WX, price: 150,   priceMale: 150,  duration: 10  },
    { name: "Legs Upto Knee Advance Wax",  slug: "adv-wax-legs-knee",      categoryId: waxCat.id, category: WX, price: 350,   priceMale: 400,  duration: 30  },
    { name: "Full Legs Advance Wax",       slug: "adv-wax-full-legs",      categoryId: waxCat.id, category: WX, price: 450,   priceMale: 500,  duration: 45  },
    { name: "Arms Upto Elbow Advance Wax", slug: "adv-wax-arms-elbow",    categoryId: waxCat.id, category: WX, price: 250,   priceMale: 300,  duration: 20  },
    { name: "Full Arms Advance Wax",      slug: "adv-wax-full-arms",      categoryId: waxCat.id, category: WX, price: 350,   priceMale: 400,  duration: 30  },
    { name: "Full Face Advance Wax",       slug: "adv-wax-full-face",      categoryId: waxCat.id, category: WX, price: 350,   priceMale: 350,  duration: 20  },
    { name: "Back or Front Half Advance Wax", slug: "adv-wax-back-front-half",categoryId: waxCat.id, category: WX, price: 350, priceMale: 350, duration: 30 },
    { name: "Back or Front Full Advance Wax",  slug: "adv-wax-back-front-full",categoryId: waxCat.id, category: WX, price: 600, priceMale: 600, duration: 45 },
    { name: "Stomach Advance Wax",         slug: "adv-wax-stomach",       categoryId: waxCat.id, category: WX, price: 350,   priceMale: 350,  duration: 20  },
    { name: "Bikini Line Advance Wax",     slug: "adv-wax-bikini-line",   categoryId: waxCat.id, category: WX, price: 800,   priceMale: 800,  duration: 20  },
    { name: "Bikini Advance Wax",         slug: "adv-wax-bikini",         categoryId: waxCat.id, category: WX, price: 1500,                   duration: 30  },
    { name: "Full Body Advance Wax",       slug: "adv-wax-full-body",     categoryId: waxCat.id, category: WX, price: 4000,  priceMale: 4000, duration: 90  },

    // ── Body Treatments ──────────────────────────────────────────────
    { name: "Body Massage (Oil)",        slug: "body-massage-oil",   categoryId: bodyCat.id, category: BD, price: 1000,  priceMale: 1000, duration: 60 },
    { name: "Body Massage (Cream)",        slug: "body-massage-cream", categoryId: bodyCat.id, category: BD, price: 1500,  priceMale: 1500, duration: 60 },
    { name: "Body Polishing",              slug: "body-polishing",     categoryId: bodyCat.id, category: BD, price: 4000,  priceMale: 3500, duration: 90 },

    // ── Non-gendered nail add-ons (removals, re-fills, art) ──────────
    { name: "Gel Polish Removal",              slug: "gel-polish-removal",        categoryId: handCat.id, category: NC, price: 150,  duration: 15  },
    { name: "Gel Nail Extension Removal",      slug: "gel-nail-ex-removal",       categoryId: handCat.id, category: NC, price: 299,  duration: 20  },
    { name: "Acrylic Nail Extension Removal",  slug: "acrylic-nail-ex-removal",   categoryId: handCat.id, category: NC, price: 399,  duration: 20  },
    { name: "Gel Nail Re-fills (Per Hand)",    slug: "gel-nail-refills",         categoryId: handCat.id, category: NC, price: 499,  duration: 45  },
    { name: "Acrylic Nail Re-fills (Per Hand)",slug: "acrylic-nail-refills",     categoryId: handCat.id, category: NC, price: 599,  duration: 45  },
    { name: "Fake / Press-on Nail (Per Hand)",  slug: "fake-press-on-nail",       categoryId: handCat.id, category: NC, price: 999,  duration: 30  },
    { name: "Gel Nail Extension",             slug: "gel-nail-extension",        categoryId: handCat.id, category: NC, price: 2000, duration: 90,  isFeatured: true },
    { name: "Acrylic Nail Extension",         slug: "acrylic-nail-extension",   categoryId: handCat.id, category: NC, price: 3000, duration: 90  },
    { name: "Gel Nail Extension (Bridal)",     slug: "gel-nail-extension-bridal",categoryId: handCat.id, category: NC, price: 3000, duration: 120 },
    { name: "Acrylic Nail Extension (Bridal)",  slug: "acrylic-nail-ex-bridal",  categoryId: handCat.id, category: NC, price: 4000, duration: 120 },
    { name: "Single Nail Art (Per Finger)",        slug: "nail-art",               categoryId: handCat.id, category: NC, price: 100,  duration: 30, isPopular: true },
    { name: "Ombre Nail Art (Per Finger)",          slug: "ombre-nail-art",         categoryId: handCat.id, category: NC, price: 129,  duration: 30 },
    { name: "Cat Eye Nail Art (Per Finger)",         slug: "cat-eye-nail",           categoryId: handCat.id, category: NC, price: 149,  duration: 30 },
    { name: "Chrome / Metallic Nail (Per Finger)",  slug: "chrome-nail",           categoryId: handCat.id, category: NC, price: 149,  duration: 30 },
    { name: "Cut / File",                          slug: "nail-cut-file",         categoryId: handCat.id, category: NC, price: 100,  duration: 15 },
    { name: "3D Design",                          slug: "nail-3d-design",        categoryId: handCat.id, category: NC, price: 199,  duration: 30 },
    { name: "Acrylic Nail Design",                slug: "acrylic-nail-design",   categoryId: handCat.id, category: NC, price: 199,  duration: 30 },
    { name: "Application of Nail Polish (Per Hand)",slug: "nail-polish-application",categoryId: handCat.id, category: NC, price: 499, duration: 30 },
    { name: "Glitter Colour Change Polish",        slug: "glitter-nail-polish",   categoryId: handCat.id, category: NC, price: 999, duration: 30 },
  ];
}
