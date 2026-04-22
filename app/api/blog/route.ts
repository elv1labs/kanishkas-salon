export const dynamic = "force-dynamic";
// app/api/blog/route.ts
// Blog post management API — public reading + authenticated writing

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, hasPermission } from "@/lib/auth";
import { UserRole, BlogStatus } from "@prisma/client";
import { z } from "zod";
import slugify from "slugify";
import readingTime from "reading-time";
import {
  apiSuccess,
  apiError,
  parseJsonBody,
  validatePagination,
  handlePrismaError,
  requireActiveSession,
} from "@/lib/api-utils";

// ---- Validation schemas ----
const CreateBlogSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title is too long"),
  excerpt: z.string().max(500, "Excerpt is too long").optional(),
  content: z.string().min(100, "Content must be at least 100 characters"),
  coverImage: z.string().url("Invalid cover image URL").optional(),
  status: z.nativeEnum(BlogStatus, { errorMap: () => ({ message: "Invalid blog status" }) }).default(BlogStatus.DRAFT),
  tags: z.array(z.string().max(50)).max(20, "Too many tags").default([]),
  category: z.string().max(100, "Category is too long").optional(),
  isFeatured: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  seoTitle: z.string().max(60, "SEO title is too long").optional(),
  seoDescription: z.string().max(160, "SEO description is too long").optional(),
  seoKeywords: z.array(z.string().max(50)).max(20, "Too many SEO keywords").default([]),
  ogImage: z.string().url("Invalid OG image URL").optional(),
});

const UpdateBlogSchema = CreateBlogSchema.partial().extend({
  id: z.string().cuid("Invalid blog post ID"),
});

// ---- GET: List blog posts ----
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = validatePagination(searchParams, { page: 1, limit: 9, maxLimit: 50 });
    const status = searchParams.get("status") as BlogStatus | null;
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const featured = searchParams.get("featured") === "true";
    const search = searchParams.get("search");

    // Validate status filter
    if (status && !Object.values(BlogStatus).includes(status)) {
      return apiError(`Invalid status. Valid values: ${Object.values(BlogStatus).join(", ")}`, 400);
    }

    const session = await getAuthSession();
    const canManage = session?.user && hasPermission(
      session.user.role as UserRole,
      "manageBlog"
    );

    const where: any = {};

    // Public only sees published posts
    if (!canManage) {
      where.status = BlogStatus.PUBLISHED;
      where.publishedAt = { lte: new Date() };
    } else if (status) {
      where.status = status;
    }

    if (category) where.category = category;
    if (featured) where.isFeatured = true;
    if (tag) where.tags = { hasSome: [tag] };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          status: true,
          publishedAt: true,
          tags: true,
          category: true,
          readTime: true,
          viewCount: true,
          isFeatured: true,
          createdAt: true,
          author: { select: { id: true, name: true, image: true } },
          _count: { select: { comments: { where: { isApproved: true } } } },
        },
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    // Fetch all categories and tags for filtering
    const [categories, allTags] = await Promise.all([
      prisma.blogPost.groupBy({
        by: ["category"],
        where: { status: BlogStatus.PUBLISHED, category: { not: null } },
        _count: true,
      }),
      prisma.blogPost.findMany({
        where: { status: BlogStatus.PUBLISHED },
        select: { tags: true },
      }),
    ]);

    const tagMap = new Map<string, number>();
    allTags.forEach((p) => p.tags.forEach((t) => tagMap.set(t, (tagMap.get(t) ?? 0) + 1)));
    const popularTags = Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    return apiSuccess({
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      meta: { categories, popularTags },
    });
  } catch (error) {
    return handlePrismaError(error, "GET /api/blog");
  }
}

// ---- POST: Create blog post ----
export async function POST(req: NextRequest) {
  const { data: body, error: jsonError } = await parseJsonBody(req);
  if (jsonError) return jsonError;

  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiError("Authentication required", 401);
    }

    if (!hasPermission(session!.user.role as UserRole, "manageBlog")) {
      return apiError("You don't have permission to create blog posts", 403);
    }

    const parsed = CreateBlogSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const data = parsed.data;

    // Calculate reading time
    const stats = readingTime(data.content);
    const readTime = Math.ceil(stats.minutes);

    // Generate unique slug
    let slug = slugify(data.title, { lower: true, strict: true });
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    // Set publishedAt if publishing immediately
    const publishedAt =
      data.status === BlogStatus.PUBLISHED ? new Date() : null;

    const post = await prisma.blogPost.create({
      data: {
        ...data,
        slug,
        readTime,
        publishedAt,
        authorId: session!.user.id,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "CREATE_BLOG_POST",
        entity: "BlogPost",
        entityId: post.id,
        details: { title: data.title, status: data.status },
      },
    });

    return apiSuccess(post, 201);
  } catch (error) {
    return handlePrismaError(error, "POST /api/blog");
  }
}

// ---- PATCH: Update blog post ----
export async function PATCH(req: NextRequest) {
  const { data: body, error: jsonError } = await parseJsonBody(req);
  if (jsonError) return jsonError;

  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiError("Authentication required", 401);
    }

    if (!hasPermission(session!.user.role as UserRole, "manageBlog")) {
      return apiError("You don't have permission to update blog posts", 403);
    }

    const parsed = UpdateBlogSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { id, ...updateFields } = parsed.data;

    // Get existing post
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return apiError("Blog post not found", 404);
    }

    // Recalculate reading time if content changed
    if (updateFields.content) {
      const stats = readingTime(updateFields.content);
      (updateFields as any).readTime = Math.ceil(stats.minutes);
    }

    // If title changed, regenerate slug
    if (updateFields.title) {
      let slug = slugify(updateFields.title, { lower: true, strict: true });
      const slugConflict = await prisma.blogPost.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugConflict) slug = `${slug}-${Date.now()}`;
      (updateFields as any).slug = slug;
    }

    // Set publishedAt on status transition to PUBLISHED
    if (updateFields.status === BlogStatus.PUBLISHED && existing.status !== BlogStatus.PUBLISHED) {
      (updateFields as any).publishedAt = new Date();
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateFields as any,
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "UPDATE_BLOG_POST",
        entity: "BlogPost",
        entityId: post.id,
        details: { fields: Object.keys(updateFields) },
      },
    });

    return apiSuccess(post);
  } catch (error) {
    return handlePrismaError(error, "PATCH /api/blog");
  }
}

// ---- DELETE: Archive blog post ----
export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    if (!hasPermission(session!.user.role as UserRole, "manageBlog")) {
      return apiError("You don't have permission to delete blog posts", 403);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("Post ID is required", 400);
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: { status: BlogStatus.ARCHIVED },
    });

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "DELETE_BLOG_POST",
        entity: "BlogPost",
        entityId: id,
        details: { title: post.title },
      },
    });

    return apiSuccess({ success: true, message: "Blog post archived" });
  } catch (error) {
    return handlePrismaError(error, "DELETE /api/blog");
  }
}
