import React, { useState } from 'react';
import { BookOpen, Target, List, Video, FileText, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { generateCourseContent } from '../services/courseGenerator';

interface CourseContent {
  title: string;
  description: string;
  modules: {
    title: string;
    content: string[];
  }[];
  glossary: { term: string; definition: string }[];
  roadmap: string[];
  resources: {
    articles: string[];
    videos: string[];
  };
}

export function CourseGenerator() {
  const { user } = useAuthStore();
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [courseContent, setCourseContent] = useState<CourseContent | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const content = await generateCourseContent(topic, audience);
      const course = await saveCourse(content);
      setCourseContent({ ...content, id: course.id });
    } catch (err) {
      setError('Failed to generate course. Please try again.');
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
        image_url: `https://source.unsplash.com/800x600/?${encodeURIComponent(topic)}`,
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

  const enrollInCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user?.id,
          course_id: courseId,
          progress: 0,
          completed_modules: []
        });

      if (error) throw error;
      setEnrolled(true);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      setError('Failed to enroll in the course. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <form onSubmit={generateCourse} className="mb-12">
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-200 mb-2">
              What topic would you like to create a course about?
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-gray-600"
              placeholder="e.g., Machine Learning, Web Development, Digital Marketing"
              required
            />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-200 mb-2">
              Who is your target audience?
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-gray-600"
              placeholder="e.g., Beginners, Intermediate Developers, Business Professionals"
              required
            />
          </div>
          {error && (
            <div className="bg-red-500 bg-opacity-10 text-red-500 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition flex items-center justify-center"
          >
            {loading ? (
              <span className="animate-pulse">Generating your course...</span>
            ) : (
              'Generate Course'
            )}
          </button>
        </div>
      </form>

      {courseContent && (
        <div className="space-y-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">{courseContent.title}</h2>
            <p className="text-gray-300 mb-6">{courseContent.description}</p>
            {!enrolled && (
              <button
                onClick={() => enrollInCourse(courseContent.id)}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Enroll Now
              </button>
            )}
            {enrolled && (
              <div className="bg-purple-500 bg-opacity-20 text-purple-300 px-4 py-2 rounded-lg inline-flex items-center">
                <Check className="w-5 h-5 mr-2" />
                Enrolled
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <BookOpen className="w-6 h-6 text-purple-500 mr-2" />
                <h3 className="text-xl font-semibold text-white">Course Modules</h3>
              </div>
              <div className="space-y-4">
                {courseContent.modules.map((module, index) => (
                  <div key={index}>
                    <h4 className="text-lg font-medium text-purple-400 mb-2">
                      {module.title}
                    </h4>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {module.content.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <List className="w-6 h-6 text-purple-500 mr-2" />
                <h3 className="text-xl font-semibold text-white">Glossary</h3>
              </div>
              <div className="space-y-2">
                {courseContent.glossary.map((item, index) => (
                  <div key={index}>
                    <dt className="text-purple-400 font-medium">{item.term}</dt>
                    <dd className="text-gray-300 ml-4">{item.definition}</dd>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Target className="w-6 h-6 text-purple-500 mr-2" />
              <h3 className="text-xl font-semibold text-white">Learning Roadmap</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {courseContent.roadmap.map((step, index) => (
                <div
                  key={index}
                  className="bg-gray-700 p-4 rounded-lg text-gray-300"
                >
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <FileText className="w-6 h-6 text-purple-500 mr-2" />
                <h3 className="text-xl font-semibold text-white">
                  Suggested Articles
                </h3>
              </div>
              <ul className="space-y-2">
                {courseContent.resources.articles.map((article, index) => (
                  <li
                    key={index}
                    className="text-gray-300 hover:text-purple-400 cursor-pointer"
                  >
                    {article}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Video className="w-6 h-6 text-purple-500 mr-2" />
                <h3 className="text-xl font-semibold text-white">
                  Suggested Videos
                </h3>
              </div>
              <ul className="space-y-2">
                {courseContent.resources.videos.map((video, index) => (
                  <li
                    key={index}
                    className="text-gray-300 hover:text-purple-400 cursor-pointer"
                  >
                    {video}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}