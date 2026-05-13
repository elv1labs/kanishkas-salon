export const dynamic = 'force-dynamic';
// Academy / Courses Page
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GraduationCap, Clock, Users, Award, ArrowRight, Star, Calendar } from "lucide-react";

export const metadata: Metadata = {
    title: "Beauty Academy - Professional Courses",
    description: "Enroll in professional beauty courses at Kanishka's Family Salon & Academy. Learn hair styling, skincare, makeup, and more from experts in Indore.",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Playfair+Display:wght@400;500;600;700&display=swap');
  
  @keyframes academyFadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes academyFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  .academy-hero-section {
    position: relative;
    background: #0A0A0A;
    padding: clamp(60px, 10vw, 100px) clamp(20px, 5vw, 48px);
    min-height: 45vh;
    display: flex;
    align-items: center;
    overflow: hidden;
  }
  .academy-hero-bg {
    position: absolute; inset: 0;
    background: 
      radial-gradient(ellipse at 30% 40%, rgba(201,168,76,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 70%, rgba(183,110,121,0.04) 0%, transparent 40%);
  }
  .academy-hero-pattern {
    position: absolute; inset: 0;
    background-image: radial-gradient(circle at 1px 1px, rgba(201,168,76,0.06) 1px, transparent 0);
    background-size: 32px 32px;
  }
  .academy-eyebrow { animation: academyFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
  .academy-title { animation: academyFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.25s both; }
  .academy-rule { animation: academyFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.4s both; }
  .academy-subtitle { animation: academyFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.55s both; }

  .academy-hero-float {
    animation: academyFloat 5s ease-in-out infinite;
  }

  .academy-course-card {
    transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease;
  }
  .academy-course-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 24px 56px rgba(201,168,76,0.12), 0 8px 24px rgba(0,0,0,0.35);
  }
  .academy-course-card:hover .academy-course-img {
    transform: scale(1.06);
  }
  .academy-course-img {
    transition: transform 0.6s cubic-bezier(0.22,1,0.36,1);
  }
  .academy-course-card:hover .academy-course-badge {
    transform: translateY(-4px);
  }

  .academy-feature-card {
    transition: background 0.3s ease;
  }
  .academy-feature-card:hover {
    background: rgba(201,168,76,0.04);
  }

  @media (max-width: 767px) {
    .academy-hero-section { min-height: 35vh; }
    .academy-courses-grid { grid-template-columns: repeat(1, 1fr) !important; }
  }

  @media (prefers-reduced-motion: reduce) {
    .academy-eyebrow, .academy-title, .academy-rule, .academy-subtitle,
    .academy-hero-float, .academy-course-card, .academy-course-img,
    .academy-course-badge, .academy-feature-card {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
      transition: none !important;
    }
  }
`;

async function getCourses() {
    try {
        return await prisma.course.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { enrollments: { where: { status: { in: ["CONFIRMED", "ENROLLED", "ACTIVE"] } } } } },
            },
        });
    } catch {
        return [];
    }
}

const features = [
    { icon: Award, label: "Certified Training", desc: "Industry-recognized certificates" },
    { icon: Users, label: "Expert Instructors", desc: "Learn from seasoned professionals" },
    { icon: Clock, label: "Flexible Schedule", desc: "Batch timings for working students" },
    { icon: GraduationCap, label: "Hands-on Practice", desc: "Real-world training sessions" },
];

export default async function AcademyPage() {
    const courses = await getCourses();

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />

            {/* Hero */}
            <section className="academy-hero-section">
                <div className="academy-hero-bg" />
                <div className="academy-hero-pattern" />
                
                {/* Floating shapes */}
                <div style={{ position: "absolute", top: "20%", left: "10%", pointerEvents: "none" }}>
                    <div className="academy-hero-float" style={{ width: 80, height: 80, border: "1px solid rgba(201,168,76,0.12)", borderRadius: "50%" }} />
                </div>
                <div style={{ position: "absolute", bottom: "25%", right: "8%", pointerEvents: "none" }}>
                    <div className="academy-hero-float" style={{ width: 50, height: 50, border: "1px solid rgba(183,110,121,0.1)", borderRadius: "2px", animationDelay: "-1.5s" }} />
                </div>

                <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 700, margin: "0 auto" }}>
                    <p className="academy-eyebrow" style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.35em",
                        textTransform: "uppercase",
                        color: "#C9A84C",
                        marginBottom: 20,
                    }}>
                        <GraduationCap className="inline w-4 h-4 mr-2" style={{ verticalAlign: "middle" }} />
                        Professional Training
                    </p>
                    <h1 className="academy-title" style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "clamp(40px, 8vw, 72px)",
                        fontWeight: 500,
                        color: "#FDFAF5",
                        lineHeight: 1.1,
                        letterSpacing: "-0.02em",
                        margin: 0,
                    }}>
                        Beauty Academy
                    </h1>
                    <div className="academy-rule" style={{
                        height: 1,
                        width: 60,
                        background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
                        margin: "20px auto 0",
                    }} />
                    <p className="academy-subtitle" style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 15,
                        fontWeight: 300,
                        color: "rgba(253,250,245,0.5)",
                        lineHeight: 1.7,
                        marginTop: 20,
                    }}>
                        Master the art of beauty with our professional courses
                    </p>
                </div>
            </section>

            {/* Features */}
            <section style={{ background: "#111111", padding: "clamp(32px, 6vw, 56px) clamp(20px, 5vw, 48px)", borderBottom: "1px solid #1A1A1A" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
                        {features.map((feature, i) => (
                            <div key={feature.label} className="academy-feature-card" style={{
                                textAlign: "center",
                                padding: "20px 16px",
                                borderRadius: 4,
                            }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: "50%",
                                    border: "1px solid rgba(201,168,76,0.15)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 16px",
                                }}>
                                    <feature.icon size={20} color="#C9A84C" strokeWidth={1.5} />
                                </div>
                                <div style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: "#FDFAF5",
                                    marginBottom: 6,
                                }}>
                                    {feature.label}
                                </div>
                                <div style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 11,
                                    color: "rgba(253,250,245,0.4)",
                                }}>
                                    {feature.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Courses */}
            <section style={{ background: "#0D0D0D", padding: "clamp(48px, 10vw, 100px) clamp(16px, 4vw, 48px)" }}>
                <div style={{ maxWidth: 1300, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "clamp(40px, 6vw, 64px)" }}>
                        <p style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.35em",
                            textTransform: "uppercase",
                            color: "#C9A84C",
                            marginBottom: 16,
                        }}>
                            Our Programs
                        </p>
                        <h2 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: "clamp(32px, 5vw, 52px)",
                            fontWeight: 500,
                            color: "#FDFAF5",
                            lineHeight: 1.15,
                        }}>
                            Available Courses
                        </h2>
                    </div>

                    {courses.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 20px" }}>
                            <p style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: 24,
                                color: "rgba(253,250,245,0.5)",
                            }}>
                                No courses available currently
                            </p>
                            <p style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: 14,
                                color: "rgba(253,250,245,0.35)",
                                marginTop: 12,
                            }}>
                                Check back soon for new courses
                            </p>
                        </div>
                    ) : (
                        <div className="academy-courses-grid" style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "clamp(20px, 4vw, 32px)",
                        }}>
                            {courses.map((course) => {
                                const enrolled = course._count.enrollments;
                                const spotsLeft = Math.max(0, course.maxStudents - enrolled);
                                const curriculum = course.curriculum as Record<string, string[]> | null;
                                const modules = curriculum ? Object.keys(curriculum).length : 0;

                                return (
                                    <Link key={course.id} href={`/academy/${course.id}`} className="academy-course-card" style={{
                                        display: "block",
                                        background: "#141414",
                                        border: "1px solid #1A1A1A",
                                        borderRadius: 4,
                                        overflow: "hidden",
                                        textDecoration: "none",
                                    }}>
                                        {/* Image */}
                                        <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", background: "#0A0A0A" }}>
                                            {course.imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={course.imageUrl}
                                                    alt={course.name}
                                                    className="academy-course-img"
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    background: "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(183,110,121,0.08) 100%)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}>
                                                    <GraduationCap style={{ color: "rgba(201,168,76,0.15)" }} size={48} />
                                                </div>
                                            )}
                                            
                                            {/* Badges */}
                                            {course.isFeatured && (
                                                <div className="academy-course-badge" style={{
                                                    position: "absolute",
                                                    top: 12,
                                                    right: 12,
                                                    background: "#C9A84C",
                                                    color: "#0A0A0A",
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontSize: 10,
                                                    fontWeight: 600,
                                                    padding: "5px 12px",
                                                    borderRadius: 2,
                                                    letterSpacing: "0.05em",
                                                }}>
                                                    ★ Featured
                                                </div>
                                            )}
                                            {spotsLeft <= 3 && spotsLeft > 0 && (
                                                <div className="academy-course-badge" style={{
                                                    position: "absolute",
                                                    top: 12,
                                                    left: 12,
                                                    background: "rgba(234,179,8,0.9)",
                                                    color: "#0A0A0A",
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontSize: 10,
                                                    fontWeight: 600,
                                                    padding: "5px 12px",
                                                    borderRadius: 2,
                                                }}>
                                                    {spotsLeft} spots left
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ padding: "clamp(18px, 3vw, 24px)" }}>
                                            {/* Name */}
                                            <h3 style={{
                                                fontFamily: "'Playfair Display', serif",
                                                fontSize: "clamp(18px, 2vw, 22px)",
                                                fontWeight: 500,
                                                color: "#FDFAF5",
                                                lineHeight: 1.3,
                                                marginBottom: 12,
                                            }}>
                                                {course.name}
                                            </h3>

                                            {/* Description */}
                                            {course.description && (
                                                <p style={{
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontSize: 13,
                                                    color: "rgba(253,250,245,0.5)",
                                                    lineHeight: 1.6,
                                                    marginBottom: 16,
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                }}>
                                                    {course.description}
                                                </p>
                                            )}

                                            {/* Stats */}
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Clock size={14} color="rgba(253,250,245,0.4)" />
                                                    <span style={{
                                                        fontFamily: "'DM Sans', sans-serif",
                                                        fontSize: 12,
                                                        color: "rgba(253,250,245,0.5)",
                                                    }}>
                                                        {course.duration}
                                                    </span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Users size={14} color="rgba(253,250,245,0.4)" />
                                                    <span style={{
                                                        fontFamily: "'DM Sans', sans-serif",
                                                        fontSize: 12,
                                                        color: "rgba(253,250,245,0.5)",
                                                    }}>
                                                        Max {course.maxStudents}
                                                    </span>
                                                </div>
                                                {modules > 0 && (
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                        <Award size={14} color="rgba(253,250,245,0.4)" />
                                                        <span style={{
                                                            fontFamily: "'DM Sans', sans-serif",
                                                            fontSize: 12,
                                                            color: "rgba(253,250,245,0.5)",
                                                        }}>
                                                            {modules} modules
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Price & CTA */}
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <div>
                                                    <span style={{
                                                        fontFamily: "'Playfair Display', serif",
                                                        fontSize: "clamp(22px, 2.5vw, 26px)",
                                                        fontWeight: 500,
                                                        color: "#C9A84C",
                                                    }}>
                                                        ₹{Number(course.price).toLocaleString("en-IN")}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    color: "#C9A84C",
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                }}>
                                                    View Course <ArrowRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section style={{ background: "#111111", padding: "clamp(48px, 8vw, 80px) clamp(20px, 5vw, 48px)", borderTop: "1px solid #1A1A1A" }}>
                <div style={{
                    maxWidth: 700,
                    margin: "0 auto",
                    textAlign: "center",
                }}>
                    <h2 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "clamp(28px, 4vw, 42px)",
                        fontWeight: 500,
                        color: "#FDFAF5",
                        lineHeight: 1.2,
                        marginBottom: 16,
                    }}>
                        Ready to Start Your Journey?
                    </h2>
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 15,
                        color: "rgba(253,250,245,0.5)",
                        lineHeight: 1.7,
                        marginBottom: 32,
                    }}>
                        Enroll in one of our professional courses and transform your career in the beauty industry.
                    </p>
                    <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                        <a href="#courses" style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "14px 32px",
                            background: "#C9A84C",
                            color: "#0A0A0A",
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            textDecoration: "none",
                            borderRadius: 2,
                        }}>
                            Browse Courses
                        </a>
                        <a href="/contact" style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "14px 32px",
                            background: "transparent",
                            color: "#FDFAF5",
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 12,
                            fontWeight: 500,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            textDecoration: "none",
                            border: "1px solid rgba(253,250,245,0.2)",
                            borderRadius: 2,
                        }}>
                            Contact Us
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}