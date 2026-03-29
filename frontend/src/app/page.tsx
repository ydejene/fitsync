import Link from "next/link";
import GoogleTranslate from "@/components/GoogleTranslate";
import CalendlyBadge from "@/components/CalendlyBadge";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  CTAButton,
  AnimatedStat,
} from "./components/motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-border-base">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="FitSync Logo" 
              className="h-10 md:h-14 w-auto object-contain transition-all"
            />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-text-secondary hover:text-brand-orange transition-colors">Features</a>
            <a href="#reviews" className="text-sm text-text-secondary hover:text-brand-orange transition-colors">Reviews</a>
            <a href="#plans" className="text-sm text-text-secondary hover:text-brand-orange transition-colors">Pricing</a>
            <a href="#contact" className="text-sm text-text-secondary hover:text-brand-orange transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <GoogleTranslate />
            <Link href="/login" className="text-xs md:text-sm font-medium text-text-primary hover:text-brand-orange transition-colors whitespace-nowrap">
              Sign in
            </Link>
            <CTAButton href="/login" className="btn-primary px-3 py-1.5 md:px-5 md:py-2 text-[10px] md:text-sm whitespace-nowrap">
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
            <FadeIn direction="down">
              <span className="inline-block px-3 py-1 bg-brand-orange text-white text-xs font-semibold rounded-full uppercase tracking-widest mb-6">
                All-in-One Platform
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
                The all-in-one gym management platform that streamlines operations.
                Handle payments, memberships, bookings, and analytics — all from one
                beautiful dashboard.
              </p>
            </FadeIn>
            <FadeIn delay={0.3} direction="scale">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <CTAButton href="/login" className="btn-primary px-8 py-3.5 text-base shadow-lg shadow-brand-orange/20">
                  Start Free Trial
                  <i className="fa-solid fa-arrow-right text-xs" />
                </CTAButton>
                <CTAButton href="#features" className="hidden sm:flex items-center gap-2 text-gray-300 hover:text-white text-sm font-medium transition-colors border border-white/10 px-6 py-3.5 rounded-lg">
                  See how it works
                </CTAButton>
              </div>
            </FadeIn>

            <StaggerContainer className="mt-16 flex flex-wrap items-center justify-center gap-12 border-t border-white/10 pt-8 w-full" stagger={0.15}>
              {[
                { label: "ACTIVE GYMS", value: "200+" },
                { label: "MEMBERS MANAGED", value: "50K+" },
                { label: "UPTIME", value: "99.9%" },
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
            {["Payment Processing", "Member Portals", "Auto Expiry Alerts", "Real-time Analytics", "Role-Based Access", "Audit Trail"].map((f) => (
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
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.12}>
            {[
              { icon: "fa-users", title: "Member Management", desc: "Track profiles, subscriptions, health records, and attendance — all in one view." },
              { icon: "fa-money-bill-transfer", title: "Manual Payment Tracking", desc: "Track cash, bank transfers, and mobile money collections in one clear dashboard." },
              { icon: "fa-chart-line", title: "Financial Analytics", desc: "Monitor MRR, churn rate, overdue payments, and monthly revenue trends." },
              { icon: "fa-bell", title: "Expiry Alerts", desc: "Automated notifications before memberships expire — no more lost renewals." },
              { icon: "fa-calendar", title: "Class Booking", desc: "Let members book HIIT, Yoga, CrossFit sessions. Track attendance instantly." },
              { icon: "fa-shield", title: "Audit Trail", desc: "Immutable log of all changes to prevent staff maladministration." },
            ].map((feat, i) => (
              <StaggerItem key={feat.title} direction={i % 2 === 0 ? "left" : "right"}>
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

      {/* Reviews / Testimonials */}
      <section id="reviews" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-widest">Testimonials</span>
            <h2 className="font-display text-4xl font-bold text-text-primary mt-2">
              Loved by gym owners everywhere
            </h2>
            <p className="text-text-secondary mt-3 max-w-lg mx-auto text-sm">
              See what fitness professionals are saying about FitSync.
            </p>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" stagger={0.15}>
            {[
              {
                name: "Marcus Johnson",
                role: "Owner, Peak Fitness",
                avatar: "MJ",
                rating: 5,
                text: "FitSync completely transformed how we run our gym. Payment tracking alone saved us hours every week. The dashboard is incredibly intuitive.",
              },
              {
                name: "Sarah Chen",
                role: "Manager, Elevate Gym",
                avatar: "SC",
                rating: 5,
                text: "The automated expiry alerts reduced our membership churn by 25%. Members love the booking system, and our staff loves the simplicity.",
              },
              {
                name: "David Okonkwo",
                role: "Founder, Iron House",
                avatar: "DO",
                rating: 5,
                text: "We tried three other platforms before FitSync. Nothing comes close. The analytics alone are worth it — I can see exactly where revenue is going.",
              },
              {
                name: "Emily Rodriguez",
                role: "Director, FitZone Studios",
                avatar: "ER",
                rating: 4,
                text: "Onboarding was a breeze. We migrated 400+ members in a day. The role-based access keeps our staff accountable and our data secure.",
              },
              {
                name: "James Mwangi",
                role: "Owner, PowerLift Center",
                avatar: "JM",
                rating: 5,
                text: "The audit trail feature is a game-changer. I have full visibility into every action taken by my staff. No more revenue leakage.",
              },
              {
                name: "Amara Diallo",
                role: "Co-founder, Flex Academy",
                avatar: "AD",
                rating: 5,
                text: "FitSync&apos;s class booking system boosted our group class attendance by 40%. Members book on their own and we just show up to coach.",
              },
            ].map((review) => (
              <StaggerItem key={review.name}>
                <div className="card p-6 h-full flex flex-col hover:shadow-md transition-shadow">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i
                        key={i}
                        className={`fa-solid fa-star text-xs ${
                          i < review.rating ? "text-amber-400" : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-sm text-text-secondary leading-relaxed flex-1">
                    &ldquo;{review.text}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border-base">
                    <div className="w-10 h-10 rounded-full bg-brand-orange-light flex items-center justify-center text-brand-orange text-xs font-bold">
                      {review.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{review.name}</p>
                      <p className="text-xs text-text-muted">{review.role}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="py-24 bg-brand-off-white">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-4">
            <h2 className="font-display text-4xl font-bold text-text-primary">
              Choose Your Plan
            </h2>
            <p className="text-text-secondary mt-3 max-w-lg mx-auto text-sm leading-relaxed">
              Subscribe to FitSync to unlock your gym management dashboard. Pay securely with Telebirr.
            </p>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-3 gap-6 mt-12" stagger={0.15}>
            {[
              {
                name: "Monthly",
                desc: "Monthly subscription to FitSync platform",
                price: "2,500",
                cycle: "/month",
                features: ["Full Dashboard", "Up to 100 Members", "Payment Tracking", "Class Scheduling"],
                highlight: false,
              },
              {
                name: "Half-Yearly",
                desc: "6-month subscription to FitSync platform",
                price: "12,000",
                cycle: "/6 months",
                features: ["Full Dashboard", "Up to 500 Members", "Payment Tracking", "Class Scheduling", "Analytics", "Priority Support"],
                highlight: true,
              },
              {
                name: "Yearly",
                desc: "Annual subscription to FitSync platform",
                price: "20,000",
                cycle: "/year",
                features: ["Full Dashboard", "Unlimited Members", "Payment Tracking", "Class Scheduling", "Advanced Analytics", "Priority Support", "Custom Branding"],
                highlight: false,
              },
            ].map((plan, i) => (
              <StaggerItem key={plan.name} className="flex" direction={i === 0 ? "left" : i === 2 ? "right" : "up"}>
                  <div
                    className={`rounded-xl p-8 border-2 relative flex flex-col w-full ${
                      plan.highlight
                        ? "border-brand-orange bg-white shadow-lg"
                        : "border-border-base bg-white"
                    }`}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-orange text-white text-xs font-bold rounded-full tracking-wide">
                        Most Popular
                      </span>
                    )}
                    <div className="mb-6">
                      <h3 className="font-display text-xl font-bold text-text-primary">{plan.name}</h3>
                      <p className="text-xs text-text-secondary mt-1">{plan.desc}</p>
                      <div className="mt-5 flex items-baseline gap-1">
                        <span className="text-sm font-semibold text-text-secondary">ETB</span>
                        <span className="font-display text-4xl font-bold text-text-primary">{plan.price}</span>
                        <span className="text-text-secondary text-sm">{plan.cycle}</span>
                      </div>
                    </div>
                    <div className="border-t border-border-base pt-5 mb-8 flex-1">
                      <ul className="space-y-3">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2.5 text-sm text-text-primary">
                            <i className="fa-solid fa-check text-brand-orange text-xs" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <CTAButton
                      href="/login"
                      className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold transition-all ${
                        plan.highlight
                          ? "bg-brand-orange text-white hover:bg-brand-orange-dark"
                          : "border border-border-base text-text-primary hover:bg-brand-off-white"
                      }`}
                    >
                      <i className="fa-solid fa-mobile-screen text-xs" />
                     Get Started
                    </CTAButton>
                  </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white border-t border-border-base">
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-widest">Questions & Answers</span>
            <h2 className="font-display text-3xl font-bold text-text-primary mt-2">Frequently Asked Questions</h2>
          </FadeIn>
          <div className="space-y-4">
            {[
              { q: "Can I track offline payments?", a: "Yes, FitSync allows you to manually record and track cash, bank transfers, and mobile money collections in a unified dashboard." },
              { q: "Does it handle staff management?", a: "Absolutely. You can assign specific roles and permissions to your staff, ensuring they only access the data relevant to their job." },
              { q: "Is the financial data secure?", a: "Yes. Every record includes an immutable audit log, making it easy to track changes and prevent errors or malpractice." },
              { q: "Can members book sessions directly?", a: "Yes, our class booking feature allows members to book slots for sessions like HIIT, Yoga, and CrossFit instantly." },
              { q: "What about membership renewals?", a: "FitSync automatically identifies expiring memberships and provides clear alerts, so you never miss a renewal conversation." },
            ].map((faq, i) => (
              <div key={i} className="card p-6 hover:shadow-sm transition-all border-[#E5E5E5] group">
                <h3 className="font-display font-semibold text-text-primary mb-2 flex items-center justify-between">
                  {faq.q}
                  <i className="fa-solid fa-plus text-brand-orange text-xs opacity-50 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer id="contact" className="bg-text-primary text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

            <FadeIn direction="left" className="md:col-span-2">
              <Link href="/" className="flex items-center mb-6">
                <img 
                  src="/logo.png" 
                  alt="FitSync Logo" 
                  className="h-10 md:h-12 w-auto object-contain brightness-0 invert opacity-90 transition-all hover:opacity-100" 
                />
              </Link>
              <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-6">
                The leading gym management platform.
                We simplify operations so you can focus on building a healthier community.
              </p>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <i className="fa-solid fa-envelope text-sm" />
                <a href="mailto:admin@fitsync.io" className="text-sm">admin@fitsync.io</a>
              </div>
              <p className="text-[10px] text-gray-600 mt-4 uppercase tracking-widest">
                ALU Foundations Project by Team FitSync
              </p>
            </FadeIn>

            <FadeIn direction="up" delay={0.1}>
              <h4 className="text-sm font-semibold text-gray-400 mb-6 uppercase tracking-wider">Product</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-brand-orange transition-colors">Features</a></li>
                <li><a href="#reviews" className="hover:text-brand-orange transition-colors">Reviews</a></li>
                <li><a href="#plans" className="hover:text-brand-orange transition-colors">Pricing</a></li>
                <li><Link href="/login" className="hover:text-brand-orange transition-colors">Sign In</Link></li>
              </ul>
            </FadeIn>

            <FadeIn direction="right" delay={0.2}>
              <h4 className="text-sm font-semibold text-gray-400 mb-6 uppercase tracking-wider">Company</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><a href="#" className="hover:text-brand-orange transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Careers</a></li>
              </ul>
            </FadeIn>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-end gap-6">
            <p className="text-[10px] text-gray-600 mr-auto">&copy; 2026 FitSync Platform</p>
            <a href="#" className="text-xs text-gray-500 hover:text-gray-300">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-500 hover:text-gray-300">Terms of Service</a>
          </div>
        </div>
      </footer>
      <CalendlyBadge />
    </div>
  );
}
