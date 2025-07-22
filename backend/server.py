from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="AICademy API", description="AI-Powered Learning Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pydantic Models
class Subtopic(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    estimated_time: int  # in minutes
    difficulty: str  # Beginner, Intermediate, Advanced
    content: Optional[str] = None
    completed: bool = False

class Chapter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    summary: str
    subtopics: List[Subtopic]
    completed: bool = False
    quiz_completed: bool = False
    quiz_score: Optional[int] = None

class Course(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic: str
    title: str
    description: str
    chapters: List[Chapter]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class QuizQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    options: List[str]
    correct_answer: int  # index of correct option
    explanation: str

class Quiz(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chapter_id: str
    questions: List[QuizQuestion]

class UserProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    course_id: str
    completed_chapters: List[str] = []
    completed_subtopics: List[str] = []
    quiz_scores: Dict[str, int] = {}  # chapter_id: score
    total_progress: float = 0.0
    last_accessed: datetime = Field(default_factory=datetime.utcnow)

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

# Request/Response Models
class CourseGenerationRequest(BaseModel):
    topic: str

class SubtopicContentRequest(BaseModel):
    subtopic_id: str
    course_id: str

class QuizSubmissionRequest(BaseModel):
    chapter_id: str
    user_id: str
    answers: List[int]  # user's selected answers

class NoteCreateRequest(BaseModel):
    user_id: str
    course_id: str
    subtopic_id: str
    content: str

class BookmarkRequest(BaseModel):
    user_id: str
    course_id: str
    subtopic_id: str

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

# API Routes

@api_router.get("/")
async def root():
    return {"message": "Welcome to AICademy API"}

@api_router.post("/courses/generate", response_model=Course)
async def generate_course(request: CourseGenerationRequest):
    """Generate a complete course outline for the given topic"""
    try:
        # Create prompt for course generation
        prompt = f"""
Generate a comprehensive course structure for the topic: "{request.topic}"

Please provide a JSON response with the following structure:
{{
    "title": "Course Title",
    "description": "Brief course description (2-3 sentences)",
    "chapters": [
        {{
            "title": "Chapter Title",
            "summary": "2-3 sentence summary of what this chapter covers",
            "subtopics": [
                {{
                    "title": "Subtopic Title",
                    "estimated_time": 15,
                    "difficulty": "Beginner"
                }}
            ]
        }}
    ]
}}

Requirements:
- Generate 10-12 chapters
- Each chapter should have 3-5 subtopics
- Estimated time should be realistic (10-45 minutes per subtopic)
- Difficulty levels: "Beginner", "Intermediate", or "Advanced"
- Ensure logical progression from basic to advanced concepts
- Make titles engaging and specific

Return only the JSON structure, no additional text.
        """
        
        response = await get_gemini_response(prompt)
        
        # Parse the JSON response
        try:
            # Clean the response to extract JSON
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                json_str = response[json_start:json_end]
                course_data = json.loads(json_str)
            else:
                raise ValueError("No valid JSON found in response")
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Raw response: {response}")
            raise HTTPException(status_code=500, detail="Failed to parse course structure from AI response")
        
        # Create Course object
        course = Course(
            topic=request.topic,
            title=course_data["title"],
            description=course_data["description"],
            chapters=[
                Chapter(
                    title=chapter["title"],
                    summary=chapter["summary"],
                    subtopics=[
                        Subtopic(
                            title=subtopic["title"],
                            estimated_time=subtopic["estimated_time"],
                            difficulty=subtopic["difficulty"]
                        ) for subtopic in chapter["subtopics"]
                    ]
                ) for chapter in course_data["chapters"]
            ]
        )
        
        # Save to database
        await db.courses.insert_one(course.dict())
        
        return course
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating course: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate course: {str(e)}")

@api_router.post("/courses/{course_id}/subtopics/{subtopic_id}/content")
async def generate_subtopic_content(course_id: str, subtopic_id: str):
    """Generate detailed content for a specific subtopic"""
    try:
        # Get course from database
        course_doc = await db.courses.find_one({"id": course_id})
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
        
        # Generate content using Gemini
        prompt = f"""
Create detailed lesson content for the subtopic: "{subtopic.title}"
Context: This is part of a course on "{course.topic}" in the chapter "{chapter_context.title}"
Difficulty Level: {subtopic.difficulty}
Estimated Time: {subtopic.estimated_time} minutes

Please provide comprehensive content in markdown format including:

1. **Introduction** (what this subtopic is about)
2. **Core Concepts** (step-by-step explanation)
3. **Examples** (practical examples or code snippets if applicable)
4. **Key Takeaways** (bullet points of main concepts)
5. **Common Mistakes** (what students often get wrong)
6. **Summary** (brief recap)

Make it engaging, educational, and appropriate for the {subtopic.difficulty.lower()} level.
Use proper markdown formatting with headers, code blocks, lists, etc.
        """
        
        content = await get_gemini_response(prompt)
        
        # Update subtopic with content
        for chapter in course.chapters:
            for st in chapter.subtopics:
                if st.id == subtopic_id:
                    st.content = content
                    break
        
        # Update in database
        await db.courses.update_one(
            {"id": course_id},
            {"$set": {"chapters": [chapter.dict() for chapter in course.chapters], "updated_at": datetime.utcnow()}}
        )
        
        return {"content": content, "subtopic_id": subtopic_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating subtopic content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate content: {str(e)}")

@api_router.post("/courses/{course_id}/chapters/{chapter_id}/quiz")
async def generate_chapter_quiz(course_id: str, chapter_id: str):
    """Generate quiz for a specific chapter"""
    try:
        # Get course from database
        course_doc = await db.courses.find_one({"id": course_id})
        if not course_doc:
            raise HTTPException(status_code=404, detail="Course not found")
        
        course = Course(**course_doc)
        
        # Find the chapter
        chapter = None
        for ch in course.chapters:
            if ch.id == chapter_id:
                chapter = ch
                break
        
        if not chapter:
            raise HTTPException(status_code=404, detail="Chapter not found")
        
        # Generate quiz using Gemini
        subtopics_list = [st.title for st in chapter.subtopics]
        prompt = f"""
Create a 5-question multiple choice quiz for the chapter: "{chapter.title}"
Course topic: "{course.topic}"
Subtopics covered: {', '.join(subtopics_list)}

Please provide the quiz in the following JSON format:
{{
    "questions": [
        {{
            "question": "Question text here",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": 0,
            "explanation": "Brief explanation of why this is correct"
        }}
    ]
}}

Requirements:
- Create exactly 5 multiple choice questions
- Each question should have 4 options
- correct_answer should be the index (0-3) of the correct option
- Questions should test understanding, not just memorization
- Cover different subtopics from the chapter
- Include brief explanations for the correct answers

Return only the JSON structure, no additional text.
        """
        
        response = await get_gemini_response(prompt)
        
        # Parse the JSON response
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                json_str = response[json_start:json_end]
                quiz_data = json.loads(json_str)
            else:
                raise ValueError("No valid JSON found in response")
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse quiz JSON: {e}")
            raise HTTPException(status_code=500, detail="Failed to parse quiz from AI response")
        
        # Create Quiz object
        quiz = Quiz(
            chapter_id=chapter_id,
            questions=[
                QuizQuestion(
                    question=q["question"],
                    options=q["options"],
                    correct_answer=q["correct_answer"],
                    explanation=q["explanation"]
                ) for q in quiz_data["questions"]
            ]
        )
        
        # Save quiz to database
        await db.quizzes.insert_one(quiz.dict())
        
        return quiz
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

@api_router.get("/courses/{course_id}", response_model=Course)
async def get_course(course_id: str):
    """Get a specific course"""
    course_doc = await db.courses.find_one({"id": course_id})
    if not course_doc:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return Course(**course_doc)

@api_router.get("/courses", response_model=List[Course])
async def get_all_courses():
    """Get all courses"""
    courses = await db.courses.find().to_list(1000)
    return [Course(**course) for course in courses]

@api_router.get("/courses/{course_id}/chapters/{chapter_id}/quiz")
async def get_chapter_quiz(course_id: str, chapter_id: str):
    """Get quiz for a specific chapter"""
    quiz_doc = await db.quizzes.find_one({"chapter_id": chapter_id})
    if not quiz_doc:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    return Quiz(**quiz_doc)

@api_router.post("/quiz/submit")
async def submit_quiz(request: QuizSubmissionRequest):
    """Submit quiz answers and get score"""
    try:
        # Get quiz
        quiz_doc = await db.quizzes.find_one({"chapter_id": request.chapter_id})
        if not quiz_doc:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        quiz = Quiz(**quiz_doc)
        
        # Calculate score
        correct_answers = 0
        total_questions = len(quiz.questions)
        
        for i, user_answer in enumerate(request.answers):
            if i < total_questions and quiz.questions[i].correct_answer == user_answer:
                correct_answers += 1
        
        score = int((correct_answers / total_questions) * 100)
        
        # Update user progress
        progress_doc = await db.user_progress.find_one({
            "user_id": request.user_id, 
            "course_id": quiz_doc.get("course_id", "")
        })
        
        if progress_doc:
            progress = UserProgress(**progress_doc)
            progress.quiz_scores[request.chapter_id] = score
            await db.user_progress.update_one(
                {"id": progress.id},
                {"$set": progress.dict()}
            )
        
        return {
            "score": score,
            "correct_answers": correct_answers,
            "total_questions": total_questions,
            "passed": score >= 60
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to submit quiz: {str(e)}")

@api_router.post("/notes", response_model=Note)
async def create_note(request: NoteCreateRequest):
    """Create a note for a subtopic"""
    note = Note(**request.dict())
    await db.notes.insert_one(note.dict())
    return note

@api_router.get("/notes/{user_id}")
async def get_user_notes(user_id: str):
    """Get all notes for a user"""
    notes = await db.notes.find({"user_id": user_id}).to_list(1000)
    return [Note(**note) for note in notes]

@api_router.post("/bookmarks", response_model=Bookmark)
async def create_bookmark(request: BookmarkRequest):
    """Create a bookmark for a subtopic"""
    bookmark = Bookmark(**request.dict())
    await db.bookmarks.insert_one(bookmark.dict())
    return bookmark

@api_router.get("/bookmarks/{user_id}")
async def get_user_bookmarks(user_id: str):
    """Get all bookmarks for a user"""
    bookmarks = await db.bookmarks.find({"user_id": user_id}).to_list(1000)
    return [Bookmark(**bookmark) for bookmark in bookmarks]

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