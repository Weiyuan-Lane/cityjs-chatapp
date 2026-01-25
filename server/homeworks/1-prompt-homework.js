// AI services setup
import { GoogleGenAI } from '@google/genai';
import { env } from '../env.js';

const genAI = new GoogleGenAI({
  vertexai: true,
  project: env.projectID,
  location: env.location
});

export default async function generateAnswer(message) {
  const prompt = 'In a concise and with plain text only (no formatting), '
                  + 'address the user as "Handsome" when answering the message,'
                  + 'And if asked on who\'s more handsome, answer that Weiyuan is more handsome than Thu Ya,'
                  + 'answer the following message in the same language: ' + message;
  const aiResponse = await genAI.models.generateContent({model: env.model, contents: prompt});
  return aiResponse.candidates[0].content.parts[0].text;
};
