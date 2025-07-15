import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  BarChart3, 
  Play, 
  CheckCircle, 
  FileText, 
  Video, 
  List, 
  Brain,
  ArrowLeft,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { MarkdownRenderer } from './MarkdownRenderer';
import { generateSubtopicContent, type CourseContent, type CourseModule, type CourseSubtopic } from '../services/aiService';

export function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<CourseContent | null>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<CourseSubtopic | null>(null);
  const [subtopicContent, setSubtopicContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
      if (user) {
        fetchEnrollment();
      }
    }
  }, [courseId, user]);

  const fetchCourseDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      setCourse(data);
      
      if (data.modules && data.modules.length > 0) {
        setSelectedModule(data.modules[0]);
        if (data.modules[0].subtopics && data.modules[0].subtopics.length > 0) {
          setSelectedSubtopic(data.modules[0].subtopics[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollment = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setEnrollment(data);
    } catch (error) {
      console.error('Error fetching enrollment:', error);
    }
  };

  const enrollInCourse = async () => {
    if (!user || !course) return;
    
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          progress: 0,
          completed_modules: [],
          current_module: 0
        });

      if (error) throw error;
      fetchEnrollment();
    } catch (error) {
      console.error('Error enrolling:', error);
    }
  };

  const loadSubtopicContent = async (subtopic: CourseSubtopic) => {
    if (!course) return;
    
    setLoadingContent(true);
    try {
      if (subtopic.content) {
        setSubtopicContent(subtopic.content);
      } else {
        const content = await generateSubtopicContent(course.title, subtopic.title);
        setSubtopicContent(content);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setSubtopicContent('Failed to load content. Please try again.');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleSubtopicSelect = (subtopic: CourseSubtopic) => {
    setSelectedSubtopic(subtopic);
    loadSubtopicContent(subtopic);
  };

  const calculateQuizScore = () => {
    if (!course?.quiz) return;
    
    let correct = 0;
    course.quiz.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    
    const score = Math.round((correct / course.quiz.length) * 100);
    setQuizScore(score);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Course not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-purple-400 hover:text-purple-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex flex-col lg:flex-row gap-6">
            <img
              src={course.image_url || `https://images.unsplash.com/800x600/?${encodeURIComponent(course.title)}`}
              alt={course.title}
              className="w-full lg:w-64 h-48 object-cover rounded-xl"
            />
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-4">{course.title}</h1>
              <p className="text-gray-300 text-lg mb-6">{course.description}</p>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center text-purple-300">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  <span>{course.difficulty_level}</span>
                </div>
                <div className="flex items-center text-purple-300">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>{course.estimated_duration}</span>
                </div>
                <div className="flex items-center text-purple-300">
                  <BookOpen className="w-5 h-5 mr-2" />
                  <span>{course.modules?.length || 0} Modules</span>
                </div>
              </div>

              {!enrollment ? (
                <button
                  onClick={enrollInCourse}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-medium flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Enroll Now
                </button>
              ) : (
                <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-6 py-3 rounded-xl inline-flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Enrolled - Progress: {enrollment.progress}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'content', label: 'Course Content', icon: BookOpen },
              { id: 'articles', label: 'Articles', icon: FileText },
              { id: 'videos', label: 'Videos', icon: Video },
              { id: 'glossary', label: 'Glossary', icon: List },
              { id: 'quiz', label: 'Quiz', icon: Brain }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'content' && (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Module Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 sticky top-8">
                <h3 className="text-xl font-semibold text-white mb-4">Course Modules</h3>
                <div className="space-y-2">
                  {course.modules?.map((module, index) => (
                    <div key={module.id}>
                      <button
                        onClick={() => {
                          setSelectedModule(module);
                          if (module.subtopics && module.subtopics.length > 0) {
                            handleSubtopicSelect(module.subtopics[0]);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedModule?.id === module.id
                            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                            : 'text-gray-300 hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="font-medium">Module {index + 1}</div>
                        <div className="text-sm opacity-80">{module.title}</div>
                      </button>
                      
                      {selectedModule?.id === module.id && module.subtopics && (
                        <div className="ml-4 mt-2 space-y-1">
                          {module.subtopics.map((subtopic) => (
                            <button
                              key={subtopic.id}
                              onClick={() => handleSubtopicSelect(subtopic)}
                              className={`w-full text-left p-2 rounded text-sm transition-colors ${
                                selectedSubtopic?.id === subtopic.id
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                              }`}
                            >
                              {subtopic.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
                {selectedSubtopic ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">{selectedSubtopic.title}</h2>
                      <span className="text-purple-400 text-sm bg-purple-500/20 px-3 py-1 rounded-full">
                        {selectedSubtopic.estimatedTime}
                      </span>
                    </div>
                    
                    {loadingContent ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                      </div>
                    ) : (
                      <MarkdownRenderer content={subtopicContent} />
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Select a Topic</h3>
                    <p className="text-gray-400">Choose a module and subtopic to start learning</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'articles' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {course.resources?.articles?.map((article, index) => (
              <div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all">
                <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2">{article.title}</h3>
                <p className="text-gray-300 mb-4 line-clamp-3">{article.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <span>{article.source}</span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Read Article <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {course.resources?.videos?.map((video, index) => (
              <div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700 hover:border-purple-500/50 transition-all">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{video.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{video.channelTitle}</p>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{video.description}</p>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Watch Video
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'glossary' && (
          <div className="grid md:grid-cols-2 gap-6">
            {course.glossary?.map((term, index) => (
              <div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-purple-400 mb-3">{term.term}</h3>
                <p className="text-gray-300 mb-3">{term.definition}</p>
                {term.example && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                    <p className="text-purple-300 text-sm font-medium mb-1">Example:</p>
                    <p className="text-gray-300 text-sm">{term.example}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
              <div className="text-center mb-8">
                <Brain className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">Course Quiz</h2>
                <p className="text-gray-300">Test your knowledge with these questions</p>
              </div>

              {quizScore !== null && (
                <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/20 rounded-xl p-6 mb-8 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h3>
                  <p className="text-purple-300 text-lg">Your Score: {quizScore}%</p>
                  <p className="text-gray-300 mt-2">
                    {quizScore >= 80 ? 'Excellent work!' : quizScore >= 60 ? 'Good job!' : 'Keep studying!'}
                  </p>
                </div>
              )}

              <div className="space-y-8">
                {course.quiz?.map((question, index) => (
                  <div key={question.id} className="bg-gray-700/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      {index + 1}. {question.question}
                    </h3>
                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => (
                        <label
                          key={optionIndex}
                          className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedAnswers[question.id] === optionIndex
                              ? 'bg-purple-600/20 border border-purple-500/50'
                              : 'bg-gray-600/30 hover:bg-gray-600/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={optionIndex}
                            onChange={() => setSelectedAnswers(prev => ({
                              ...prev,
                              [question.id]: optionIndex
                            }))}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            selectedAnswers[question.id] === optionIndex
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-400'
                          }`}>
                            {selectedAnswers[question.id] === optionIndex && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          <span className="text-gray-300">{option}</span>
                        </label>
                      ))}
                    </div>
                    
                    {quizScore !== null && (
                      <div className="mt-4 p-3 bg-gray-600/30 rounded-lg">
                        <p className="text-sm text-gray-300">
                          <strong className="text-purple-400">Explanation:</strong> {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {quizScore === null && (
                <div className="text-center mt-8">
                  <button
                    onClick={calculateQuizScore}
                    disabled={Object.keys(selectedAnswers).length !== course.quiz?.length}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Quiz
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}