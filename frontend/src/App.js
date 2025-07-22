import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [topic, setTopic] = useState('');
  const [course, setCourse] = useState(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [subtopicContent, setSubtopicContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [notes, setNotes] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  
  // Dummy user ID for demo
  const userId = 'demo-user-123';

  const generateCourse = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic!');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/courses/generate`, {
        topic: topic
      });
      setCourse(response.data);
      setCurrentView('course');
    } catch (error) {
      console.error('Error generating course:', error);
      alert('Failed to generate course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openSubtopic = async (subtopicId, courseId) => {
    setLoading(true);
    setSelectedSubtopic(subtopicId);
    
    try {
      // Check if content already exists
      let content = '';
      const chapter = course.chapters.find(ch => 
        ch.subtopics.some(st => st.id === subtopicId)
      );
      const subtopic = chapter?.subtopics.find(st => st.id === subtopicId);
      
      if (subtopic?.content) {
        content = subtopic.content;
      } else {
        // Generate content
        const response = await axios.post(
          `${API_URL}/api/courses/${courseId}/subtopics/${subtopicId}/content`
        );
        content = response.data.content;
        
        // Update course data
        setCourse(prevCourse => {
          const updatedCourse = { ...prevCourse };
          const chapterIndex = updatedCourse.chapters.findIndex(ch => 
            ch.subtopics.some(st => st.id === subtopicId)
          );
          const subtopicIndex = updatedCourse.chapters[chapterIndex].subtopics.findIndex(
            st => st.id === subtopicId
          );
          updatedCourse.chapters[chapterIndex].subtopics[subtopicIndex].content = content;
          return updatedCourse;
        });
      }
      
      setSubtopicContent(content);
      setCurrentView('content');
    } catch (error) {
      console.error('Error loading content:', error);
      alert('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async (chapterId, courseId) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/courses/${courseId}/chapters/${chapterId}/quiz`
      );
      setQuiz(response.data);
      setUserAnswers(new Array(response.data.questions.length).fill(-1));
      setCurrentView('quiz');
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (userAnswers.some(answer => answer === -1)) {
      alert('Please answer all questions before submitting.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/quiz/submit`, {
        chapter_id: quiz.chapter_id,
        user_id: userId,
        answers: userAnswers
      });
      setQuizResult(response.data);
      setCurrentView('quiz-result');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async (subtopicId, noteContent) => {
    try {
      await axios.post(`${API_URL}/api/notes`, {
        user_id: userId,
        course_id: course.id,
        subtopic_id: subtopicId,
        content: noteContent
      });
      setNotes(prev => ({ ...prev, [subtopicId]: noteContent }));
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const toggleBookmark = async (subtopicId) => {
    try {
      await axios.post(`${API_URL}/api/bookmarks`, {
        user_id: userId,
        course_id: course.id,
        subtopic_id: subtopicId
      });
      setBookmarks(prev => [...prev, subtopicId]);
    } catch (error) {
      console.error('Error bookmarking:', error);
    }
  };

  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-6">
            🧠 AI-Powered Learning Platform
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AICademy</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform any topic into a comprehensive, personalized learning experience. 
            Our AI creates structured courses, interactive content, and adaptive quizzes just for you.
          </p>
        </div>

        {/* Course Generation Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Start Learning Anything</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to learn today?
                </label>
                <input
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Data Science, Web Development, Machine Learning, Blockchain..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && generateCourse()}
                />
              </div>
              
              <button
                onClick={generateCourse}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating Your Course...
                  </div>
                ) : (
                  'Generate Course with AI ✨'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              📚
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Dynamic Course Creation</h3>
            <p className="text-gray-600">AI generates comprehensive 10-12 chapter courses with detailed subtopics tailored to your learning needs.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              🧠
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Adaptive Learning</h3>
            <p className="text-gray-600">Interactive quizzes and personalized content that adapts to your progress and learning style.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              📊
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Progress Tracking</h3>
            <p className="text-gray-600">Track your learning journey with detailed progress analytics, notes, and bookmarks.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCourse = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <button
            onClick={() => setCurrentView('home')}
            className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center"
          >
            ← Back to Home
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{course?.title}</h1>
          <p className="text-lg text-gray-600 mb-6">{course?.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>📚 {course?.chapters?.length} Chapters</span>
            <span>⏱️ Interactive Learning</span>
            <span>🧠 AI-Generated Content</span>
          </div>
        </div>

        {/* Chapters Grid */}
        <div className="grid gap-6">
          {course?.chapters?.map((chapter, chapterIndex) => (
            <div key={chapter.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Chapter {chapterIndex + 1}: {chapter.title}
                </h2>
                <button
                  onClick={() => generateQuiz(chapter.id, course.id)}
                  className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-teal-600 transition"
                  disabled={loading}
                >
                  Take Quiz 📝
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">{chapter.summary}</p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chapter.subtopics.map((subtopic) => (
                  <div
                    key={subtopic.id}
                    onClick={() => openSubtopic(subtopic.id, course.id)}
                    className="bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{subtopic.title}</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(subtopic.id);
                        }}
                        className="text-gray-400 hover:text-yellow-500"
                      >
                        {bookmarks.includes(subtopic.id) ? '⭐' : '☆'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded text-xs ${
                        subtopic.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                        subtopic.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {subtopic.difficulty}
                      </span>
                      <span>⏱️ {subtopic.estimated_time} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => setCurrentView('course')}
              className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center"
            >
              ← Back to Course
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Lesson Content</h1>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                <span>Loading content...</span>
              </div>
            ) : (
              <div className="prose prose-lg max-w-none">
                <div dangerouslySetInnerHTML={{ 
                  __html: subtopicContent.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
                }} />
              </div>
            )}
          </div>
          
          {/* Notes Section */}
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-lg font-bold mb-3">Your Notes</h3>
            <textarea
              value={notes[selectedSubtopic] || ''}
              onChange={(e) => setNotes(prev => ({ ...prev, [selectedSubtopic]: e.target.value }))}
              onBlur={(e) => saveNote(selectedSubtopic, e.target.value)}
              placeholder="Add your notes here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuiz = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <button
            onClick={() => setCurrentView('course')}
            className="text-indigo-600 hover:text-indigo-800 mb-6 flex items-center"
          >
            ← Back to Course
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Chapter Quiz</h1>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
              <span>Generating quiz...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {quiz?.questions?.map((question, qIndex) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {qIndex + 1}. {question.question}
                  </h3>
                  
                  <div className="space-y-3">
                    {question.options.map((option, oIndex) => (
                      <label key={oIndex} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          value={oIndex}
                          checked={userAnswers[qIndex] === oIndex}
                          onChange={() => {
                            const newAnswers = [...userAnswers];
                            newAnswers[qIndex] = oIndex;
                            setUserAnswers(newAnswers);
                          }}
                          className="mr-3"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              
              <button
                onClick={submitQuiz}
                disabled={loading || userAnswers.some(answer => answer === -1)}
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-4 px-6 rounded-lg hover:from-green-600 hover:to-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Quiz
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderQuizResult = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl ${
            quizResult?.passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {quizResult?.passed ? '🎉' : '📚'}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {quizResult?.passed ? 'Congratulations!' : 'Keep Learning!'}
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            You scored {quizResult?.score}% ({quizResult?.correct_answers}/{quizResult?.total_questions} correct)
          </p>
          
          {!quizResult?.passed && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <p className="text-yellow-800">
                💡 Since you scored below 60%, we recommend reviewing the chapter content before moving forward.
              </p>
            </div>
          )}
          
          <div className="space-x-4">
            <button
              onClick={() => setCurrentView('course')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition"
            >
              Back to Course
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="App">
      {currentView === 'home' && renderHome()}
      {currentView === 'course' && renderCourse()}
      {currentView === 'content' && renderContent()}
      {currentView === 'quiz' && renderQuiz()}
      {currentView === 'quiz-result' && renderQuizResult()}
    </div>
  );
}

export default App;