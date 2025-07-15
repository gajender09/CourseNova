import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const genAI = new GoogleGenerativeAI(import.meta.env.REACT_APP_GEMINI_API_KEY);

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  content: string[];
  duration: string;
  objectives: string[];
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
}

export interface CourseContent {
  title: string;
  description: string;
  difficulty_level: string;
  estimated_duration: string;
  modules: CourseModule[];
  glossary: GlossaryTerm[];
  roadmap: string[];
  resources: {
    articles: Array<{
      title: string;
      url: string;
      description: string;
    }>;
    videos: Array<{
      title: string;
      url: string;
      thumbnail: string;
      duration: string;
    }>;
  };
}

export async function generateCourseContent(
  topic: string,
  audience: string,
  difficulty: string = 'Beginner'
): Promise<CourseContent> {
  try {
    // Generate course structure using Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Create a comprehensive course about "${topic}" for ${audience} at ${difficulty} level. 
    
    Please provide a detailed JSON response with the following structure:
    {
      "title": "Course title",
      "description": "Detailed course description",
      "difficulty_level": "${difficulty}",
      "estimated_duration": "X weeks",
      "modules": [
        {
          "id": "module-1",
          "title": "Module title",
          "description": "Module description",
          "content": ["Learning point 1", "Learning point 2"],
          "duration": "X hours",
          "objectives": ["Objective 1", "Objective 2"]
        }
      ],
      "glossary": [
        {
          "term": "Term",
          "definition": "Definition",
          "example": "Example usage"
        }
      ],
      "roadmap": ["Step 1", "Step 2", "Step 3"]
    }
    
    Make sure to include 5-8 modules, 10-15 glossary terms, and a clear learning roadmap.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const courseData = JSON.parse(jsonMatch[0]);
    
    // Fetch additional resources
    const [articles, videos] = await Promise.all([
      fetchArticles(topic),
      fetchVideos(topic)
    ]);
    
    return {
      ...courseData,
      resources: {
        articles,
        videos
      }
    };
  } catch (error) {
    console.error('Error generating course content:', error);
    throw new Error('Failed to generate course content. Please try again.');
  }
}

async function fetchArticles(topic: string) {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: topic,
        sortBy: 'relevancy',
        pageSize: 5,
        language: 'en',
        apiKey: import.meta.env.REACT_APP_NEWS_API_KEY
      }
    });

    return response.data.articles.map((article: any) => ({
      title: article.title,
      url: article.url,
      description: article.description || 'No description available'
    }));
  } catch (error) {
    console.warn('Failed to fetch articles:', error);
    return [];
  }
}

async function fetchVideos(topic: string) {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: `${topic} tutorial`,
        type: 'video',
        maxResults: 5,
        key: import.meta.env.REACT_APP_YOUTUBE_API_KEY
      }
    });

    return response.data.items.map((video: any) => ({
      title: video.snippet.title,
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
      thumbnail: video.snippet.thumbnails.medium.url,
      duration: 'N/A' // YouTube API v3 doesn't provide duration in search
    }));
  } catch (error) {
    console.warn('Failed to fetch videos:', error);
    return [];
  }
}

export async function generateCourseImage(topic: string): Promise<string> {
  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: import.meta.env.REACT_APP_GOOGLE_API_KEY,
        cx: import.meta.env.REACT_APP_GOOGLE_CSE_ID,
        q: `${topic} course education`,
        searchType: 'image',
        num: 1,
        safe: 'active'
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].link;
    }
  } catch (error) {
    console.warn('Failed to fetch course image:', error);
  }
  
  // Fallback to Unsplash
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(topic)},education`;
}