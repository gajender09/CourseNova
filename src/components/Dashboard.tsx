import React, { useEffect, useState } from 'react';
import { Book, Clock, CheckCircle, Play, BarChart3, Trophy, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface Enrollment {
  id: string;
  progress: number;
  current_module: number;
  enrolled_at: string;
  last_accessed: string;
  completed_at: string | null;
  course: {
    id: string;
    title: string;
    description: string;
    image_url: string;
    difficulty_level: string;
    estimated_duration: string;
    modules: any[];
  };
}

export function Dashboard() {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgress: 0,
    totalHours: 0
  });

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          progress,
          current_module,
          enrolled_at,
          last_accessed,
          completed_at,
          course:courses (
            id,
            title,
            description,
            image_url,
            difficulty_level,
            estimated_duration,
            modules
          )
        `)
        .eq('user_id', user?.id)
        .order('last_accessed', { ascending: false });

      if (error) throw error;
      
      const enrollmentData = data || [];
      setEnrollments(enrollmentData);
      
      // Calculate stats
      const totalCourses = enrollmentData.length;
      const completedCourses = enrollmentData.filter(e => e.progress === 100).length;
      const inProgress = enrollmentData.filter(e => e.progress > 0 && e.progress < 100).length;
      
      setStats({
        totalCourses,
        completedCourses,
        inProgress,
        totalHours: totalCourses * 20 // Estimate
      });
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (enrollmentId: string, newProgress: number, moduleIndex: number) => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({
          progress: newProgress,
          current_module: moduleIndex,
          last_accessed: new Date().toISOString(),
          completed_at: newProgress === 100 ? new Date().toISOString() : null
        })
        .eq('id', enrollmentId);

      if (error) throw error;
      fetchEnrollments(); // Refresh data
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">My Learning Dashboard</h1>
        <p className="text-xl text-gray-300">Track your progress and continue your learning journey</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm font-medium">Total Courses</p>
              <p className="text-3xl font-bold text-white">{stats.totalCourses}</p>
            </div>
            <Book className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold text-white">{stats.completedCourses}</p>
            </div>
            <Trophy className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm font-medium">In Progress</p>
              <p className="text-3xl font-bold text-white">{stats.inProgress}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm font-medium">Learning Hours</p>
              <p className="text-3xl font-bold text-white">{stats.totalHours}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {enrollments.length === 0 ? (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-700">
          <Book className="w-16 h-16 text-purple-500 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-white mb-4">No Courses Yet</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            You haven't enrolled in any courses yet. Start your learning journey by creating or exploring courses!
          </p>
          <button className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-medium">
            Explore Courses
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700 hover:border-purple-500/50 transition-all duration-300 group"
            >
              <div className="relative">
                <img
                  src={enrollment.course.image_url || `https://source.unsplash.com/800x600/?${encodeURIComponent(enrollment.course.title)}`}
                  alt={enrollment.course.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4">
                  <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-white text-sm font-medium">
                      {enrollment.course.difficulty_level}
                    </span>
                  </div>
                </div>
                {enrollment.progress === 100 && (
                  <div className="absolute top-4 left-4">
                    <div className="bg-green-500 p-2 rounded-full">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                  {enrollment.course.title}
                </h3>
                <p className="text-gray-400 mb-4 line-clamp-2">
                  {enrollment.course.description}
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-300">
                      <Clock className="w-4 h-4 mr-2 text-purple-500" />
                      <span>{enrollment.course.estimated_duration}</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <BarChart3 className="w-4 h-4 mr-2 text-purple-500" />
                      <span>{enrollment.progress}% Complete</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-purple-400 font-medium">{enrollment.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${enrollment.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Module {enrollment.current_module + 1} of {enrollment.course.modules?.length || 0}</span>
                    <span>Last accessed: {new Date(enrollment.last_accessed).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        const nextProgress = Math.min(enrollment.progress + 20, 100);
                        const nextModule = Math.floor((nextProgress / 100) * (enrollment.course.modules?.length || 1));
                        updateProgress(enrollment.id, nextProgress, nextModule);
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      {enrollment.progress === 0 ? 'Start Learning' : 'Continue'}
                    </button>
                    {enrollment.progress === 100 && (
                      <button className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-all">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}