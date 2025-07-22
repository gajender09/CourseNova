from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timedelta
import json
import jwt
import bcrypt
import asyncio
import aiohttp
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'fallback_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24 * 7  # 1 week

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="AICademy API", description="Enhanced AI-Powered Learning Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Enhanced Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    profile_picture: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    full_name: str

class Subtopic(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    estimated_time: int  # in minutes
    difficulty: str  # Beginner, Intermediate, Advanced
    content: Optional[str] = None
    completed: bool = False
    videos: List[Dict[str, Any]] = []
    articles: List[Dict[str, Any]] = []

class Chapter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    summary: str
    subtopics: List[Subtopic]
    completed: bool = False
    quiz_completed: bool = False
    quiz_score: Optional[int] = None

class CourseMetadata(BaseModel):
    total_duration: int = 0  # total estimated minutes
    difficulty_distribution: Dict[str, int] = {}  # count by difficulty
    completion_rate: float = 0.0

class Course(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    topic: str
    title: str
    description: str
    chapters: List[Chapter]
    roadmap: Optional[str] = None
    final_quiz: Optional[Dict[str, Any]] = None
    glossary: List[Dict[str, str]] = []
    resources: Dict[str, List[Dict[str, Any]]] = {"articles": [], "videos": []}
    metadata: CourseMetadata = Field(default_factory=CourseMetadata)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class QuizQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    options: List[str]
    correct_answer: int  # index of correct option
    explanation: str

class Quiz(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    course_id: str
    chapter_id: Optional[str] = None  # None for final quiz
    quiz_type: str = "chapter"  # "chapter" or "final"
    questions: List[QuizQuestion]

class UserProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    course_id: str
    completed_chapters: List[str] = []
    completed_subtopics: List[str] = []
    quiz_scores: Dict[str, int] = {}  # chapter_id: score
    total_progress: float = 0.0
    study_time: int = 0  # total minutes studied
    last_accessed: datetime = Field(default_factory=datetime.utcnow)
    current_chapter: Optional[str] = None
    current_subtopic: Optional[str] = None

class Note(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    course_id: str
    subtopic_id: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Bookmark(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    course_id: str
    subtopic_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Request Models
class CourseGenerationRequest(BaseModel):
    topic: str

class SubtopicContentRequest(BaseModel):
    subtopic_id: str
    course_id: str

class QuizSubmissionRequest(BaseModel):
    quiz_id: str
    user_id: str
    answers: List[int]  # user's selected answers

class NoteCreateRequest(BaseModel):
    course_id: str
    subtopic_id: str
    content: str

class BookmarkRequest(BaseModel):
    course_id: str
    subtopic_id: str

class ProgressUpdateRequest(BaseModel):
    course_id: str
    subtopic_id: Optional[str] = None
    chapter_id: Optional[str] = None
    study_time_minutes: int = 0

# Utility Functions
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, email: str) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    to_encode = {"user_id": user_id, "email": email, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

# LLM Integration Helper
async def get_gemini_response(prompt: str, session_id: str = None) -> str:
    """Generate content using Gemini LLM"""
    try:
        if not session_id:
            session_id = str(uuid.uuid4())
            
        chat = LlmChat(
            api_key=os.environ.get('GEMINI_API_KEY'),
            session_id=session_id,
            system_message="You are an expert curriculum creator and interactive tutor for AICademy, an AI-powered learning platform. Generate educational content that is engaging, structured, and pedagogically sound."
        ).with_model("gemini", "gemini-2.0-flash").with_max_tokens(8192)
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        return response
        
    except Exception as e:
        logger.error(f"Error generating content with Gemini: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate content: {str(e)}")

# YouTube Integration
async def search_youtube_videos(query: str, max_results: int = 3) -> List[Dict[str, Any]]:
    """Search for relevant YouTube videos"""
    try:
        youtube_api_key = os.environ.get('YOUTUBE_API_KEY')
        if not youtube_api_key:
            return []
        
        search_url = f"https://www.googleapis.com/youtube/v3/search"
        params = {
            'part': 'snippet',
            'q': query,
            'type': 'video',
            'maxResults': max_results,
            'key': youtube_api_key,
            'videoDuration': 'medium',  # 4-20 minutes
            'videoDefinition': 'high',
            'relevanceLanguage': 'en'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(search_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    videos = []
                    for item in data.get('items', []):
                        videos.append({
                            'title': item['snippet']['title'],
                            'description': item['snippet']['description'][:200] + '...',
                            'video_id': item['id']['videoId'],
                            'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                            'thumbnail': item['snippet']['thumbnails']['medium']['url'],
                            'channel': item['snippet']['channelTitle']
                        })
                    return videos
                else:
                    logger.error(f"YouTube API error: {response.status}")
                    return []
                    
    except Exception as e:
        logger.error(f"Error searching YouTube videos: {str(e)}")
        return []

# Google Search Integration
async def search_articles(query: str, max_results: int = 3) -> List[Dict[str, Any]]:
    """Search for relevant articles using Google Custom Search"""
    try:
        google_api_key = os.environ.get('GOOGLE_API_KEY')
        google_cse_id = os.environ.get('GOOGLE_CSE_ID')
        
        if not google_api_key or not google_cse_id:
            return []
        
        search_url = f"https://www.googleapis.com/customsearch/v1"
        params = {
            'key': google_api_key,
            'cx': google_cse_id,
            'q': f"{query} tutorial guide",
            'num': max_results,
            'fileType': 'html'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(search_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    articles = []
                    for item in data.get('items', []):
                        articles.append({
                            'title': item['title'],
                            'description': item['snippet'],
                            'url': item['link'],
                            'source': item.get('displayLink', ''),
                        })
                    return articles
                else:
                    logger.error(f"Google Search API error: {response.status}")
                    return []
                    
    except Exception as e:
        logger.error(f"Error searching articles: {str(e)}")
        return []

# Authentication Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create new user
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password)
    )
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token = create_access_token(user.id, user.email)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name
    )

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    """Login user"""
    # Find user by email
    user_doc = await db.users.find_one({"email": user_data.email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    user = User(**user_doc)
    
    # Verify password
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token = create_access_token(user.id, user.email)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name
    )

@api_router.get("/auth/me")
async def get_current_user_info(current_user: str = Depends(get_current_user)):
    """Get current user information"""
    user_doc = await db.users.find_one({"id": current_user})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = User(**user_doc)
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "created_at": user.created_at,
        "profile_picture": user.profile_picture
    }

# Course Routes
@api_router.post("/courses/generate", response_model=Course)
async def generate_course(
    request: CourseGenerationRequest, 
    current_user: str = Depends(get_current_user)
):
    """Generate a comprehensive course for the given topic"""
    try:
        # Enhanced course generation prompt
        course_prompt = f"""
Generate a comprehensive, professional course structure for the topic: "{request.topic}"

Please provide a JSON response with the following structure:
{{
    "title": "Professional Course Title",
    "description": "Comprehensive course description (3-4 sentences explaining what students will learn)",
    "chapters": [
        {{
            "title": "Chapter Title",
            "summary": "Detailed 2-3 sentence summary of what this chapter covers",
            "subtopics": [
                {{
                    "title": "Specific Subtopic Title",
                    "estimated_time": 25,
                    "difficulty": "Beginner"
                }}
            ]
        }}
    ],
    "glossary": [
        {{
            "term": "Technical Term",
            "definition": "Clear definition of the term"
        }}
    ]
}}

Requirements:
- Generate 12-15 chapters for comprehensive coverage
- Each chapter should have 4-6 subtopics
- Estimated time should be realistic (15-45 minutes per subtopic)
- Difficulty levels: "Beginner", "Intermediate", or "Advanced"
- Ensure logical progression from fundamentals to advanced concepts
- Include 10-12 key terms in glossary
- Make titles specific and actionable
- Focus on practical, applicable knowledge

Return only the JSON structure, no additional text.
        """
        
        response = await get_gemini_response(course_prompt)
        
        # Parse the JSON response
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                json_str = response[json_start:json_end]
                course_data = json.loads(json_str)
            else:
                raise ValueError("No valid JSON found in response")
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse JSON response: {e}")
            raise HTTPException(status_code=500, detail="Failed to parse course structure from AI response")
        
        # Search for relevant videos and articles
        videos_task = search_youtube_videos(f"{request.topic} tutorial")
        articles_task = search_articles(f"{request.topic} guide")
        
        videos, articles = await asyncio.gather(videos_task, articles_task)
        
        # Generate roadmap
        roadmap_prompt = f"""
Create a learning roadmap for someone who has completed the course on "{request.topic}".

Provide a structured roadmap in markdown format including:
1. **Next Steps**: What to learn after this course
2. **Skill Development**: Practical projects to build
3. **Career Paths**: Potential job roles and career directions
4. **Certifications**: Relevant certifications to pursue
5. **Advanced Topics**: Areas for further study
6. **Community**: Communities and resources to join

Make it actionable and inspiring.
        """
        
        roadmap = await get_gemini_response(roadmap_prompt)
        
        # Calculate metadata
        total_duration = 0
        difficulty_dist = {"Beginner": 0, "Intermediate": 0, "Advanced": 0}
        
        # Create Course object with enhanced data
        chapters = []
        for chapter_data in course_data["chapters"]:
            subtopics = []
            for subtopic_data in chapter_data["subtopics"]:
                total_duration += subtopic_data["estimated_time"]
                difficulty_dist[subtopic_data["difficulty"]] += 1
                
                subtopic = Subtopic(
                    title=subtopic_data["title"],
                    estimated_time=subtopic_data["estimated_time"],
                    difficulty=subtopic_data["difficulty"]
                )
                subtopics.append(subtopic)
            
            chapter = Chapter(
                title=chapter_data["title"],
                summary=chapter_data["summary"],
                subtopics=subtopics
            )
            chapters.append(chapter)
        
        course = Course(
            user_id=current_user,
            topic=request.topic,
            title=course_data["title"],
            description=course_data["description"],
            chapters=chapters,
            roadmap=roadmap,
            glossary=course_data.get("glossary", []),
            resources={
                "videos": videos,
                "articles": articles
            },
            metadata=CourseMetadata(
                total_duration=total_duration,
                difficulty_distribution=difficulty_dist
            )
        )
        
        # Save to database
        await db.courses.insert_one(course.dict())
        
        # Initialize user progress
        progress = UserProgress(
            user_id=current_user,
            course_id=course.id
        )
        await db.user_progress.insert_one(progress.dict())
        
        return course
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating course: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate course: {str(e)}")

@api_router.post("/courses/{course_id}/subtopics/{subtopic_id}/content")
async def generate_subtopic_content(
    course_id: str, 
    subtopic_id: str,
    current_user: str = Depends(get_current_user)
):
    """Generate enhanced content for a specific subtopic"""
    try:
        # Get course from database
        course_doc = await db.courses.find_one({"id": course_id, "user_id": current_user})
        if not course_doc:
            raise HTTPException(status_code=404, detail="Course not found")
        
        course = Course(**course_doc)
        
        # Find the subtopic
        subtopic = None
        chapter_context = None
        for chapter in course.chapters:
            for st in chapter.subtopics:
                if st.id == subtopic_id:
                    subtopic = st
                    chapter_context = chapter
                    break
            if subtopic:
                break
        
        if not subtopic:
            raise HTTPException(status_code=404, detail="Subtopic not found")
        
        # Enhanced content generation
        content_prompt = f"""
Create comprehensive, engaging lesson content for the subtopic: "{subtopic.title}"

**Context:**
- Course: {course.topic}
- Chapter: {chapter_context.title}
- Difficulty: {subtopic.difficulty}
- Duration: {subtopic.estimated_time} minutes

**Content Structure (use proper markdown formatting):**

# {subtopic.title}

## 🎯 Learning Objectives
[List 3-4 specific learning objectives]

## 📖 Introduction
[Engaging introduction explaining why this topic matters]

## 🔍 Core Concepts
[Detailed explanation of key concepts with examples]

## 💡 Practical Examples
[Real-world examples, code snippets if applicable, step-by-step demonstrations]

## ⚠️ Common Pitfalls
[Important mistakes to avoid with explanations]

## 🚀 Pro Tips
[Expert insights and best practices]

## 📝 Quick Summary
[Bullet points summarizing key takeaways]

## 🔗 What's Next
[Brief preview of how this connects to upcoming topics]

**Requirements:**
- Use clear, engaging language appropriate for {subtopic.difficulty.lower()} level
- Include practical examples and actionable insights
- Make it visually structured with proper markdown headers
- Ensure content can be completed in approximately {subtopic.estimated_time} minutes
- Focus on hands-on learning and real-world application
        """
        
        content = await get_gemini_response(content_prompt)
        
        # Search for specific videos and articles for this subtopic
        subtopic_videos = await search_youtube_videos(f"{subtopic.title} {course.topic}")
        subtopic_articles = await search_articles(f"{subtopic.title} tutorial")
        
        # Update subtopic with enhanced content
        for chapter in course.chapters:
            for st in chapter.subtopics:
                if st.id == subtopic_id:
                    st.content = content
                    st.videos = subtopic_videos
                    st.articles = subtopic_articles
                    break
        
        # Update in database
        await db.courses.update_one(
            {"id": course_id, "user_id": current_user},
            {"$set": {"chapters": [chapter.dict() for chapter in course.chapters], "updated_at": datetime.utcnow()}}
        )
        
        return {
            "content": content,
            "videos": subtopic_videos,
            "articles": subtopic_articles,
            "subtopic_id": subtopic_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating subtopic content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate content: {str(e)}")

@api_router.get("/dashboard")
async def get_dashboard_data(current_user: str = Depends(get_current_user)):
    """Get user dashboard data"""
    try:
        # Get user's courses
        courses = await db.courses.find({"user_id": current_user}).to_list(1000)
        course_list = [Course(**course) for course in courses]
        
        # Get progress for all courses
        progress_docs = await db.user_progress.find({"user_id": current_user}).to_list(1000)
        progress_map = {p["course_id"]: UserProgress(**p) for p in progress_docs}
        
        # Calculate dashboard stats
        total_courses = len(course_list)
        total_study_time = sum(progress_map.get(c.id, UserProgress(user_id=current_user, course_id=c.id)).study_time for c in course_list)
        completed_courses = sum(1 for c in course_list if progress_map.get(c.id, UserProgress(user_id=current_user, course_id=c.id)).total_progress >= 100)
        
        # Format course cards with progress
        course_cards = []
        for course in course_list:
            progress = progress_map.get(course.id, UserProgress(user_id=current_user, course_id=course.id))
            course_cards.append({
                "id": course.id,
                "title": course.title,
                "description": course.description,
                "topic": course.topic,
                "progress": progress.total_progress,
                "chapters_completed": len(progress.completed_chapters),
                "total_chapters": len(course.chapters),
                "study_time": progress.study_time,
                "last_accessed": progress.last_accessed,
                "current_chapter": progress.current_chapter,
                "created_at": course.created_at,
                "total_duration": course.metadata.total_duration
            })
        
        # Sort by last accessed
        course_cards.sort(key=lambda x: x["last_accessed"], reverse=True)
        
        return {
            "stats": {
                "total_courses": total_courses,
                "completed_courses": completed_courses,
                "total_study_time": total_study_time,
                "active_courses": total_courses - completed_courses
            },
            "courses": course_cards,
            "recent_activity": course_cards[:5]  # Most recent 5 courses
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard data: {str(e)}")

@api_router.get("/courses/{course_id}", response_model=Course)
async def get_course(course_id: str, current_user: str = Depends(get_current_user)):
    """Get a specific course with progress"""
    course_doc = await db.courses.find_one({"id": course_id, "user_id": current_user})
    if not course_doc:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Update last accessed
    await db.user_progress.update_one(
        {"user_id": current_user, "course_id": course_id},
        {"$set": {"last_accessed": datetime.utcnow()}},
        upsert=True
    )
    
    return Course(**course_doc)

@api_router.post("/progress/update")
async def update_progress(
    request: ProgressUpdateRequest,
    current_user: str = Depends(get_current_user)
):
    """Update user progress"""
    try:
        # Get or create progress record
        progress_doc = await db.user_progress.find_one({
            "user_id": current_user, 
            "course_id": request.course_id
        })
        
        if progress_doc:
            progress = UserProgress(**progress_doc)
        else:
            progress = UserProgress(
                user_id=current_user,
                course_id=request.course_id
            )
            await db.user_progress.insert_one(progress.dict())
        
        # Update progress
        updates = {
            "last_accessed": datetime.utcnow(),
            "study_time": progress.study_time + request.study_time_minutes
        }
        
        if request.subtopic_id and request.subtopic_id not in progress.completed_subtopics:
            updates["$addToSet"] = {"completed_subtopics": request.subtopic_id}
        
        if request.chapter_id:
            updates["current_chapter"] = request.chapter_id
        
        await db.user_progress.update_one(
            {"user_id": current_user, "course_id": request.course_id},
            {"$set": updates}
        )
        
        return {"success": True, "message": "Progress updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating progress: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update progress: {str(e)}")

# Other existing endpoints (notes, bookmarks, etc.) remain the same...
@api_router.post("/notes", response_model=Note)
async def create_note(
    request: NoteCreateRequest,
    current_user: str = Depends(get_current_user)
):
    """Create a note for a subtopic"""
    note = Note(
        user_id=current_user,
        course_id=request.course_id,
        subtopic_id=request.subtopic_id,
        content=request.content
    )
    await db.notes.insert_one(note.dict())
    return note

@api_router.get("/notes")
async def get_user_notes(current_user: str = Depends(get_current_user)):
    """Get all notes for current user"""
    notes = await db.notes.find({"user_id": current_user}).to_list(1000)
    return [Note(**note) for note in notes]

@api_router.post("/bookmarks", response_model=Bookmark)
async def create_bookmark(
    request: BookmarkRequest,
    current_user: str = Depends(get_current_user)
):
    """Create a bookmark for a subtopic"""
    bookmark = Bookmark(
        user_id=current_user,
        course_id=request.course_id,
        subtopic_id=request.subtopic_id
    )
    await db.bookmarks.insert_one(bookmark.dict())
    return bookmark

@api_router.get("/bookmarks")
async def get_user_bookmarks(current_user: str = Depends(get_current_user)):
    """Get all bookmarks for current user"""
    bookmarks = await db.bookmarks.find({"user_id": current_user}).to_list(1000)
    return [Bookmark(**bookmark) for bookmark in bookmarks]

@api_router.get("/")
async def root():
    return {"message": "Welcome to AICademy Enhanced API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()