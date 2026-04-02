import { useState } from "react";
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
} from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Benefits", href: "#benefits" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

const FEATURES = [
  { icon: Users, title: "Student Records", description: "Complete digital profiles with photos, grades, and history — all in one place.", color: "from-blue-500 to-indigo-600" },
  { icon: ClipboardCheck, title: "Smart Attendance", description: "Mark and track attendance in seconds. Instant reports for parents and admins.", color: "from-emerald-500 to-teal-600" },
  { icon: CreditCard, title: "Fees Management", description: "Automate fee collection, send reminders, and generate receipts effortlessly.", color: "from-amber-500 to-orange-600" },
  { icon: Monitor, title: "CBT Exams", description: "Create, manage, and auto-grade computer-based tests with AI question generation.", color: "from-purple-500 to-violet-600" },
  { icon: FileText, title: "Results & Report Cards", description: "Generate beautiful report cards with grades, positions, and teacher remarks.", color: "from-pink-500 to-rose-600" },
  { icon: MessageSquare, title: "Parent Communication", description: "Send SMS, email, and WhatsApp notifications to parents instantly.", color: "from-cyan-500 to-blue-600" },
];

const BENEFITS = [
  { icon: Clock, title: "Save 10+ Hours Weekly", description: "Automate repetitive tasks like attendance, grading, and report generation.", emoji: "⏰" },
  { icon: FileText, title: "Go Paperless", description: "Eliminate paper records. Everything is digital, searchable, and backed up.", emoji: "📄" },
  { icon: BarChart3, title: "Track Performance", description: "Real-time analytics on student progress, attendance trends, and fee collection.", emoji: "📊" },
  { icon: Shield, title: "Bank-Level Security", description: "Your data is encrypted, backed up daily, and protected with role-based access.", emoji: "🔒" },
  { icon: Zap, title: "Instant Setup", description: "Get your school running on EDISSMS in under 30 minutes. No training needed.", emoji: "⚡" },
  { icon: Globe, title: "Access Anywhere", description: "Works on any device — phone, tablet, or computer. No app download required.", emoji: "🌍" },
];

const TESTIMONIALS = [
  { name: "Mrs. Adebayo", role: "Principal, Grace International Academy", quote: "EDISSMS transformed how we manage our school. Parents love the instant updates, and our teachers save hours every week.", rating: 5 },
  { name: "Mr. Okechukwu", role: "Director, Bright Future Schools", quote: "The CBT exam feature alone was worth it. Our students now take tests seamlessly, and results are instant. Remarkable!", rating: 5 },
  { name: "Mrs. Ibrahim", role: "Admin, Al-Hikma Primary School", quote: "Fee collection used to be a nightmare. Now parents pay online and we track everything automatically. Best decision ever.", rating: 5 },
  { name: "Dr. Mensah", role: "Proprietor, Excel Preparatory School", quote: "We've tried 3 other systems before EDISSMS. None come close in terms of ease of use and features for Nigerian schools.", rating: 5 },
];

const PRICING = [
  {
    name: "Basic",
    price: "₦15,000",
    period: "/term",
    description: "Perfect for small nursery & primary schools",
    features: ["Up to 100 students", "Student records & profiles", "Attendance tracking", "Basic fee management", "SMS notifications (50/month)", "Email support"],
    popular: false,
    cta: "Start Free Trial",
  },
  {
    name: "Standard",
    price: "₦35,000",
    period: "/term",
    description: "Ideal for growing primary & secondary schools",
    features: ["Up to 500 students", "Everything in Basic", "CBT Exam management", "Report card generation", "Parent portal access", "WhatsApp notifications", "Priority support"],
    popular: true,
    cta: "Start Free Trial",
  },
  {
    name: "Premium",
    price: "₦65,000",
    period: "/term",
    description: "For large schools & multi-branch institutions",
    features: ["Unlimited students", "Everything in Standard", "AI question generation", "Multi-branch management", "Custom branding", "API access", "Dedicated account manager", "24/7 phone support"],
    popular: false,
    cta: "Contact Sales",
  },
];

