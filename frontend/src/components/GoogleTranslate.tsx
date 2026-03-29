"use client";

import { useEffect, useState, useRef } from "react";

interface TranslateElementOptions {
  pageLanguage: string;
  includedLanguages: string;
  autoDisplay: boolean;
}

interface TranslateWindow {
  translate: {
    TranslateElement: new (options: TranslateElementOptions, elementId: string) => unknown;
  };
}

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: TranslateWindow;
  }
}

const languages = [
  { code: "en", label: "English" },
  { code: "am", label: "አማርኛ" },
];

export default function GoogleTranslate() {
  const [mounted, setMounted] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    // Read initial language from cookie
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("googtrans="));
    const lang = cookie?.split("/").pop();
    if (lang && lang !== "en") {
      setCurrentLang(lang);
    }

    // Load Google Translate script
    // Load Google Translate script
    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
      if (!window.google) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "am,en",
          autoDisplay: false,
        },
        "google_translate_hidden"
      );
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

  }, []);

    // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchLanguage(langCode: string) {
    setCurrentLang(langCode);
    setOpen(false);

    // Trigger Google Translate
    const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event("change"));
    }
  }

  const current = languages.find((l) => l.code === currentLang) || languages[0];

    return (
    <div ref={dropdownRef} className="relative">
      {/* Hidden Google Translate widget */}
      <div id="google_translate_hidden" style={{ display: "none" }} />

      {/* Custom dropdown button */}
      <button
        onClick={() => setOpen(!open)}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Switch language. Current language: ${current.label}`}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-white hover:border-[#F15A24] text-sm font-medium transition-all cursor-pointer"
      >
        <span className="text-[#1A1A1A]">{current.label}</span>
        <i className={`fa-solid fa-chevron-down text-[9px] text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div role="listbox" className="absolute right-0 mt-2 w-40 bg-white border border-[#E5E5E5] rounded-xl shadow-lg overflow-hidden z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => switchLanguage(lang.code)}
              aria-label={`Switch language to ${lang.label}`}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                currentLang === lang.code
                  ? "bg-[#FFF0EB] text-[#F15A24] font-semibold"
                  : "text-[#1A1A1A] hover:bg-[#F9FAFB]"
              }`}
            >
              <span>{lang.label}</span>
              {currentLang === lang.code && (
                <i className="fa-solid fa-check text-[#F15A24] text-xs ml-auto" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
