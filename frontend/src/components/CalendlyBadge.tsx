"use client";

import Script from "next/script";
import { useEffect } from "react";

export default function CalendlyBadge() {
  useEffect(() => {
    // Re-initialize if component remounts
    if (typeof window !== "undefined" && (window as any).Calendly) {
      (window as any).Calendly.initBadgeWidget({
        url: 'https://calendly.com/y-dejene-alustudent/30min',
        text: 'Book a Demo',
        color: '#F15A24',
        textColor: '#ffffff',
        branding: false
      });
    }
  }, []);

  return (
    <>
      <link
        href="https://assets.calendly.com/assets/external/widget.css"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: `
        .calendly-badge-widget {
          right: 30px !important;
          bottom: 30px !important;
          box-shadow: 0 10px 25px -5px rgba(241, 90, 36, 0.4) !important;
          transition: transform 0.3s ease !important;
        }
        .calendly-badge-widget:hover {
          transform: translateY(-5px) !important;
        }
      `}} />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          (window as any).Calendly.initBadgeWidget({
            url: 'https://calendly.com/y-dejene-alustudent/30min',
            text: 'Book a Demo',
            color: '#F15A24',
            textColor: '#ffffff',
            branding: false
          });
        }}
      />
    </>
  );
}