const FAQS = [
  { q: "How long does it take to set up EDISSMS?", a: "You can have your school fully set up in under 30 minutes. Our onboarding wizard guides you through adding classes, subjects, and students. We also offer free data migration for schools switching from other systems." },
  { q: "Is my school's data safe?", a: "Absolutely. We use bank-level encryption, automated daily backups, and role-based access control. Your data is hosted on secure cloud servers with 99.9% uptime guarantee." },
  { q: "Can parents access the system?", a: "Yes! Parents can view their child's attendance, exam results, fee status, and school announcements through a dedicated parent portal accessible on any device." },
  { q: "Do you support the Nigerian curriculum?", a: "Yes, EDISSMS is specifically built for Nigerian schools — nursery, primary, and secondary. Our grading system, report cards, and exam formats align with Nigerian educational standards." },
  { q: "What payment methods are supported?", a: "We support bank transfers, card payments via Paystack, and mobile money. Parents can pay fees online, and you get instant notification when payments are made." },
  { q: "Can I try before I buy?", a: "Yes! Every plan comes with a 14-day free trial. No credit card required. You can explore all features and decide which plan works best for your school." },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">EDISSMS</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/auth")} className="font-medium">
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth/register-school")} className="bg-gradient-primary hover:opacity-90 transition-opacity font-medium shadow-md">
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Mobile menu button */}
            <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl animate-fade-in">
            <div className="px-4 py-4 space-y-3">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  {link.label}
                </a>
              ))}
              <div className="pt-3 flex flex-col gap-2 border-t border-border/50">
                <Button variant="outline" onClick={() => navigate("/auth")} className="w-full">Sign In</Button>
                <Button onClick={() => navigate("/auth/register-school")} className="w-full bg-gradient-primary">Get Started</Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/3 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              Trusted by 200+ Schools Across Nigeria
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-extrabold text-foreground leading-tight tracking-tight mb-6">
              All-in-One School{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">Management</span>{" "}
              Made Simple
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              From admissions to report cards, manage your entire school digitally. Save time, reduce paperwork, and give parents real-time updates — all from one powerful platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth/register-school")} className="bg-gradient-primary hover:opacity-90 transition-all shadow-lg shadow-primary/25 text-base px-8 py-6 h-auto font-semibold">
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => { const el = document.getElementById('contact'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="text-base px-8 py-6 h-auto font-semibold border-2">
                Request Demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" /> 14-day free trial</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" /> No credit card required</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" /> Setup in 30 minutes</div>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="mt-16 lg:mt-20 max-w-5xl mx-auto relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card">
              {/* Browser chrome */}
              <div className="h-10 bg-muted/50 flex items-center px-4 gap-2 border-b border-border/30">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
                <div className="ml-4 flex-1 max-w-xs h-6 bg-background/80 rounded-md" />
              </div>
              {/* Dashboard preview content */}
              <div className="p-6 sm:p-8 bg-gradient-to-br from-background via-background to-muted/30">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  {[
                    { label: "Total Students", value: "1,247", emoji: "👨‍🎓", bg: "from-blue-500/10 to-indigo-500/10" },
                    { label: "Teachers", value: "48", emoji: "👩‍🏫", bg: "from-emerald-500/10 to-teal-500/10" },
                    { label: "Fees Collected", value: "₦4.2M", emoji: "💰", bg: "from-amber-500/10 to-orange-500/10" },
                    { label: "Attendance", value: "94.7%", emoji: "✅", bg: "from-purple-500/10 to-violet-500/10" },
                  ].map((stat) => (
                    <div key={stat.label} className={`rounded-xl p-4 bg-gradient-to-br ${stat.bg} border border-border/30`}>
                      <div className="text-2xl mb-1">{stat.emoji}</div>
                      <div className="text-lg sm:text-xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="sm:col-span-2 h-32 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-border/30 flex items-center justify-center">
                    <div className="flex items-end gap-2">
                      {[40, 65, 45, 80, 55, 70, 90, 60, 75].map((h, i) => (
                        <div key={i} className="w-4 sm:w-6 rounded-t-md bg-gradient-to-t from-primary/40 to-primary/80" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="h-32 rounded-xl bg-gradient-to-br from-secondary/5 to-pink/5 border border-border/30 p-4">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Recent Activity</div>
                    {["Fee payment received", "Attendance marked", "Exam published"].map((text, i) => (
                      <div key={i} className="flex items-center gap-2 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-success" />
                        <span className="text-xs text-foreground truncate">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-primary opacity-5 blur-3xl rounded-3xl -z-10" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              ✨ Powerful Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Everything Your School Needs
            </h2>
            <p className="text-muted-foreground text-lg">
              One platform to manage students, teachers, fees, exams, and communication — designed for Nigerian schools.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="group border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-card/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
              🚀 Why Choose EDISSMS
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Transform How You Run Your School
            </h2>
            <p className="text-muted-foreground text-lg">
              Join hundreds of schools already saving time, money, and effort with EDISSMS.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="group p-6 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <div className="text-3xl mb-4">{benefit.emoji}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink/10 text-pink text-sm font-medium mb-4">
              💬 Testimonials
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Loved by Schools Everywhere
            </h2>
            <p className="text-muted-foreground text-lg">
              See what school administrators and teachers are saying about EDISSMS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-foreground leading-relaxed mb-4 italic">"{t.quote}"</p>
                  <div>
                    <div className="font-semibold text-foreground">{t.name}</div>
                    <div className="text-sm text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              💎 Simple Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Plans That Grow With Your School
            </h2>
            <p className="text-muted-foreground text-lg">
              Start free, upgrade when you're ready. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {PRICING.map((plan) => (
              <Card key={plan.name} className={`relative overflow-hidden border-border/50 ${plan.popular ? "border-primary shadow-xl shadow-primary/10 scale-[1.03]" : "bg-card/80"}`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary" />
                )}
                <CardContent className="p-6 lg:p-8">
                  {plan.popular && (
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-display font-extrabold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <Button
                    className={`w-full mb-6 font-semibold ${plan.popular ? "bg-gradient-primary hover:opacity-90 shadow-md" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => navigate("/auth/register-school")}
                  >
                    {plan.cta}
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
            {[
              { icon: Shield, label: "SSL Encrypted" },
              { icon: Lock, label: "NDPR Compliant" },
              { icon: Globe, label: "99.9% Uptime" },
              { icon: HeadphonesIcon, label: "24/7 Support" },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-muted-foreground">
                <badge.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              ❓ FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-xl px-6 bg-card/80 data-[state=open]:shadow-md transition-shadow">
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                📬 Get in Touch
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
                Ready to Transform Your School?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Have questions? Want a personalized demo? Fill out the form and our team will reach out within 24 hours.
              </p>
              <div className="space-y-4">
                {[
                  { emoji: "📧", text: "support@edissms.com" },
                  { emoji: "📞", text: "+234 800 EDISSMS" },
                  { emoji: "📍", text: "Lagos, Nigeria" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6 lg:p-8">
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                      <Input placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">School Name</label>
                      <Input placeholder="Grace Academy" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
                    <Input type="email" placeholder="you@school.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number</label>
                    <Input placeholder="+234 ..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
                    <Textarea placeholder="Tell us about your school and what you need..." rows={4} />
                  </div>
                  <Button className="w-full bg-gradient-primary hover:opacity-90 font-semibold shadow-md" size="lg">
                    Send Message <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
            Start Managing Your School Smarter Today
          </h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-10">
            Join 200+ schools already using EDISSMS. Free 14-day trial — no credit card needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth/register-school")} className="bg-white text-primary hover:bg-white/90 text-base px-8 py-6 h-auto font-semibold shadow-lg">
              Get Started Free <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => { const el = document.getElementById('contact'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="border-white/30 text-white hover:bg-white/10 text-base px-8 py-6 h-auto font-semibold">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border/50 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="font-display text-lg font-bold text-foreground">EDISSMS</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The complete digital school management system built for Nigerian schools.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#contact" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} EDISSMS. All rights reserved. Built with ❤️ for Nigerian schools.
          </div>
        </div>
      </footer>
    </div>
  );
}
