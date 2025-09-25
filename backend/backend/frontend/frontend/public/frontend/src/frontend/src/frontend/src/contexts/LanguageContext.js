import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translation dictionaries
const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    liveNow: "Live Now",
    smartMoney: "Smart Money",
    policies: "Policies",
    about: "About",
    admin: "Admin",
    privacy: "Privacy",
    
    // Main content
    title: "CryptoAI Digest",
    subtitle: "All Financial Intelligence in One Place",
    marketClosed: "MARKET CLOSED",
    live: "LIVE",
    financialDataUpdates: "Financial data updates every 30 seconds",
    aiNewsEvery: "AI news every 15 minutes",
    
    // Categories
    allNews: "All News",
    finance: "Finance",
    cryptocurrency: "Cryptocurrency", 
    policyUpdates: "Policy Updates",
    
    // Actions
    read: "Read",
    share: "Share",
    refresh: "Refresh",
    loading: "Loading",
    loadingNews: "Loading latest financial news...",
    
    // Live Now
    liveFinancialStreams: "📡 Live Financial Streams",
    liveDescription: "Watch live financial news, market analysis, and crypto events as they happen",
    noLiveStreams: "No Live Streams",
    noStreamsDescription: "No live financial streams are currently available. Check back soon!",
    refreshStreams: "Refresh Streams",
    
    // Smart Money
    smartMoneyTracker: "Smart Money Tracker",
    smartMoneyDescription: "Follow the moves of major investment funds, hedge funds, and institutional investors",
    
    // Footer
    quickLinks: "Quick Links",
    contact: "Contact",
    generalInquiries: "General Inquiries:",
    updates: "Updates:",
    liveUpdated: "Live • Updated every 15 minutes",
    
    // Language
    language: "Language",
    english: "English",
    spanish: "Spanish", 
    italian: "Italian"
  },
  
  es: {
    // Navigation
    dashboard: "Panel",
    liveNow: "En Vivo",
    smartMoney: "Dinero Inteligente",
    policies: "Políticas",
    about: "Acerca de",
    admin: "Admin",
    privacy: "Privacidad",
    
    // Main content
    title: "CryptoAI Digest",
    subtitle: "Toda la Inteligencia Financiera en Un Lugar",
    marketClosed: "MERCADO CERRADO",
    live: "EN VIVO",
    financialDataUpdates: "Datos financieros actualizados cada 30 segundos",
    aiNewsEvery: "Noticias IA cada 15 minutos",
    
    // Categories
    allNews: "Todas las Noticias",
    finance: "Finanzas",
    cryptocurrency: "Criptomonedas",
    policyUpdates: "Actualizaciones de Políticas",
    
    // Actions
    read: "Leer",
    share: "Compartir",
    refresh: "Actualizar",
    loading: "Cargando",
    loadingNews: "Cargando las últimas noticias financieras...",
    
    // Live Now
    liveFinancialStreams: "📡 Transmisiones Financieras en Vivo",
    liveDescription: "Ve noticias financieras en vivo, análisis de mercado y eventos crypto mientras suceden",
    noLiveStreams: "Sin Transmisiones en Vivo",
    noStreamsDescription: "No hay transmisiones financieras en vivo disponibles. ¡Vuelve pronto!",
    refreshStreams: "Actualizar Transmisiones",
    
    // Smart Money
    smartMoneyTracker: "Rastreador de Dinero Inteligente",
    smartMoneyDescription: "Sigue los movimientos de fondos de inversión, hedge funds e inversores institucionales",
    
    // Footer
    quickLinks: "Enlaces Rápidos",
    contact: "Contacto",
    generalInquiries: "Consultas Generales:",
    updates: "Actualizaciones:",
    liveUpdated: "En Vivo • Actualizado cada 15 minutos",
    
    // Language
    language: "Idioma",
    english: "Inglés",
    spanish: "Español",
    italian: "Italiano"
  },
  
  it: {
    // Navigation
    dashboard: "Dashboard",
    liveNow: "Live Ora",
    smartMoney: "Smart Money",
    policies: "Politiche", 
    about: "Chi Siamo",
    admin: "Admin",
    privacy: "Privacy",
    
    // Main content
    title: "CryptoAI Digest",
    subtitle: "Tutta l'Intelligenza Finanziaria in Un Posto",
    marketClosed: "MERCATO CHIUSO",
    live: "LIVE",
    financialDataUpdates: "Dati finanziari aggiornati ogni 30 secondi",
    aiNewsEvery: "Notizie AI ogni 15 minuti",
    
    // Categories
    allNews: "Tutte le Notizie",
    finance: "Finanza",
    cryptocurrency: "Criptovalute",
    policyUpdates: "Aggiornamenti Politiche",
    
    // Actions
    read: "Leggi",
    share: "Condividi",
    refresh: "Aggiorna",
    loading: "Caricamento",
    loadingNews: "Caricamento ultime notizie finanziarie...",
    
    // Live Now
    liveFinancialStreams: "📡 Streaming Finanziari Live",
    liveDescription: "Guarda notizie finanziarie live, analisi di mercato ed eventi crypto mentre accadono",
    noLiveStreams: "Nessuno Streaming Live",
    noStreamsDescription: "Nessuno streaming finanziario live disponibile al momento. Torna presto!",
    refreshStreams: "Aggiorna Streaming",
    
    // Smart Money
    smartMoneyTracker: "Tracker Smart Money",
    smartMoneyDescription: "Segui le mosse di fondi di investimento, hedge fund e investitori istituzionali",
    
    // Footer
    quickLinks: "Link Rapidi",
    contact: "Contatti",
    generalInquiries: "Richieste Generali:",
    updates: "Aggiornamenti:",
    liveUpdated: "Live • Aggiornato ogni 15 minuti",
    
    // Language
    language: "Lingua",
    english: "Inglese",
    spanish: "Spagnolo",
    italian: "Italiano"
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('preferred-language') || 'en';
  });

  const changeLanguage = (langCode) => {
    setCurrentLanguage(langCode);
    localStorage.setItem('preferred-language', langCode);
  };

  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    availableLanguages: [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' }
    ]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
