import { defineAgent } from 'eve';
import { google } from '@ai-sdk/google';

export default defineAgent({
  // Configure the Gemini model for agent generation
  model: google('models/gemini-1.5-flash'),
});
