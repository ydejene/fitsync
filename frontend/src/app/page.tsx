// src/app/page.tsx
// Landing page — public, no auth required
// Branch: feature/landing-page (Derrick)

import Link from "next/link";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  CTAButton,
  AnimatedStat,
} from "./components/motion";

export default function LandingPage() {
  return (
    /* Use semantic font-sans mapped in globals.css */
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-border-base">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-dumbbell text-white text-xs" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-text-primary">
              FitSync
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-text-secondary hover:text-brand-orange transition-colors">Features</a>
            <a href="#plans" className="text-sm text-text-secondary hover:text-brand-orange transition-colors">Pricing</a>
            <a href="#contact" className="text-sm text-text-secondary hover:text-brand-orange transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-text-primary hover:text-brand-orange transition-colors">
              Sign in
            </Link>
            <CTAButton href="/login" className="btn-primary text-sm">
              Get Started
            </CTAButton>
          </div>
        </div>
      </nav>

     {/* Hero */}
      <section className="relative overflow-hidden bg-text-primary text-white">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(241,90,36,0.3) 40px, rgba(241,90,36,0.3) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(241,90,36,0.3) 40px, rgba(241,90,36,0.3) 41px)"
          }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
            <FadeIn>
              <span className="inline-block px-3 py-1 bg-brand-orange text-white text-xs font-semibold rounded-full uppercase tracking-widest mb-6">
                Built for Ethiopia
              </span>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
                Manage Your Gym
                <span className="text-brand-orange block">The Smart Way</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="text-lg text-gray-300 mb-10 max-w-xl leading-relaxed">
                The first all-in-one gym management platform built for Ethiopia. Accept
                Telebirr and CBE Birr payments directly in ETB. Stop revenue leakage
                and grow your member base effortlessly.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <CTAButton href="/login" className="btn-primary px-8 py-3.5 text-base">
                  Start Free Pilot
                  <i className="fa-solid fa-arrow-right text-xs" />
                </CTAButton>
                <CTAButton href="#features" className="flex items-center gap-2 text-gray-300 hover:text-white text-sm font-medium transition-colors border border-white/20 px-6 py-3.5 rounded-lg">
                  See how it works
                </CTAButton>
              </div>
            </FadeIn>

            <StaggerContainer className="mt-16 flex flex-wrap items-center justify-center gap-12 border-t border-white/10 pt-8 w-full" stagger={0.15}>
              {[
                { label: "REVENUE LEAKAGE", value: "< 3%" },
                { label: "FASTER PAYMENTS", value: "30%" },
                { label: "PILOT GYM IN ADDIS", value: "#1" },
              ].map((stat) => (
                <StaggerItem key={stat.label}>
                  <AnimatedStat value={stat.value} label={stat.label} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="bg-brand-orange py-4">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-white text-sm font-medium">
            {["Telebirr Integration", "CBE Birr Payments", "Amharic Interface", "Auto Expiry Alerts", "Real-time Analytics", "Role-Based Access"].map((f) => (
              <span key={f} className="flex items-center gap-2">
                <i className="fa-solid fa-check text-white/70 text-xs" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-brand-off-white">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-widest">Platform Features</span>
            <h2 className="font-display text-4xl font-bold text-text-primary mt-2">
              Everything you need to run a gym
            </h2>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.08}>
            {[
              { icon: "fa-users", title: "Member Management", desc: "Track profiles, subscriptions, health records, and attendance — all in one view." },
              { icon: "fa-credit-card", title: "Local Payments", desc: "Accept Telebirr, CBE Birr, and cash. All amounts in Ethiopian Birr." },
              { icon: "fa-chart-line", title: "Financial Analytics", desc: "Monitor MRR, churn rate, overdue payments, and monthly revenue trends." },
              { icon: "fa-bell", title: "Expiry Alerts", desc: "Automated notifications before memberships expire — no more lost renewals." },
              { icon: "fa-calendar", title: "Class Booking", desc: "Let members book HIIT, Yoga, CrossFit sessions. Track attendance instantly." },
              { icon: "fa-shield", title: "Audit Trail", desc: "Immutable log of all changes to prevent staff maladministration." },
            ].map((feat) => (
              <StaggerItem key={feat.title}>
                <div className="card p-6 hover:shadow-md transition-shadow h-full">
                  <div className="w-10 h-10 bg-brand-orange-light rounded-lg flex items-center justify-center mb-4">
                    <i className={`fa-solid ${feat.icon} text-brand-orange`} />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-text-primary mb-2">{feat.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feat.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-widest">Membership Plans</span>
            <h2 className="font-display text-4xl font-bold text-text-primary mt-2">
              Simple, transparent pricing in ETB
            </h2>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-3 gap-6" stagger={0.12}>
            {[
              {
                name: "Basic", price: "500", cycle: "/ month",
                features: ["Gym access", "Locker room", "Member portal"],
                highlight: false,
              },
              {
                name: "Pro", price: "1,200", cycle: "/ quarter",
                features: ["Gym access", "All group classes", "1 trainer session", "Priority support"],
                highlight: true,
              },
              {
                name: "Elite", price: "4,000", cycle: "/ year",
                features: ["All access", "Personal trainer", "Nutrition plan", "Guest passes"],
                highlight: false,
              },
            ].map((plan) => (
              <StaggerItem key={plan.name}>
                <div
                  className={`rounded-xl p-8 border-2 relative h-full ${
                    plan.highlight
                      ? "border-brand-orange bg-[#FFF8F5]"
                      : "border-border-base bg-white"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full uppercase tracking-wide">
                      Popular
                    </span>
                  )}
                  <div className="mb-6">
                    <h3 className="font-display text-2xl font-bold text-text-primary">{plan.name}</h3>
                    <div className="mt-4 flex items-end gap-1">
                      <span className="text-xs text-text-secondary mb-1">ETB</span>
                      <span className="font-display text-4xl font-bold text-text-primary">{plan.price}</span>
                      <span className="text-text-secondary text-sm mb-1">{plan.cycle}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-text-primary">
                        <i className="fa-solid fa-check text-brand-orange text-xs" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <CTAButton
                    href="/login"
                    className={`block text-center py-3 rounded-lg text-sm font-semibold transition-all ${
                      plan.highlight
                        ? "bg-brand-orange text-white hover:bg-brand-orange-dark"
                        : "border border-border-base text-text-primary hover:bg-brand-off-white"
                    }`}
                  >
                    Get Started
                  </CTAButton>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-text-primary text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <i className="fa-solid fa-dumbbell text-brand-orange text-xl" />
                <span className="font-display text-2xl font-bold tracking-tight">FitSync</span>
              </div>
              <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-6">
                The leading gym management platform in Ethiopia.
                We simplify operations so you can focus on building a healthier community.
              </p>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <i className="fa-solid fa-envelope text-sm" />
                <a href="mailto:admin@fitsync.et" className="text-sm">admin@fitsync.et</a>
              </div>
              <p className="text-[10px] text-gray-600 mt-4 uppercase tracking-widest">
                ALU Foundations Project by Team FitSync
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-6 uppercase tracking-wider">Product</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-brand-orange transition-colors">Features</a></li>
                <li><a href="#plans" className="hover:text-brand-orange transition-colors">Pricing</a></li>
                <li><Link href="/login" className="hover:text-brand-orange transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-6 uppercase tracking-wider">About Us</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><a href="#" className="hover:text-brand-orange transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Contact</a></li>
                <li className="text-xs text-gray-600 pt-2 border-t border-white/5">Addis Ababa, Ethiopia</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-end gap-6">
            <p className="text-[10px] text-gray-600 mr-auto">© 2026 FitSync Platform</p>
            <a href="#" className="text-xs text-gray-500 hover:text-gray-300">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-500 hover:text-gray-300">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
