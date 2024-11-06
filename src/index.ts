import { Cache } from './cache';
import { Embeddings } from './embeddings';
import { Similarity } from './similarity';
import { API } from './api';
import { InitializationOptions } from './types';

export class SemanticGPTCache {
  private cache: Cache;
  private embeddings: Embeddings;
  private similarityThreshold: number;
  private gptOptions: any;  
  private cacheTTL?: number;
  private options: InitializationOptions;
  private cacheHit : number;
  private apiHit : number;



  constructor(options: InitializationOptions) {
    console.log('Initializing SemanticGPTCache');
    this.options = options;
    this.embeddings = new Embeddings(options.embeddingOptions);
    console.log('Embeddings initialized');
    this.similarityThreshold = options.cacheOptions?.similarityThreshold || 0.8;
    this.gptOptions = options.gptOptions;
    this.cacheTTL = options.cacheOptions?.cacheTTL;
    this.cacheHit = 0;
    this.apiHit = 0
  }

  public async initialize() {
    await this.embeddings.initialize();
    const embeddingSize = this.embeddings.getEmbeddingSize();
    this.cache = new Cache(
      this.options.cacheOptions?.redisUrl,
      embeddingSize,
      this.cacheTTL
    );
    await this.cache.initialize();
  }
  public getCacheHit(){
    return this.cacheHit

  }
  public getApiHit(){
    return this.apiHit
  }

  public async query(userQuery: string, additionalContext?: string): Promise<string> {
    const queryEmbedding = await this.embeddings.getEmbedding(userQuery);


    const candidates = await this.cache.searchSimilar(queryEmbedding, 5);

    if (candidates.length === 0) {
         
        console.log('No candidates found in the ANN index. Querying GPT API.');
        const prompt = this.buildPrompt(userQuery, additionalContext);
        this.apiHit += 1
        const response = await API.getGPTResponse(prompt, this.gptOptions);
        await this.cache.storeEmbedding(userQuery, queryEmbedding, response);
        return response;
      }

    let bestMatch = null;
    let highestSimilarity = 0;

    for (const candidate of candidates) {
      const similarity = Similarity.cosineSimilarity(queryEmbedding, candidate.embedding);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = candidate;
      }
    }
    if (highestSimilarity >= this.similarityThreshold && bestMatch) {
      console.log('Cache hit with similarity:', highestSimilarity);
      this.cacheHit += 1
      return bestMatch.response;
    } else {
      console.log('Cache miss. Fetching response from GPT API.');
      this.apiHit += 1
      const prompt = this.buildPrompt(userQuery, additionalContext);
      const response = await API.getGPTResponse(prompt, this.gptOptions);
      await this.cache.storeEmbedding(userQuery, queryEmbedding, response);

      return response;
    }
  }



  private buildPrompt(userQuery: string, additionalContext?: string): string {
    let prompt = '';
    if (this.gptOptions.promptPrefix) {
      prompt += this.gptOptions.promptPrefix + '\n';
    }
    if (additionalContext) {
      prompt += additionalContext + '\n';
    }
    prompt += userQuery;
    return prompt;
  }
  public async clearCache() {
    await this.cache.clearCache();
  }
}
