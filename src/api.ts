import axios from 'axios';

export class API {
  public static async getGPTResponse(prompt: string, options: any): Promise<string> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: options.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${options.openAIApiKey}`,
        },
      }
    );
    return response.data.choices[0].message.content.trim();
  }
}
