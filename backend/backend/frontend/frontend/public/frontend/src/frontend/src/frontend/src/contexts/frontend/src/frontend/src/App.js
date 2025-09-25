import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import {
  TrendingUp,
  Bitcoin,
  Globe,
  Settings,
  Calendar,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  Target,
  Activity,
  DollarSign,
  Lock,
  LogOut,
  User,
  Share2,
  Eye,
  Clock,
  Zap,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Video,
  ChevronDown,
  Languages
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Language Dropdown Component
const LanguageDropdown = () => {
  const { currentLanguage, changeLanguage, availableLanguages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white transition-all duration-200"
      >
        <Languages className="h-4 w-4" />
        <span className="text-sm font-medium">{currentLang?.flag}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[150px]">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                changeLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-sm ${
                currentLanguage === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Main App Content Component
const AppContent = () => {
  const { t } = useLanguage();
  
  const API = BACKEND_URL + "/api";
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  // Financial data state
  const [marketData, setMarketData] = useState({ stocks: [], cryptos: [] });
  const [marketLoading, setMarketLoading] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [marketAlerts, setMarketAlerts] = useState([]);
  const [readingList, setReadingList] = useState({ finance: [], crypto: [] });
  const [institutionalData, setInstitutionalData] = useState([]);
  const [policyUpdates, setPolicyUpdates] = useState([]);
  
  // Live streams state
  const [liveStreams, setLiveStreams] = useState([]);
  const [liveStreamsLoading, setLiveStreamsLoading] = useState(false);
  const [selectedStreamCategory, setSelectedStreamCategory] = useState("all");
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [resetEmail, setResetEmail] = useState("");
  const [recoveryStep, setRecoveryStep] = useState(1);
  
  // Admin data
  const [adminStats, setAdminStats] = useState({});
  const [newsSources, setNewsSources] = useState([]);
  const [seoStats, setSeoStats] = useState({});

  // Utility functions
  const isMarketOpen = () => {
    const now = new Date();
    const utcHours = now.getUTCHours();
    // Simplified market hours check (9:30 AM - 4:00 PM EST = 14:30 - 21:00 UTC)
    return utcHours >= 14 && utcHours < 21;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/admin/login`, loginData);
      localStorage.setItem("token", response.data.access_token);
      setIsAuthenticated(true);
      setShowLogin(false);
      setCurrentView("admin");
    } catch (error) {
      alert("Login failed. Please check your credentials and try again.");
      console.error("Login error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setCurrentView("dashboard");
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      // Simulate password reset request
      alert(`Password reset instructions sent to ${resetEmail}`);
      
      setRecoveryStep(2);
    } catch (error) {
      alert("Password reset failed. Please try again.");
      console.error("Password reset error:", error);
    }
  };

  // Fetch articles with performance optimization
  const fetchArticles = async (category = null) => {
    try {
      setLoading(true);
      const url = category && category !== "all" 
        ? `${API}/articles?category=${category}&limit=20` 
        : `${API}/articles?limit=20`;
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        // Remove timeout to allow slow responses
        validateStatus: (status) => status < 500 // Accept any status < 500
      });
      setArticles(response.data);
    } catch (error) {
      console.error("Error fetching articles:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      
      // Try alternative approach if first fails
      try {
        console.log("Trying alternative fetch...");
        const fallbackResponse = await fetch(`${API}/articles?limit=10`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setArticles(fallbackData);
          console.log("Fallback fetch successful:", fallbackData.length, "articles");
          return;
        }
      } catch (fallbackError) {
        console.error("Fallback fetch also failed:", fallbackError);
      }
      
      // Set empty array only if both methods fail
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const shareArticle = async (article) => {
    const url = `${window.location.origin}/article/${article.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: url
        });
      } catch (error) {
        console.log("Share cancelled or failed:", error);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Article link copied to clipboard!");
    }
  };

  // Fetch SEO stats
  const fetchSeoStats = async () => {
    try {
      const response = await axios.get(`${API}/seo-stats`);
      setSeoStats(response.data);
    } catch (error) {
      console.error("Error fetching SEO stats:", error);
    }
  };

  const fetchMarketData = async () => {
    try {
      setMarketLoading(true);
      const response = await axios.get(`${API}/market-data`);
      setMarketData(response.data);
    } catch (error) {
      console.error("Error fetching market data:", error);
    } finally {
      setMarketLoading(false);
    }
  };

  const fetchTrendingTopics = async () => {
    // Simulated trending topics
    setTrendingTopics([
      { topic: "Bitcoin ETF", volume: 12500 },
      { topic: "Federal Reserve", volume: 8900 },
      { topic: "Ethereum Upgrade", volume: 7200 },
      { topic: "Market Volatility", volume: 6800 },
      { topic: "Crypto Regulation", volume: 5400 }
    ]);
  };

  const fetchMarketAlerts = async () => {
    // Simulated market alerts
    setMarketAlerts([
      { 
        id: 1, 
        type: "price", 
        title: "Bitcoin reaches $45,000", 
        message: "BTC hits resistance level",
        timestamp: new Date(Date.now() - 300000),
        severity: "medium"
      },
      { 
        id: 2, 
        type: "volume", 
        title: "High trading volume on ETH", 
        message: "Ethereum sees 200% volume increase",
        timestamp: new Date(Date.now() - 600000),
        severity: "high"
      }
    ]);
  };

  const fetchReadingList = async () => {
    // Simulated reading recommendations
    setReadingList({
      finance: [
        "Understanding Market Cycles",
        "Federal Reserve Policy Impact",
        "Investment Strategy Guide"
      ],
      crypto: [
        "DeFi Protocols Explained",
        "Blockchain Technology Basics",
        "Crypto Market Analysis"
      ]
    });
  };

  const fetchInstitutionalData = async () => {
    // Simulated institutional holdings
    setInstitutionalData([
      { institution: "BlackRock", asset: "BTC", amount: 28450, change: 2.3 },
      { institution: "Grayscale", asset: "ETH", amount: 15670, change: -0.8 },
      { institution: "MicroStrategy", asset: "BTC", amount: 132500, change: 0.0 },
      { institution: "Tesla", asset: "BTC", amount: 42902, change: 1.2 }
    ]);
  };

  const fetchPolicyUpdates = async () => {
    // Simulated policy updates
    setPolicyUpdates([
      {
        id: "1",
        title: "EU Digital Asset Regulation",
        country: "European Union",
        impact: "High",
        date: "2024-01-15",
        status: "Proposed"
      },
      {
        id: "2", 
        title: "US Bitcoin ETF Approval",
        country: "United States",
        impact: "Very High",
        date: "2024-01-10", 
        status: "Approved"
      }
    ]);
  };

  // Adaptive loading based on connection speed
  const isSlowConnection = () => {
    return navigator.connection && (
      navigator.connection.effectiveType === 'slow-2g' ||
      navigator.connection.effectiveType === '2g' ||
      navigator.connection.saveData
    );
  };
  
  const fetchLiveStreams = async (category = "all") => {
    try {
      setLiveStreamsLoading(true);
      const params = category !== "all" ? { category } : {};
      
      // Try axios first
      try {
        const response = await axios.get(`${API}/live-streams`, { params });
        setLiveStreams(response.data);
      } catch (axiosError) {
        // Fallback to fetch if axios fails
        const fallbackUrl = `${API}/live-streams${category !== "all" ? `?category=${category}` : ""}`;
        const fallbackResponse = await fetch(fallbackUrl);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setLiveStreams(fallbackData);
        }
      }
    } catch (error) {
      console.error("Error fetching live streams:", error);
    } finally {
      setLiveStreamsLoading(false);
    }
  };

  // Optimized data fetching - load critical data first, then secondary data
  useEffect(() => {
    // Load critical data immediately
    const loadCriticalData = async () => {
      try {
        // Load only essential data first for fast initial render
        await fetchMarketData();
        await fetchArticles();
      } catch (error) {
        console.error("Error loading critical data:", error);
      }
    };
    
    // Load secondary data after a delay to improve performance
    const loadSecondaryData = async () => {
      try {
        setTimeout(() => fetchTrendingTopics(), 1000);
        setTimeout(() => fetchMarketAlerts(), 1500);
        setTimeout(() => fetchReadingList(), 2000);
        setTimeout(() => fetchInstitutionalData(), 2500);
        setTimeout(() => fetchPolicyUpdates(), 3000);
        setTimeout(() => fetchLiveStreams(), 3500);
      } catch (error) {
        console.error("Error loading secondary data:", error);
      }
    };
    
    loadCriticalData();
    loadSecondaryData();
    
    // Reduced interval frequency to improve performance
    const marketInterval = setInterval(fetchMarketData, 60000); // Every 1 minute instead of 30s
    const topicsInterval = setInterval(fetchTrendingTopics, 600000); // Every 10 minutes
    const alertsInterval = setInterval(fetchMarketAlerts, 120000); // Every 2 minutes
    
    // Keep-alive ping (less frequent)
    const keepAliveInterval = setInterval(async () => {
      try {
        await axios.get(`${API}/`);
        console.log('Keep-alive ping sent');
      } catch (error) {
        console.log('Keep-alive ping failed:', error.message);
      }
    }, 300000); // Every 5 minutes instead of 4
    
    return () => {
      clearInterval(marketInterval);
      clearInterval(topicsInterval);
      clearInterval(alertsInterval);
      clearInterval(keepAliveInterval);
    };
  }, []);

  useEffect(() => {
    // Only fetch articles when category changes or view changes
    fetchArticles(selectedCategory);
    
    if (currentView === "admin") {
      fetchAdminStats();
      fetchNewsSources();
    }
    
    // Only fetch SEO stats on first load (not on every view change)
    if (currentView === "dashboard") {
      fetchSeoStats();
    }
  }, [currentView, selectedCategory]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminStats(response.data);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const fetchNewsSources = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/news-sources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewsSources(response.data);
    } catch (error) {
      console.error("Error fetching news sources:", error);
    }
  };

  const triggerArticleGeneration = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/admin/generate-now`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Article generation triggered successfully!");
      setTimeout(fetchAdminStats, 2000);
    } catch (error) {
      console.error("Error triggering article generation:", error);
      alert("Failed to trigger article generation");
    }
  };

  const Header = () => {
    const isMarketOpenNow = isMarketOpen();

    return (
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-purple-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  {t('title')}
                </h1>
                <div className="flex items-center space-x-2">
                  <p className="text-blue-200 text-xs">{t('subtitle')}</p>
                  <div className={isMarketOpenNow ? "market-open" : "market-closed"}>
                    {isMarketOpenNow ? "MARKET OPEN" : t('marketClosed')}
                  </div>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 hover-lift ${
                  currentView === "dashboard"
                    ? "bg-white/20 text-white shadow-lg"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium text-sm">{t('dashboard')}</span>
              </button>

              <button
                onClick={() => setCurrentView("live-now")}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 hover-lift ${
                  currentView === "live-now"
                    ? "bg-white/20 text-white shadow-lg"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Video className="h-4 w-4" />
                <span className="font-medium text-sm">{t('liveNow')}</span>
              </button>

              <button
                onClick={() => setCurrentView("smart-money")}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 hover-lift ${
                  currentView === "smart-money"
                    ? "bg-white/20 text-white shadow-lg"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Target className="h-4 w-4" />
                <span className="font-medium text-sm">{t('smartMoney')}</span>
              </button>

              <button
                onClick={() => setCurrentView("about")}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 hover-lift ${
                  currentView === "about"
                    ? "bg-white/20 text-white shadow-lg"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <User className="h-4 w-4" />
                <span className="font-medium text-sm">{t('about')}</span>
              </button>

              <button
                onClick={() => setCurrentView("policies")}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 hover-lift ${
                  currentView === "policies"
                    ? "bg-white/20 text-white shadow-lg"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Globe className="h-4 w-4" />
                <span className="font-medium text-sm">{t('policies')}</span>
              </button>

              <button
                onClick={() => setCurrentView("privacy")}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 hover-lift ${
                  currentView === "privacy"
                    ? "bg-white/20 text-white shadow-lg"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Lock className="h-4 w-4" />
                <span className="font-medium text-sm">{t('privacy')}</span>
              </button>

              {!isAuthenticated ? (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white transition-all duration-200 hover-lift"
                >
                  <Settings className="h-4 w-4" />
                  <span className="font-medium text-sm">{t('admin')}</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentView("admin")}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 hover-lift ${
                    currentView === "admin"
                      ? "bg-white/20 text-white shadow-lg"
                      : "text-blue-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span className="font-medium text-sm">{t('admin')}</span>
                </button>
              )}

              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-red-200 hover:bg-red-500/20 hover:text-white transition-all duration-200 hover-lift"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              )}
              
              <LanguageDropdown />
            </nav>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-blue-200">
            <div className="flex items-center space-x-6">
              <span className="flex items-center">
                <Activity className="h-3 w-3 mr-1" />
                {t('financialDataUpdates')}
              </span>
              <span className="flex items-center">
                <Zap className="h-3 w-3 mr-1" />
                {t('aiNewsEvery')}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span>{seoStats.total_articles || 0} articles</span>
              <span>{seoStats.articles_today || 0} today</span>
            </div>
          </div>
        </div>
      </header>
    );
  };

  // Live Now View
  const LiveNowView = () => (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 title-gradient">{t('liveFinancialStreams')}</h2>
        <p className="text-gray-600">{t('liveDescription')}</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "finance", "crypto", "economics"].map((category) => (
          <button
            key={category}
            onClick={() => {
              setSelectedStreamCategory(category);
              fetchLiveStreams(category);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedStreamCategory === category
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
            {category !== "all" && (
              <span className="ml-1 text-xs">
                {liveStreams.filter(s => s.category === category).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {liveStreamsLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Loading live streams...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {liveStreams.map((stream) => (
            <div key={stream.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover-lift">
              {/* Video Thumbnail with Link */}
              <div className="aspect-video bg-gradient-to-br from-blue-900 to-purple-900 relative cursor-pointer hover:opacity-95 transition-opacity"
                   onClick={() => window.open(stream.embed_url, '_blank')}>
                {stream.thumbnail_url && (
                  <img
                    src={stream.thumbnail_url}
                    alt={stream.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-all">
                  <div className="bg-white bg-opacity-90 rounded-full p-3 hover:bg-opacity-100 transition-all">
                    <ArrowUpRight className="h-6 w-6 text-gray-800" />
                  </div>
                </div>
                
                {/* Live indicator */}
                <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                  {t('live')}
                </div>
                
                {/* Category badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    stream.category === 'crypto' 
                      ? 'bg-orange-500 text-white' 
                      : stream.category === 'finance'
                      ? 'bg-blue-500 text-white'
                      : 'bg-purple-500 text-white'
                  }`}>
                    {stream.category.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Stream Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight">
                    {stream.title}
                  </h3>
                </div>
                
                <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                  {stream.description}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{stream.source_name}</span>
                    {stream.viewers_count && (
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {stream.viewers_count.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(stream.started_at), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Visit Site Button */}
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => window.open(stream.embed_url, '_blank')}
                    className="flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:from-blue-600 hover:to-purple-700 transition-all hover-lift"
                  >
                    <span>Visita Sito</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                  
                  {/* Tags */}
                  {stream.tags && stream.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {stream.tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {liveStreams.length === 0 && !liveStreamsLoading && (
        <div className="text-center py-12">
          <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noLiveStreams')}</h3>
          <p className="text-gray-600">
            {selectedStreamCategory === "all" 
              ? t('noStreamsDescription')
              : `No live ${selectedStreamCategory} streams at the moment.`
            }
          </p>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => fetchLiveStreams(selectedStreamCategory)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all hover-lift"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{t('refreshStreams')}</span>
        </button>
      </div>
    </div>
  );

  // Smart Money View
  const SmartMoneyView = () => (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 title-gradient">{t('smartMoneyTracker')}</h2>
        <p className="text-gray-600">{t('smartMoneyDescription')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Institutional Holdings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Institutional Holdings
          </h3>
          <div className="space-y-4">
            {institutionalData.map((holding, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-sm">{holding.institution}</span>
                  <div className="text-xs text-gray-500">{holding.asset}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm">{holding.amount.toLocaleString()}</span>
                  <div className={`text-xs ${holding.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {holding.change >= 0 ? '+' : ''}{holding.change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Policy Updates */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Globe className="h-5 w-5 mr-2 text-purple-600" />
            Policy Updates
          </h3>
          <div className="space-y-4">
            {policyUpdates.map((policy) => (
              <div key={policy.id} className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-sm text-gray-900">{policy.title}</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{policy.country}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    policy.impact === 'Very High' ? 'bg-red-100 text-red-800' :
                    policy.impact === 'High' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {policy.impact} Impact
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Alerts */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-yellow-600" />
          Market Alerts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marketAlerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
              alert.severity === 'high' ? 'border-red-500 bg-red-50' :
              alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
              'border-green-500 bg-green-50'
            }`}>
              <h4 className="font-medium text-sm text-gray-900">{alert.title}</h4>
              <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
              <div className="text-xs text-gray-500 mt-2">
                {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // About View
  const AboutView = () => (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4 title-gradient">About CryptoAI Digest</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your ultimate destination for AI-powered financial intelligence and cryptocurrency insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
          <p className="text-gray-600 mb-6">
            CryptoAI Digest aggregates and analyzes financial news from over 50 international sources, 
            delivering real-time insights through AI-powered content generation. We provide investors, 
            traders, and financial enthusiasts with the intelligence they need to make informed decisions.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <Zap className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Real-Time Updates</h4>
                <p className="text-gray-600 text-sm">AI-generated articles every 15 minutes from global financial sources</p>
              </div>
            </div>
            <div className="flex items-start">
              <Target className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Smart Money Tracking</h4>
                <p className="text-gray-600 text-sm">Follow institutional investments and policy changes</p>
              </div>
            </div>
            <div className="flex items-start">
              <Globe className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Global Coverage</h4>
                <p className="text-gray-600 text-sm">Multi-language support and international market focus</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Founder</h3>
          <div className="mb-4">
            <h4 className="text-xl font-semibold text-gray-900">Daniele Magrini</h4>
            <p className="text-blue-600 font-medium">Financial Technology Innovator</p>
          </div>
          <p className="text-gray-600">
            With a passion for democratizing financial intelligence, Daniele founded CryptoAI Digest 
            to bridge the gap between complex market data and actionable insights. The platform combines 
            cutting-edge AI technology with comprehensive financial analysis to serve both novice and 
            experienced investors worldwide.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Live Market Data</h4>
            <p className="text-gray-600 text-sm">Real-time stock and cryptocurrency prices with trend analysis</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="h-8 w-8 text-purple-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Live Streams</h4>
            <p className="text-gray-600 text-sm">Direct access to financial news streams from major outlets</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Trend Analysis</h4>
            <p className="text-gray-600 text-sm">AI-powered insights on market trends and investment opportunities</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Policies View (stub)
  const PoliciesView = () => (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 title-gradient">Policy & Regulation Tracker</h2>
      <div className="space-y-6">
        {policyUpdates.map((policy) => (
          <div key={policy.id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">{policy.title}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                policy.impact === 'Very High' ? 'bg-red-100 text-red-800' :
                policy.impact === 'High' ? 'bg-orange-100 text-orange-800' :
                'bg-green-100 text-green-800'
              }`}>
                {policy.impact} Impact
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Globe className="h-4 w-4 mr-1" />
                {policy.country}
              </span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {policy.date}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                policy.status === 'Approved' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {policy.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Privacy View (stub)
  const PrivacyView = () => (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 title-gradient">Privacy Policy</h2>
      <div className="bg-white rounded-lg shadow-lg p-8 prose max-w-none">
        <p className="text-gray-600 mb-6">
          Last updated: January 2024
        </p>
        
        <h3 className="text-xl font-bold text-gray-900 mb-4">Information We Collect</h3>
        <p className="text-gray-600 mb-6">
          We collect information you provide directly to us, information we obtain automatically when you use our services, 
          and information from third-party sources in accordance with applicable law.
        </p>

        <h3 className="text-xl font-bold text-gray-900 mb-4">How We Use Information</h3>
        <p className="text-gray-600 mb-6">
          We use the information we collect to provide, maintain, and improve our services, process transactions, 
          send you technical notices and support messages, and communicate with you about products, services, and events.
        </p>

        <h3 className="text-xl font-bold text-gray-900 mb-4">Information Sharing</h3>
        <p className="text-gray-600 mb-6">
          We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
          except as described in this privacy policy or as required by law.
        </p>

        <h3 className="text-xl font-bold text-gray-900 mb-4">Contact</h3>
        <p className="text-gray-600">
          If you have questions about this privacy policy, please contact us at privacy@cryptoaidigest.com
        </p>
      </div>
    </div>
  );

  // Dashboard View (Main News Feed)
  const DashboardView = () => (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto px-4 py-6">
        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: t('allNews') },
              { key: "finance", label: t('finance') },
              { key: "crypto", label: t('cryptocurrency') }
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover-lift ${
                  selectedCategory === cat.key
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">{t('loadingNews')}</span>
          </div>
        ) : articles.length > 0 ? (
          <div className="space-y-6">
            {articles.map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden article-card"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          article.category === 'finance' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {article.category}
                        </span>
                        {article.source_name && (
                          <span className="text-xs text-gray-500">
                            {article.source_name}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                        {article.title}
                      </h2>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {article.summary}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {article.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedArticle(article)}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all hover-lift"
                        >
                          {t('read')}
                          <ArrowUpRight className="ml-1 h-4 w-4" />
                        </button>
                        <button
                          onClick={() => shareArticle(article)}
                          className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          {t('share')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">Check back later for the latest financial news and insights.</p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg p-6 space-y-6 overflow-y-auto">
        {/* Market Data */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Live Market
          </h3>
          {marketLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {marketData.stocks?.slice(0, 5).map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-sm">{stock.symbol}</span>
                    <div className="text-xs text-gray-500">{stock.name}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm">${stock.price}</span>
                    <div className={`text-xs flex items-center ${
                      stock.change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stock.change_percentage_24h >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {Math.abs(stock.change_percentage_24h).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crypto Data */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Bitcoin className="h-5 w-5 mr-2 text-orange-500" />
            Top Crypto
          </h3>
          <div className="space-y-3">
            {marketData.cryptos?.slice(0, 5).map((crypto) => (
              <div key={crypto.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-sm">{crypto.symbol}</span>
                  <div className="text-xs text-gray-500">{crypto.name}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm">${crypto.price.toLocaleString()}</span>
                  <div className={`text-xs flex items-center ${
                    crypto.change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {crypto.change_percentage_24h >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {Math.abs(crypto.change_percentage_24h).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Topics */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            Trending
          </h3>
          <div className="space-y-2">
            {trendingTopics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <span className="text-sm font-medium text-gray-900">{topic.topic}</span>
                <span className="text-xs text-gray-500">{topic.volume.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Reading */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Recommended
          </h3>
          <div className="space-y-2">
            {[...readingList.finance.slice(0, 2), ...readingList.crypto.slice(0, 2)].map((item, index) => (
              <div key={index} className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-900">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Admin View
  const AdminView = () => (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 title-gradient">Admin Dashboard</h2>
        <p className="text-gray-600">Manage your CryptoAI Digest platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Articles</p>
              <p className="text-2xl font-bold text-gray-900">{adminStats.total_articles || 0}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Sources</p>
              <p className="text-2xl font-bold text-gray-900">{adminStats.active_sources || 0}</p>
            </div>
            <Globe className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Sources</p>
              <p className="text-2xl font-bold text-gray-900">{adminStats.total_sources || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Articles Today</p>
              <p className="text-2xl font-bold text-gray-900">{seoStats.articles_today || 0}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-4">
            <button
              onClick={triggerArticleGeneration}
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <Zap className="h-4 w-4 mr-2" />
              Generate Articles Now
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Dashboard
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Articles</h3>
          <div className="space-y-3">
            {adminStats.recent_articles?.slice(0, 5).map((article, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{article.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Article Modal
  const ArticleModal = ({ article, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  article.category === 'finance' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {article.category}
                </span>
                {article.source_name && (
                  <span className="text-xs text-gray-500">{article.source_name}</span>
                )}
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{article.title}</h1>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 mb-6">{article.summary}</p>
            <div className="text-gray-600 whitespace-pre-line">{article.content}</div>
          </div>
          
          {article.source_attribution && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{article.source_attribution}</p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 mt-6">
            {article.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {currentView === "dashboard" && <DashboardView />}
      {currentView === "live-now" && <LiveNowView />}
      {currentView === "smart-money" && <SmartMoneyView />}
      {currentView === "policies" && <PoliciesView />}
      {currentView === "about" && <AboutView />}
      {currentView === "privacy" && <PrivacyView />}
      {currentView === "admin" && <AdminView />}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h3 className="text-2xl font-bold mb-4 title-gradient">{t('title')}</h3>
              <p className="text-gray-400 mb-4 max-w-md">
                {t('subtitle')}. Get real-time market insights, AI-powered analysis, and stay ahead of financial trends.
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <Activity className="h-4 w-4 mr-1" />
                  {t('liveUpdated')}
                </span>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">{t('quickLinks')}</h4>
              <div className="space-y-2">
                <button 
                  onClick={() => setCurrentView("live-now")}
                  className="block text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t('liveNow')}
                </button>
                <button 
                  onClick={() => setCurrentView("smart-money")}
                  className="block text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t('smartMoneyTracker')}
                </button>
                <button 
                  onClick={() => setCurrentView("policies")}
                  className="block text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t('policyUpdates')}
                </button>
                <button 
                  onClick={() => setCurrentView("about")}
                  className="block text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t('about')}
                </button>
                <button 
                  onClick={() => setCurrentView("privacy")}
                  className="block text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t('privacy')}
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">{t('contact')}</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>{t('generalInquiries')}</p>
                <a href="mailto:info@cryptoaidigest.com" className="hover:text-white transition-colors">
                  info@cryptoaidigest.com
                </a>
                <p className="mt-4">{t('updates')}:</p>
                <a href="mailto:news@cryptoaidigest.com" className="hover:text-white transition-colors">
                  news@cryptoaidigest.com
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 CryptoAI Digest. All rights reserved. | Founded by Daniele Magrini
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Login</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Forgot Password?
                </button>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowLogin(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Login
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Recovery</h2>
            
            {recoveryStep === 1 && (
              <form onSubmit={handlePasswordReset}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordReset(false);
                      setShowLogin(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Back to Login
                  </button>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswordReset(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </div>
              </form>
            )}
            
            {recoveryStep === 2 && (
              <div>
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">
                    Password reset instructions have been sent to info@cryptoaidigest.com. 
                    Please check your email and follow the instructions.
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowPasswordReset(false);
                      setRecoveryStep(1);
                      setResetEmail("");
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Article Modal */}
      {selectedArticle && (
        <ArticleModal 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
        />
      )}
    </div>
  );
};

// Main App wrapper with Language Provider
function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
