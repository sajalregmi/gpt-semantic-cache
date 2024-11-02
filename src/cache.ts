import { createClient, RedisClientType } from 'redis';
import { EmbeddingData } from './types';
import { HierarchicalNSW } from 'hnswlib-node';


export class Cache {
  private client: RedisClientType;
  private annIndex: HierarchicalNSW;
  private embeddingSize: number;
  private indexInitialized: boolean = false;
  private currentId: number = 0;
  private cacheTTL?: number; // in seconds
  private redisKey: string;

  constructor(redisUrl?: string, embeddingSize?: number, cacheTTL?: number) {
    this.client = createClient({ url: redisUrl });
    this.embeddingSize = embeddingSize || 1536; // Default to OpenAI embedding size
    this.annIndex = new HierarchicalNSW('cosine', this.embeddingSize);
    this.cacheTTL = cacheTTL;
    this.redisKey = `embeddings_${this.embeddingSize}`;
  }

  public async initialize() {
    await this.client.connect();
    await this.loadIndex();
  }

  private async loadIndex() {
    const data = await this.getAllEmbeddings();
    if (data.length > 0) {
      const vectors = data.map((e) => e.embedding);
      

      const ids = data.map((e) => e.id);

      if (!vectors[0]) {
        console.log('Error: Retrieved embedding is undefined or empty');
        throw new Error('Embedding data is missing or invalid.');
      }
  
      this.annIndex.initIndex(vectors.length);
      for (let i = 0; i < vectors.length; i++) {
        if (!Array.isArray(vectors[i])) {
          throw new Error('Embedding is not an array.');
        }
        

        this.annIndex.addPoint(vectors[i], ids[i]);
      }
      this.currentId = Math.max(...ids) + 1;
      this.indexInitialized = true;
    }else{
        this.annIndex.initIndex(1); // Initialize with at least one slot (or minimal size)
        this.indexInitialized = true;
    }
  }

  public async storeEmbedding(query: string, embedding: number[], response: string): Promise<void> {
    if (embedding.length !== this.embeddingSize) {
        console.log("embedding size from store embedding", embedding.length)
        throw new Error(`Invalid embedding size. Expected ${this.embeddingSize}, but got ${embedding.length}.`);
      }

      if (!Array.isArray(embedding)) {
        console.log('Embedding is not an array. Converting to array...');
        embedding = Array.from(embedding);
      }
      console.log("Storing embedding in cache as ", typeof embedding);

    const id = this.currentId++;
    const timestamp = Date.now();
    const data: EmbeddingData = {
      id,
      query,
      embedding,
      response,
      timestamp,
    };

    await this.client.hSet(this.redisKey, id.toString(), JSON.stringify(data));
    if (this.cacheTTL) {
      await this.client.expire(this.redisKey, this.cacheTTL);
    }
    if (!this.indexInitialized) {
        console.log("Initializing ANN index for the first embedding...");
        this.annIndex.initIndex(1000); 
        this.indexInitialized = true;
      }
      const currentCount = this.annIndex.getCurrentCount();
      const maxElements = this.annIndex.getMaxElements();
      if (currentCount >= maxElements) {
        this.annIndex.resizeIndex(maxElements + 1000);
      }
      this.annIndex.addPoint(embedding, id);

  }

  public async searchSimilar(embedding: number[], k: number = 5): Promise<EmbeddingData[]> {
    
    if (embedding.length !== this.embeddingSize) {
        console.log("embedding size from load index search similar", this.embeddingSize)
        throw new Error(`Invalid embedding size for search. Expected ${this.embeddingSize}, but got ${embedding.length}.`);
      }
    if (!this.indexInitialized) {
      await this.loadIndex();
    }
    const totalElements = this.annIndex.getCurrentCount(); // Total number of elements in the ANN index
    const adjustedK = Math.min(k, totalElements);
    if (adjustedK === 0) {
        console.log('No elements in the ANN index for search.');
        return [];
    }
    const result = this.annIndex.searchKnn(embedding, adjustedK);
    const ids = result.neighbors.map((id) => id.toString());
    const data = await this.client.hmGet(this.redisKey, ids);
    return data
      .filter((item) => item !== null)
      .map((item) => JSON.parse(item as string) as EmbeddingData);
  }

  public async getAllEmbeddings(): Promise<EmbeddingData[]> {
    const data = await this.client.hGetAll(this.redisKey);
    const EmbeddingsArray =  Object.values(data).map((item) => {
      const embeddingData = JSON.parse(item) as EmbeddingData;
      if (!Array.isArray(embeddingData.embedding)) {
        embeddingData.embedding = Object.values(embeddingData.embedding).map(Number);
        console.log('Embedding had to be converted');
      }
      return embeddingData;
    });
    console.log('type of EmbeddingsArray:', typeof EmbeddingsArray);
   // return Object.values(data).map((item) => JSON.parse(item)) as EmbeddingData[];
   return EmbeddingsArray;
  }

  public async clearCache() {
    await this.client.del('embeddings');
    this.annIndex = new HierarchicalNSW('cosine', this.embeddingSize);
    this.indexInitialized = false;
    this.currentId = 0;
  }
}
