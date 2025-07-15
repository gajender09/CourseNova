import React, { useState } from 'react';
import { Brain, BookOpen, Target, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { CourseGenerator } from './components/CourseGenerator';
import { Dashboard } from './components/Dashboard';
import { useAuthStore } from './store/authStore';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, signOut } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Hero Section */}
      <header className="container mx-auto px-6 py-16">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold text-white">AICADEMY</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <a href="#dashboard" className="text-gray-300 hover:text-white transition">Dashboard</a>
                <a href="#create" className="text-gray-300 hover:text-white transition">Create Course</a>
                <button
                  onClick={() => signOut()}
                  className="bg-gray-700 text-white px-6 py-2 rounded-full hover:bg-gray-600 transition"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
                <a href="#how-it-works" className="text-gray-300 hover:text-white transition">How it Works</a>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </nav>

        {user ? (
          <>
            <section id="dashboard">
              <Dashboard />
            </section>
            <section id="create">
              <CourseGenerator />
            </section>
          </>
        ) : (
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Create Professional Courses with
              <span className="text-purple-500"> AI</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Transform your expertise into engaging online courses in minutes. Our AI-powered platform helps you create professional curriculum, content, and assessments.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full sm:w-auto bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
              >
                Start Creating <ArrowRight className="w-5 h-5" />
              </button>
              <button className="w-full sm:w-auto bg-gray-700 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-600 transition">
                Watch Demo
              </button>
            </div>
          </div>
        )}
      </header>

      {!user && (
        <>
          {/* Features Section */}
          <section id="features" className="py-20 bg-gray-800">
            <div className="container mx-auto px-6">
              <h2 className="text-3xl font-bold text-white text-center mb-12">
                Powerful Features for Course Creation
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: <BookOpen className="w-8 h-8 text-purple-500" />,
                    title: "AI Curriculum Design",
                    description: "Generate comprehensive course outlines and lesson plans tailored to your subject matter."
                  },
                  {
                    icon: <Target className="w-8 h-8 text-purple-500" />,
                    title: "Smart Learning Objectives",
                    description: "Create measurable learning outcomes that align with industry standards."
                  },
                  {
                    icon: <Sparkles className="w-8 h-8 text-purple-500" />,
                    title: "Interactive Content",
                    description: "Generate engaging content including quizzes, assignments, and practical exercises."
                  }
                ].map((feature, index) => (
                  <div key={index} className="bg-gray-700 p-6 rounded-xl">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-300">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="py-20 bg-gray-900">
            <div className="container mx-auto px-6">
              <h2 className="text-3xl font-bold text-white text-center mb-12">
                How It Works
              </h2>
              <div className="grid md:grid-cols-4 gap-8">
                {[
                  {
                    step: "1",
                    title: "Input Your Topic",
                    description: "Enter your course subject and target audience"
                  },
                  {
                    step: "2",
                    title: "AI Analysis",
                    description: "Our AI analyzes and structures your content"
                  },
                  {
                    step: "3",
                    title: "Generate Content",
                    description: "Get a complete course structure and materials"
                  },
                  {
                    step: "4",
                    title: "Customize & Export",
                    description: "Fine-tune and export your course"
                  }
                ].map((step, index) => (
                  <div key={index} className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mb-4">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-gray-300">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-gray-800">
            <div className="container mx-auto px-6 text-center">
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-12">
                <h2 className="text-3xl font-bold text-white mb-6">
                  Ready to Create Your First Course?
                </h2>
                <p className="text-xl text-gray-200 mb-8">
                  Join thousands of educators using AI to create engaging courses
                </p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-white text-purple-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition"
                >
                  Get Started for Free
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="w-6 h-6 text-purple-500" />
              <span className="text-xl font-bold text-white">AICADEMY</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

export default App;