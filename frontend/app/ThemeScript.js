'use client';

import { useEffect } from 'react';

export default function ThemeScript() {
  useEffect(() => {
    // Forzar tema claro siempre
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
    // Asegurar que el color-scheme sea solo light
    document.documentElement.style.colorScheme = 'light';
  }, []);

  return null;
}