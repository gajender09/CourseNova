#!/usr/bin/env python3
"""
AICademy Backend API Testing Suite
Tests all backend endpoints and functionality
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime
from typing import Dict, Any, List

# Backend URL from frontend/.env
BACKEND_URL = "https://043b7fb1-fbe5-4674-867f-a5dad48277cb.preview.emergentagent.com/api"

class AICademyTester:
    def __init__(self):
        self.session = None
        self.test_results = {}
        self.course_id = None
        self.chapter_id = None
        self.subtopic_id = None
        self.quiz_id = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results[test_name] = {
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
    
    async def test_health_check(self):
        """Test basic API health check"""
        try:
            async with self.session.get(f"{BACKEND_URL}/") as response:
                if response.status == 200:
                    data = await response.json()
                    if "message" in data:
                        self.log_test("Health Check", True, f"API is responding: {data['message']}")
                        return True
                    else:
                        self.log_test("Health Check", False, "Response missing 'message' field", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Health Check", False, f"HTTP {response.status}", text)
                    return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    async def test_course_generation(self):
        """Test course generation with Machine Learning topic"""
        try:
            payload = {"topic": "Machine Learning"}
            async with self.session.post(
                f"{BACKEND_URL}/courses/generate",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Validate course structure
                    required_fields = ["id", "topic", "title", "description", "chapters"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_test("Course Generation", False, f"Missing fields: {missing_fields}", data)
                        return False
                    
                    # Store course_id for later tests
                    self.course_id = data["id"]
                    
                    # Validate chapters structure
                    if not data["chapters"] or len(data["chapters"]) < 5:
                        self.log_test("Course Generation", False, f"Expected at least 5 chapters, got {len(data['chapters'])}")
                        return False
                    
                    # Store first chapter and subtopic for later tests
                    if data["chapters"]:
                        self.chapter_id = data["chapters"][0]["id"]
                        if data["chapters"][0]["subtopics"]:
                            self.subtopic_id = data["chapters"][0]["subtopics"][0]["id"]
                    
                    # Validate subtopics structure
                    total_subtopics = sum(len(chapter.get("subtopics", [])) for chapter in data["chapters"])
                    if total_subtopics < 10:
                        self.log_test("Course Generation", False, f"Expected at least 10 subtopics total, got {total_subtopics}")
                        return False
                    
                    self.log_test("Course Generation", True, 
                                f"Generated course '{data['title']}' with {len(data['chapters'])} chapters and {total_subtopics} subtopics")
                    return True
                    
                else:
                    text = await response.text()
                    self.log_test("Course Generation", False, f"HTTP {response.status}", text)
                    return False
                    
        except Exception as e:
            self.log_test("Course Generation", False, f"Error: {str(e)}")
            return False
    
    async def test_get_courses(self):
        """Test getting all courses"""
        try:
            async with self.session.get(f"{BACKEND_URL}/courses") as response:
                if response.status == 200:
                    data = await response.json()
                    if isinstance(data, list) and len(data) > 0:
                        self.log_test("Get All Courses", True, f"Retrieved {len(data)} courses")
                        return True
                    else:
                        self.log_test("Get All Courses", False, "No courses found or invalid format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Get All Courses", False, f"HTTP {response.status}", text)
                    return False
        except Exception as e:
            self.log_test("Get All Courses", False, f"Error: {str(e)}")
            return False
    
    async def test_get_specific_course(self):
        """Test getting a specific course"""
        if not self.course_id:
            self.log_test("Get Specific Course", False, "No course_id available from previous test")
            return False
            
        try:
            async with self.session.get(f"{BACKEND_URL}/courses/{self.course_id}") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("id") == self.course_id:
                        self.log_test("Get Specific Course", True, f"Retrieved course: {data.get('title', 'Unknown')}")
                        return True
                    else:
                        self.log_test("Get Specific Course", False, "Course ID mismatch", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Get Specific Course", False, f"HTTP {response.status}", text)
                    return False
        except Exception as e:
            self.log_test("Get Specific Course", False, f"Error: {str(e)}")
            return False
    
    async def test_subtopic_content_generation(self):
        """Test subtopic content generation"""
        if not self.course_id or not self.subtopic_id:
            self.log_test("Subtopic Content Generation", False, "Missing course_id or subtopic_id from previous tests")
            return False
            
        try:
            async with self.session.post(
                f"{BACKEND_URL}/courses/{self.course_id}/subtopics/{self.subtopic_id}/content",
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    if "content" in data and data["content"]:
                        content_length = len(data["content"])
                        if content_length > 100:  # Expect substantial content
                            self.log_test("Subtopic Content Generation", True, 
                                        f"Generated {content_length} characters of content")
                            return True
                        else:
                            self.log_test("Subtopic Content Generation", False, 
                                        f"Content too short: {content_length} characters")
                            return False
                    else:
                        self.log_test("Subtopic Content Generation", False, "No content in response", data)
                        return False
                        
                else:
                    text = await response.text()
                    self.log_test("Subtopic Content Generation", False, f"HTTP {response.status}", text)
                    return False
                    
        except Exception as e:
            self.log_test("Subtopic Content Generation", False, f"Error: {str(e)}")
            return False
    
    async def test_quiz_generation(self):
        """Test quiz generation for a chapter"""
        if not self.course_id or not self.chapter_id:
            self.log_test("Quiz Generation", False, "Missing course_id or chapter_id from previous tests")
            return False
            
        try:
            async with self.session.post(
                f"{BACKEND_URL}/courses/{self.course_id}/chapters/{self.chapter_id}/quiz",
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Validate quiz structure
                    if "questions" in data and isinstance(data["questions"], list):
                        questions = data["questions"]
                        if len(questions) >= 3:  # Expect at least 3 questions
                            # Validate question structure
                            valid_questions = 0
                            for q in questions:
                                if all(field in q for field in ["question", "options", "correct_answer", "explanation"]):
                                    if isinstance(q["options"], list) and len(q["options"]) >= 2:
                                        if isinstance(q["correct_answer"], int) and 0 <= q["correct_answer"] < len(q["options"]):
                                            valid_questions += 1
                            
                            if valid_questions == len(questions):
                                self.quiz_id = data.get("id")
                                self.log_test("Quiz Generation", True, 
                                            f"Generated quiz with {len(questions)} valid questions")
                                return True
                            else:
                                self.log_test("Quiz Generation", False, 
                                            f"Only {valid_questions}/{len(questions)} questions are valid")
                                return False
                        else:
                            self.log_test("Quiz Generation", False, f"Expected at least 3 questions, got {len(questions)}")
                            return False
                    else:
                        self.log_test("Quiz Generation", False, "Invalid quiz structure", data)
                        return False
                        
                else:
                    text = await response.text()
                    self.log_test("Quiz Generation", False, f"HTTP {response.status}", text)
                    return False
                    
        except Exception as e:
            self.log_test("Quiz Generation", False, f"Error: {str(e)}")
            return False
    
    async def test_quiz_submission(self):
        """Test quiz submission and scoring"""
        if not self.chapter_id:
            self.log_test("Quiz Submission", False, "Missing chapter_id from previous tests")
            return False
            
        try:
            # Submit quiz with sample answers
            payload = {
                "chapter_id": self.chapter_id,
                "user_id": "test_user_123",
                "answers": [0, 1, 2, 0, 1]  # Sample answers
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/quiz/submit",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Validate response structure
                    required_fields = ["score", "correct_answers", "total_questions", "passed"]
                    if all(field in data for field in required_fields):
                        score = data["score"]
                        if isinstance(score, int) and 0 <= score <= 100:
                            self.log_test("Quiz Submission", True, 
                                        f"Quiz scored: {score}% ({data['correct_answers']}/{data['total_questions']} correct)")
                            return True
                        else:
                            self.log_test("Quiz Submission", False, f"Invalid score: {score}")
                            return False
                    else:
                        missing = [f for f in required_fields if f not in data]
                        self.log_test("Quiz Submission", False, f"Missing fields: {missing}", data)
                        return False
                        
                else:
                    text = await response.text()
                    self.log_test("Quiz Submission", False, f"HTTP {response.status}", text)
                    return False
                    
        except Exception as e:
            self.log_test("Quiz Submission", False, f"Error: {str(e)}")
            return False
    
    async def test_notes_crud(self):
        """Test notes CRUD operations"""
        user_id = "test_user_123"
        
        try:
            # Create a note
            note_payload = {
                "user_id": user_id,
                "course_id": self.course_id or "test_course",
                "subtopic_id": self.subtopic_id or "test_subtopic",
                "content": "This is a test note for Machine Learning fundamentals."
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/notes",
                json=note_payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    note_data = await response.json()
                    note_id = note_data.get("id")
                    
                    if note_id and note_data.get("content") == note_payload["content"]:
                        # Test getting user notes
                        async with self.session.get(f"{BACKEND_URL}/notes/{user_id}") as get_response:
                            if get_response.status == 200:
                                notes = await get_response.json()
                                if isinstance(notes, list) and len(notes) > 0:
                                    found_note = any(note.get("id") == note_id for note in notes)
                                    if found_note:
                                        self.log_test("Notes CRUD", True, f"Created and retrieved note successfully")
                                        return True
                                    else:
                                        self.log_test("Notes CRUD", False, "Created note not found in user notes")
                                        return False
                                else:
                                    self.log_test("Notes CRUD", False, "No notes returned for user")
                                    return False
                            else:
                                get_text = await get_response.text()
                                self.log_test("Notes CRUD", False, f"Failed to get notes: HTTP {get_response.status}", get_text)
                                return False
                    else:
                        self.log_test("Notes CRUD", False, "Note creation response invalid", note_data)
                        return False
                        
                else:
                    text = await response.text()
                    self.log_test("Notes CRUD", False, f"Failed to create note: HTTP {response.status}", text)
                    return False
                    
        except Exception as e:
            self.log_test("Notes CRUD", False, f"Error: {str(e)}")
            return False
    
    async def test_bookmarks_crud(self):
        """Test bookmarks CRUD operations"""
        user_id = "test_user_123"
        
        try:
            # Create a bookmark
            bookmark_payload = {
                "user_id": user_id,
                "course_id": self.course_id or "test_course",
                "subtopic_id": self.subtopic_id or "test_subtopic"
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/bookmarks",
                json=bookmark_payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    bookmark_data = await response.json()
                    bookmark_id = bookmark_data.get("id")
                    
                    if bookmark_id:
                        # Test getting user bookmarks
                        async with self.session.get(f"{BACKEND_URL}/bookmarks/{user_id}") as get_response:
                            if get_response.status == 200:
                                bookmarks = await get_response.json()
                                if isinstance(bookmarks, list) and len(bookmarks) > 0:
                                    found_bookmark = any(bookmark.get("id") == bookmark_id for bookmark in bookmarks)
                                    if found_bookmark:
                                        self.log_test("Bookmarks CRUD", True, f"Created and retrieved bookmark successfully")
                                        return True
                                    else:
                                        self.log_test("Bookmarks CRUD", False, "Created bookmark not found in user bookmarks")
                                        return False
                                else:
                                    self.log_test("Bookmarks CRUD", False, "No bookmarks returned for user")
                                    return False
                            else:
                                get_text = await get_response.text()
                                self.log_test("Bookmarks CRUD", False, f"Failed to get bookmarks: HTTP {get_response.status}", get_text)
                                return False
                    else:
                        self.log_test("Bookmarks CRUD", False, "Bookmark creation response invalid", bookmark_data)
                        return False
                        
                else:
                    text = await response.text()
                    self.log_test("Bookmarks CRUD", False, f"Failed to create bookmark: HTTP {response.status}", text)
                    return False
                    
        except Exception as e:
            self.log_test("Bookmarks CRUD", False, f"Error: {str(e)}")
            return False
    
    async def run_all_tests(self):
        """Run all backend tests in sequence"""
        print("🚀 Starting AICademy Backend API Tests")
        print(f"Testing against: {BACKEND_URL}")
        print("=" * 60)
        
        # Test sequence - order matters for dependent tests
        tests = [
            ("Health Check", self.test_health_check),
            ("Course Generation", self.test_course_generation),
            ("Get All Courses", self.test_get_courses),
            ("Get Specific Course", self.test_get_specific_course),
            ("Subtopic Content Generation", self.test_subtopic_content_generation),
            ("Quiz Generation", self.test_quiz_generation),
            ("Quiz Submission", self.test_quiz_submission),
            ("Notes CRUD", self.test_notes_crud),
            ("Bookmarks CRUD", self.test_bookmarks_crud),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                result = await test_func()
                if result:
                    passed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Unexpected error: {str(e)}")
        
        print("=" * 60)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Backend is working correctly.")
        else:
            print(f"⚠️  {total - passed} tests failed. Check details above.")
        
        return passed, total, self.test_results

async def main():
    """Main test runner"""
    async with AICademyTester() as tester:
        passed, total, results = await tester.run_all_tests()
        
        # Return exit code based on results
        if passed == total:
            sys.exit(0)
        else:
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())