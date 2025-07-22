# AICademy - AI-Powered Learning Platform

## Overview
AICademy is an AI-driven educational platform that dynamically generates personalized courses based on user-input topics. Using advanced AI capabilities, it creates structured curricula, interactive lessons, adaptive quizzes, and progress tracking.

## Key Features

### 🧠 Dynamic Course Generation
- Creates 10-12 chapter courses from any topic
- Detailed chapter outlines with subtopics, difficulty levels, and time estimates
- JSON-structured curriculum output

### 📚 Interactive Content Delivery
- ChatGPT-style lesson explanations
- Code snippets with proper formatting
- Common mistake highlights
- Summary takeaways

### 🧪 Adaptive Assessment System
- Chapter-end quizzes with 5 MCQs
- Automatic revision for scores <60%
- Explanations for correct answers

### 📈 Progress Tracking
- Firebase-powered user progress storage
- Completion status tracking
- Quiz performance analytics

### 🌐 Course Completion Resources
- Personalized learning roadmap
- Essential glossary terms
- Curated articles and videos
- Project ideas and career paths

## Tech Stack
- **AI Model**: Together Chat (DeepSeek R1)
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Frontend**: Modern web framework (React/Vue/Angular)
- **Additional**: Text-to-Speech for narration

## Implementation Highlights

### Course Structure (JSON Example)
```json
{
  "course_title": "Data Science Fundamentals",
  "chapters": [
    {
      "title": "Introduction to Python",
      "summary": "Learn Python basics for data analysis...",
      "subtopics": [
        {
          "title": "Variables and Data Types",
          "time": 15,
          "difficulty": "Beginner"
        }
      ]
    }
  ]
}
```

### Content Generation Workflow
1. User inputs topic
2. AI generates course outline
3. User selects subtopic
4. AI delivers interactive lesson content
5. Chapter completion triggers quiz
6. Progress saved to Firestore

## Setup Instructions
1. Clone repository: `git clone https://github.com/your-repo/aicademy.git`
2. Install dependencies: `npm install`
3. Configure Firebase:
   - Create project at firebase.google.com
   - Add config to `src/firebase.js`
4. Start development server: `npm start`

## Production Features
- AI-powered quiz recommendations
- Learning analytics dashboard
- Bookmarking & note-taking
- Voice narration
- AI doubt solver
- Certificate generation
- Gamification (badges, streaks, leaderboards)

---

**License**: MIT  
**Version**: 1.0.0  
**Maintainer**: Your Name
