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

  // Initialize the embeddings pipeline (either OpenAI or local)
  public async initialize() {
    if (this.options.type === 'local') {
      await this.loadLocalModel(this.options.modelName!);
    }
  }

  // Get the embedding size (default or based on model)
  public getEmbeddingSize(): number {
    return this.embeddingSize;
  }

  // Main method to get embeddings (either via OpenAI or local)
  public async getEmbedding(text: string): Promise<number[]> {
    if (this.options.type === 'openai') {
      return await this.getOpenAIEmbedding(text);
    } else if (this.options.type === 'local') {
      return await this.getLocalEmbedding(text);
    } else {
      throw new Error('Invalid embedding type.');
    }
  }

  // Fetch embeddings from OpenAI
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

  // Dynamically import and load the local model from Hugging Face using `@xenova/transformers`
  private async loadLocalModel(modelName: string): Promise<void> {
    console.log(`Loading model ${modelName} from Hugging Face...`);

    // Dynamic import for @xenova/transformers since it's an ES module
    const transformers = await import('@xenova/transformers');
    this.embeddingPipeline = await transformers.pipeline('feature-extraction', modelName);

    // Set embedding size based on model output
    const testEmbedding = await this.embeddingPipeline('Test');
    this.embeddingSize = testEmbedding[0][0].length;
    console.log(`Model loaded. Embedding size is ${this.embeddingSize}.`);
  }

  // Get local embeddings using the dynamically imported model
  private async getLocalEmbedding(text: string): Promise<number[]> {
    if (!this.embeddingPipeline) {
      throw new Error('Local embedding model is not initialized.');
    }
    const embeddings = await this.embeddingPipeline(text, { pooling: 'mean', normalize: true });
    // embeddings is a 2D array: [[embedding_vector]]
    return embeddings[0][0];
  }
}
