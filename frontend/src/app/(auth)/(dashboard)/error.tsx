"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Dashboard Error Boundary Caught:", error);
  }, [error]);

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

      {process.env.NODE_ENV === "development" && (
        <div className="mt-12 p-4 bg-gray-50 rounded-xl border border-gray-200 text-left max-w-2xl overflow-auto">
          <p className="text-xs font-mono text-gray-500 mb-2 uppercase tracking-widest">Debug Info</p>
          <pre className="text-xs text-red-600 font-mono whitespace-pre-wrap">
            {error.stack || error.message}
          </pre>
        </div>
      )}
    </div>
  );
}
