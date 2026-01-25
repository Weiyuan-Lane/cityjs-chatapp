// AI services setup
import { GoogleGenAI } from '@google/genai';
import { env } from '../env.js';

const genAI = new GoogleGenAI({
  vertexai: true,
  project: env.projectID,
  location: env.location
});

const googleSearchTool = { googleSearch: {} };
// const codeExecutionTool = { codeExecution: {} }; // See https://ai.google.dev/gemini-api/docs/code-execution for more details

export default async function generateAnswer(message) {
  const aiResponse = await prompt(message);
  const grounding = generateGroundingData(aiResponse);
  const responseMessage = generateResponseMessage(aiResponse);

  return {
    message: responseMessage,
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
    config: {
      tools: [
        googleSearchTool,
        //codeExecutionTool,
      ]
    },
  });

  return aiResponse;
}

function generateResponseMessage(aiResponse) {
  if (!aiResponse || !aiResponse.candidates || !aiResponse.candidates[0]) {
    return '';
  }

  const markdownParts = [];

  aiResponse.candidates[0].content.parts.forEach(part => {
    if (part.text) {
      // Regular text content
      markdownParts.push(part.text);
    } else if (part.executableCode) {
      // Code that was executed
      const lang = part.executableCode.language?.toLowerCase() || 'code';
      markdownParts.push(`\`\`\`${lang}\n${part.executableCode.code}\`\`\``);
    } else if (part.codeExecutionResult) {
      // Result of code execution
      const outcome = part.codeExecutionResult.outcome;
      const output = part.codeExecutionResult.output || '';
      const status = outcome === 'OUTCOME_OK' ? '✅ Output' : '❌ Error';
      markdownParts.push(`**${status}:**\n\`\`\`\n${output}\`\`\``);
    }
  });

  return markdownParts.join('\n\n---\n\n');
}

function generateGroundingData(aiResponse) {
  if (!aiResponse || !aiResponse.candidates || !aiResponse.candidates[0]) {
    return {};
  }

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
