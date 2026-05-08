// Lightweight client-side persistence for MVP (no backend yet).
import { useEffect, useState } from "react";

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(safeGet<T>(key, initial));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated] as const;
}

export interface Portfolio {
  fullName: string;
  age: string;
  country: string;
  nationality: string;
  email: string;
  education: string;
  workExperience: string;
  volunteerExperience: string;
  leadership: string;
  awards: string;
  languages: string;
  skills: string;
  interests: string;
  socialImpact: string;
  internationalExperience: string;
  motivation: string;
  challenges: string;
  causes: string;
  goals: string;
}

export const emptyPortfolio: Portfolio = {
  fullName: "",
  age: "",
  country: "",
  nationality: "",
  email: "",
  education: "",
  workExperience: "",
  volunteerExperience: "",
  leadership: "",
  awards: "",
  languages: "",
  skills: "",
  interests: "",
  socialImpact: "",
  internationalExperience: "",
  motivation: "",
  challenges: "",
  causes: "",
  goals: "",
};
