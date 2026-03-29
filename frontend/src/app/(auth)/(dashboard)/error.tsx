"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Dashboard Error Boundary Caught:", error);
  }, [error]);

  const isForbidden = error.message === "FORBIDDEN";
  const isUnauthorized = error.message === "UNAUTHORIZED";

  if (isForbidden || isUnauthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 font-sans">
        <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-orange-100">
          <i className="fa-solid fa-lock text-4xl text-[#F15A24]" />
        </div>

        <h1 className="font-[family-name:var(--font-barlow)] text-3xl font-bold text-[#1A1A1A] mb-3">
          Access Denied
        </h1>

        <p className="text-[#6B6B6B] max-w-sm mb-2 leading-relaxed">
          You don&apos;t have permission to view this page.
        </p>
        <p className="text-sm text-[#9CA3AF] max-w-sm mb-8">
          {isUnauthorized
            ? "Please sign in to continue."
            : "Contact your administrator if you think this is a mistake."}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {isUnauthorized ? (
            <Link href="/login" className="btn-primary flex items-center gap-2 px-8 py-3">
              <i className="fa-solid fa-arrow-right-to-bracket text-xs" />
              Sign In
            </Link>
          ) : (
            <Link href="/insights" className="btn-primary flex items-center gap-2 px-8 py-3">
              <i className="fa-solid fa-house text-xs" />
              Go to Dashboard
            </Link>
          )}
          <a
            href="https://t.me/Niyoll" target="_blank" rel="noopener noreferrer"
            className="text-sm font-semibold text-[#1A1A1A] hover:text-[#F15A24] transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 font-sans">
      <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-red-100">
        <i className="fa-solid fa-triangle-exclamation text-3xl" />
      </div>

      <h1 className="font-[family-name:var(--font-barlow)] text-3xl font-bold text-[#1A1A1A] mb-3">
        Something went wrong
      </h1>

      <p className="text-[#6B6B6B] max-w-md mb-8 leading-relaxed">
        {error.message.includes("Internal server error")
          ? "The server encountered an error while loading your dashboard stats. Please try again or contact support."
          : "We encountered an unexpected error while preparing your dashboard data. Our team has been notified."}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => reset()}
          className="btn-primary flex items-center gap-2 px-8 py-3"
        >
          <i className="fa-solid fa-rotate-right" />
          Try Again
        </button>

        <Link
          href="/"
          className="text-sm font-semibold text-[#1A1A1A] hover:text-[#F15A24] transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
