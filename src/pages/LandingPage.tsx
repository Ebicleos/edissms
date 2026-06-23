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
  UserCog,
  LineChart,
  TrendingUp,
  Activity,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import demoVideo from "@/assets/demo.mp4.asset.json";
import demoPoster from "@/assets/demo-poster.jpg.asset.json";

/* ──────────────── Scroll-reveal wrapper ──────────────── */
function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
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
        transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* Animated counter */
function Counter({ end, suffix = "", duration = 1800 }: { end: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(Math.floor(end * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

/* Eyebrow chip */
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur text-indigo-700 text-xs font-semibold tracking-wide uppercase border border-indigo-100 shadow-sm">
      <Sparkles className="w-3 h-3" />
      {children}
    </div>
  );
}

/* ──────────────── Data ──────────────── */
const NAV_LINKS = [
  { label: "Product", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "Portals", href: "#portals" },
  { label: "Pricing", href: "#pricing" },
  { label: "Customers", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

const FEATURES = [
  { icon: Users, title: "Student Management", description: "Complete digital profiles with photos, classes, guardians, and academic history — searchable in seconds.", gradient: "from-blue-500 to-cyan-500" },
  { icon: ClipboardCheck, title: "Attendance Tracking", description: "Mark daily attendance in a single tap. Auto-generate reports and alert parents instantly.", gradient: "from-emerald-500 to-teal-500" },
  { icon: Monitor, title: "CBT Examination System", description: "Create, deliver, and auto-grade computer-based tests with AI-assisted question generation.", gradient: "from-violet-500 to-purple-500" },
  { icon: FileText, title: "Result & Report Management", description: "Generate professional, customizable report cards with class positions and teacher remarks.", gradient: "from-rose-500 to-pink-500" },
  { icon: CreditCard, title: "Fee Management", description: "Online payments via Paystack, automated reminders, instant receipts — no spreadsheets.", gradient: "from-amber-500 to-orange-500" },
  { icon: MessageSquare, title: "Parent Communication", description: "Send SMS, email, and WhatsApp updates to parents and staff from one unified inbox.", gradient: "from-sky-500 to-blue-500" },
  { icon: UserCog, title: "Staff Management", description: "Manage teachers, roles, payroll, and class assignments with granular access control.", gradient: "from-fuchsia-500 to-pink-500" },
  { icon: BarChart3, title: "Academic Reports", description: "Track performance, attendance, and revenue trends from one real-time analytics dashboard.", gradient: "from-indigo-500 to-violet-500" },
];

const BENEFITS = [
  { icon: Clock, title: "Save 10+ hours weekly", description: "Automate attendance, grading, fee tracking, and reporting — so staff focus on teaching." },
  { icon: BookOpen, title: "Go fully paperless", description: "Every record digitized. Search, export, and share instantly — no filing cabinets." },
  { icon: LineChart, title: "Real-time analytics", description: "Track performance, attendance, and revenue from a single, always-current dashboard." },
  { icon: Shield, title: "Enterprise security", description: "AES-256 encryption, daily backups, and role-based access — NDPR compliant by default." },
  { icon: Zap, title: "Onboarding in 30 minutes", description: "Guided setup with free data migration. No training required to go live this week." },
  { icon: Globe, title: "Works on any device", description: "Phones, tablets, laptops — no installs. Just open a browser and sign in." },
];

const TESTIMONIALS = [
  { name: "Mrs. Adebayo", role: "Principal, Grace International Academy", quote: "EDISMS transformed how we run our school. Parents see updates instantly, and our teachers save hours every week.", avatar: "A", color: "from-blue-500 to-indigo-600" },
  { name: "Mr. Okechukwu", role: "Director, Bright Future Schools", quote: "The CBT exam feature alone justified the switch. Students take tests seamlessly, and results are instant.", avatar: "O", color: "from-emerald-500 to-teal-600" },
  { name: "Mrs. Ibrahim", role: "Admin, Al-Hikma Primary School", quote: "Fee collection used to be a nightmare. Now parents pay online and everything reconciles automatically.", avatar: "I", color: "from-rose-500 to-pink-600" },
  { name: "Dr. Mensah", role: "Proprietor, Excel Preparatory School", quote: "We tried three other systems before EDISMS. None come close in usability or features for Nigerian schools.", avatar: "M", color: "from-amber-500 to-orange-600" },
];

const PRICING = [
  {
    name: "Starter", price: "₦15,000", period: "/term",
    description: "For small nursery & primary schools getting started.",
    features: ["Up to 100 students", "Student profiles & records", "Attendance tracking", "Basic fee management", "SMS notifications (50/mo)", "Email support"],
    popular: false, cta: "Start Free Trial",
  },
  {
    name: "Professional", price: "₦35,000", period: "/term",
    description: "For growing schools that need powerful, complete tools.",
    features: ["Up to 500 students", "Everything in Starter", "CBT exam management", "Report card generation", "Parent portal access", "WhatsApp notifications", "Priority support"],
    popular: true, cta: "Start Free Trial",
  },
  {
    name: "Enterprise", price: "₦65,000", period: "/term",
    description: "For large schools and multi-branch institutions.",
    features: ["Unlimited students", "Everything in Professional", "AI question generation", "Multi-branch management", "Custom branding & domain", "API access", "Dedicated account manager", "24/7 phone support"],
    popular: false, cta: "Contact Sales",
  },
];

const FAQS = [
  { q: "How quickly can I set up EDISMS for my school?", a: "Most schools are fully operational within 30 minutes. Our step-by-step onboarding wizard guides you through adding classes, subjects, and students. We also offer free data migration if you're switching from another system." },
  { q: "How secure is my school's data?", a: "We use bank-level AES-256 encryption, automated daily backups, and role-based access control. Your data is hosted on secure cloud servers with a 99.9% uptime guarantee. We are fully NDPR compliant." },
  { q: "Can parents access student information?", a: "Yes. Parents get a dedicated portal where they can view their child's attendance, exam results, fee status, and school announcements — accessible from any device, anytime." },
  { q: "Is EDISMS designed for the Nigerian curriculum?", a: "Absolutely. EDISMS is purpose-built for Nigerian schools — nursery, primary, and secondary. Our grading system, report cards, and exam formats fully align with Nigerian educational standards." },
  { q: "What payment methods do you support?", a: "We support bank transfers, debit/credit cards via Paystack, and mobile payments. Parents can pay fees online, and schools receive instant confirmation when payments are completed." },
  { q: "Is there a free trial available?", a: "Yes — every plan includes a 14-day free trial with full access to all features. No credit card required." },
];

const STATS = [
  { value: 200, suffix: "+", label: "Active schools" },
  { value: 50000, suffix: "+", label: "Students managed" },
  { value: 99, suffix: ".9%", label: "Uptime SLA" },
  { value: 24, suffix: "/7", label: "Support coverage" },
];

const PORTALS = [
  {
    name: "Admin Portal", tagline: "Run the entire school from one cockpit.",
    color: "from-indigo-500 via-blue-500 to-cyan-400",
    points: ["Real-time analytics & KPIs", "Fee reconciliation & payroll", "Multi-branch management"],
  },
  {
    name: "Teacher Portal", tagline: "Teach more, paperwork less.",
    color: "from-emerald-500 via-teal-500 to-cyan-400",
    points: ["Attendance & grade entry", "CBT exam authoring", "Lesson plans & resources"],
  },
  {
    name: "Student & Parent", tagline: "Stay connected, always informed.",
    color: "from-rose-500 via-fuchsia-500 to-violet-500",
    points: ["Live results & report cards", "Fee status & online pay", "School announcements"],
  },
];

/* ──────────────── Component ──────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formSent, setFormSent] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Smooth scroll
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = prev; };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-slate-900 overflow-x-hidden selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* ───── Sticky Navigation ───── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "backdrop-blur-xl bg-white/80 border-b border-slate-200/70 shadow-[0_2px_20px_-10px_rgba(15,23,42,0.15)]" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            <button onClick={() => scrollTo("top")} className="flex items-center gap-2.5 group" aria-label="EDISMS home">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 group-hover:scale-105 transition-all duration-300">
                <GraduationCap className="w-5 h-5 text-white" />
                <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">EDISMS</span>
            </button>

            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href.slice(1))}
                  className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-indigo-700 rounded-md transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate("/auth")} className="font-medium text-slate-700 hover:text-indigo-700 hover:bg-indigo-50">
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/auth/register-school")}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold rounded-lg px-4 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 hover:-translate-y-0.5"
              >
                Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>

            <button className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl" style={{ animation: "fade-in 0.2s ease-out" }}>
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <button key={link.href} onClick={() => scrollTo(link.href.slice(1))} className="block w-full text-left py-2.5 px-3 text-sm font-medium text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors">
                  {link.label}
                </button>
              ))}
              <div className="pt-3 flex flex-col gap-2 border-t border-slate-200 mt-2">
                <Button variant="outline" onClick={() => navigate("/auth")} className="w-full">Sign In</Button>
                <Button onClick={() => navigate("/auth/register-school")} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white">Get Started</Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ───── Hero Section ───── */}
      <section id="top" className="relative pt-28 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50" />
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-indigo-400/30 to-purple-400/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-20 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400/30 to-blue-400/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-pink-300/20 to-rose-300/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
          <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(99,102,241,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.07)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-indigo-100 text-slate-700 text-xs font-medium shadow-sm mb-8">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Trusted by 200+ schools across Nigeria
            </div>

            <h1 className="text-[2.5rem] sm:text-5xl lg:text-[4.5rem] font-bold leading-[1.05] tracking-[-0.035em] mb-7">
              <span className="text-slate-900">The complete OS</span><br />
              <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">for modern schools</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              EDISMS brings admissions, attendance, fees, exams, and parent communication into one secure, beautiful platform — purpose-built for Nigerian schools.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                size="lg"
                onClick={() => navigate("/auth/register-school")}
                className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-base px-7 h-12 font-semibold rounded-lg shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 hover:-translate-y-0.5 group"
              >
                Get Started <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollTo("demo")}
                className="text-base px-7 h-12 font-semibold border-slate-300 bg-white/70 backdrop-blur text-slate-800 hover:bg-white hover:border-indigo-300 hover:text-indigo-700 rounded-lg group transition-all"
              >
                <Play className="w-4 h-4 mr-2 fill-current" /> Request Demo
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => scrollTo("contact")}
                className="text-base px-7 h-12 font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg"
              >
                Contact Us
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-slate-500">
              {["14-day free trial", "No credit card required", "Setup in 30 minutes"].map((text) => (
                <div key={text} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Hero product preview with floating cards */}
          <Reveal className="mt-16 lg:mt-20 max-w-6xl mx-auto relative" delay={150}>
            <div className="relative">
              {/* Floating stat cards */}
              <div className="hidden md:block absolute -left-6 lg:-left-12 top-20 z-20 animate-float">
                <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-indigo-500/10 p-4 w-56">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Attendance today</div>
                      <div className="text-lg font-bold text-slate-900">94.2% <span className="text-xs text-emerald-600 font-semibold">↑ 3.1%</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden md:block absolute -right-6 lg:-right-12 bottom-24 z-20 animate-float animation-delay-2000">
                <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-indigo-500/10 p-4 w-60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Fee collection</div>
                      <div className="text-lg font-bold text-slate-900">₦8.4M <span className="text-xs text-violet-600 font-semibold">this term</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl -z-10" />

              <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200/80 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.35)] bg-white">
                <div className="h-10 bg-gradient-to-r from-slate-50 to-white flex items-center px-4 gap-2 border-b border-slate-200/70">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="ml-3 flex-1 max-w-sm h-6 bg-white border border-slate-200/70 rounded-md flex items-center px-3">
                    <Lock className="w-3 h-3 text-emerald-500 mr-2" />
                    <span className="text-[11px] text-slate-500 truncate">app.edissms.com/dashboard</span>
                  </div>
                </div>
                <video
                  src={demoVideo.url}
                  poster={demoPoster.url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full block"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───── Animated Stats strip ───── */}
      <section className="relative py-14 border-y border-slate-200/70 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 overflow-hidden">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.4),transparent_40%),radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.3),transparent_40%)]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 80} className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                  <Counter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-white/80 mt-1.5 font-medium">{stat.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Demo Video Section ───── */}
      <section id="demo" className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-indigo-50/30 to-white" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <Eyebrow>Product Tour</Eyebrow>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-5 mb-4 tracking-[-0.025em] leading-tight">
              See EDISMS <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">in action</span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              A 30-second walkthrough across the core modules — from dashboard analytics to report cards.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-r from-indigo-500/30 via-blue-500/30 to-cyan-500/30 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden ring-1 ring-slate-200 shadow-[0_40px_100px_-30px_rgba(79,70,229,0.4)] bg-slate-950">
                <video
                  src={demoVideo.url}
                  poster={demoPoster.url}
                  controls
                  muted
                  loop
                  playsInline
                  className="w-full block aspect-video"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───── Features Section ───── */}
      <section id="features" className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white to-slate-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <Eyebrow>Features</Eyebrow>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-5 mb-4 tracking-[-0.025em] leading-tight">
              Everything your school needs,{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">in one place</span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Eight tightly integrated modules replace the patchwork of spreadsheets, WhatsApp groups, and paper files.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 50}>
                <div className="group relative h-full p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-transparent hover:shadow-[0_20px_50px_-15px_rgba(79,70,229,0.25)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg shadow-slate-900/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Portals Showcase ───── */}
      <section id="portals" className="py-20 lg:py-28 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/30 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/30 to-blue-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 backdrop-blur border border-white/10 text-cyan-300 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3 h-3" /> Three Portals, One Platform
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-5 mb-4 tracking-[-0.025em] leading-tight">
              Built for everyone in your school
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Tailored experiences for administrators, teachers, and parents — beautifully connected.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PORTALS.map((portal, i) => (
              <Reveal key={portal.name} delay={i * 90}>
                <div className="group relative h-full rounded-2xl p-[1px] bg-gradient-to-br from-white/20 to-white/5 hover:from-white/40 transition-all duration-300">
                  <div className="relative h-full rounded-2xl bg-slate-900/80 backdrop-blur-xl p-7 overflow-hidden">
                    <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br ${portal.color} opacity-30 blur-3xl rounded-full group-hover:opacity-50 transition-opacity duration-500`} />
                    <div className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${portal.color} text-white text-xs font-semibold mb-5`}>
                      {portal.name}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{portal.tagline}</h3>
                    <ul className="space-y-2.5 mt-5">
                      {portal.points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5 text-sm text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Benefits Section ───── */}
      <section id="benefits" className="py-20 lg:py-28 relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-cyan-50/20 to-white" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <Eyebrow>Why EDISMS</Eyebrow>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-5 mb-4 tracking-[-0.025em] leading-tight">
              Built to remove friction, not add it
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Hundreds of schools have already replaced disconnected tools with one unified system.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((benefit, i) => (
              <Reveal key={benefit.title} delay={i * 60}>
                <div className="group relative p-7 rounded-2xl bg-white/70 backdrop-blur border border-slate-200/80 hover:border-indigo-200 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center mb-5 group-hover:from-indigo-100 group-hover:to-blue-100 transition-colors">
                    <benefit.icon className="w-5 h-5 text-indigo-600" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2 tracking-tight">{benefit.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Testimonials Section ───── */}
      <section id="testimonials" className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <Eyebrow>Customers</Eyebrow>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-5 mb-4 tracking-[-0.025em] leading-tight">
              Trusted by school leaders nationwide
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Real stories from administrators who modernized their schools with EDISMS.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 80}>
                <Card className="border-slate-200/80 bg-white shadow-none hover:shadow-[0_20px_50px_-15px_rgba(79,70,229,0.2)] hover:-translate-y-1 transition-all duration-300 rounded-2xl h-full">
                  <CardContent className="p-7 flex flex-col h-full">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-800 leading-relaxed mb-6 flex-1 text-[15px]">"{t.quote}"</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-slate-900/10`}>
                        {t.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                        <div className="text-xs text-slate-500">{t.role}</div>
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
      <section id="pricing" className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-indigo-50/20 to-white" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-5 mb-4 tracking-[-0.025em] leading-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Start with a 14-day free trial. Upgrade anytime. No hidden fees, no long-term contracts.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto items-stretch">
            {PRICING.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 90}>
                <div className={`relative rounded-2xl h-full transition-all duration-300 hover:-translate-y-2 ${plan.popular ? "p-[2px] bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 shadow-2xl shadow-indigo-500/30" : ""}`}>
                  <Card className={`relative rounded-2xl h-full ${plan.popular ? "border-0 bg-white" : "border-slate-200/80 hover:border-indigo-200 hover:shadow-[0_20px_50px_-15px_rgba(79,70,229,0.2)]"}`}>
                    {plan.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/40">
                        <Award className="w-3 h-3" /> Most Popular
                      </div>
                    )}
                    <CardContent className="p-8">
                      <h3 className="text-base font-semibold text-slate-900 tracking-tight">{plan.name}</h3>
                      <p className="text-sm text-slate-500 mt-1.5 mb-6 leading-relaxed min-h-[40px]">{plan.description}</p>
                      <div className="mb-6">
                        <span className={`text-4xl font-bold tracking-tight ${plan.popular ? "bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent" : "text-slate-900"}`}>{plan.price}</span>
                        <span className="text-slate-500 text-sm ml-1">{plan.period}</span>
                      </div>
                      <Button
                        className={`w-full mb-7 font-semibold rounded-lg h-11 transition-all ${plan.popular ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50" : "bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 hover:border-indigo-300"}`}
                        onClick={() => navigate("/auth/register-school")}
                      >
                        {plan.cta}
                      </Button>
                      <ul className="space-y-3">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-sm">
                            <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-indigo-600" : "text-emerald-500"}`} />
                            <span className="text-slate-700">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Trust Badges ───── */}
      <section className="py-12 border-y border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[
              { icon: Shield, label: "SSL Encrypted" },
              { icon: Lock, label: "NDPR Compliant" },
              { icon: Globe, label: "99.9% Uptime" },
              { icon: HeadphonesIcon, label: "24/7 Support" },
              { icon: Zap, label: "Lightning Fast" },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-slate-600 hover:text-indigo-700 transition-colors">
                <badge.icon className="w-4 h-4" />
                <span className="text-sm font-semibold">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FAQ Section ───── */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-5 mb-4 tracking-[-0.025em] leading-tight">
              Frequently asked questions
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Everything you need to know before getting started.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-slate-200 rounded-xl px-5 bg-white data-[state=open]:border-indigo-200 data-[state=open]:shadow-[0_8px_24px_-8px_rgba(79,70,229,0.15)] transition-all">
                  <AccordionTrigger className="text-left font-semibold text-slate-900 hover:no-underline py-5 text-[15px]">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 leading-relaxed pb-5 text-sm">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* ───── Contact Section ───── */}
      <section id="contact" className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-cyan-50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <Reveal>
              <Eyebrow>Get In Touch</Eyebrow>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-5 mb-4 tracking-[-0.025em] leading-tight">
                Ready to modernize{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">your school?</span>
              </h2>
              <p className="text-slate-600 text-base sm:text-lg mb-8 leading-relaxed">
                Have questions or need a personalized walkthrough? Our team responds within 24 hours.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Mail, label: "Email", text: "support@edissms.com" },
                  { icon: Phone, label: "Phone", text: "+234 800 EDISMS" },
                  { icon: MapPin, label: "Location", text: "Lagos, Nigeria" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-4 p-4 rounded-xl bg-white/70 backdrop-blur border border-slate-200/70 hover:border-indigo-200 hover:shadow-md transition-all">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{item.label}</div>
                      <div className="text-slate-900 font-semibold">{item.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <Card className="border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 rounded-2xl">
                <CardContent className="p-7 lg:p-8">
                  {formSent ? (
                    <div className="text-center py-12" style={{ animation: "scale-in 0.4s ease-out" }}>
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 mx-auto flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Message sent!</h3>
                      <p className="text-slate-600">We'll be in touch within 24 hours.</p>
                    </div>
                  ) : (
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setFormSent(true); }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full Name</label>
                          <Input required placeholder="John Doe" className="rounded-lg h-11 border-slate-300 focus-visible:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1.5 block">School Name</label>
                          <Input required placeholder="Grace Academy" className="rounded-lg h-11 border-slate-300 focus-visible:ring-indigo-500" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email Address</label>
                        <Input required type="email" placeholder="you@school.com" className="rounded-lg h-11 border-slate-300 focus-visible:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Phone Number</label>
                        <Input placeholder="+234 ..." className="rounded-lg h-11 border-slate-300 focus-visible:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Message</label>
                        <Textarea required placeholder="Tell us about your school and what you need…" rows={4} className="rounded-lg border-slate-300 focus-visible:ring-indigo-500" />
                      </div>
                      <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold rounded-lg h-12 text-base shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all group" size="lg">
                        Send Message <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───── Final CTA ───── */}
      <section className="py-20 lg:py-28 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-slate-950 to-cyan-600/20" />
        <div className="absolute inset-0 [background-image:radial-gradient(ellipse_at_top,rgba(99,102,241,0.3),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.5] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />

        <Reveal className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-cyan-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3 h-3" /> Join 200+ schools today
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-5 leading-tight tracking-[-0.025em]">
            Start managing your school{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">smarter, today</span>
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Join 200+ schools on EDISMS. Start your free 14-day trial — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth/register-school")}
              className="bg-white text-slate-900 hover:bg-slate-100 text-base px-7 h-12 font-semibold rounded-lg group shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
            >
              Get Started Free <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollTo("contact")}
              className="border-white/30 bg-white/5 backdrop-blur text-white hover:bg-white/15 text-base px-7 h-12 font-semibold rounded-lg"
            >
              Schedule a Demo
            </Button>
          </div>
        </Reveal>
      </section>

      {/* ───── Footer ───── */}
      <footer className="py-14 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">EDISMS</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                The complete digital school management system, purpose-built for Nigerian schools.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4 text-sm">Product</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                {[{ l: "Features", id: "features" }, { l: "Demo", id: "demo" }, { l: "Portals", id: "portals" }, { l: "Pricing", id: "pricing" }, { l: "FAQ", id: "faq" }].map(({ l, id }) => (
                  <li key={l}>
                    <button onClick={() => scrollTo(id)} className="hover:text-indigo-700 transition-colors">{l}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4 text-sm">Support</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                {[{ label: "Contact Us", action: () => scrollTo("contact") }, { label: "Help Center" }, { label: "System Status" }].map((item) => (
                  <li key={item.label}>
                    <button onClick={item.action} className="hover:text-indigo-700 transition-colors">{item.label}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4 text-sm">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((label) => (
                  <li key={label}>
                    <a href="#" className="hover:text-indigo-700 transition-colors">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} EDISMS. All rights reserved.
            </p>
            <p className="text-sm text-slate-500">Built for Nigerian schools.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
