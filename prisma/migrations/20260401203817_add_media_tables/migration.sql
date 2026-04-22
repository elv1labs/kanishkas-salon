-- AlterTable
ALTER TABLE "staff_profiles" ADD COLUMN     "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "hero_slides" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT NOT NULL,
    "titleItalic" TEXT,
    "subtitle" TEXT,
    "ctaLabel" TEXT NOT NULL DEFAULT 'Book Appointment',
    "ctaHref" TEXT NOT NULL DEFAULT '/book',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_images" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hero_slides_isActive_sortOrder_idx" ON "hero_slides"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "site_images_key_key" ON "site_images"("key");
