// AI services setup
import { GoogleGenAI } from '@google/genai';
import { env } from '../env.js';

const genAI = new GoogleGenAI({
  vertexai: true,
  project: env.projectID,
  location: env.location
});

export default async function generateAnswer(message) {
  const aiResponse = await prompt(message);
  const grounding = generateGroundingData(aiResponse);

  return {
    message: aiResponse.candidates[0].content.parts[0].text,
    metadata: { grounding },
  };
};

async function prompt(message) {
  const prompt = 'Format the message with markdown if necessary, '
                  + 'answer the following message in the same language: ' + message;
  const aiResponse = await genAI.models.generateContent({
    model: env.model,
    contents: prompt,
    // Google Search tool is enabled
    config: { tools: [{ googleSearch: {}}]},
  });

  return aiResponse;
}

function generateGroundingData(aiResponse) {
  const grounding = aiResponse.candidates[0].groundingMetadata;
  let links = [];

  // Go through the grounding metadata if any
  if (grounding && grounding.groundingChunks && grounding.groundingChunks.length > 0) {
    grounding.groundingChunks.forEach(groundingChunk => {
      if (groundingChunk.web) {
        // Create one link button per web URL returned
        links.push({
          text: groundingChunk.web.domain,
          url: groundingChunk.web.uri,
        });
      }
    });
  }

  return { links };
}
