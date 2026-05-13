// prisma/seed.ts
// Seeds the database with Kanishka's Family Salon comprehensive data

import { PrismaClient, UserRole, ServiceCategory, ProductCategory, AppointmentStatus, OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getHairServices } from "./menu-services";
import { getSkinMakeupNailServices } from "./menu-services-2";
import { getWaxingBodyServices } from "./menu-services-3";

const prisma = new PrismaClient();

// Helper: date relative to today
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d; };
const daysFromNow = (n: number) => daysAgo(-n);
const hoursAgo = (n: number) => { const d = new Date(); d.setHours(d.getHours() - n); return d; };

async function main() {
  console.log("🌱 Seeding Kanishka's Family Salon database...\n");

  // ================================================================
  // 1. BUSINESS SETTINGS
  // ================================================================
  await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      salonName: "Kanishka's Family Salon & Academy",
      tagline: "Step Into a World of Beauty & Luxury",
      phone: "+919171230292",
      email: "kanishkasen100@gmail.com",
      address: "Anand Bazar, Baikunth Dham, Indore, Madhya Pradesh 452001",
      googleMapsUrl: "https://maps.google.com/?q=Kanishka+Family+Salon+Indore",
      instagramUrl: "https://instagram.com/kanishkas_family_salon",
      whatsappNumber: "919171230292",
      openTime: "10:00",
      closeTime: "21:00",
      currency: "INR",
      timezone: "Asia/Kolkata",
      loyaltyPointsValue: 1,
      appointmentBuffer: 15,
      cancellationPolicy: "Please cancel at least 2 hours before your appointment to avoid a cancellation fee.",
    },
  });
  console.log("  ✅ Business settings");

  // ================================================================
  // 2. USERS (10 total: 1 admin, 1 owner, 2 receptionists, 6 clients)
  // ================================================================
  const pw = await bcrypt.hash("Kanishka@2024!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "kanishkasen100@gmail.com" },
    update: {},
    create: { name: "Kanishka Sen", email: "kanishkasen100@gmail.com", phone: "+919171230292", passwordHash: pw, role: UserRole.ADMIN, emailVerified: new Date() },
  });

  const owner = await prisma.user.upsert({
    where: { email: "priya.s@kanishkas.in" },
    update: {},
    create: { name: "Priya Sharma", email: "priya.s@kanishkas.in", phone: "+919876511111", passwordHash: pw, role: UserRole.OWNER, emailVerified: new Date() },
  });

  const receptionist1 = await prisma.user.upsert({
    where: { email: "neha.g@kanishkas.in" },
    update: {},
    create: { name: "Neha Gupta", email: "neha.g@kanishkas.in", phone: "+919876522222", passwordHash: pw, role: UserRole.RECEPTIONIST, emailVerified: new Date() },
  });

  const receptionist2 = await prisma.user.upsert({
    where: { email: "aarti.j@kanishkas.in" },
    update: {},
    create: { name: "Aarti Joshi", email: "aarti.j@kanishkas.in", phone: "+919876533333", passwordHash: pw, role: UserRole.RECEPTIONIST, emailVerified: new Date() },
  });

  const clientEmails = [
    { name: "Meera Kapoor", email: "meera.kapoor@gmail.com", phone: "+919876543210" },
    { name: "Riya Patel", email: "riya.p@outlook.com", phone: "+918765432109" },
    { name: "Anita Sharma", email: "anita.sharma@gmail.com", phone: "+917654321098" },
    { name: "Sunita Joshi", email: "sunita.j@gmail.com", phone: "+915432109876" },
    { name: "Pooja Verma", email: "pooja.v@yahoo.com", phone: "+916543210987" },
    { name: "Deepa Reddy", email: "deepa.reddy@gmail.com", phone: "+913210987654" },
  ];

  const clients: any[] = [];
  for (const c of clientEmails) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { ...c, passwordHash: pw, role: UserRole.CLIENT, emailVerified: new Date(), isActive: c.name !== "Pooja Verma" },
    });
    clients.push(user);
  }
  console.log("  ✅ 10 users (admin, owner, 2 receptionists, 6 clients)");

  // ================================================================
  // 3. STAFF PROFILES
  // ================================================================
  for (const { userId, designation, bio, specs, exp } of [
    { userId: admin.id, designation: "Founder & Head Stylist", bio: "Kanishka Sen is the founder with 15+ years of expertise in hair, makeup, and beauty.", specs: ["Bridal Makeup", "Hair Styling", "Academy Training"], exp: 15 },
    { userId: owner.id, designation: "Senior Stylist & Manager", bio: "Priya manages salon operations and specializes in hair treatments and coloring.", specs: ["Hair Treatments", "Hair Coloring", "Keratin"], exp: 8 },
    { userId: receptionist1.id, designation: "Stylist & Makeup Artist", bio: "Neha specializes in bridal makeup, facials, and skin treatments.", specs: ["Bridal Makeup", "Facials", "Skin Care"], exp: 5 },
    { userId: receptionist2.id, designation: "Nail & Beauty Specialist", bio: "Aarti specializes in nail art, waxing, and hand/foot care.", specs: ["Nail Art", "Waxing", "Manicure & Pedicure"], exp: 3 },
  ]) {
    await prisma.staffProfile.upsert({
      where: { userId },
      update: {},
      create: { userId, designation, bio, specializations: specs, experience: exp },
    });
  }
  console.log("  ✅ 4 staff profiles");

  // ================================================================
  // 4. CLIENT PROFILES
  // ================================================================
  const profileData = [
    { idx: 0, gender: "Female", city: "Indore", skinType: "Combination", hairType: "Wavy", totalVisits: 12 },
    { idx: 1, gender: "Female", city: "Indore", skinType: "Oily", hairType: "Straight", totalVisits: 8 },
    { idx: 2, gender: "Female", city: "Indore", skinType: "Normal", hairType: "Curly", totalVisits: 6 },
    { idx: 3, gender: "Female", city: "Indore", skinType: "Dry", hairType: "Straight", totalVisits: 4 },
    { idx: 4, gender: "Female", city: "Indore", skinType: "Sensitive", hairType: "Wavy", totalVisits: 2 },
    { idx: 5, gender: "Female", city: "Indore", skinType: "Normal", hairType: "Straight", totalVisits: 5 },
  ];
  for (const p of profileData) {
    await prisma.clientProfile.upsert({
      where: { userId: clients[p.idx].id },
      update: {},
      create: { userId: clients[p.idx].id, gender: p.gender, city: p.city, skinType: p.skinType, hairType: p.hairType, totalVisits: p.totalVisits },
    });
  }
  console.log("  ✅ 6 client profiles");

  // ================================================================
  // 5. LOYALTY ACCOUNTS
  // ================================================================
  const loyaltyData = [
    { idx: 0, points: 1250, earned: 1750, redeemed: 500, tier: "GOLD" },
    { idx: 1, points: 480, earned: 580, redeemed: 100, tier: "SILVER" },
    { idx: 2, points: 320, earned: 370, redeemed: 50, tier: "SILVER" },
    { idx: 3, points: 150, earned: 150, redeemed: 0, tier: "BRONZE" },
    { idx: 4, points: 50, earned: 50, redeemed: 0, tier: "BRONZE" },
    { idx: 5, points: 600, earned: 800, redeemed: 200, tier: "SILVER" },
  ];
  const loyaltyAccounts: any[] = [];
  for (const l of loyaltyData) {
    const acc = await prisma.loyaltyAccount.upsert({
      where: { userId: clients[l.idx].id },
      update: {},
      create: { userId: clients[l.idx].id, totalPoints: l.points, lifetimeEarned: l.earned, lifetimeRedeemed: l.redeemed, tier: l.tier },
    });
    loyaltyAccounts.push(acc);
  }
  console.log("  ✅ 6 loyalty accounts");

  // ================================================================
  // 6. SERVICE CATEGORIES & SERVICES
  // ================================================================
  const categoryData = [
    { name: "Hair Styling & Cuts", slug: "hair-styling", icon: "✂️", sortOrder: 1 },
    { name: "Hair Treatments", slug: "hair-treatments", icon: "💆", sortOrder: 2 },
    { name: "Hair Coloring", slug: "hair-coloring", icon: "🎨", sortOrder: 3 },
    { name: "Skin Care", slug: "skin-care", icon: "✨", sortOrder: 4 },
    { name: "Makeup", slug: "makeup", icon: "💄", sortOrder: 5 },
    { name: "Nail Care", slug: "nail-care", icon: "💅", sortOrder: 6 },
    { name: "Waxing", slug: "waxing", icon: "🌸", sortOrder: 7 },
    { name: "Body Treatments", slug: "body-treatments", icon: "🧖", sortOrder: 8 },
    { name: "Hand & Foot Care", slug: "hand-foot-care", icon: "🤲", sortOrder: 9 },
    { name: "Bridal Services", slug: "bridal", icon: "👰", sortOrder: 10 },
    { name: "Academy & Training", slug: "academy", icon: "🎓", sortOrder: 11 },
    { name: "Bleach", slug: "bleach", icon: "🌟", sortOrder: 12 },
  ];
  for (const cat of categoryData) {
    await prisma.serviceCategory_Model.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }

  const hairCat = await prisma.serviceCategory_Model.findUnique({ where: { slug: "hair-styling" } });
  const treatCat = await prisma.serviceCategory_Model.findUnique({ where: { slug: "hair-treatments" } });
  const colorCat = await prisma.serviceCategory_Model.findUnique({ where: { slug: "hair-coloring" } });
  const skinCat = await prisma.serviceCategory_Model.findUnique({ where: { slug: "skin-care" } });
  const makeupCat = await prisma.serviceCategory_Model.findUnique({ where: { slug: "makeup" } });
  const nailCat = await prisma.serviceCategory_Model.findUnique({ where: { slug: "nail-care" } });
  const waxCat = await prisma.serviceCategory_Model.findUnique({ where: { slug: "waxing" } });
  const bodyCat = await prisma.serviceCategory_Model.findUnique({ where: { slug: "body-treatments" } });
  const handCat = await prisma.serviceCategory_Model.findUnique({ where: { slug: "hand-foot-care" } });
  const bridalCat = await prisma.serviceCategory_Model.findUnique({ where: { slug: "bridal" } });
  const bleachCat = await prisma.serviceCategory_Model.findUnique({ where: { slug: "bleach" } });

  const services = [
    ...getHairServices(hairCat!, treatCat!, colorCat!),
    ...getSkinMakeupNailServices(skinCat!, makeupCat!, nailCat!, bridalCat!),
    ...getWaxingBodyServices(waxCat!, handCat!, bodyCat!, bleachCat!),
  ];

  const newSlugs = new Set(services.map(s => s.slug));
  const currentSlugs = await prisma.service.findMany({ select: { slug: true } });
  const slugsToDelete = currentSlugs.filter(s => !newSlugs.has(s.slug)).map(s => s.slug);
  if (slugsToDelete.length > 0) {
    await prisma.service.updateMany({
      where: { slug: { in: slugsToDelete } },
      data: { isActive: false },
    });
    console.log(`  📦 Deactivated ${slugsToDelete.length} old services`);
  }

  const svcMap: Record<string, any> = {};
  for (const svc of services) {
    const created = await prisma.service.upsert({
      where: { slug: svc.slug },
      update: {},
      create: {
        ...svc,
        seoTitle: `${svc.name} in Indore | Kanishka's Family Salon`,
        seoDescription: `Book ${svc.name} at Kanishka's Family Salon & Academy, Indore.`,
        tags: [svc.name.toLowerCase(), "salon", "indore"],
      } as any,
    });
    svcMap[svc.slug] = created;
  }
  console.log(`  ✅ ${services.length} services from MENU.pdf`);

  // ================================================================
  // 7. PRODUCTS
  // ================================================================
  const products = [
    { name: "L'Oréal Keratin Shampoo 500ml", slug: "loreal-keratin-shampoo", category: ProductCategory.HAIR_CARE, brand: "L'Oréal", sku: "HC-001", price: 1200, stock: 24, isFeatured: true, thumbnailUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&h=600&fit=crop&q=80" },
    { name: "Moroccanoil Hair Serum 100ml", slug: "moroccanoil-hair-serum", category: ProductCategory.HAIR_CARE, brand: "Moroccanoil", sku: "HC-002", price: 1650, stock: 12, thumbnailUrl: "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=600&h=600&fit=crop&q=80" },
    { name: "MAC Ruby Woo Lipstick", slug: "mac-ruby-woo-lipstick", category: ProductCategory.MAKEUP_COSMETICS, brand: "MAC", sku: "MK-001", price: 1800, stock: 8, isFeatured: true, thumbnailUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=600&fit=crop&q=80" },
    { name: "Maybelline Fit Me Foundation", slug: "maybelline-fit-me-foundation", category: ProductCategory.MAKEUP_COSMETICS, brand: "Maybelline", sku: "MK-002", price: 600, stock: 15, thumbnailUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop&q=80" },
    { name: "OPI Nail Lacquer Set (6pk)", slug: "opi-nail-lacquer-set", category: ProductCategory.NAIL_CARE, brand: "OPI", sku: "NC-001", price: 1500, stock: 3, thumbnailUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&q=80" },
    { name: "GHD Platinum+ Styler", slug: "ghd-platinum-styler", category: ProductCategory.TOOLS_ACCESSORIES, brand: "GHD", sku: "TL-001", price: 22500, stock: 0, isActive: false, thumbnailUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop&q=80" },
    { name: "Lakme Primer 30ml", slug: "lakme-primer-30ml", category: ProductCategory.MAKEUP_COSMETICS, brand: "Lakme", sku: "MK-003", price: 1000, stock: 20, thumbnailUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&h=600&fit=crop&q=80" },
    { name: "Biotique Hair Mask 200g", slug: "biotique-hair-mask", category: ProductCategory.HAIR_CARE, brand: "Biotique", sku: "HC-003", price: 450, stock: 4, thumbnailUrl: "https://images.unsplash.com/photo-1556229162-5c63ed9c4efb?w=600&h=600&fit=crop&q=80" },
    { name: "Vitamin C Brightening Serum", slug: "vitamin-c-serum", category: ProductCategory.SKIN_CARE, brand: "The Derma Co", sku: "SK-001", price: 1200, stock: 25, isFeatured: true, thumbnailUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop&q=80" },
  ];

  const prodMap: Record<string, any> = {};
  for (const p of products) {
    const created = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, seoTitle: `${p.name} | Kanishka's Shop`, seoDescription: `Buy ${p.name} online.`, tags: [p.category.toLowerCase(), "beauty"] },
    });
    prodMap[p.slug] = created;
  }
  console.log(`  ✅ ${products.length} products`);

  // ================================================================
  // 8. COURSES
  // ================================================================
  const courses = [
    { name: "Professional Makeup Artist Course", slug: "professional-makeup-artist", description: "Complete makeup artistry course.", duration: "3 months", price: 25000, maxStudents: 8, certificate: true },
    { name: "Hair Styling & Coloring Diploma", slug: "hair-styling-coloring-diploma", description: "Comprehensive hair course.", duration: "4 months", price: 30000, maxStudents: 10, certificate: true },
    { name: "Nail Art & Extension Course", slug: "nail-art-extension-course", description: "Master gel, acrylic, nail art techniques.", duration: "45 days", price: 12000, maxStudents: 12, certificate: true },
    { name: "Complete Beauty Diploma", slug: "complete-beauty-diploma", description: "All-in-one diploma.", duration: "6 months", price: 60000, maxStudents: 6, certificate: true, isFeatured: true },
  ];
  for (const course of courses) {
    await prisma.course.upsert({ where: { slug: course.slug }, update: {}, create: { ...course, seoTitle: `${course.name} | Kanishka's Academy` } });
  }
  console.log(`  ✅ ${courses.length} courses`);

  // ================================================================
  // 9. LOYALTY RULES
  // ================================================================
  await prisma.loyaltyRule.createMany({
    skipDuplicates: true,
    data: [
      { name: "Appointment Reward", description: "Earn points for every appointment", type: "EARN_APPOINTMENT", pointsPerRupee: 0.1, isActive: true },
      { name: "Purchase Reward", description: "Earn points for product purchases", type: "EARN_PURCHASE", pointsPerRupee: 0.1, isActive: true },
      { name: "Referral Reward", description: "Earn points for referring friends", type: "EARN_REFERRAL", fixedPoints: 200, isActive: true },
      { name: "Review Reward", description: "Earn points for leaving a review", type: "EARN_REVIEW", fixedPoints: 50, isActive: true },
    ],
  });
  console.log("  ✅ Loyalty rules");

  // Continued in seedTransactionalData()...
  await seedTransactionalData(admin, owner, receptionist1, receptionist2, clients, loyaltyAccounts, svcMap, prodMap);
}

// ================================================================
// TRANSACTIONAL / CONTENT SEED DATA (Part 2)
// ================================================================
async function seedTransactionalData(
  admin: any, owner: any, rec1: any, rec2: any,
  clients: any[], loyaltyAccounts: any[],
  svcMap: Record<string, any>, prodMap: Record<string, any>,
) {
  // 10. APPOINTMENTS
  const appointments = [
    { bookingRef: "KFS-0312", clientIdx: 0, staffId: owner.id, svcSlug: "hair-smoothening", daysAgo: 0, start: "10:00", end: "12:00", status: AppointmentStatus.IN_PROGRESS, amount: 3500 },
    { bookingRef: "KFS-0313", clientIdx: 1, staffId: rec1.id, svcSlug: "gold-facial", daysAgo: 0, start: "11:00", end: "12:00", status: AppointmentStatus.CONFIRMED, amount: 1800 },
    { bookingRef: "KFS-0314", clientIdx: 2, staffId: rec2.id, svcSlug: "classic-mani-pedi", daysAgo: 0, start: "14:00", end: "15:30", status: AppointmentStatus.PENDING, amount: 1200 },
    { bookingRef: "KFS-0315", clientIdx: 4, staffId: owner.id, svcSlug: "global-hair-color", daysAgo: -1, start: "15:00", end: "17:30", status: AppointmentStatus.CONFIRMED, amount: 6000 },
    { bookingRef: "KFS-0316", clientIdx: 3, staffId: rec2.id, svcSlug: "threading-cleanup", daysAgo: -1, start: "17:00", end: "17:45", status: AppointmentStatus.CONFIRMED, amount: 600 },
    { bookingRef: "KFS-0310", clientIdx: 4, staffId: rec1.id, svcSlug: "hair-spa", daysAgo: 1, start: "14:00", end: "15:00", status: AppointmentStatus.COMPLETED, amount: 1500, completedAt: hoursAgo(20) },
    { bookingRef: "KFS-0309", clientIdx: 5, staffId: rec1.id, svcSlug: "bridal-trial-makeup", daysAgo: 1, start: "10:00", end: "12:00", status: AppointmentStatus.COMPLETED, amount: 5000, completedAt: hoursAgo(28) },
    { bookingRef: "KFS-0305", clientIdx: 0, staffId: owner.id, svcSlug: "keratin-treatment", daysAgo: 3, start: "11:00", end: "13:30", status: AppointmentStatus.COMPLETED, amount: 4500, completedAt: daysAgo(3) },
    { bookingRef: "KFS-0298", clientIdx: 1, staffId: rec1.id, svcSlug: "basic-facial", daysAgo: 6, start: "14:00", end: "15:00", status: AppointmentStatus.CANCELLED, amount: 1200, cancelledAt: daysAgo(7), cancelReason: "Personal emergency" },
    { bookingRef: "KFS-0290", clientIdx: 2, staffId: owner.id, svcSlug: "hair-cut-blow-dry", daysAgo: 8, start: "16:00", end: "17:00", status: AppointmentStatus.NO_SHOW, amount: 800 },
    { bookingRef: "KFS-0285", clientIdx: 0, staffId: rec2.id, svcSlug: "nail-art", daysAgo: 10, start: "11:00", end: "12:00", status: AppointmentStatus.COMPLETED, amount: 500, completedAt: daysAgo(10) },
    { bookingRef: "KFS-0280", clientIdx: 3, staffId: rec1.id, svcSlug: "gold-facial", daysAgo: 14, start: "15:00", end: "16:15", status: AppointmentStatus.COMPLETED, amount: 1200, completedAt: daysAgo(14) },
    { bookingRef: "KFS-0275", clientIdx: 5, staffId: owner.id, svcSlug: "highlights", daysAgo: 20, start: "10:00", end: "12:30", status: AppointmentStatus.COMPLETED, amount: 3500, completedAt: daysAgo(20) },
  ];

  const aptMap: Record<string, any> = {};
  for (const a of appointments) {
    const svc = svcMap[a.svcSlug];
    if (!svc) continue;
    const apt = await prisma.appointment.upsert({
      where: { bookingRef: a.bookingRef },
      update: {},
      create: {
        bookingRef: a.bookingRef,
        clientId: clients[a.clientIdx].id,
        staffId: a.staffId,
        serviceId: svc.id,
        date: a.daysAgo >= 0 ? daysAgo(a.daysAgo) : daysFromNow(-a.daysAgo),
        startTime: a.start,
        endTime: a.end,
        status: a.status,
        totalAmount: a.amount,
        completedAt: (a as any).completedAt ?? null,
        cancelledAt: (a as any).cancelledAt ?? null,
        cancelReason: (a as any).cancelReason ?? null,
        reminderSent: a.status === AppointmentStatus.COMPLETED,
      },
    });
    aptMap[a.bookingRef] = apt;
  }
  console.log(`  ✅ ${appointments.length} appointments`);

  // 11. ORDERS
  const orders = [
    { orderRef: "ORD-0089", clientIdx: 0, status: OrderStatus.PROCESSING, items: [{ slug: "loreal-keratin-shampoo", qty: 1 }, { slug: "moroccanoil-hair-serum", qty: 1 }], daysAgo: 3 },
    { orderRef: "ORD-0088", clientIdx: 3, status: OrderStatus.SHIPPED, items: [{ slug: "loreal-keratin-shampoo", qty: 1 }], daysAgo: 4 },
    { orderRef: "ORD-0087", clientIdx: 2, status: OrderStatus.PENDING, items: [{ slug: "mac-ruby-woo-lipstick", qty: 1 }, { slug: "maybelline-fit-me-foundation", qty: 1 }, { slug: "lakme-primer-30ml", qty: 1 }], daysAgo: 5 },
    { orderRef: "ORD-0086", clientIdx: 1, status: OrderStatus.DELIVERED, items: [{ slug: "mac-ruby-woo-lipstick", qty: 1 }], daysAgo: 6 },
    { orderRef: "ORD-0085", clientIdx: 4, status: OrderStatus.DELIVERED, items: [{ slug: "vitamin-c-serum", qty: 1 }, { slug: "biotique-hair-mask", qty: 2 }], daysAgo: 7 },
    { orderRef: "ORD-0084", clientIdx: 5, status: OrderStatus.CANCELLED, items: [{ slug: "ghd-platinum-styler", qty: 1 }], daysAgo: 8 },
  ];

  for (const o of orders) {
    let subtotal = 0;
    const itemsData = o.items.map(i => {
      const prod = prodMap[i.slug];
      const unitPrice = Number(prod.price);
      const totalPrice = unitPrice * i.qty;
      subtotal += totalPrice;
      return { productId: prod.id, quantity: i.qty, unitPrice, totalPrice };
    });
    await prisma.order.upsert({
      where: { orderRef: o.orderRef },
      update: {},
      create: {
        orderRef: o.orderRef,
        clientId: clients[o.clientIdx].id,
        status: o.status,
        subtotal,
        total: subtotal,
        createdAt: daysAgo(o.daysAgo),
        items: { create: itemsData },
      },
    });
  }
  console.log(`  ✅ ${orders.length} orders`);

  // 12. PAYMENTS for completed appointments
  for (const ref of ["KFS-0310", "KFS-0309", "KFS-0305", "KFS-0285", "KFS-0280", "KFS-0275"]) {
    const apt = aptMap[ref];
    if (!apt) continue;
    const existing = await prisma.payment.findUnique({ where: { appointmentId: apt.id } });
    if (!existing) {
      await prisma.payment.create({
        data: { appointmentId: apt.id, amount: apt.totalAmount, status: PaymentStatus.PAID, method: PaymentMethod.UPI, paidAt: apt.completedAt ?? new Date() },
      });
    }
  }
  console.log("  ✅ Payments");

  // 13. LOYALTY TRANSACTIONS
  const txns = [
    { accIdx: 0, type: "EARN_APPOINTMENT" as const, points: 450, desc: "Keratin Treatment appointment", daysAgo: 3 },
    { accIdx: 0, type: "EARN_APPOINTMENT" as const, points: 150, desc: "Hair Spa appointment", daysAgo: 10 },
    { accIdx: 0, type: "EARN_PURCHASE" as const, points: 285, desc: "Product order ORD-0089", daysAgo: 3 },
    { accIdx: 0, type: "EARN_REFERRAL" as const, points: 200, desc: "Referred Riya Patel", daysAgo: 60 },
    { accIdx: 0, type: "REDEEM" as const, points: -500, desc: "Redeemed 500pts on appointment", daysAgo: 15 },
    { accIdx: 1, type: "EARN_APPOINTMENT" as const, points: 180, desc: "Gold Facial appointment", daysAgo: 14 },
    { accIdx: 1, type: "EARN_PURCHASE" as const, points: 180, desc: "Product order ORD-0086", daysAgo: 6 },
    { accIdx: 5, type: "EARN_APPOINTMENT" as const, points: 500, desc: "Bridal Trial Makeup", daysAgo: 1 },
    { accIdx: 5, type: "EARN_APPOINTMENT" as const, points: 350, desc: "Highlights appointment", daysAgo: 20 },
    { accIdx: 5, type: "REDEEM" as const, points: -200, desc: "Redeemed on Bridal Trial", daysAgo: 1 },
  ];
  for (const tx of txns) {
    await prisma.loyaltyTransaction.create({
      data: { loyaltyAccountId: loyaltyAccounts[tx.accIdx].id, type: tx.type, points: tx.points, description: tx.desc, createdAt: daysAgo(tx.daysAgo) },
    });
  }
  console.log("  ✅ Loyalty transactions");

  // 14. BLOG POSTS
  const blogPosts = [
    { title: "5 Hair Care Tips for Summer", slug: "5-hair-care-tips-summer", excerpt: "Protect your hair from sun damage with these essential tips.", content: "Summer can wreak havoc on your hair. Here are 5 tips to keep your locks healthy and shiny...", authorId: owner.id, status: "PUBLISHED" as const, publishedAt: hoursAgo(5), category: "Hair Care", tags: ["hair", "summer", "tips"], readTime: 4, viewCount: 245, isFeatured: true },
    { title: "Complete Guide to Bridal Makeup", slug: "complete-guide-bridal-makeup", excerpt: "Everything you need to know about bridal makeup for your big day.", content: "Your wedding day is the most special day of your life. Let us help you look your absolute best...", authorId: admin.id, status: "PUBLISHED" as const, publishedAt: daysAgo(5), category: "Makeup", tags: ["bridal", "makeup", "wedding"], readTime: 8, viewCount: 892, isFeatured: true },
    { title: "Why Keratin Treatment Is Worth It", slug: "why-keratin-treatment-worth-it", excerpt: "Discover the benefits of professional keratin treatments.", content: "If you struggle with frizzy, unmanageable hair, keratin treatment might be the answer...", authorId: owner.id, status: "PUBLISHED" as const, publishedAt: daysAgo(12), category: "Hair Care", tags: ["keratin", "treatment", "hair"], readTime: 5, viewCount: 567 },
    { title: "Bridal Makeup Trends 2026", slug: "bridal-makeup-trends-2026", excerpt: "Latest trends in bridal makeup for the upcoming wedding season.", content: "The 2026 wedding season brings exciting new makeup trends...", authorId: rec1.id, status: "DRAFT" as const, category: "Makeup", tags: ["bridal", "trends", "2026"], readTime: 6 },
    { title: "Nail Art Designs for Every Occasion", slug: "nail-art-designs-every-occasion", excerpt: "From casual to bridal, explore nail art ideas.", content: "Nail art is a fantastic way to express your personal style...", authorId: rec1.id, status: "DRAFT" as const, category: "Nail Care", tags: ["nails", "art", "design"], readTime: 4 },
  ];
  for (const post of blogPosts) {
    await prisma.blogPost.upsert({ where: { slug: post.slug }, update: {}, create: { ...post, seoTitle: `${post.title} | Kanishka's Blog` } });
  }
  console.log("  ✅ 5 blog posts");

  // 15. GALLERY ITEMS
  const galleryItems = [
    { title: "Bridal Makeup — Meenakshi",  category: "BRIDAL" as const,        imageUrl: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&h=1000&fit=crop&q=80", isFeatured: true },
    { title: "Balayage Transformation",     category: "HAIR" as const,          imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=1000&fit=crop&q=80", isFeatured: true },
    { title: "Gold Facial Glow",            category: "SKIN" as const,          imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=1000&fit=crop&q=80" },
    { title: "Bridal Hairstyle — Priya",    category: "BRIDAL" as const,        imageUrl: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=1000&fit=crop&q=80" },
    { title: "Nail Art — Floral Design",    category: "NAILS" as const,         imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=1000&fit=crop&q=80", isFeatured: true },
    { title: "Salon Interior",              category: "SALON_INTERIOR" as const, imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=1000&fit=crop&q=80" },
    { title: "Keratin Before & After",      category: "BEFORE_AFTER" as const,  imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=1000&fit=crop&q=80", isFeatured: true },
    { title: "Academy Training Session",    category: "ACADEMY" as const,       imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=1000&fit=crop&q=80" },
    { title: "Skin Cleanup — Glow Treatment", category: "SKIN" as const,        imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&h=1000&fit=crop&q=80" },
    { title: "Waxing & Threading Service",  category: "MAKEUP" as const,        imageUrl: "https://images.unsplash.com/photo-1547921985-5e6e847408ab?w=800&h=1000&fit=crop&q=80" },
    { title: "Manicure — French Tips",      category: "NAILS" as const,         imageUrl: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&h=1000&fit=crop&q=80" },
    { title: "Bridal Mehendi Look",         category: "BRIDAL" as const,        imageUrl: "https://images.unsplash.com/photo-1591471937531-b9a68d2b3c2c?w=800&h=1000&fit=crop&q=80", isFeatured: true },
  ];
  // Only seed if none exist (to avoid duplicates on re-seed)
  const existingGallery = await prisma.galleryItem.count();
  if (existingGallery === 0) {
    for (const g of galleryItems) {
      await prisma.galleryItem.create({
        data: { ...g, uploadedById: rec1.id, altText: g.title, isPublished: true, sortOrder: galleryItems.indexOf(g) },
      });
    }
    console.log(`  ✅ ${galleryItems.length} gallery items`);
  } else {
    console.log(`  ℹ️  ${existingGallery} gallery items already exist, skipping`);
  }

  // 16. REVIEWS
  const reviews = [
    { clientIdx: 0, svcSlug: "keratin-treatment", rating: 5, title: "Amazing transformation!", comment: "My hair has never looked so smooth. Priya did an incredible job. Highly recommend!", isApproved: true, isPublished: true, daysAgo: 3 },
    { clientIdx: 5, svcSlug: "bridal-trial-makeup", rating: 5, title: "Perfect bridal look", comment: "Neha understood exactly what I wanted. The trial makeup was flawless!", isApproved: true, isPublished: true, daysAgo: 1 },
    { clientIdx: 3, svcSlug: "gold-facial", rating: 4, title: "Relaxing experience", comment: "The gold facial was very relaxing and my skin felt so soft afterward.", isApproved: true, isPublished: true, ownerResponse: "Thank you Sunita! We're glad you enjoyed it.", daysAgo: 14 },
    { clientIdx: 0, svcSlug: "nail-art", rating: 5, title: "Beautiful nail art", comment: "Aarti's nail art is truly artistic. Got so many compliments!", isApproved: true, isPublished: true, daysAgo: 10 },
    { clientIdx: 2, svcSlug: "hair-cut-blow-dry", rating: 3, comment: "Good haircut but had to wait 20 minutes past my appointment time.", isApproved: false, isPublished: false, daysAgo: 8 },
  ];
  for (const r of reviews) {
    const svc = svcMap[r.svcSlug];
    if (!svc) continue;
    await prisma.review.create({
      data: {
        clientId: clients[r.clientIdx].id, serviceId: svc.id, rating: r.rating, title: r.title ?? null,
        comment: r.comment, isApproved: r.isApproved, isPublished: r.isPublished,
        ownerResponse: (r as any).ownerResponse ?? null,
        respondedAt: (r as any).ownerResponse ? daysAgo(r.daysAgo - 1) : null,
        createdAt: daysAgo(r.daysAgo),
      },
    });
  }
  console.log("  ✅ 5 reviews");

  // 17. NOTIFICATIONS
  const notifications = [
    { userId: clients[0].id, type: "APPOINTMENT_CONFIRMED" as const, title: "Appointment Confirmed", message: "Your Hair Smoothening appointment on Mar 11 at 10:00 AM is confirmed.", daysAgo: 1 },
    { userId: clients[1].id, type: "APPOINTMENT_CONFIRMED" as const, title: "Appointment Confirmed", message: "Your Gold Facial appointment on Mar 11 at 11:00 AM is confirmed.", daysAgo: 1 },
    { userId: clients[0].id, type: "LOYALTY_POINTS" as const, title: "Points Earned!", message: "You earned 450 loyalty points for your Keratin Treatment.", daysAgo: 3 },
    { userId: clients[5].id, type: "LOYALTY_POINTS" as const, title: "Points Earned!", message: "You earned 500 loyalty points for your Bridal Trial Makeup.", daysAgo: 1 },
    { userId: clients[0].id, type: "ORDER_UPDATE" as const, title: "Order Processing", message: "Your order ORD-0089 is being processed.", daysAgo: 3, isRead: true },
    { userId: clients[3].id, type: "ORDER_UPDATE" as const, title: "Order Shipped", message: "Your order ORD-0088 has been shipped!", daysAgo: 3 },
  ];
  for (const n of notifications) {
    await prisma.notification.create({
      data: { userId: n.userId, type: n.type, title: n.title, message: n.message, isRead: (n as any).isRead ?? false, createdAt: daysAgo(n.daysAgo) },
    });
  }
  console.log("  ✅ 6 notifications");

  // 18. REFERRALS
  await prisma.referral.create({ data: { referrerId: clients[0].id, referredId: clients[1].id, code: "MEERA200", isConverted: true, convertedAt: daysAgo(60), rewardPoints: 200 } });
  await prisma.referral.create({ data: { referrerId: clients[5].id, referredId: clients[4].id, code: "DEEPA200", isConverted: false, rewardPoints: 0 } });
  console.log("  ✅ 2 referrals");

  // 19. CONTACT SUBMISSIONS
  const contacts = [
    { name: "Priti Malhotra", phone: "+919988776655", email: "priti.m@gmail.com", message: "Hi, I want to enquire about your bridal packages for a December wedding.", status: "NEW" as const, daysAgo: 0 },
    { name: "Rekha Agarwal", phone: "+919876001122", message: "Do you offer home service for senior citizens? My mother would like a facial.", status: "READ" as const, isRead: true, daysAgo: 1 },
    { name: "Suresh Patel", phone: "+919765432100", email: "suresh.p@outlook.com", message: "I'm interested in your academy courses. When does the next batch start?", status: "RESPONDED" as const, isRead: true, respondedAt: daysAgo(2), response: "Thank you for your interest! The next batch starts April 1. Please visit the salon for enrollment.", daysAgo: 3 },
  ];
  for (const c of contacts) {
    await prisma.contactSubmission.create({ data: { name: c.name, phone: c.phone, email: c.email ?? null, message: c.message, status: c.status, isRead: (c as any).isRead ?? false, respondedAt: (c as any).respondedAt ?? null, response: (c as any).response ?? null, createdAt: daysAgo(c.daysAgo) } });
  }
  console.log("  ✅ 3 contact submissions");

  // 20. SITE CONTENT (CMS)
  const siteContent = [
    { key: "home_hero", title: "Step Into a World of Beauty & Luxury", content: "Welcome to Kanishka's Family Salon & Academy — Indore's premier destination for hair, skin, makeup, and beauty services." },
    { key: "about_story", title: "Our Story", content: "Founded by Kanishka Sen with a passion for beauty and empowerment, Kanishka's Family Salon has been serving Indore families since 2010." },
    { key: "about_mission", title: "Our Mission", content: "To provide premium, personalized beauty experiences while training the next generation of beauty professionals." },
  ];
  for (const sc of siteContent) {
    await prisma.siteContent.upsert({ where: { key: sc.key }, update: {}, create: sc });
  }
  console.log("  ✅ Site content");

  // 21. ACTIVITY LOGS
  const logs = [
    { userId: admin.id, action: "UPDATE", entity: "Settings", details: { field: "businessHours" }, daysAgo: 0 },
    { userId: owner.id, action: "CREATE", entity: "Service", details: { name: "Premium Hair Spa" }, daysAgo: 0 },
    { userId: rec1.id, action: "CREATE", entity: "Appointment", details: { ref: "KFS-0314", note: "Walk-in" }, daysAgo: 0 },
    { userId: null, action: "AUTO", entity: "Appointment", details: { count: 3, type: "reminders" }, daysAgo: 0 },
    { userId: rec2.id, action: "UPDATE", entity: "Appointment", details: { ref: "KFS-0312", status: "IN_PROGRESS" }, daysAgo: 0 },
    { userId: admin.id, action: "UPDATE", entity: "User", details: { name: "Pooja Verma", action: "deactivated" }, daysAgo: 0 },
    { userId: owner.id, action: "UPDATE", entity: "Product", details: { name: "GHD Styler", stock: 0 }, daysAgo: 1 },
    { userId: rec1.id, action: "CREATE", entity: "Blog", details: { title: "5 Hair Care Tips" }, daysAgo: 1 },
  ];
  for (const log of logs) {
    await prisma.activityLog.create({
      data: { userId: log.userId, action: log.action, entity: log.entity, details: log.details, ipAddress: log.userId ? "103.21.x.x" : null, createdAt: daysAgo(log.daysAgo) },
    });
  }
  console.log("  ✅ Activity logs");

  // 22. GIFT VOUCHERS
  await prisma.giftVoucher.create({
    data: { code: "GIFT-LOVE-500", value: 500, remainingValue: 500, status: "ACTIVE", purchasedById: clients[0].id, recipientName: "Riya Patel", recipientEmail: clients[1].email, message: "Happy Birthday! Treat yourself 💕", expiresAt: daysFromNow(90) },
  });
  await prisma.giftVoucher.create({
    data: { code: "GIFT-XMAS-1000", value: 1000, remainingValue: 0, status: "REDEEMED", purchasedById: clients[5].id, redeemedById: clients[3].id, recipientName: "Sunita Joshi", expiresAt: daysFromNow(30), redeemedAt: daysAgo(5) },
  });
  console.log("  ✅ 2 gift vouchers");

  // ================================================================
  // 23. HERO SLIDES
  // ================================================================
  const heroSlides = [
    { imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&h=900&fit=crop&q=80", eyebrow: "Indore's Premier Salon", title: "Kanishka's Family", titleItalic: "Salon & Academy", subtitle: "Step into a world of beauty & luxury — trusted by 500+ happy clients in Indore", ctaLabel: "Book Appointment", ctaHref: "/book", sortOrder: 0, isActive: true },
    { imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1600&h=900&fit=crop&q=80", eyebrow: "Bridal Services", title: "Your Dream", titleItalic: "Wedding Look", subtitle: "Premium bridal packages crafted with love", ctaLabel: "Book Appointment", ctaHref: "/book", sortOrder: 1, isActive: true },
    { imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1600&h=900&fit=crop&q=80", eyebrow: "Beauty & Care", title: "Glow With", titleItalic: "Confidence", subtitle: "Expert skincare & hair treatments", ctaLabel: "Book Appointment", ctaHref: "/book", sortOrder: 2, isActive: true },
  ];
  // Only seed if none exist
  const existingSlides = await prisma.heroSlide.count();
  if (existingSlides === 0) {
    for (const slide of heroSlides) {
      await prisma.heroSlide.create({ data: slide });
    }
    console.log("  ✅ 3 hero slides");
  } else {
    console.log(`  ℹ️  ${existingSlides} hero slides already exist, skipping`);
  }

  // ================================================================
  // 24. SITE IMAGES (named image slots)
  // ================================================================
  for (const [key, def] of Object.entries({
    about_founder:       { label: "About Page — Founder Portrait", imageUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=533&fit=crop&q=80", altText: "Kanishka Sen — Founder" },
    homepage_about:      { label: "Homepage — About Section", imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=750&fit=crop&q=80", altText: "Salon interior" },
    why_us_photo:        { label: "Homepage — Why Choose Us", imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=600&fit=crop&q=80", altText: "Salon experience" },
    cta_background:      { label: "Homepage — Booking CTA Background", imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&h=600&fit=crop&q=80", altText: "Book your salon experience" },
    homepage_hero_fallback: { label: "Homepage — Hero Fallback", imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&h=900&fit=crop&q=80", altText: "Kanishka's Family Salon" },
  })) {
    await prisma.siteImage.upsert({
      where: { key },
      update: {},
      create: { key, ...def },
    });
  }
  console.log("  ✅ 5 site images");

  console.log("\n✅ Seeding completed successfully!");

  console.log("\n📋 All accounts use password: Kanishka@2024!");
  console.log("  Admin:         kanishkasen100@gmail.com");
  console.log("  Owner:         priya.s@kanishkas.in");
  console.log("  Receptionist:  neha.g@kanishkas.in");
  console.log("  Receptionist:  aarti.j@kanishkas.in");
  console.log("  Client:        meera.kapoor@gmail.com");
  console.log("  Client:        riya.p@outlook.com");
  console.log("  + 4 more clients");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
