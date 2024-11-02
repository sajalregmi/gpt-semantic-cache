import axios from 'axios';
import { EmbeddingOptions } from './types';

export class Embeddings {
  public apiKey?: string;
  private options: EmbeddingOptions;
  private embeddingPipeline?: any;
  private embeddingSize: number;

  constructor(options: EmbeddingOptions) {
    this.options = options;
    if (options.type === 'openai') {
      if (!options.openAIApiKey) {
        throw new Error('OpenAI API key is required for OpenAI embeddings.');
      }
      this.apiKey = options.openAIApiKey;
    } else if (options.type === 'local') {
      if (!options.modelName) {
        throw new Error('Model name is required for local embeddings.');
      }
    }
  }


  public async initialize() {
    if (this.options.type === 'local') {
      await this.loadLocalModel(this.options.modelName!);
    }
  }


  public getEmbeddingSize(): number {
    console.log('embedding size called', this.embeddingSize);
    return this.embeddingSize;
  }


  public async getEmbedding(text: string): Promise<number[]> {
    if (this.options.type === 'openai') {
      return await this.getOpenAIEmbedding(text);
    } else if (this.options.type === 'local') {
      return await this.getLocalEmbedding(text);
    } else {
      throw new Error('Invalid embedding type.');
    }
  }


  private async getOpenAIEmbedding(text: string): Promise<number[]> {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: text,
        model: 'text-embedding-ada-002',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );
    this.embeddingSize = response.data.data[0].embedding.length;
    return response.data.data[0].embedding;
  }


  private async loadLocalModel(modelName: string): Promise<void> {
    console.log(`Loading model ${modelName} from Hugging Face...`);
    const transformers = await import('@xenova/transformers');
    this.embeddingPipeline = await transformers.pipeline('feature-extraction', modelName);

    const testEmbedding = await this.embeddingPipeline('Test', { pooling: 'mean', normalize: true });
    const testEmbeddingSize = testEmbedding.size;

    console.log('test embeddings sizze', testEmbeddingSize);
    this.embeddingSize = testEmbeddingSize;
    console.log(`Model loaded. Embedding size is ${testEmbeddingSize}.`);
  }

  // Get local embeddings using the dynamically imported model
  private async getLocalEmbedding(text: string): Promise<number[]> {
    if (!this.embeddingPipeline) {
      throw new Error('Local embedding model is not initialized.');
    }
    const embeddingTensor = await this.embeddingPipeline(text, { pooling: 'mean', normalize: true });
    let embeddingArray = embeddingTensor.data;
     embeddingArray = Array.from(embeddingTensor.data);
    return embeddingArray;
  }  
}
