export interface EmbeddingOptions {
    type: 'openai' | 'local';
    openAIApiKey?: string;
    modelName?: string; // e.g., 'sentence-transformers/all-MiniLM-L6-v2' - use hugging face model name for local embeddings ( needs to be onnx compatible)
    embeddingSize?: number;
  }
  
  
  export interface GPTOptions {
    openAIApiKey: string;
    model: string;
    promptPrefix?: string;
  }
  
  export interface CacheOptions {
    redisUrl?: string;
    similarityThreshold?: number;
    cacheTTL?: number; // in seconds
    embeddingSize?: number;
  }
  
  export interface InitializationOptions {
    embeddingOptions: EmbeddingOptions;
    gptOptions: GPTOptions;
    cacheOptions?: CacheOptions;
  }
  
  export interface EmbeddingData {
    id: number;
    query: string;
    embedding: number[];
    response: string;
    timestamp: number;
  }
  
  export interface ANNOptions {
    efConstruction?: number;
    M?: number;
    efSearch?: number;
  }
  