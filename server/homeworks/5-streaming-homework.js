// AI services setup - Streaming version
import { GoogleGenAI } from '@google/genai';
import { env } from '../env.js';

const genAI = new GoogleGenAI({
  vertexai: true,
  project: env.projectID,
  location: env.location
});

const googleSearchTool = { googleSearch: {} };

/**
 * Generator function that streams AI response chunks
 * @param {string} message - The user's message
 * @yields {Object} - Chunks with type 'text', 'grounding', or 'done'
 */
export default async function* generateAnswer(message) {
  const prompt = 'Format the message with markdown if necessary, '
                  + 'answer the following message in the same language: ' + message;

  const streamingResponse = await genAI.models.generateContentStream({
    model: env.model,
    contents: prompt,
    config: {
      tools: [googleSearchTool],
    },
  });

  let groundingMetadata = null;

  // Stream text chunks as they arrive
  for await (const chunk of streamingResponse) {
    // Check for grounding metadata in the chunk
    if (chunk.candidates?.[0]?.groundingMetadata) {
      groundingMetadata = chunk.candidates[0].groundingMetadata;
    }

    // Extract text from the chunk
    const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      yield {
        type: 'text',
        content: text
      };
    }
  }

  // Send grounding data at the end if available
  if (groundingMetadata) {
    const grounding = generateGroundingData(groundingMetadata);
    yield {
      type: 'grounding',
      content: grounding
    };
  }

  // Signal completion
  yield {
    type: 'done',
    content: null
  };
}

function generateGroundingData(groundingMetadata) {
  let links = [];

  if (groundingMetadata?.groundingChunks?.length > 0) {
    groundingMetadata.groundingChunks.forEach(groundingChunk => {
      if (groundingChunk.web) {
        links.push({
          text: groundingChunk.web.domain,
          url: groundingChunk.web.uri,
        });
      }
    });
  }

  return { links };
}
