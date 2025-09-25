from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import uuid
import asyncio
import threading
import time
import schedule
import logging
import requests
from bs4 import BeautifulSoup
import jwt
from passlib.context import CryptContext
import json
import random

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="CryptoAI Digest API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = "HS256"

# Database connection
MONGO_URL = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client.crypto_news

# Pydantic Models
class Article(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    summary: str
    category: str
    tags: List[str] = []
    seo_keywords: List[str] = []
    published_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source_name: Optional[str] = None
    source_attribution: Optional[str] = None
    ai_generated: bool = True

class NewsSource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    url: str
    category: str
    is_active: bool = True
    last_scraped: Optional[datetime] = None
    
class MarketData(BaseModel):
    symbol: str
    name: str
    price: float
    change_24h: float
    change_percentage_24h: float
    market_cap: Optional[float] = None
    volume_24h: Optional[float] = None
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InstitutionalHolding(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    institution_name: str
    asset_symbol: str
    asset_name: str
    holding_amount: float
    holding_value_usd: float
    percentage_of_portfolio: float
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    change_amount: Optional[float] = None
    change_percentage: Optional[float] = None

class PolicyUpdate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    country: str
    region: str
    category: str  # "regulation", "taxation", "legal", "central_bank"
    impact_level: str  # "high", "medium", "low"
    date_announced: datetime
    effective_date: Optional[datetime] = None
    source_url: Optional[str] = None
    tags: List[str] = []

class LiveStream(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    source_name: str
    embed_url: str
    thumbnail_url: Optional[str] = None
    category: str
    language: str = "en"
    is_live: bool = True
    viewers_count: Optional[int] = None
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    scheduled_for: Optional[datetime] = None
    tags: List[str] = []
    region: str = "global"
    is_direct_link: bool = False

class AdminUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str

# Utility functions
def prepare_for_mongo(data):
    """Prepare data for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, dict):
                prepare_for_mongo(value)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        prepare_for_mongo(item)
    return data

def convert_mongo_doc(doc):
    """Convert MongoDB document to dict"""
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    # Recursively convert nested documents
    for key, value in doc.items():
        if isinstance(value, list):
            for item in value:
                if isinstance(item, dict) and '_id' in item:
                    item['_id'] = str(item['_id'])
    return doc

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_jwt_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# AI Article Generation
async def generate_articles_from_sources():
    """Generate AI articles from news sources"""
    try:
        # Import emergent integrations
        from emergentintegrations import llm_client
        
        logger.info("Starting AI article generation...")
        
        # Get active news sources
        sources = await db.news_sources.find({"is_active": True}).to_list(length=None)
        
        if not sources:
            logger.warning("No active news sources found")
            return
            
        # Select random sources to generate content from
        selected_sources = random.sample(sources, min(3, len(sources)))
        
        # Keywords for different categories
        category_keywords = {
            "finance": ["market analysis", "stock market", "financial news", "economic indicators", "investment trends"],
            "crypto": ["cryptocurrency", "bitcoin", "blockchain", "defi", "crypto market"],
            "general": ["financial markets", "economic news", "investment", "trading", "market update"]
        }
        
        articles_generated = 0
        
        for source in selected_sources:
            try:
                # Determine category
                category = source.get('category', 'general')
                if category not in category_keywords:
                    category = 'general'
                    
                # Select trending keyword
                selected_keyword = random.choice(category_keywords[category])
                
                # Create scraped content simulation (in real deployment, you'd scrape actual content)
                scraped_content = f"Latest {category} news and analysis focusing on {selected_keyword} from {source['name']}"
                
                # Create the SEO-optimized prompt with proper source attribution
                prompt = f"""Based on the following news content about {category} from {source['name']}, create a comprehensive, SEO-optimized article focusing on "{selected_keyword}":

SOURCE: {source['name']}
CONTENT:
{scraped_content}

CRITICAL REQUIREMENTS:
1. Always include proper source attribution in the article 
2. Create content that ranks well for "{selected_keyword}" and related {category} terms
3. Make it newsworthy and up-to-the-minute relevant
4. Include market analysis and expert insights
5. Use trending financial/crypto terminology naturally

Please provide your response in this exact JSON format:
{{
    "title": "SEO-optimized breaking news title under 60 characters",
    "content": "BREAKING NEWS article (600-900 words) with proper source attribution. Start with 'According to {source['name']},' or 'Reports from {source['name']} indicate...' ALWAYS mention the source multiple times throughout the article. Include market analysis, expert commentary, and trending insights. Make it feel like breaking financial news.",
    "summary": "Compelling 2-3 sentence summary mentioning the source and key market impact",
    "tags": ["breaking-news", "{category}", "market-analysis", "financial-update", "{selected_keyword.replace(' ', '-')}"],
    "seo_keywords": ["{selected_keyword}", "{category}", "breaking news", "market analysis", "financial update"],
    "source_attribution": "Information sourced from {source['name']}"
}}

IMPORTANT: This should read like BREAKING financial news, not generic content. Make it urgent and market-relevant."""

                # Generate article using AI
                response = await llm_client.chat_completion(
                    messages=[{"role": "user", "content": prompt}],
                    model="gpt-4o-mini"
                )
                
                if response and 'choices' in response:
                    content = response['choices'][0]['message']['content']
                    
                    # Parse JSON response
                    try:
                        article_data = json.loads(content)
                        
                        # Create article object
                        article = Article(
                            title=article_data['title'],
                            content=article_data['content'],
                            summary=article_data['summary'],
                            category=category,
                            tags=article_data.get('tags', []),
                            seo_keywords=article_data.get('seo_keywords', []),
                            source_name=source['name'],
                            source_attribution=article_data.get('source_attribution', f"Source: {source['name']}")
                        )
                        
                        # Save to database
                        article_dict = prepare_for_mongo(article.dict())
                        await db.articles.insert_one(article_dict)
                        
                        articles_generated += 1
                        logger.info(f"Generated article: {article.title}")
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse AI response as JSON: {e}")
                        continue
                        
            except Exception as e:
                logger.error(f"Error generating article for source {source['name']}: {str(e)}")
                continue
                
        logger.info(f"Article generation complete. Generated {articles_generated} articles.")
        
    except Exception as e:
        logger.error(f"Critical error in article generation: {str(e)}")

# Background scheduler
def run_scheduler():
    """Run the background scheduler for automated article generation"""
    # Create new event loop for this thread
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    def job():
        # Run the async function in the current thread's event loop
        loop.run_until_complete(generate_articles_from_sources())
    
    # Schedule article generation every 15 minutes for real-time financial news
    schedule.every(15).minutes.do(job)
    
    # Run immediate generation on startup
    job()
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

# Start the scheduler in a separate thread
scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
scheduler_thread.start()

# API Routes
@api_router.get("/")
async def root():
    return {"message": "CryptoAI Digest API", "status": "active"}

@api_router.get("/articles", response_model=List[Article])
async def get_articles(category: Optional[str] = None, limit: int = 20):
    """Get articles, optionally filtered by category"""
    try:
        filter_query = {}
        if category and category != "all":
            filter_query["category"] = category
            
        articles = await db.articles.find(filter_query).sort("published_at", -1).limit(limit).to_list(length=None)
        return [convert_mongo_doc(article) for article in articles]
    except Exception as e:
        logger.error(f"Error fetching articles: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching articles: {str(e)}")

@api_router.get("/market-data")
async def get_market_data():
    """Get real-time market data"""
    try:
        # Simulated market data (in production, integrate with real APIs)
        stocks_data = [
            {"symbol": "AAPL", "name": "Apple Inc.", "price": 175.23, "change_24h": 2.15, "change_percentage_24h": 1.24},
            {"symbol": "GOOGL", "name": "Alphabet Inc.", "price": 142.56, "change_24h": -1.83, "change_percentage_24h": -1.27},
            {"symbol": "MSFT", "name": "Microsoft Corporation", "price": 378.91, "change_24h": 4.67, "change_percentage_24h": 1.25},
            {"symbol": "TSLA", "name": "Tesla, Inc.", "price": 248.50, "change_24h": -8.24, "change_percentage_24h": -3.21},
            {"symbol": "NVDA", "name": "NVIDIA Corporation", "price": 456.78, "change_24h": 12.34, "change_percentage_24h": 2.78}
        ]
        
        # Top Cryptocurrencies
        crypto_data = [
            {"symbol": "BTC", "name": "Bitcoin", "price": 43250.67, "change_24h": 891.23, "change_percentage_24h": 2.10, "market_cap": 847000000000},
            {"symbol": "ETH", "name": "Ethereum", "price": 2678.45, "change_24h": -45.67, "change_percentage_24h": -1.68, "market_cap": 321000000000},
            {"symbol": "BNB", "name": "Binance Coin", "price": 345.12, "change_24h": 8.97, "change_percentage_24h": 2.67, "market_cap": 51000000000},
            {"symbol": "SOL", "name": "Solana", "price": 78.34, "change_24h": 3.21, "change_percentage_24h": 4.28, "market_cap": 33000000000},
            {"symbol": "ADA", "name": "Cardano", "price": 0.52, "change_24h": 0.018, "change_percentage_24h": 3.57, "market_cap": 18000000000}
        ]
        
        return {
            "stocks": stocks_data,
            "cryptos": crypto_data,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching market data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching market data: {str(e)}")

@api_router.get("/seo-stats")
async def get_seo_stats():
    """Get SEO statistics"""
    try:
        total_articles = await db.articles.count_documents({})
        
        # Articles from today
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        articles_today = await db.articles.count_documents({"published_at": {"$gte": today.isoformat()}})
        
        # Category breakdown
        finance_articles = await db.articles.count_documents({"category": "finance"})
        crypto_articles = await db.articles.count_documents({"category": "crypto"})
        
        return {
            "total_articles": total_articles,
            "articles_today": articles_today,
            "finance_articles": finance_articles,
            "crypto_articles": crypto_articles,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching SEO stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching SEO stats: {str(e)}")

# Admin routes
class LoginRequest(BaseModel):
    username: str
    password: str

@api_router.post("/admin/login")
async def admin_login(login_data: LoginRequest):
    """Admin login endpoint"""
    # For simplicity, using hardcoded admin credentials
    if login_data.username == "admin" and login_data.password == "cryptoadmin123":
        token = create_jwt_token({"sub": login_data.username})
        return {"access_token": token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

@api_router.get("/admin/stats")
async def get_admin_stats(username: str = Depends(verify_jwt_token)):
    """Get admin statistics"""
    try:
        total_articles = await db.articles.count_documents({})
        total_sources = await db.news_sources.count_documents({})
        active_sources = await db.news_sources.count_documents({"is_active": True})
        
        # Recent articles
        recent_articles = await db.articles.find().sort("published_at", -1).limit(5).to_list(length=None)
        
        return {
            "total_articles": total_articles,
            "total_sources": total_sources,
            "active_sources": active_sources,
            "recent_articles": [convert_mongo_doc(article) for article in recent_articles]
        }
    except Exception as e:
        logger.error(f"Error fetching admin stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching admin stats: {str(e)}")

@api_router.post("/admin/generate-now")
async def generate_articles_now(username: str = Depends(verify_jwt_token)):
    """Manually trigger article generation"""
    try:
        asyncio.create_task(generate_articles_from_sources())
        return {"message": "Article generation started"}
    except Exception as e:
        logger.error(f"Error triggering article generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error triggering article generation: {str(e)}")

@api_router.get("/news-sources", response_model=List[NewsSource])
async def get_news_sources(username: str = Depends(verify_jwt_token)):
    """Get all news sources"""
    try:
        sources = await db.news_sources.find().to_list(length=None)
        return [convert_mongo_doc(source) for source in sources]
    except Exception as e:
        logger.error(f"Error fetching news sources: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching news sources: {str(e)}")

# Initialize default news sources
async def initialize_default_sources():
    """Initialize default news sources if none exist"""
    existing_sources = await db.news_sources.count_documents({})
    
    if existing_sources == 0:
        logger.info("Initializing default news sources...")
        default_sources = [
            # Major Financial News Sources
            {"name": "Financial Times", "url": "https://www.ft.com", "category": "finance"},
            {"name": "Bloomberg", "url": "https://www.bloomberg.com", "category": "finance"},
            {"name": "Reuters Finance", "url": "https://www.reuters.com/business/finance", "category": "finance"},
            {"name": "Wall Street Journal", "url": "https://www.wsj.com", "category": "finance"},
            {"name": "MarketWatch", "url": "https://www.marketwatch.com", "category": "finance"},
            {"name": "CNBC", "url": "https://www.cnbc.com", "category": "finance"},
            {"name": "Yahoo Finance", "url": "https://finance.yahoo.com", "category": "finance"},
            
            # Cryptocurrency Sources
            {"name": "CoinDesk", "url": "https://www.coindesk.com", "category": "crypto"},
            {"name": "Cointelegraph", "url": "https://cointelegraph.com", "category": "crypto"},
            {"name": "CoinMarketCap News", "url": "https://coinmarketcap.com/news", "category": "crypto"},
            {"name": "The Block", "url": "https://www.theblock.co", "category": "crypto"},
            {"name": "Decrypt", "url": "https://decrypt.co", "category": "crypto"}
        ]
        
        for source_data in default_sources:
            source = NewsSource(**source_data)
            await db.news_sources.insert_one(prepare_for_mongo(source.dict()))
        
        logger.info("Default news sources initialized")

# Live Streams API
@api_router.get("/live-streams", response_model=List[LiveStream])
async def get_live_streams(category: Optional[str] = None, region: Optional[str] = None):
    """Get all active live streams"""
    try:
        filter_query = {"is_live": True}
        if category:
            filter_query["category"] = category
        if region:
            filter_query["region"] = region
            
        streams = await db.live_streams.find(filter_query).sort("started_at", -1).to_list(length=20)
        return [convert_mongo_doc(stream) for stream in streams]
    except Exception as e:
        logger.error(f"Error fetching live streams: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching live streams: {str(e)}")

# Initialize default live streams
async def initialize_default_live_streams():
    """Initialize popular financial live streams if none exist"""
    existing_streams = await db.live_streams.count_documents({})
    
    if existing_streams == 0:
        default_streams = [
            {
                "title": "CNBC Live - Breaking Financial News",
                "description": "Live coverage of breaking financial news, market updates, and expert analysis from CNBC",
                "source_name": "CNBC",
                "embed_url": "https://www.cnbc.com/live-tv/",
                "thumbnail_url": "https://sc.cnbcfm.com/applications/cnbc.com/staticcontent/img/cnbc_logo.svg",
                "category": "finance",
                "language": "en",
                "region": "us",
                "tags": ["breaking-news", "markets", "stocks"],
                "is_direct_link": True
            },
            {
                "title": "Bloomberg Markets Live",
                "description": "Live market coverage and financial analysis from Bloomberg experts",
                "source_name": "Bloomberg",
                "embed_url": "https://www.bloomberg.com/live",
                "thumbnail_url": "https://assets.bwbx.io/s3/javelin/public/modules/tv/images/livestream-cover-bg.jpg",
                "category": "finance",
                "language": "en",
                "region": "global",
                "tags": ["markets", "analysis", "trading"],
                "is_direct_link": True
            },
            {
                "title": "Yahoo Finance Live",
                "description": "Real-time market news and analysis covering stocks, crypto, and economy",
                "source_name": "Yahoo Finance",
                "embed_url": "https://finance.yahoo.com/live/",
                "thumbnail_url": "https://s.yimg.com/cv/apiv2/social/images/yahoo_default_logo.png",
                "category": "finance", 
                "language": "en",
                "region": "us",
                "tags": ["live-market", "stocks", "crypto"],
                "is_direct_link": True
            },
            {
                "title": "MarketWatch Live Coverage",
                "description": "Real-time market updates and financial news from MarketWatch",
                "source_name": "MarketWatch",
                "embed_url": "https://www.marketwatch.com/",
                "thumbnail_url": "https://mw3.wsj.net/mw5/content/logos/mw_logo_social.png",
                "category": "finance",
                "language": "en",
                "region": "us",
                "tags": ["markets", "stocks", "live-updates"],
                "is_direct_link": True
            },
            {
                "title": "CoinDesk Live - Breaking Crypto News",
                "description": "Live coverage of cryptocurrency market movements and blockchain developments",
                "source_name": "CoinDesk",
                "embed_url": "https://www.coindesk.com/",
                "thumbnail_url": "https://www.coindesk.com/resizer/_RvfKZu7vQKWo_7HP8_SEKHl1Ro=/1200x628/cloudfront-us-east-1.images.arcpublishing.com/coindesk/DUXEIQ4MTJGATOZ6KTPG5DFBXY.png",
                "category": "crypto",
                "language": "en",
                "region": "global", 
                "tags": ["crypto-news", "blockchain", "defi"],
                "is_direct_link": True
            },
            {
                "title": "Cointelegraph Live Updates",
                "description": "Latest cryptocurrency news and live market analysis from Cointelegraph",
                "source_name": "Cointelegraph",
                "embed_url": "https://cointelegraph.com/",
                "thumbnail_url": "https://images.cointelegraph.com/images/1200_aHR0cHM6Ly9zMy5jb2ludGVsZWdyYXBoLmNvbS91cGxvYWRzLzIwMjEtMTAvNGNkNDFhYjEtOTU5Yy00YzQ5LWI2YWUtNzU4NWQzM2I5Yjk1LmpwZw==.jpg",
                "category": "crypto",
                "language": "en",
                "region": "global",
                "tags": ["cryptocurrency", "bitcoin", "analysis"],
                "is_direct_link": True
            }
        ]
        
        for stream_data in default_streams:
            stream = LiveStream(**stream_data)
            await db.live_streams.insert_one(prepare_for_mongo(stream.dict()))
        
        logger.info("Initialized default live streams")

# Production CORS configuration
allowed_origins = [
    "https://cryptoaidigest.com",
    "https://www.cryptoaidigest.com", 
    "https://crypto-news-ai.preview.emergentagent.com",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,
)

# Include the router
app.include_router(api_router)

@app.on_event("startup")
async def startup_db_client():
    await initialize_default_sources()
    await initialize_default_live_streams()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
