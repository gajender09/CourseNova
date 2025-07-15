import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  objectives: string[];
  subtopics: CourseSubtopic[];
}

export interface CourseSubtopic {
  id: string;
  title: string;
  content: string;
  estimatedTime: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CourseContent {
  title: string;
  description: string;
  difficulty_level: string;
  estimated_duration: string;
  image_url: string;
  modules: CourseModule[];
  glossary: GlossaryTerm[];
  roadmap: string[];
  quiz: QuizQuestion[];
  resources: {
    articles: Array<{
      title: string;
      url: string;
      description: string;
      source: string;
      publishedAt: string;
    }>;
    videos: Array<{
      title: string;
      url: string;
      thumbnail: string;
      duration: string;
      channelTitle: string;
      description: string;
    }>;
  };
}

export async function generateCourseContent(
  topic: string,
  audience: string,
  difficulty: string = 'Beginner'
): Promise<CourseContent> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Generate comprehensive course structure
    const coursePrompt = `Create a comprehensive course about "${topic}" for ${audience} at ${difficulty} level.

    Please provide a detailed JSON response with the following structure:
    {
      "title": "Engaging course title",
      "description": "Detailed course description (2-3 sentences)",
      "difficulty_level": "${difficulty}",
      "estimated_duration": "X weeks",
      "modules": [
        {
          "id": "module-1",
          "title": "Module title",
          "description": "Module description",
          "duration": "X hours",
          "objectives": ["Objective 1", "Objective 2", "Objective 3"],
          "subtopics": [
            {
              "id": "subtopic-1",
              "title": "Subtopic title",
              "content": "Detailed markdown content with headings, code blocks, examples, and explanations",
              "estimatedTime": "X minutes"
            }
          ]
        }
      ],
      "glossary": [
        {
          "term": "Term",
          "definition": "Clear definition",
          "example": "Practical example"
        }
      ],
      "roadmap": ["Step 1: Foundation", "Step 2: Practice", "Step 3: Advanced"],
      "quiz": [
        {
          "id": "q1",
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Why this answer is correct"
        }
      ]
    }

    Requirements:
    - Include 5-7 modules with 3-4 subtopics each
    - Each subtopic should have detailed markdown content (300-500 words)
    - Include code examples where relevant
    - Create 15-20 glossary terms
    - Generate 10-15 quiz questions
    - Make content engaging and practical
    - Use proper markdown formatting in subtopic content`;

    const result = await model.generateContent(coursePrompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean and parse JSON response
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const courseData = JSON.parse(jsonMatch[0]);
    
    // Fetch additional resources
    const [articles, videos, imageUrl] = await Promise.all([
      fetchArticles(topic),
      fetchVideos(topic),
      generateCourseImage(topic)
    ]);
    
    return {
      ...courseData,
      image_url: imageUrl,
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

export async function generateSubtopicContent(topic: string, subtopic: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Generate detailed educational content about "${subtopic}" in the context of "${topic}".

    Requirements:
    - Use markdown formatting
    - Include headings (##, ###)
    - Add code examples where relevant
    - Use bullet points and numbered lists
    - Include practical examples
    - Make it engaging and educational
    - Length: 400-600 words
    
    Format the response as clean markdown without any wrapper text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating subtopic content:', error);
    throw new Error('Failed to generate content for this subtopic.');
  }
}

async function fetchArticles(topic: string) {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: `${topic} tutorial guide learning`,
        sortBy: 'relevancy',
        pageSize: 8,
        language: 'en',
        apiKey: import.meta.env.VITE_NEWS_API_KEY
      }
    });

    return response.data.articles.map((article: any) => ({
      title: article.title,
      url: article.url,
      description: article.description || 'No description available',
      source: article.source.name,
      publishedAt: article.publishedAt
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
        q: `${topic} tutorial course`,
        type: 'video',
        maxResults: 8,
        order: 'relevance',
        key: import.meta.env.VITE_YOUTUBE_API_KEY
      }
    });

    return response.data.items.map((video: any) => ({
      title: video.snippet.title,
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
      thumbnail: video.snippet.thumbnails.medium.url,
      duration: 'N/A',
      channelTitle: video.snippet.channelTitle,
      description: video.snippet.description
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
        key: import.meta.env.VITE_GOOGLE_API_KEY,
        cx: import.meta.env.VITE_GOOGLE_CSE_ID,
        q: `${topic} course education learning`,
        searchType: 'image',
        num: 1,
        safe: 'active',
        imgSize: 'large'
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].link;
    }
  } catch (error) {
    console.warn('Failed to fetch course image:', error);
  }
  
  return `https://images.unsplash.com/800x600/?${encodeURIComponent(topic)},education,learning`;
}