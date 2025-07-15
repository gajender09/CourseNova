import OpenAI from 'openai';
import axios from 'axios';

const openai = import.meta.env.VITE_OPENAI_API_KEY ? new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
}) : null;

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

export async function generateCourseContent(topic: string, audience: string): Promise<CourseContent> {
  try {
    // Check if OpenAI API key is available
    if (!openai) {
      throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
    }

    // Generate course structure using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert course creator and educator. Create a detailed course structure based on the given topic and target audience."
        },
        {
          role: "user",
          content: `Create a comprehensive course about ${topic} for ${audience}. Include modules, glossary terms, a learning roadmap, and suggested resources.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const courseStructure = JSON.parse(completion.choices[0].message.content);

    // Get relevant articles using News API
    let articles = { data: { articles: [] } };
    if (import.meta.env.VITE_NEWS_API_KEY) {
      try {
        articles = await axios.get(`https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&sortBy=relevancy&pageSize=3&apiKey=${import.meta.env.VITE_NEWS_API_KEY}`);
      } catch (error) {
        console.warn('Failed to fetch articles:', error);
      }
    }

    // Get relevant videos using YouTube API
    let videos = { data: { items: [] } };
    if (import.meta.env.VITE_YOUTUBE_API_KEY) {
      try {
        videos = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(topic)}&type=video&maxResults=3&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`);
      } catch (error) {
        console.warn('Failed to fetch videos:', error);
      }
    }

    return {
      ...courseStructure,
      resources: {
        articles: articles.data.articles?.map((article: any) => article.title) || [],
        videos: videos.data.items?.map((video: any) => video.snippet.title) || []
      }
    };
  } catch (error) {
    console.error('Error generating course content:', error);
    throw error;
  }
}