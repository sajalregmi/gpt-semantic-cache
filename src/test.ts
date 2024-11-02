import { SemanticGPTCache } from './index';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  
  
  const cache = new SemanticGPTCache({
    embeddingOptions: {
      type: 'local',
      modelName: 'Xenova/all-MiniLM-L6-v2',
      openAIApiKey: process.env.OPENAI_API_KEY || '',
     // embeddingSize: 384,
    },
    gptOptions: {
      openAIApiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4o-mini-2024-07-18',
      promptPrefix: 'You are a helpful assistant and a technical support assistant for a 3D printer, you will limit your result to 5 sentances', // Optional: Add a prefix to the prompt
    },
    cacheOptions: {
      redisUrl: process.env.REDIS_URL, // Redis server URL (e.g., 'redis://localhost:6379')
      similarityThreshold: 0.8, // Similarity threshold for cache hits
      cacheTTL: 86400, // Cache entries expire after 1 hour,
    // embeddingSize: 384,
    },
  });
  await cache.initialize();
  await cache.clearCache();
  const queries = [
    'My Anycubic 3d printer is not running',
    'My Anycubic 3d printer seems off, it is having a hard time running.',
    'My Anycubic 3d printer is not working properly',
    'Who is geoffrey hinto?',
    'My Zotrax 3d printer is not running',
    'Who is elon musk'
  ];

  let context = "I need help with my 3d printer"

  for (const query of queries) {
    console.log(`\nUser Query: ${query}`);
    const response = await cache.query(query, context);
    console.log('Response:', response);
  }

  // Optionally clear the cache at the end
   await cache.clearCache();
}
main();
