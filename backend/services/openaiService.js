const OpenAI = require('openai');

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-5.5';
const DEFAULT_REASONING_EFFORT = process.env.OPENAI_REASONING_EFFORT || 'medium';
const DEFAULT_TEXT_VERBOSITY = process.env.OPENAI_TEXT_VERBOSITY || 'low';

const baseInstructions = [
  'You are an AI assistant for a Scrum project management application.',
  'Focus on the requested outcome, keep responses practical and concise, and preserve any explicit constraints from the user.',
  'If the request lacks required information, say what is missing instead of inventing details.',
  'Stop once you have fully answered the request or identified the missing information that blocks a complete answer.',
].join(' ');

let client;

const getClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return client;
};

const buildInput = ({ prompt, context }) => {
  const input = [
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: prompt,
        },
      ],
    },
  ];

  if (context) {
    input.unshift({
      role: 'developer',
      content: [
        {
          type: 'input_text',
          text: `Relevant application context:\n${context}`,
        },
      ],
    });
  }

  return input;
};

const generateResponse = async ({
  prompt,
  context,
  instructions,
  previousResponseId,
}) => {
  const openai = getClient();
  const response = await openai.responses.create({
    model: DEFAULT_MODEL,
    store: false,
    previous_response_id: previousResponseId || undefined,
    instructions: instructions
      ? `${baseInstructions}\n\nAdditional instructions:\n${instructions}`
      : baseInstructions,
    input: buildInput({ prompt, context }),
    reasoning: {
      effort: DEFAULT_REASONING_EFFORT,
    },
    text: {
      verbosity: DEFAULT_TEXT_VERBOSITY,
    },
  });

  return {
    id: response.id,
    model: response.model,
    outputText: response.output_text || '',
    usage: response.usage || null,
  };
};

module.exports = {
  generateResponse,
};
