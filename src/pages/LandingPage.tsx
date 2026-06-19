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
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* Subtle chip used for section eyebrows */
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold tracking-wide uppercase border border-slate-200/80">
      {children}
    </div>
  );
}

/* ──────────────── Data ──────────────── */
const NAV_LINKS = [
  { label: "Product", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "Pricing", href: "#pricing" },
  { label: "Customers", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

const FEATURES = [
  { icon: Users, title: "Student Records", description: "Complete digital profiles with photos, grades, and academic history — searchable in seconds." },
  { icon: ClipboardCheck, title: "Attendance Tracking", description: "Mark daily attendance in a single tap. Auto-generate reports for parents and administrators." },
  { icon: CreditCard, title: "Fees & Payments", description: "Online payments via Paystack, automated reminders, and instant receipts — no spreadsheets." },
  { icon: Monitor, title: "CBT Examinations", description: "Create, deliver, and auto-grade computer-based tests. AI-assisted question generation built in." },
  { icon: FileText, title: "Report Cards", description: "Generate professional, customizable report cards with class positions and teacher remarks." },
  { icon: MessageSquare, title: "Communication", description: "Send SMS, email, and WhatsApp updates to parents and staff from one inbox." },
];

const BENEFITS = [
  { icon: Clock, title: "Save 10+ hours weekly", description: "Automate attendance, grading, fee tracking, and reporting — so staff can focus on teaching." },
  { icon: BookOpen, title: "Go fully paperless", description: "Every record digitized. Search, export, and share data instantly — no filing cabinets." },
  { icon: BarChart3, title: "Real-time analytics", description: "Track performance, attendance, and revenue from a single, always-current dashboard." },
  { icon: Shield, title: "Enterprise security", description: "AES-256 encryption, daily backups, and role-based access — NDPR compliant by default." },
  { icon: Zap, title: "Onboarding in 30 minutes", description: "Guided setup with free data migration. No training required to go live this week." },
  { icon: Globe, title: "Works on any device", description: "Phones, tablets, laptops — no installs required. Just open a browser and sign in." },
];

const TESTIMONIALS = [
  { name: "Mrs. Adebayo", role: "Principal, Grace International Academy", quote: "EDISMS transformed how we run our school. Parents see updates instantly, and our teachers save hours every week.", avatar: "A" },
  { name: "Mr. Okechukwu", role: "Director, Bright Future Schools", quote: "The CBT exam feature alone justified the switch. Students take tests seamlessly, and results are instant.", avatar: "O" },
  { name: "Mrs. Ibrahim", role: "Admin, Al-Hikma Primary School", quote: "Fee collection used to be a nightmare. Now parents pay online and everything reconciles automatically.", avatar: "I" },
  { name: "Dr. Mensah", role: "Proprietor, Excel Preparatory School", quote: "We tried three other systems before EDISMS. None come close in usability or features for Nigerian schools.", avatar: "M" },
];

const PRICING = [
  {
    name: "Starter",
    price: "₦15,000",
    period: "/term",
    description: "For small nursery & primary schools getting started.",
    features: ["Up to 100 students", "Student profiles & records", "Attendance tracking", "Basic fee management", "SMS notifications (50/mo)", "Email support"],
    popular: false,
    cta: "Start Free Trial",
  },
  {
    name: "Professional",
    price: "₦35,000",
    period: "/term",
    description: "For growing schools that need powerful, complete tools.",
    features: ["Up to 500 students", "Everything in Starter", "CBT exam management", "Report card generation", "Parent portal access", "WhatsApp notifications", "Priority support"],
    popular: true,
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    price: "₦65,000",
    period: "/term",
    description: "For large schools and multi-branch institutions.",
    features: ["Unlimited students", "Everything in Professional", "AI question generation", "Multi-branch management", "Custom branding & domain", "API access", "Dedicated account manager", "24/7 phone support"],
    popular: false,
    cta: "Contact Sales",
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
  { value: "200+", label: "Schools" },
  { value: "50,000+", label: "Students managed" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9/5", label: "Customer rating" },
];

/* ──────────────── Component ──────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-slate-900 overflow-x-hidden">
      {/* ───── Sticky Navigation ───── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "backdrop-blur-xl bg-white/85 border-b border-slate-200/70" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">EDISMS</span>
            </div>

            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href.slice(1))}
                  className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-md transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate("/auth")} className="font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100">
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth/register-school")} className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg px-4 shadow-sm">
                Start free trial <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>

            <button className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white" style={{ animation: "fade-in 0.2s ease-out" }}>
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <button key={link.href} onClick={() => scrollTo(link.href.slice(1))} className="block w-full text-left py-2.5 px-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">
                  {link.label}
                </button>
              ))}
              <div className="pt-3 flex flex-col gap-2 border-t border-slate-200 mt-2">
                <Button variant="outline" onClick={() => navigate("/auth")} className="w-full">Sign In</Button>
                <Button onClick={() => navigate("/auth/register-school")} className="w-full bg-slate-900 hover:bg-slate-800 text-white">Start free trial</Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ───── Hero Section ───── */}
      <section className="relative pt-28 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {/* Subtle background — single blue wash, no rainbow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-blue-100/70 via-blue-50/40 to-transparent rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.06),transparent_55%)]" />
          {/* Soft grid */}
          <div className="absolute inset-0 opacity-[0.4] [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-medium shadow-sm mb-8">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Trusted by 200+ schools across Nigeria
            </div>

            <h1 className="text-[2.5rem] sm:text-5xl lg:text-[4.5rem] font-bold text-slate-900 leading-[1.05] tracking-[-0.035em] mb-7">
              The complete operating system{" "}
              <span className="text-blue-600">for modern schools</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              EDISMS brings admissions, attendance, fees, exams, and parent communication into one secure platform — purpose-built for Nigerian schools.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/auth/register-school")}
                className="bg-slate-900 hover:bg-slate-800 text-white text-base px-7 h-12 font-semibold rounded-lg shadow-sm group"
              >
                Start free trial <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollTo("demo")}
                className="text-base px-7 h-12 font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg group"
              >
                <Play className="w-4 h-4 mr-2 fill-current" /> Watch 30-sec demo
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

          {/* Product preview */}
          <Reveal className="mt-16 lg:mt-20 max-w-6xl mx-auto" delay={150}>
            <div className="rounded-xl overflow-hidden ring-1 ring-slate-200 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.18)] bg-white">
              <div className="h-10 bg-slate-50 flex items-center px-4 gap-2 border-b border-slate-200/70">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                </div>
                <div className="ml-3 flex-1 max-w-sm h-6 bg-white border border-slate-200/70 rounded-md flex items-center px-3">
                  <Lock className="w-3 h-3 text-slate-400 mr-2" />
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
          </Reveal>
        </div>
      </section>

      {/* ───── Logo / Stats strip ───── */}
      <section className="py-12 border-y border-slate-200/70 bg-slate-50/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 60} className="text-center md:text-left md:border-l md:first:border-l-0 md:border-slate-200 md:pl-8">
                <div className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Demo Video Section ───── */}
      <section id="demo" className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <Eyebrow>Product tour</Eyebrow>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-5 mb-4 tracking-[-0.025em] leading-tight">
              See EDISMS in action
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              A 30-second walkthrough across the core modules — from dashboard analytics to report cards.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.25)] bg-slate-900">
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
          </Reveal>
        </div>
      </section>

      {/* ───── Features Section ───── */}
      <section id="features" className="py-20 lg:py-28 bg-slate-50/60 border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <Eyebrow>Features</Eyebrow>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-5 mb-4 tracking-[-0.025em] leading-tight">
              Everything your school needs, in one place
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Six tightly integrated modules replace the patchwork of spreadsheets, WhatsApp groups, and paper files.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200/70 rounded-2xl overflow-hidden border border-slate-200/70">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 60}>
                <div className="group bg-white p-7 lg:p-8 h-full hover:bg-slate-50/80 transition-colors">
                  <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-5 ring-1 ring-blue-100 group-hover:bg-blue-100 transition-colors">
                    <feature.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Benefits Section ───── */}
      <section id="benefits" className="py-20 lg:py-28">
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
                <div className="group p-7 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.1)] transition-all h-full">
                  <benefit.icon className="w-5 h-5 text-blue-600 mb-5" strokeWidth={2.2} />
                  <h3 className="text-base font-semibold text-slate-900 mb-2 tracking-tight">{benefit.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Testimonials Section ───── */}
      <section id="testimonials" className="py-20 lg:py-28 bg-slate-50/60 border-y border-slate-200/70">
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
                <Card className="border-slate-200 bg-white shadow-none hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.1)] transition-shadow rounded-2xl h-full">
                  <CardContent className="p-7 flex flex-col h-full">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-800 leading-relaxed mb-6 flex-1 text-[15px]">"{t.quote}"</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-semibold">
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
      <section id="pricing" className="py-20 lg:py-28">
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
                <Card className={`relative rounded-2xl h-full transition-all ${plan.popular ? "border-slate-900 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5" : "border-slate-200 shadow-none hover:border-slate-300"}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold">
                      <Award className="w-3 h-3" /> Most popular
                    </div>
                  )}
                  <CardContent className="p-8">
                    <h3 className="text-base font-semibold text-slate-900 tracking-tight">{plan.name}</h3>
                    <p className="text-sm text-slate-500 mt-1.5 mb-6 leading-relaxed min-h-[40px]">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-slate-900 tracking-tight">{plan.price}</span>
                      <span className="text-slate-500 text-sm ml-1">{plan.period}</span>
                    </div>
                    <Button
                      className={`w-full mb-7 font-medium rounded-lg h-11 ${plan.popular ? "bg-slate-900 hover:bg-slate-800 text-white" : "bg-white border border-slate-300 text-slate-900 hover:bg-slate-50"}`}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => navigate("/auth/register-school")}
                    >
                      {plan.cta}
                    </Button>
                    <ul className="space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-slate-700">{f}</span>
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
      <section className="py-12 border-y border-slate-200/70 bg-slate-50/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[
              { icon: Shield, label: "SSL Encrypted" },
              { icon: Lock, label: "NDPR Compliant" },
              { icon: Globe, label: "99.9% Uptime" },
              { icon: HeadphonesIcon, label: "24/7 Support" },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-slate-500">
                <badge.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{badge.label}</span>
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
                <AccordionItem key={i} value={`faq-${i}`} className="border border-slate-200 rounded-xl px-5 bg-white data-[state=open]:shadow-sm transition-all">
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
      <section id="contact" className="py-20 lg:py-28 bg-slate-50/60 border-y border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            <Reveal>
              <Eyebrow>Get in touch</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-5 mb-4 tracking-[-0.025em] leading-tight">
                Ready to modernize your school?
              </h2>
              <p className="text-slate-600 text-base sm:text-lg mb-8 leading-relaxed">
                Have questions or need a personalized walkthrough? Our team responds within 24 hours.
              </p>
              <div className="space-y-5">
                {[
                  { label: "Email", text: "support@edissms.com" },
                  { label: "Phone", text: "+234 800 EDISMS" },
                  { label: "Location", text: "Lagos, Nigeria" },
                ].map((item) => (
                  <div key={item.text}>
                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{item.label}</div>
                    <div className="text-slate-900 font-medium">{item.text}</div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
                <CardContent className="p-7 lg:p-8">
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full Name</label>
                        <Input placeholder="John Doe" className="rounded-lg h-11 border-slate-300" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">School Name</label>
                        <Input placeholder="Grace Academy" className="rounded-lg h-11 border-slate-300" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email Address</label>
                      <Input type="email" placeholder="you@school.com" className="rounded-lg h-11 border-slate-300" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Phone Number</label>
                      <Input placeholder="+234 ..." className="rounded-lg h-11 border-slate-300" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Message</label>
                      <Textarea placeholder="Tell us about your school and what you need…" rows={4} className="rounded-lg border-slate-300" />
                    </div>
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg h-11 text-base" size="lg">
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
      <section className="py-20 lg:py-28 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.18),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.5] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />
        <Reveal className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight tracking-[-0.025em]">
            Start managing your school smarter, today
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Join 200+ schools on EDISMS. Start your free 14-day trial — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth/register-school")}
              className="bg-white text-slate-900 hover:bg-slate-100 text-base px-7 h-12 font-semibold rounded-lg group"
            >
              Start free trial <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollTo("contact")}
              className="border-white/20 bg-transparent text-white hover:bg-white/10 text-base px-7 h-12 font-semibold rounded-lg"
            >
              Schedule a demo
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
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900">EDISMS</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                The complete digital school management system, purpose-built for Nigerian schools.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4 text-sm">Product</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                {[{ l: "Features", id: "features" }, { l: "Demo", id: "demo" }, { l: "Pricing", id: "pricing" }, { l: "FAQ", id: "faq" }].map(({ l, id }) => (
                  <li key={l}>
                    <button onClick={() => scrollTo(id)} className="hover:text-slate-900 transition-colors">{l}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4 text-sm">Support</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                {[{ label: "Contact Us", action: () => scrollTo("contact") }, { label: "Help Center" }, { label: "System Status" }].map((item) => (
                  <li key={item.label}>
                    <button onClick={item.action} className="hover:text-slate-900 transition-colors">{item.label}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4 text-sm">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((label) => (
                  <li key={label}>
                    <a href="#" className="hover:text-slate-900 transition-colors">{label}</a>
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
