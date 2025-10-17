const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const generateAiResponse = async (userMessage, chatHistory) => {
  try {
    // Format chat history for OpenRouter API
    const messages = chatHistory.map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.content
    }));
    
    // Ensure we always have at least the current user message
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      messages.push({ role: 'user', content: userMessage });
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Chat App'
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: messages
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Full API Error Response:", JSON.stringify(errorBody, null, 2));
      console.error("Request body was:", JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: messages,
        max_tokens: 1000
      }, null, 2));
      throw new Error(`API request failed with status ${response.status}. Error: ${errorBody.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return "Sorry, I couldn't generate a valid response. The model may have returned empty content.";
    }
    return text;

  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    return `There was an error connecting to the AI. Please check the console and ensure your API key is valid and has the necessary permissions. \n\n**Error:** ${error.message}`;
  }
};