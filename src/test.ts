import { SemanticGPTCache } from './index';
import dotenv from 'dotenv';
import fs from 'fs'

dotenv.config()

async function main() {
  
  const cache = new SemanticGPTCache({
    embeddingOptions: {
      type: 'local',
      modelName: 'Xenova/all-MiniLM-L6-v2',
      openAIApiKey: process.env.OPENAI_API_KEY || '',
    },
    gptOptions: {
      openAIApiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4o-mini-2024-07-18',
      promptPrefix: 'You are a helpful assistant and a technical support assistant for a 3D printer, you will limit your result to 5 sentences',
    },
    cacheOptions: {
      redisUrl: process.env.REDIS_URL,
      similarityThreshold: 0.8, 
      cacheTTL: 86400,
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
    'Who is elon musk',
    'who the hell is elon musk?'
  ];

  let context = "I need help with my 3d printer"
  let i=0
  let arr = 0

  const filePath = './QA_Automotive.json';

  // Read the JSON file asynchronously
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the file:', err);
      return;
    }
  
    try {
      // Parse the JSON data
      const jsonData = JSON.parse(data);
  
      // Limit the iteration to the first 100 items
      jsonData.slice(0, 5).forEach(item => {
        console.log(item); // Do something with each item
      });
    } catch (parseError) {
      console.error('Error parsing JSON data:', parseError);
    }
  });
  // for (const query of queries) {
  //   i++;
  //   console.log(`\nUser Query: ${query}`);
  //   // Start the timer
  //   const startTime = performance.now();
  //   // Execute the query
  //   const response = await cache.query(query, context);
  //   // Stop the timer
  //   const endTime = performance.now();
  //   // Calculate the response time
  //   const responseTime = endTime - startTime;
  //   arr += responseTime
  
  //   console.log('Response:', response);
  //   console.log(`Response time: ${responseTime.toFixed(2)} ms`);
  // }
  
  console.log("Api hit : " + cache.getApiHit())
  console.log("Cache hit : "+cache.getCacheHit())
  console.log("Average Response time : ",arr/7)
  // Optionally clear the cache at the end
   await cache.clearCache();
}
main();
