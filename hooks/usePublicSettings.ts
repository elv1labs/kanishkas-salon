"use client";

import { useState, useEffect } from "react";

export type PublicSettings = {
  salonName?: string;
  phone?: string;
  whatsappNumber?: string;
  address?: string;
  email?: string;
};

export function usePublicSettings() {
  const [settings, setSettings] = useState<PublicSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/public")
      .then(r => r.json())
      .then(data => {
        setSettings(data.settings ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { settings, loading };
}