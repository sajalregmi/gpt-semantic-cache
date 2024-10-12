# GPT Semantic Cache

An NPM package for semantic caching of GPT responses using Redis and Approximate Nearest Neighbors (ANN) search.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Initialization](#initialization)
  - [Querying](#querying)
  - [Configuration Options](#configuration-options)
- [Science Behind the Package](#science-behind-the-package)
  - [Semantic Embeddings](#semantic-embeddings)
  - [Approximate Nearest Neighbors Search](#approximate-nearest-neighbors-search)
  - [Cosine Similarity](#cosine-similarity)
  - [Caching Mechanism](#caching-mechanism)
- [Examples](#examples)
- [License](#license)

## Introduction

The GPT Semantic Cache is a Node.js package that provides a semantic caching mechanism for GPT responses. By leveraging semantic embeddings and approximate nearest neighbors search, the package efficiently caches and retrieves GPT responses based on the semantic similarity of user queries. This reduces redundant API calls to GPT models, saving time and costs, and improving response times for end-users. Queries with similar meaning are retrieved from cache saving the cost associated with an API.


Here are several areas where this can be used:

- **Technical Customer Support**: Technical Support are specific and based of technical docunents so semantic caching can be used to address similar queries
- **Product Support**: Responses to the online shopping products where the specifications or queries to the product is largely static
-**Other support based services**

## Features

- **Semantic Caching**: Efficiently cache GPT responses based on semantic similarity.
- **Supports Multiple Embedding Sources**: Use OpenAI or local models for generating embeddings.
- **Redis Integration**: Utilize Redis for fast storage and retrieval of cached data.
- **Approximate Nearest Neighbors (ANN) Search**: Quickly find similar queries using ANN algorithms.
- **Customizable Settings**: Adjust similarity thresholds, cache TTL, and more according to your needs.

## Installation

```bash
npm install gpt-semantic-cache
```

## Quick Start

Here's a quick example to get you started:

```javascript
const { SemanticGPTCache } = require('gpt-semantic-cache');

(async () => {
  const cache = new SemanticGPTCache({
    embeddingOptions: {
      type: 'openai',
      openAIApiKey: 'YOUR_OPENAI_API_KEY',
    },
    gptOptions: {
      openAIApiKey: 'YOUR_OPENAI_API_KEY',
      model: 'gpt-3.5-turbo',
    },
    cacheOptions: {
      redisUrl: 'redis://localhost:6379',
      similarityThreshold: 0.8,
      cacheTTL: 3600, // Cache Time-To-Live in seconds
      embeddingSize: 1536, // OpenAI's embedding size
    },
  });

  await cache.initialize();

  const response = await cache.query('What is the capital of France?');
  console.log(response);
})();
```

## Usage

### Initialization

To initialize the SemanticGPTCache, you need to provide configuration options for embeddings, GPT model, and caching.

```javascript
const cache = new SemanticGPTCache({
  embeddingOptions: {
    type: 'local', // 'openai' or 'local'
    modelName: 'sentence-transformers/all-MiniLM-L6-v2', // Only for local models
    openAIApiKey: 'YOUR_OPENAI_API_KEY', // Only for OpenAI embeddings
  },
  gptOptions: {
    openAIApiKey: 'YOUR_OPENAI_API_KEY',
    model: 'gpt-3.5-turbo',
    promptPrefix: 'You are an AI assistant.',
  },
  cacheOptions: {
    redisUrl: 'redis://localhost:6379',
    similarityThreshold: 0.8, // Cosine similarity threshold for cache hits
    cacheTTL: 3600, // Time-to-live for cache entries in seconds
    embeddingSize: 384, // Embedding size (384 for local models, 1536 for OpenAI)
  },
});

await cache.initialize();
```

**Initialization Options Explained:**

- **embeddingOptions**:
  - `type`: `'openai'` or `'local'`. Specifies the source of embeddings.
  - `modelName`: The name of the local embedding model to use (e.g., `'sentence-transformers/all-MiniLM-L6-v2'`).
  - `openAIApiKey`: Your OpenAI API key (required if `type` is `'openai'`).

- **gptOptions**:
  - `openAIApiKey`: Your OpenAI API key for accessing the GPT model.
  - `model`: The GPT model to use (e.g., `'gpt-3.5-turbo'`).
  - `promptPrefix`: An optional string to prepend to every prompt sent to the GPT model.

- **cacheOptions**:
  - `redisUrl`: The URL of your Redis instance (e.g., `'redis://localhost:6379'`).
  - `similarityThreshold`: A number between 0 and 1 representing the cosine similarity threshold for cache hits.
  - `cacheTTL`: The time-to-live for cache entries in seconds.
  - `embeddingSize`: The dimensionality of the embeddings used (e.g., `384` for local models, `1536` for OpenAI).

### Querying

To query the cache and get a response:

```javascript
const response = await cache.query('Your query here', 'Additional context if any');
console.log(response);
```

- If a similar query exists in the cache (based on the similarity threshold), the cached response is returned.
- If no similar query is found, the GPT API is called, and the response is cached for future queries.

### Configuration Options

The package allows you to customize various settings to fit your needs:

- **Similarity Threshold**: Adjust the `similarityThreshold` in `cacheOptions` to control how similar a query needs to be to hit the cache. A higher threshold means only very similar queries will hit the cache.

- **Cache Time-To-Live (TTL)**: Set `cacheTTL` to control how long entries remain in the cache.

- **Embedding Size**: Ensure `embeddingSize` matches the size of embeddings produced by your chosen embedding model.

## Science Behind the Package

### Semantic Embeddings

Semantic embeddings are vector representations of text that capture the meaning and context of the text. By converting both user queries and cached queries into embeddings, we can compare them in a high-dimensional space to find semantic similarities.

### Approximate Nearest Neighbors Search

To efficiently find similar embeddings in the cache, the package uses the Hierarchical Navigable Small World (HNSW) algorithm for Approximate Nearest Neighbors search. HNSW constructs a graph of embeddings that allows for fast retrieval of nearest neighbors without comparing the query against every cached embedding.

### Cosine Similarity

Cosine similarity measures the cosine of the angle between two vectors in a multidimensional space. It is a commonly used metric to determine how similar two embeddings are. In this package, after retrieving the nearest neighbors using ANN search, cosine similarity is computed to ensure the retrieved embeddings meet the specified similarity threshold.

### Caching Mechanism

The caching mechanism works as follows:

1. **Embedding Generation**: When a query is received, it's converted into an embedding using the specified embedding model.

2. **ANN Search**: The embedding is used to search the ANN index for similar embeddings.

3. **Similarity Check**: Retrieved embeddings are compared using cosine similarity to ensure they meet the similarity threshold.

4. **Cache Hit or Miss**:
   - **Cache Hit**: If a similar embedding is found, the associated response is retrieved from Redis and returned.
   - **Cache Miss**: If no similar embedding is found, the query is sent to the GPT API. The response is then cached along with the embedding for future queries.

## Examples

### Using a Local Embedding Model

```javascript
const cache = new SemanticGPTCache({
  embeddingOptions: {
    type: 'local',
    modelName: 'sentence-transformers/all-MiniLM-L6-v2',
  },
  gptOptions: {
    openAIApiKey: 'YOUR_OPENAI_API_KEY',
    model: 'gpt-3.5-turbo',
  },
  cacheOptions: {
    redisUrl: 'redis://localhost:6379',
    similarityThreshold: 0.75,
    cacheTTL: 7200, // 2 hours
    embeddingSize: 384, // For MiniLM model
  },
});

await cache.initialize();

const response = await cache.query('Tell me a joke.');
console.log(response);
```

### Adjusting Similarity Threshold

You can adjust the `similarityThreshold` to control cache sensitivity:

```javascript
// Higher threshold - only very similar queries will hit the cache
cache.cacheOptions.similarityThreshold = 0.9;

// Lower threshold - more queries will hit the cache, but responses may be less relevant
cache.cacheOptions.similarityThreshold = 0.6;
```

## License

This project is licensed under the MIT License.