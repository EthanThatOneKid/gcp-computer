import { defineAgent } from 'eve';
import { google } from '@ai-sdk/google';

export default defineAgent({
  // Configure the Gemini model for agent generation
  model: google('gemini-2.0-flash'),
});
