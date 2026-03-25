import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found - FitSync',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <main
      className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-6 text-center"
      role="main"
      aria-labelledby="error-title"
    >
      <div role="alert" className="max-w-2xl bg-white p-10 sm:p-16 rounded-3xl shadow-sm border border-[#E5E5E5] flex flex-col items-center">
        {/* Animated Icon Container */}
        <div
          className="w-24 h-24 bg-[#FFF0EB] rounded-full flex items-center justify-center mb-8 relative"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-[#F15A24] rounded-full opacity-20 animate-ping"></div>
          <i className="fa-solid fa-compass text-5xl text-[#F15A24] relative z-10 animate-bounce"></i>
        </div>

        <h1
          id="error-title"
          className="text-4xl sm:text-5xl font-[family-name:var(--font-display)] font-bold text-[#1A1A1A] mb-4"
        >
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] mb-6">
          Looks like you're lost, Fitsyncer!
        </h2>

        <p className="text-[#6B6B6B] mb-8 text-lg max-w-xl leading-relaxed text-center">
          While you're here, maybe take a second to learn about{" "}
          <a
            href="https://en.wikipedia.org/wiki/List_of_HTTP_status_codes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#F15A24] font-semibold hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[#F15A24] rounded-sm transition-all whitespace-nowrap"
            aria-label="Learn about HTTP status codes on Wikipedia (opens in new tab)"
          >
            HTTP status codes
          </a>.
        </p>

        <div className="w-full h-px bg-[#E5E5E5] mb-8" aria-hidden="true"></div>

        <Link
          href="/"
          className="bg-[#1A1A1A] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#F15A24] transition-all transform hover:-translate-y-1 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#F15A24]/30 flex items-center gap-3 w-full sm:w-auto justify-center group cursor-pointer"
          aria-label="Return to the FitSync homepage"
        >
          <i className="fa-solid fa-house text-sm group-hover:scale-110 transition-transform" aria-hidden="true" />
          Or just head back home
        </Link>
      </div>
    </main>
  );
}
