"use client";

import { useEffect, useState, useRef } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

const languages = [
  { code: "en", label: "English" },
  { code: "am", label: "አማርኛ" },
];

export default function GoogleTranslate() {
  const [currentLang, setCurrentLang] = useState("en");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Google Translate script
    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
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

    // Check if a language was previously selected
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("googtrans="));
    if (cookie) {
      const lang = cookie.split("/").pop();
      if (lang && lang !== "en") setCurrentLang(lang);
    }
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