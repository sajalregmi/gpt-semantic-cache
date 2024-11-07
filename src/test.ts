import { SemanticGPTCache } from './index';
import dotenv from 'dotenv';
import fs from 'fs'
import { API } from './api';

dotenv.config()

import data from './test_dataset/customer_qa.json' with {type: "json"};
import prev from './test_dataset/similar_customer.json' with {type: "json"};

console.log(data.questions.length)
console.log(prev.questions.length)

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


  for (const item of prev.questions) {
    const response = await cache.query(item.question,context)

  }
  // for (const query of queries) {
  //   i++;
  //   console.log(`\nUser Query: ${query}`);
  //   // const startTime = performance.now();
  //   const response = await cache.query(query, context);
   
  //   // const endTime = performance.now();
  //   // const responseTime = endTime - startTime;
  //   // arr += responseTime
  
  //   // console.log('Response:', response);
  //   // console.log(`Response time: ${responseTime.toFixed(2)} ms`);
  // }
  console.log("Api hit : " + cache.getApiHit())
  console.log("Cache hit : "+cache.getCacheHit())
  console.log("Positive Hit : " + cache.getPositiveHit())
  console.log("Negative hit :" + cache.getNegativeHit())
  // console.log("Average Response time : ",arr/7)
  // Optionally clear the cache at the end
   await cache.clearCache();
}
main();     

async function generateQA(){
  // let system_prompt = `you are an ai agent that generates questions asked by general customer. Examples: "How can I reset my password?, What’s the expected time for my refund? " . This questions should be different from one another as it will be stored in cache for testing our semantic cache.This were the previous questions : ${JSON.stringify(data)} now  Generate 5]600 more unique questions in json form`
  let system_prompt = `your task is to generate  questions matching and similar  to ${JSON.stringify(data)}. This questions are used to test semantic cache. The previous questions are ${JSON.stringify(prev)}   Generate 300 different questions.Return questions in json form`
  const response = await API.getGPTResponse(system_prompt,{
    openAIApiKey : process.env.OPENAI_API_KEY
  })
  console.log(response)
}

// generateQA()