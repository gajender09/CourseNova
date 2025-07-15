import React, { useState } from 'react';
import { BookOpen, Target, List, Video, FileText, Check, Sparkles, Clock, BarChart3, Brain } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { generateCourseContent, type CourseContent } from '../services/aiService';

export function CourseGenerator() {
  const { user } = useAuthStore();
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [loading, setLoading] = useState(false);
  const [courseContent, setCourseContent] = useState<CourseContent | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const content = await generateCourseContent(topic, audience, difficulty);
      const course = await saveCourse(content);
      setCourseContent(content);
      setCourseId(course.id);
    } catch (err: any) {
      setError(err.message || 'Failed to generate course. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveCourse = async (content: CourseContent) => {
    try {
      const courseData = {
        title: content.title,
        description: content.description,
        image_url: content.image_url,
        difficulty_level: content.difficulty_level,
        estimated_duration: content.estimated_duration,
        modules: content.modules,
        glossary: content.glossary,
        roadmap: content.roadmap,
        resources: content.resources,
        created_by: user?.id
      };

      const { data: course, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (error) throw error;
      return course;
    } catch (error) {
      console.error('Error saving course:', error);
      throw error;
    }
  };

  const enrollInCourse = async () => {
    if (!courseId) return;
    
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user?.id,
          course_id: courseId,
          progress: 0,
          completed_modules: [],
          current_module: 0
        });

      if (error) throw error;
      setEnrolled(true);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      setError('Failed to enroll in the course. Please try again.');
    }
  };

  const resetForm = () => {
    setTopic('');
    setAudience('');
    setDifficulty('Beginner');
    setCourseContent(null);
    setCourseId(null);
    setEnrolled(false);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">AI Course Generator</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Create comprehensive, professional courses in minutes using advanced AI technology
        </p>
      </div>

      {!courseContent ? (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-gray-700">
          <form onSubmit={generateCourse} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium text-gray-200 mb-3">
                  Course Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 text-white rounded-xl border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="e.g., Machine Learning, Web Development, Digital Marketing"
                  required
                />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-200 mb-3">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 text-white rounded-xl border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="e.g., Beginners, Intermediate Developers, Business Professionals"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-lg font-medium text-gray-200 mb-3">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 text-white rounded-xl border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white mr-3"></div>
                  Generating your course...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Course with AI
                </div>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Course Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 rounded-2xl p-8 border border-purple-500/20">
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={courseContent.image_url}
                alt={courseContent.title}
                className="w-full md:w-48 h-48 object-cover rounded-xl"
              />
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-4">{courseContent.title}</h2>
                <p className="text-gray-300 mb-6 text-lg">{courseContent.description}</p>
                
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center text-purple-300">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    <span>{courseContent.difficulty_level}</span>
                  </div>
                  <div className="flex items-center text-purple-300">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>{courseContent.estimated_duration}</span>
                  </div>
                  <div className="flex items-center text-purple-300">
                    <BookOpen className="w-5 h-5 mr-2" />
                    <span>{courseContent.modules.length} Modules</span>
                  </div>
                  <div className="flex items-center text-purple-300">
                    <Brain className="w-5 h-5 mr-2" />
                    <span>{courseContent.quiz?.length || 0} Quiz Questions</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  {!enrolled ? (
                    <button
                      onClick={enrollInCourse}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-medium flex items-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Enroll Now
                    </button>
                  ) : (
                    <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-6 py-3 rounded-xl inline-flex items-center">
                      <Check className="w-5 h-5 mr-2" />
                      Successfully Enrolled!
                    </div>
                  )}
                  
                  <button
                    onClick={resetForm}
                    className="bg-gray-700 text-white px-8 py-3 rounded-xl hover:bg-gray-600 transition-all font-medium"
                  >
                    Create Another Course
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Course Preview */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Modules Preview */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center mb-6">
                <BookOpen className="w-6 h-6 text-purple-500 mr-3" />
                <h3 className="text-2xl font-semibold text-white">Course Modules</h3>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {courseContent.modules.map((module, index) => (
                  <div key={module.id} className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-lg font-medium text-purple-400">
                        Module {index + 1}: {module.title}
                      </h4>
                      <span className="text-sm text-gray-400 bg-gray-600 px-2 py-1 rounded">
                        {module.duration}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-3">{module.description}</p>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-400">Subtopics:</p>
                      <div className="flex flex-wrap gap-2">
                        {module.subtopics?.map((subtopic, i) => (
                          <span key={i} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                            {subtopic.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources Preview */}
            <div className="space-y-6">
              {/* Articles */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center mb-4">
                  <FileText className="w-6 h-6 text-purple-500 mr-3" />
                  <h3 className="text-xl font-semibold text-white">Articles ({courseContent.resources.articles.length})</h3>
                </div>
                <div className="space-y-3">
                  {courseContent.resources.articles.slice(0, 3).map((article, index) => (
                    <div key={index} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                      <h4 className="text-purple-400 font-medium text-sm line-clamp-1">{article.title}</h4>
                      <p className="text-gray-400 text-xs">{article.source}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Videos */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center mb-4">
                  <Video className="w-6 h-6 text-purple-500 mr-3" />
                  <h3 className="text-xl font-semibold text-white">Videos ({courseContent.resources.videos.length})</h3>
                </div>
                <div className="space-y-3">
                  {courseContent.resources.videos.slice(0, 3).map((video, index) => (
                    <div key={index} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                      <h4 className="text-purple-400 font-medium text-sm line-clamp-1">{video.title}</h4>
                      <p className="text-gray-400 text-xs">{video.channelTitle}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Learning Roadmap */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center mb-6">
              <Target className="w-6 h-6 text-purple-500 mr-3" />
              <h3 className="text-2xl font-semibold text-white">Learning Roadmap</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courseContent.roadmap.map((step, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 border border-purple-500/20 p-4 rounded-xl"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                      {index + 1}
                    </div>
                    <span className="text-white font-medium">Step {index + 1}</span>
                  </div>
                  <p className="text-gray-300">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}