import React, { useEffect, useState } from 'react';
import { Book, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface Enrollment {
  id: string;
  course: {
    id: string;
    title: string;
    description: string;
    image_url: string;
  };
  progress: number;
  enrolled_at: string;
  last_accessed: string;
}

export function Dashboard() {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, [user]);

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          progress,
          enrolled_at,
          last_accessed,
          course:courses (
            id,
            title,
            description,
            image_url
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
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
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">My Courses</h1>
      
      {enrollments.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <Book className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Courses Yet</h2>
          <p className="text-gray-400">
            You haven't enrolled in any courses. Start learning by exploring our course catalog!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="bg-gray-800 rounded-xl overflow-hidden transition-transform hover:scale-105"
            >
              <img
                src={enrollment.course.image_url || `https://source.unsplash.com/800x600/?${encodeURIComponent(enrollment.course.title)}`}
                alt={enrollment.course.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {enrollment.course.title}
                </h3>
                <p className="text-gray-400 mb-4 line-clamp-2">
                  {enrollment.course.description}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center text-gray-300">
                    <Clock className="w-5 h-5 mr-2 text-purple-500" />
                    <span>Last accessed: {new Date(enrollment.last_accessed).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 mr-2 text-purple-500" />
                    <span>Progress: {enrollment.progress}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-purple-600 h-2.5 rounded-full"
                      style={{ width: `${enrollment.progress}%` }}
                    ></div>
                  </div>
                  
                  <button
                    onClick={() => {/* TODO: Navigate to course content */}}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition mt-4"
                  >
                    Continue Learning
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}