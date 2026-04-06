import { useState, useEffect, useRef, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  GraduationCap,
  Users,
  ClipboardCheck,
  CreditCard,
  Monitor,
  FileText,
  MessageSquare,
  Shield,
  Zap,
  BarChart3,
  Clock,
  CheckCircle2,
  Star,
  ArrowRight,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Globe,
  Lock,
  HeadphonesIcon,
  BookOpen,
  Award,
  Play,
} from "lucide-react";

/* ──────────────── Scroll-reveal wrapper ──────────────── */
function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ──────────────── Data ──────────────── */
const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Benefits", href: "#benefits" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

const FEATURES = [
  { icon: Users, title: "Student Management", description: "Complete digital profiles with photos, grades, and academic history — organized and accessible.", gradient: "from-blue-500 to-indigo-600", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-t-blue-500", emoji: "👨‍🎓" },
  { icon: ClipboardCheck, title: "Attendance Tracking", description: "Mark attendance in seconds. Generate instant reports for parents and administrators.", gradient: "from-emerald-500 to-teal-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-t-emerald-500", emoji: "✅" },
  { icon: CreditCard, title: "Fees & Payments", description: "Automate fee collection, send payment reminders, and generate receipts automatically.", gradient: "from-amber-500 to-orange-600", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-t-amber-500", emoji: "💳" },
  { icon: Monitor, title: "CBT Examinations", description: "Create, manage, and auto-grade computer-based tests with AI-powered question generation.", gradient: "from-purple-500 to-violet-600", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-t-purple-500", emoji: "💻" },
  { icon: FileText, title: "Result Processing", description: "Generate professional report cards with grades, class positions, and teacher remarks.", gradient: "from-pink-500 to-rose-600", bg: "bg-pink-50 dark:bg-pink-950/30", border: "border-t-pink-500", emoji: "📊" },
  { icon: MessageSquare, title: "Communication Hub", description: "Send SMS, email, and WhatsApp notifications to parents and staff instantly.", gradient: "from-cyan-500 to-blue-600", bg: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-t-cyan-500", emoji: "💬" },
];

const BENEFITS = [
  { icon: Clock, title: "Save 10+ Hours Weekly", description: "Automate attendance, grading, fee tracking, and report generation — so you can focus on teaching.", emoji: "⏰", color: "from-blue-500/10 to-indigo-500/10" },
  { icon: BookOpen, title: "Go 100% Paperless", description: "Digitize every record. Search, export, and share data instantly — no more filing cabinets.", emoji: "📱", color: "from-emerald-500/10 to-teal-500/10" },
  { icon: BarChart3, title: "Real-Time Analytics", description: "Track student performance, attendance patterns, and revenue insights from a single dashboard.", emoji: "📈", color: "from-purple-500/10 to-violet-500/10" },
  { icon: Shield, title: "Enterprise Security", description: "Bank-level encryption, daily backups, and role-based access control protect your school's data.", emoji: "🔒", color: "from-amber-500/10 to-orange-500/10" },
  { icon: Zap, title: "30-Minute Setup", description: "No training required. Our guided onboarding gets your school running in under 30 minutes.", emoji: "⚡", color: "from-pink-500/10 to-rose-500/10" },
  { icon: Globe, title: "Access From Anywhere", description: "Works on phones, tablets, and computers. No app downloads — just open your browser.", emoji: "🌍", color: "from-cyan-500/10 to-blue-500/10" },
];

const TESTIMONIALS = [
  { name: "Mrs. Adebayo", role: "Principal, Grace International Academy", quote: "EDISSMS transformed how we manage our school. Parents love the instant updates, and our teachers save hours every week.", avatar: "A", color: "from-blue-500 to-indigo-600" },
  { name: "Mr. Okechukwu", role: "Director, Bright Future Schools", quote: "The CBT exam feature alone was worth it. Our students now take tests seamlessly, and results are instant. Remarkable!", avatar: "O", color: "from-emerald-500 to-teal-600" },
  { name: "Mrs. Ibrahim", role: "Admin, Al-Hikma Primary School", quote: "Fee collection used to be a nightmare. Now parents pay online and we track everything automatically. Best decision ever.", avatar: "I", color: "from-purple-500 to-violet-600" },
  { name: "Dr. Mensah", role: "Proprietor, Excel Preparatory School", quote: "We've tried 3 other systems before EDISSMS. None come close in terms of ease of use and features for Nigerian schools.", avatar: "M", color: "from-pink-500 to-rose-600" },
];

const PRICING = [
  {
    name: "Starter",
    price: "₦15,000",
    period: "/term",
    description: "For small nursery & primary schools just getting started",
    features: ["Up to 100 students", "Student profiles & records", "Attendance tracking", "Basic fee management", "SMS notifications (50/month)", "Email support"],
    popular: false,
    cta: "Start Free Trial",
    gradient: "from-teal-500 to-cyan-600",
    iconBg: "bg-teal-500/10",
  },
  {
    name: "Professional",
    price: "₦35,000",
    period: "/term",
    description: "For growing schools that need powerful tools",
    features: ["Up to 500 students", "Everything in Starter", "CBT exam management", "Report card generation", "Parent portal access", "WhatsApp notifications", "Priority support"],
    popular: true,
    cta: "Start Free Trial",
    gradient: "from-primary to-purple-600",
    iconBg: "bg-primary/10",
  },
  {
    name: "Enterprise",
    price: "₦65,000",
    period: "/term",
    description: "For large schools & multi-branch institutions",
    features: ["Unlimited students", "Everything in Professional", "AI question generation", "Multi-branch management", "Custom branding & domain", "API access", "Dedicated account manager", "24/7 phone support"],
    popular: false,
    cta: "Contact Sales",
    gradient: "from-purple-500 to-violet-600",
    iconBg: "bg-purple-500/10",
  },
];

const FAQS = [
  { q: "How quickly can I set up EDISSMS for my school?", a: "Most schools are fully operational within 30 minutes. Our step-by-step onboarding wizard guides you through adding classes, subjects, and students. We also offer free data migration if you're switching from another system." },
  { q: "How secure is my school's data?", a: "We use bank-level AES-256 encryption, automated daily backups, and role-based access control. Your data is hosted on secure cloud servers with a 99.9% uptime guarantee. We are fully NDPR compliant." },
  { q: "Can parents access student information?", a: "Yes! Parents get a dedicated portal where they can view their child's attendance, exam results, fee status, and school announcements — accessible from any device, anytime." },
  { q: "Is EDISSMS designed for the Nigerian curriculum?", a: "Absolutely. EDISSMS is purpose-built for Nigerian schools — nursery, primary, and secondary. Our grading system, report cards, and exam formats fully align with Nigerian educational standards." },
  { q: "What payment methods do you support?", a: "We support bank transfers, debit/credit cards via Paystack, and mobile payments. Parents can pay fees online, and schools receive instant confirmation when payments are completed." },
  { q: "Is there a free trial available?", a: "Yes! Every plan includes a 14-day free trial with full access to all features. No credit card required — just sign up and start exploring." },
];

const STATS = [
  { value: "200+", label: "Schools Trust Us", emoji: "🏫", gradient: "from-blue-500 to-indigo-600" },
  { value: "50,000+", label: "Students Managed", emoji: "👨‍🎓", gradient: "from-emerald-500 to-teal-600" },
  { value: "99.9%", label: "System Uptime", emoji: "⚡", gradient: "from-amber-500 to-orange-600" },
  { value: "4.9/5", label: "User Rating", emoji: "⭐", gradient: "from-purple-500 to-violet-600" },
];

/* ──────────────── Component ──────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background font-sans antialiased overflow-x-hidden">
      {/* ───── Sticky Navigation ───── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "backdrop-blur-xl bg-background/90 shadow-sm border-b border-border/40" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md shadow-primary/25">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-foreground tracking-tight">EDISSMS</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href.slice(1))}
                  className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-all duration-200"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/auth")} className="font-medium">
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth/register-school")} className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-all font-semibold shadow-md shadow-primary/25 rounded-xl px-5">
                Get Started Free <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <button className="lg:hidden p-2 rounded-lg hover:bg-muted/60 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/40 bg-background/98 backdrop-blur-xl" style={{ animation: "fade-in 0.2s ease-out" }}>
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <button key={link.href} onClick={() => scrollTo(link.href.slice(1))} className="block w-full text-left py-2.5 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors">
                  {link.label}
                </button>
              ))}
              <div className="pt-3 flex flex-col gap-2 border-t border-border/40 mt-2">
                <Button variant="outline" onClick={() => navigate("/auth")} className="w-full rounded-xl">Sign In</Button>
                <Button onClick={() => navigate("/auth/register-school")} className="w-full bg-gradient-to-r from-primary to-purple-600 rounded-xl">Get Started Free</Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ───── Hero Section ───── */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-primary/15 via-purple-500/10 to-transparent rounded-full blur-[80px] animate-[pulse_6s_ease-in-out_infinite]" />
          <div className="absolute top-1/4 -right-24 w-[400px] h-[400px] bg-gradient-to-bl from-pink-500/10 via-rose-500/8 to-transparent rounded-full blur-[80px] animate-[pulse_8s_ease-in-out_infinite_1s]" />
          <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-gradient-to-tr from-teal-500/10 via-cyan-500/8 to-transparent rounded-full blur-[80px] animate-[pulse_7s_ease-in-out_infinite_2s]" />
          {/* Floating decorative dots */}
          <div className="absolute top-20 left-[15%] w-3 h-3 rounded-full bg-primary/20 animate-[bounce_3s_ease-in-out_infinite]" />
          <div className="absolute top-40 right-[20%] w-2 h-2 rounded-full bg-pink-500/25 animate-[bounce_4s_ease-in-out_infinite_0.5s]" />
          <div className="absolute bottom-32 left-[10%] w-2.5 h-2.5 rounded-full bg-teal-500/20 animate-[bounce_3.5s_ease-in-out_infinite_1s]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-4xl mx-auto">
            {/* Trust badge with gradient border */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 text-primary text-sm font-semibold mb-8 border border-primary/20 shadow-sm">
              <Sparkles className="w-4 h-4 animate-[pulse_2s_ease-in-out_infinite]" />
              Trusted by 200+ Schools Across Nigeria
            </div>

            <h1 className="text-[2.25rem] sm:text-5xl lg:text-6xl xl:text-7xl font-display font-extrabold text-foreground leading-[1.08] tracking-tight mb-6">
              The Smarter Way to{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                Manage
              </span>{" "}
              Your School
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              From admissions to report cards — manage students, fees, exams, and communication from one powerful platform built for Nigerian schools.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/auth/register-school")}
                className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-all shadow-lg shadow-primary/25 text-base px-8 h-13 font-semibold rounded-xl group"
              >
                Get Started Free <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollTo("contact")}
                className="text-base px-8 h-13 font-semibold border-2 rounded-xl hover:bg-muted/50 group"
              >
                <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Request a Demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-10 text-sm text-muted-foreground">
              {["14-day free trial", "No credit card required", "Setup in 30 minutes"].map((text) => (
                <div key={text} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Dashboard mockup */}
          <Reveal className="mt-14 lg:mt-20 max-w-5xl mx-auto relative" delay={200}>
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/40 bg-card group hover:shadow-3xl transition-shadow duration-500">
              {/* Browser chrome */}
              <div className="h-10 sm:h-11 bg-muted/60 flex items-center px-4 gap-2 border-b border-border/30">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400/70" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400/70" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400/70" />
                </div>
                <div className="ml-3 sm:ml-4 flex-1 max-w-sm h-6 bg-background/80 rounded-md flex items-center px-3">
                  <Lock className="w-3 h-3 text-muted-foreground/60 mr-2" />
                  <span className="text-[10px] text-muted-foreground/60 truncate">app.edissms.com/dashboard</span>
                </div>
              </div>
              {/* Dashboard content */}
              <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-5">
                  {[
                    { label: "Total Students", value: "1,247", emoji: "👨‍🎓", bg: "from-blue-500/10 to-indigo-500/10 border-blue-200/40 dark:border-blue-800/40" },
                    { label: "Active Teachers", value: "48", emoji: "👩‍🏫", bg: "from-emerald-500/10 to-teal-500/10 border-emerald-200/40 dark:border-emerald-800/40" },
                    { label: "Fees Collected", value: "₦4.2M", emoji: "💰", bg: "from-amber-500/10 to-orange-500/10 border-amber-200/40 dark:border-amber-800/40" },
                    { label: "Attendance Rate", value: "94.7%", emoji: "✅", bg: "from-purple-500/10 to-violet-500/10 border-purple-200/40 dark:border-purple-800/40" },
                  ].map((stat) => (
                    <div key={stat.label} className={`rounded-xl p-3 sm:p-3.5 bg-gradient-to-br ${stat.bg} border`}>
                      <div className="text-lg sm:text-xl mb-1">{stat.emoji}</div>
                      <div className="text-base sm:text-xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
                  <div className="sm:col-span-2 h-24 sm:h-32 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-border/30 flex items-end justify-center pb-3 sm:pb-4 px-3 sm:px-4">
                    <div className="flex items-end gap-1 sm:gap-1.5 w-full max-w-xs">
                      {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/30 to-primary/70 transition-all duration-700" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="h-24 sm:h-32 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 border border-border/30 p-3 sm:p-4">
                    <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-2">Recent Activity</div>
                    {["💳 Fee payment received", "✅ Attendance marked — JSS2", "📝 Exam published — Math"].map((text, i) => (
                      <div key={i} className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <span className="text-[10px] sm:text-[11px] text-foreground/80 truncate">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -inset-6 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 blur-3xl rounded-3xl -z-10" />
          </Reveal>
        </div>
      </section>

      {/* ───── Social Proof Stats ───── */}
      <section className="py-10 lg:py-16 border-y border-border/30 bg-gradient-to-r from-muted/30 via-muted/10 to-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 80} className="text-center">
                <div className="group p-4 sm:p-5 rounded-2xl bg-card border border-border/40 hover:shadow-lg transition-all duration-300">
                  <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">{stat.emoji}</div>
                  <div className={`text-xl sm:text-3xl font-display font-extrabold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Features Section ───── */}
      <section id="features" className="py-16 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent/10 to-teal-500/10 text-accent text-sm font-semibold mb-5 border border-accent/15">
              ✨ Powerful Features
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-[2.75rem] font-display font-bold text-foreground mb-4 leading-tight">
              Everything Your School Needs in One Place
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              Manage students, teachers, fees, exams, and parent communication — purpose-built for Nigerian schools.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 80}>
                <Card className={`group border-border/40 border-t-[3px] ${feature.border} hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 ${feature.bg} backdrop-blur-sm overflow-hidden h-full rounded-2xl`}>
                  <CardContent className="p-5 lg:p-7">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-foreground mb-2.5">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Benefits Section ───── */}
      <section id="benefits" className="py-16 lg:py-28 bg-gradient-to-b from-muted/30 via-muted/20 to-background relative">
        {/* Gradient divider */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-secondary/10 to-orange-500/10 text-secondary text-sm font-semibold mb-5 border border-secondary/15">
              🚀 Why Schools Choose Us
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-[2.75rem] font-display font-bold text-foreground mb-4 leading-tight">
              Transform How You Run Your School
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              Join hundreds of schools already saving time, reducing costs, and improving student outcomes.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {BENEFITS.map((benefit, i) => (
              <Reveal key={benefit.title} delay={i * 70}>
                <div className={`group p-5 lg:p-7 rounded-2xl bg-gradient-to-br ${benefit.color} border border-border/40 hover:shadow-xl hover:shadow-accent/5 hover:border-accent/20 transition-all duration-300 h-full`}>
                  <div className="text-3xl mb-4 group-hover:scale-125 transition-transform duration-300">{benefit.emoji}</div>
                  <h3 className="text-lg font-display font-bold text-foreground mb-2.5">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Testimonials Section ───── */}
      <section id="testimonials" className="py-16 lg:py-28 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pink-500/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-rose-500/10 text-pink-600 text-sm font-semibold mb-5 border border-pink-500/15">
              💬 What Schools Say
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-[2.75rem] font-display font-bold text-foreground mb-4 leading-tight">
              Trusted by School Leaders
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              Hear from administrators and educators who transformed their schools with EDISSMS.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <Card className="border-border/40 border-l-[3px] border-l-primary/50 bg-card/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300 rounded-2xl h-full">
                  <CardContent className="p-5 lg:p-7 flex flex-col h-full">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-foreground leading-relaxed mb-5 flex-1 text-sm sm:text-[15px]">"{t.quote}"</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                        {t.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Pricing Section ───── */}
      <section id="pricing" className="py-16 lg:py-28 bg-gradient-to-b from-muted/30 to-background relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary text-sm font-semibold mb-5 border border-primary/15">
              💎 Transparent Pricing
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-[2.75rem] font-display font-bold text-foreground mb-4 leading-tight">
              Choose the Right Plan for Your School
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              Start with a free trial. Upgrade anytime. No hidden fees, no long-term contracts.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto items-start">
            {PRICING.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 120}>
                <Card className={`relative overflow-hidden rounded-2xl transition-all duration-300 h-full ${plan.popular ? "border-primary/50 shadow-xl shadow-primary/10 ring-1 ring-primary/20 scale-[1.02]" : "border-border/40 hover:shadow-lg"}`}>
                  {/* Gradient header bar for all tiers */}
                  <div className={`h-1.5 bg-gradient-to-r ${plan.gradient}`} />
                  <CardContent className="p-5 lg:p-8">
                    {plan.popular && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/15">
                        <Award className="w-3 h-3" /> Most Popular
                      </div>
                    )}
                    <h3 className="text-xl font-display font-bold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1.5 mb-5 leading-relaxed">{plan.description}</p>
                    <div className="mb-6">
                      <span className={`text-3xl sm:text-4xl font-display font-extrabold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                    </div>
                    <Button
                      className={`w-full mb-6 font-semibold rounded-xl h-11 ${plan.popular ? "bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-md shadow-primary/20" : ""}`}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => navigate("/auth/register-school")}
                    >
                      {plan.cta} {plan.popular && <ArrowRight className="w-4 h-4 ml-1" />}
                    </Button>
                    <ul className="space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Trust Badges ───── */}
      <Reveal>
        <section className="py-10 sm:py-14 border-y border-border/30 bg-gradient-to-r from-muted/20 via-primary/5 to-muted/20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 gap-y-4">
              {[
                { icon: Shield, label: "SSL Encrypted", color: "text-blue-500" },
                { icon: Lock, label: "NDPR Compliant", color: "text-emerald-500" },
                { icon: Globe, label: "99.9% Uptime", color: "text-amber-500" },
                { icon: HeadphonesIcon, label: "24/7 Support", color: "text-purple-500" },
              ].map((badge) => (
                <div key={badge.label} className="flex items-center gap-2.5">
                  <badge.icon className={`w-5 h-5 ${badge.color}`} />
                  <span className="text-sm font-semibold text-muted-foreground">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ───── FAQ Section ───── */}
      <section id="faq" className="py-16 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-10 lg:mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent/10 to-teal-500/10 text-accent text-sm font-semibold mb-5 border border-accent/15">
              ❓ Common Questions
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-4 leading-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Everything you need to know before getting started.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-border/40 rounded-xl px-4 sm:px-5 bg-card/80 data-[state=open]:shadow-md data-[state=open]:border-primary/20 transition-all duration-200">
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-4 sm:py-5 text-sm sm:text-[15px]">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4 sm:pb-5 text-sm">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* ───── Contact Section ───── */}
      <section id="contact" className="py-16 lg:py-28 bg-gradient-to-b from-muted/30 to-muted/10 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary text-sm font-semibold mb-5 border border-primary/15">
                📬 Get in Touch
              </div>
              <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-4 leading-tight">
                Ready to Modernize Your School?
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg mb-8 leading-relaxed">
                Have questions or need a personalized demo? Our team responds within 24 hours.
              </p>
              <div className="space-y-4">
                {[
                  { emoji: "📧", label: "Email", text: "support@edissms.com", gradient: "from-blue-500/10 to-indigo-500/10" },
                  { emoji: "📞", label: "Phone", text: "+234 800 EDISSMS", gradient: "from-emerald-500/10 to-teal-500/10" },
                  { emoji: "📍", label: "Location", text: "Lagos, Nigeria", gradient: "from-purple-500/10 to-violet-500/10" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-lg border border-border/30`}>{item.emoji}</div>
                    <div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{item.label}</div>
                      <div className="text-foreground font-medium text-sm sm:text-base">{item.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={150}>
              <Card className="border-border/40 bg-card/90 backdrop-blur-sm rounded-2xl shadow-lg">
                <CardContent className="p-5 lg:p-8">
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Full Name</label>
                        <Input placeholder="John Doe" className="rounded-xl h-11" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">School Name</label>
                        <Input placeholder="Grace Academy" className="rounded-xl h-11" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Email Address</label>
                      <Input type="email" placeholder="you@school.com" className="rounded-xl h-11" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Phone Number</label>
                      <Input placeholder="+234 ..." className="rounded-xl h-11" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Message</label>
                      <Textarea placeholder="Tell us about your school and what you need..." rows={4} className="rounded-xl" />
                    </div>
                    <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 font-semibold shadow-md shadow-primary/20 rounded-xl h-12 text-base" size="lg">
                      Send Message <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───── Final CTA ───── */}
      <section className="py-16 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-600 to-pink-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.08),_transparent_50%)]" />
        {/* Floating decorations */}
        <div className="absolute top-10 left-[10%] w-20 h-20 rounded-full bg-white/5 blur-xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute bottom-10 right-[15%] w-16 h-16 rounded-full bg-white/5 blur-xl animate-[pulse_5s_ease-in-out_infinite_1s]" />
        <Reveal className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6 leading-tight">
            Start Managing Your School Smarter — Today
          </h2>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Join 200+ schools already using EDISSMS. Start your free 14-day trial — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth/register-school")}
              className="bg-white text-primary hover:bg-white/90 text-base px-8 h-13 font-semibold shadow-xl rounded-xl group"
            >
              Get Started Free <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollTo("contact")}
              className="border-white/30 text-white hover:bg-white/10 text-base px-8 h-13 font-semibold rounded-xl"
            >
              Schedule a Demo
            </Button>
          </div>
        </Reveal>
      </section>

      {/* ───── Footer ───── */}
      <footer className="py-12 lg:py-16 border-t border-border/40 bg-card relative">
        {/* Gradient divider */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/40 via-purple-500/40 to-pink-500/40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-12 mb-10 lg:mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md shadow-primary/20">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="font-display text-lg font-bold text-foreground">EDISSMS</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                The complete digital school management system built for Nigerian schools — nursery, primary, and secondary.
              </p>
            </div>
            <div>
              <h4 className="font-display font-bold text-foreground mb-4 text-sm">Product</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {["Features", "Pricing", "Testimonials", "FAQ"].map((label) => (
                  <li key={label}>
                    <button onClick={() => scrollTo(label.toLowerCase())} className="hover:text-foreground transition-colors">
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-foreground mb-4 text-sm">Support</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {[{ label: "Contact Us", action: () => scrollTo("contact") }, { label: "Help Center" }, { label: "System Status" }].map((item) => (
                  <li key={item.label}>
                    <button onClick={item.action} className="hover:text-foreground transition-colors">{item.label}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-foreground mb-4 text-sm">Legal</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((label) => (
                  <li key={label}>
                    <a href="#" className="hover:text-foreground transition-colors">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-border/40 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} EDISSMS. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ for Nigerian schools
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
