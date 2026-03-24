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