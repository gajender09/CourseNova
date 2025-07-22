import { useParams } from 'react-router-dom';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { 
  BookmarkIcon, 
  ClockIcon, 
  ChartBarIcon,
  AcademicCapIcon,
  UserIcon,
  ArrowLeftOnRectangleIcon,
  HomeIcon,
  PlusIcon,
  PlayIcon,
  DocumentTextIcon,
  TrophyIcon,
  StarIcon,
  ArrowRightIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserInfo();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      const { access_token, user_id, full_name } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('userId', user_id);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setUser({ id: user_id, full_name, email });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (email, password, fullName) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        full_name: fullName
      });
      const { access_token, user_id, full_name } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('userId', user_id);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setUser({ id: user_id, full_name, email });
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Landing Page Component
const LandingPage = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    
    try {
      if (authMode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.fullName);
      }
      navigate('/dashboard');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-8">
              🚀 AI-Powered Learning Revolution
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-8">
              Master Any Subject with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                AICademy
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-4xl mx-auto">
              Transform your learning journey with AI-generated courses, personalized content, 
              interactive quizzes, and comprehensive progress tracking. Learn anything, anywhere, anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {setShowAuth(true); setAuthMode('register')}}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:from-cyan-600 hover:to-purple-700 transform transition hover:scale-105 shadow-xl"
              >
                Start Learning Free
              </button>
              <button
                onClick={() => {setShowAuth(true); setAuthMode('login')}}
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-4 px-8 rounded-xl hover:bg-white/20 transform transition hover:scale-105"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Revolutionary Learning Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of education with AI-powered course generation and personalized learning paths.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <AcademicCapIcon className="w-8 h-8" />,
                title: "AI Course Generation",
                description: "Generate comprehensive courses on any topic with 12+ chapters, detailed content, and structured learning paths.",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: <PlayIcon className="w-8 h-8" />,
                title: "Interactive Content",
                description: "Engaging lessons with videos, articles, code examples, and hands-on exercises tailored to your learning style.",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: <ChartBarIcon className="w-8 h-8" />,
                title: "Progress Analytics",
                description: "Track your learning journey with detailed analytics, completion rates, and personalized insights.",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: <TrophyIcon className="w-8 h-8" />,
                title: "Smart Assessments",
                description: "Adaptive quizzes and final exams that adjust to your knowledge level and provide instant feedback.",
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: <BookmarkIcon className="w-8 h-8" />,
                title: "Personal Library",
                description: "Save important lessons, create notes, and build your personal knowledge library for future reference.",
                color: "from-indigo-500 to-purple-500"
              },
              {
                icon: <StarIcon className="w-8 h-8" />,
                title: "Career Roadmaps",
                description: "Get personalized career guidance, project suggestions, and next steps for your professional growth.",
                color: "from-pink-500 to-red-500"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-white mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { number: "50K+", label: "Courses Generated" },
              { number: "2M+", label: "Minutes Learned" },
              { number: "95%", label: "Completion Rate" }
            ].map((stat, index) => (
              <div key={index} className="text-white">
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-5xl font-bold text-white mb-8">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Join thousands of learners who are advancing their careers with AI-powered education.
          </p>
          <button
            onClick={() => {setShowAuth(true); setAuthMode('register')}}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-6 px-12 rounded-2xl hover:from-cyan-600 hover:to-purple-700 transform transition hover:scale-105 shadow-2xl text-xl"
          >
            Get Started Now - It's Free! 🚀
          </button>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {authMode === 'login' ? 'Welcome Back!' : 'Create Account'}
              </h2>
              <button
                onClick={() => setShowAuth(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your full name"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your password"
                  minLength={6}
                />
              </div>

              {authError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="text-center mt-6">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-indigo-600 hover:text-indigo-800"
              >
                {authMode === 'login' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">AICademy</h1>
              <nav className="hidden md:flex space-x-6">
                <button className="flex items-center space-x-2 text-indigo-600 font-medium">
                  <HomeIcon className="w-5 h-5" />
                  <span>Dashboard</span>
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/generate')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>New Course</span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-700 font-medium">{user?.full_name}</span>
                <button
                  onClick={logout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeftOnRectangleIcon className="w-6 h-6 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.full_name}! 👋
          </h2>
          <p className="text-gray-600">
            Continue your learning journey and explore new courses.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: <AcademicCapIcon className="w-6 h-6" />,
              title: "Total Courses",
              value: dashboardData?.stats?.total_courses || 0,
              color: "from-blue-500 to-cyan-500"
            },
            {
              icon: <TrophyIcon className="w-6 h-6" />,
              title: "Completed",
              value: dashboardData?.stats?.completed_courses || 0,
              color: "from-green-500 to-emerald-500"
            },
            {
              icon: <ClockIcon className="w-6 h-6" />,
              title: "Study Time",
              value: formatTime(dashboardData?.stats?.total_study_time || 0),
              color: "from-purple-500 to-pink-500"
            },
            {
              icon: <ChartBarIcon className="w-6 h-6" />,
              title: "Active Courses",
              value: dashboardData?.stats?.active_courses || 0,
              color: "from-yellow-500 to-orange-500"
            }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Course Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Your Courses</h3>
            {dashboardData?.courses?.length === 0 && (
              <button
                onClick={() => navigate('/generate')}
                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Your First Course</span>
              </button>
            )}
          </div>

          {dashboardData?.courses?.length === 0 ? (
            <div className="text-center py-16">
              <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No courses yet</h3>
              <p className="text-gray-500 mb-6">Create your first AI-powered course to get started!</p>
              <button
                onClick={() => navigate('/generate')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700"
              >
                Generate Course
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData?.courses?.map((course) => (
                <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {course.topic}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatTime(course.total_duration)}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h4>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {course.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(course.progress)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(course.progress)}`}
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{course.chapters_completed}/{course.total_chapters} chapters</span>
                      <span>{formatTime(course.study_time)} studied</span>
                    </div>

                    <button
                      onClick={() => navigate(`/course/${course.id}`)}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center space-x-2"
                    >
                      <span>{course.progress > 0 ? 'Continue' : 'Start'} Learning</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Course Generation Component  
const CourseGenerator = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const generateCourse = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Please enter a topic!');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/courses/generate`, {
        topic: topic
      });
      
      // Navigate to the generated course
      navigate(`/course/${response.data.id}`);
    } catch (error) {
      console.error('Error generating course:', error);
      alert('Failed to generate course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-8 text-indigo-600 hover:text-indigo-800 flex items-center space-x-2 mx-auto"
          >
            <ArrowRightIcon className="w-5 h-5 rotate-180" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-full text-sm font-medium mb-6">
            🧠 AI Course Generator
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Create Your Perfect
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Learning Experience
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Enter any topic and our AI will generate a comprehensive course with chapters, 
            interactive content, videos, articles, and personalized quizzes just for you.
          </p>
        </div>

        {/* Course Generation Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <form onSubmit={generateCourse} className="space-y-8">
            <div>
              <label htmlFor="topic" className="block text-lg font-semibold text-gray-900 mb-4">
                What would you like to master today?
              </label>
              <input
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Machine Learning, React Development, Digital Marketing, Data Science..."
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                disabled={loading}
              />
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What you'll get:</h3>
              <ul className="space-y-2">
                {[
                  "12-15 comprehensive chapters with structured content",
                  "Interactive lessons with videos and articles",
                  "Hands-on exercises and real-world examples", 
                  "Chapter quizzes and final assessment",
                  "Personal notes and bookmark system",
                  "Career roadmap and next steps guide"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-5 px-8 rounded-xl hover:from-indigo-700 hover:to-purple-700 transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-2xl text-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Generating Your Course...
                </div>
              ) : (
                <>Generate Course with AI ✨</>
              )}
            </button>
          </form>
        </div>

        {/* Popular Topics */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Popular topics:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              "Python Programming", "Machine Learning", "Web Development", 
              "Digital Marketing", "Data Science", "Blockchain", 
              "UI/UX Design", "Cloud Computing"
            ].map((popularTopic, index) => (
              <button
                key={index}
                onClick={() => setTopic(popularTopic)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                disabled={loading}
              >
                {popularTopic}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Course View Component
const CourseView = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [subtopicContent, setSubtopicContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [currentView, setCurrentView] = useState('overview'); // overview, content, roadmap
  const [notes, setNotes] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourse();
    fetchUserData();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses/${courseId}`);
      setCourse(response.data);
    } catch (error) {
      console.error('Error fetching course:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const [notesRes, bookmarksRes] = await Promise.all([
        axios.get(`${API_URL}/api/notes`),
        axios.get(`${API_URL}/api/bookmarks`)
      ]);
      
      const courseNotes = notesRes.data.filter(note => note.course_id === courseId);
      const noteMap = {};
      courseNotes.forEach(note => {
        noteMap[note.subtopic_id] = note.content;
      });
      setNotes(noteMap);
      
      const courseBookmarks = bookmarksRes.data
        .filter(bookmark => bookmark.course_id === courseId)
        .map(bookmark => bookmark.subtopic_id);
      setBookmarks(courseBookmarks);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const openSubtopic = async (subtopicId) => {
    setContentLoading(true);
    setSelectedSubtopic(subtopicId);
    
    try {
      // Find subtopic to check if content exists
      let subtopic = null;
      for (const chapter of course.chapters) {
        subtopic = chapter.subtopics.find(st => st.id === subtopicId);
        if (subtopic) break;
      }
      
      if (subtopic?.content) {
        setSubtopicContent({
          content: subtopic.content,
          videos: subtopic.videos || [],
          articles: subtopic.articles || []
        });
      } else {
        // Generate content
        const response = await axios.post(
          `${API_URL}/api/courses/${courseId}/subtopics/${subtopicId}/content`
        );
        setSubtopicContent(response.data);
        
        // Update course data
        setCourse(prevCourse => {
          const updatedCourse = { ...prevCourse };
          for (const chapter of updatedCourse.chapters) {
            for (const st of chapter.subtopics) {
              if (st.id === subtopicId) {
                st.content = response.data.content;
                st.videos = response.data.videos;
                st.articles = response.data.articles;
                break;
              }
            }
          }
          return updatedCourse;
        });
      }
      
      setCurrentView('content');
      
      // Update progress
      await axios.post(`${API_URL}/api/progress/update`, {
        course_id: courseId,
        subtopic_id: subtopicId,
        study_time_minutes: 5
      });
      
    } catch (error) {
      console.error('Error loading content:', error);
      alert('Failed to load content. Please try again.');
    } finally {
      setContentLoading(false);
    }
  };

  const saveNote = async (subtopicId, noteContent) => {
    try {
      await axios.post(`${API_URL}/api/notes`, {
        course_id: courseId,
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
      if (!bookmarks.includes(subtopicId)) {
        await axios.post(`${API_URL}/api/bookmarks`, {
          course_id: courseId,
          subtopic_id: subtopicId
        });
        setBookmarks(prev => [...prev, subtopicId]);
      }
    } catch (error) {
      console.error('Error bookmarking:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowRightIcon className="w-6 h-6 rotate-180" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">
                {course.title}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('overview')}
                className={`px-4 py-2 rounded-lg ${
                  currentView === 'overview' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setCurrentView('roadmap')}
                className={`px-4 py-2 rounded-lg ${
                  currentView === 'roadmap' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Roadmap
              </button>
            </div>
          </div>
        </div>
      </header>

      {currentView === 'overview' && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Course Info */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full mb-3 inline-block">
                  {course.topic}
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
                <p className="text-lg text-gray-600 mb-6">{course.description}</p>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <span>📚 {course.chapters.length} Chapters</span>
                  <span>⏱️ {Math.floor(course.metadata.total_duration / 60)}h {course.metadata.total_duration % 60}m</span>
                  <span>🎯 Interactive Learning</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chapters */}
          <div className="space-y-6">
            {course.chapters.map((chapter, chapterIndex) => (
              <div key={chapter.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                  <h2 className="text-xl font-bold mb-2">
                    Chapter {chapterIndex + 1}: {chapter.title}
                  </h2>
                  <p className="opacity-90">{chapter.summary}</p>
                </div>
                
                <div className="p-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chapter.subtopics.map((subtopic) => (
                      <div
                        key={subtopic.id}
                        onClick={() => openSubtopic(subtopic.id)}
                        className="bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {subtopic.title}
                          </h4>
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
                        <div className="flex items-center justify-between text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            subtopic.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                            subtopic.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {subtopic.difficulty}
                          </span>
                          <span className="text-gray-500 flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {subtopic.estimated_time}m
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentView === 'content' && (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-8">
              {contentLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                  <span>Loading content...</span>
                </div>
              ) : (
                <>
                  {/* Content */}
                  <div className="prose prose-lg max-w-none mb-8">
                    <ReactMarkdown>{subtopicContent.content}</ReactMarkdown>
                  </div>

                  {/* Videos Section */}
                  {subtopicContent.videos && subtopicContent.videos.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-4 flex items-center">
                        <PlayIcon className="w-6 h-6 mr-2 text-red-500" />
                        Related Videos
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {subtopicContent.videos.map((video, index) => (
                          <a
                            key={index}
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                          >
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              className="w-24 h-18 object-cover rounded"
                            />
                            <div>
                              <h4 className="font-semibold text-sm mb-1 line-clamp-2">{video.title}</h4>
                              <p className="text-xs text-gray-600 mb-1">{video.channel}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">{video.description}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Articles Section */}
                  {subtopicContent.articles && subtopicContent.articles.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-4 flex items-center">
                        <DocumentTextIcon className="w-6 h-6 mr-2 text-blue-500" />
                        Related Articles
                      </h3>
                      <div className="space-y-3">
                        {subtopicContent.articles.map((article, index) => (
                          <a
                            key={index}
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 border rounded-lg hover:shadow-md transition-shadow"
                          >
                            <h4 className="font-semibold mb-1">{article.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{article.description}</p>
                            <span className="text-xs text-indigo-600">{article.source}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Notes Section */}
            <div className="border-t p-6">
              <h3 className="text-lg font-bold mb-3 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Your Notes
              </h3>
              <textarea
                value={notes[selectedSubtopic] || ''}
                onChange={(e) => setNotes(prev => ({ ...prev, [selectedSubtopic]: e.target.value }))}
                onBlur={(e) => saveNote(selectedSubtopic, e.target.value)}
                placeholder="Add your notes here..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
              />
            </div>
          </div>
        </div>
      )}

      {currentView === 'roadmap' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <TrophyIcon className="w-8 h-8 mr-3 text-yellow-500" />
              Your Learning Roadmap
            </h2>
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown>{course.roadmap}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/" />;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/generate" element={
              <ProtectedRoute>
                <CourseGenerator />
              </ProtectedRoute>
            } />
            <Route path="/course/:courseId" element={
              <ProtectedRoute>
                <CourseView />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;