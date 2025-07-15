import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Brain, BookOpen, Target, Sparkles, ArrowRight, CheckCircle2, Menu, X, User, LogOut } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { CourseGenerator } from './components/CourseGenerator';
import { Dashboard } from './components/Dashboard';
import { CourseDetails } from './components/CourseDetails';
import { useAuthStore } from './store/authStore';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut, initialize, initialized } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        {/* Navigation */}
        <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
          <nav className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">AICADEMY</span>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                {user ? (
                  <>
                    <a href="/dashboard" className="text-gray-300 hover:text-white transition-colors">Dashboard</a>
                    <a href="/create" className="text-gray-300 hover:text-white transition-colors">Create Course</a>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <User className="w-5 h-5" />
                        <span>{user.email}</span>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
                    <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How it Works</a>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden mt-4 pb-4 border-t border-gray-700 pt-4">
                {user ? (
                  <div className="space-y-4">
                    <a href="/dashboard" className="block text-gray-300 hover:text-white transition-colors">Dashboard</a>
                    <a href="/create" className="block text-gray-300 hover:text-white transition-colors">Create Course</a>
                    <div className="pt-4 border-t border-gray-700">
                      <p className="text-gray-400 text-sm mb-2">{user.email}</p>
                      <button
                        onClick={handleSignOut}
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <a href="#features" className="block text-gray-300 hover:text-white transition-colors">Features</a>
                    <a href="#how-it-works" className="block text-gray-300 hover:text-white transition-colors">How it Works</a>
                    <button
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all"
                    >
                      Get Started
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </header>

        {/* Main Content */}
        <main>
          <Routes>
            <Route path="/" element={
              user ? <Navigate to="/dashboard" /> : <LandingPage onGetStarted={() => setIsAuthModalOpen(true)} />
            } />
            <Route path="/dashboard" element={
              user ? <Dashboard /> : <Navigate to="/" />
            } />
            <Route path="/create" element={
              user ? <CourseGenerator /> : <Navigate to="/" />
            } />
            <Route path="/course/:courseId" element={
              user ? <CourseDetails /> : <Navigate to="/" />
            } />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 py-12 border-t border-gray-800">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AICADEMY</span>
              </div>
              <div className="flex space-x-8">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
              <p>&copy; 2024 AICADEMY. All rights reserved.</p>
            </div>
          </div>
        </footer>

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    </Router>
  );
}

function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-8">
            <Brain className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Create Professional Courses with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600"> AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your expertise into engaging online courses in minutes. Our AI-powered platform creates comprehensive curriculum, interactive content, and assessments automatically.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-500/25"
            >
              Start Creating <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto bg-gray-800 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-gray-700 transition-all border border-gray-600">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-800/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful AI-Driven Features
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to create, manage, and deliver exceptional learning experiences
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BookOpen className="w-8 h-8 text-purple-500" />,
                title: "AI Curriculum Design",
                description: "Generate comprehensive course outlines with modules, subtopics, and detailed content using advanced AI."
              },
              {
                icon: <Target className="w-8 h-8 text-purple-500" />,
                title: "Interactive Learning",
                description: "Create engaging content with markdown formatting, code examples, and auto-generated quizzes."
              },
              {
                icon: <Sparkles className="w-8 h-8 text-purple-500" />,
                title: "Rich Resources",
                description: "Automatically curate relevant articles, videos, and glossary terms from multiple sources."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300">
                <div className="mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-semibold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Create professional courses in four simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Input Your Topic",
                description: "Enter your course subject, target audience, and difficulty level"
              },
              {
                step: "2",
                title: "AI Generation",
                description: "Our AI creates comprehensive modules, content, and resources automatically"
              },
              {
                step: "3",
                title: "Review & Customize",
                description: "Review the generated course structure and make any adjustments needed"
              },
              {
                step: "4",
                title: "Launch & Learn",
                description: "Publish your course and start learning with interactive content and tracking"
              }
            ].map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6 shadow-lg shadow-purple-500/25">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{step.title}</h3>
                <p className="text-gray-300 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/20 rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Create Your First Course?
            </h2>
            <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto">
              Join thousands of educators using AI to create engaging, professional courses that make a real impact
            </p>
            <button
              onClick={onGetStarted}
              className="bg-white text-purple-600 px-10 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all shadow-lg"
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default App;