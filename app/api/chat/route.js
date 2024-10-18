import { OpenAI } from "openai";

// Create an OpenAI API client (edge-friendly)
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_TOKEN,
  baseURL: "https://openrouter.ai/api/v1/",
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

// In-memory message history (better to use session storage for persistence)
let messageHistory = [
  {
    role: "system",
    content: `You are a helpful assistant. Remember the context of the conversation and respond even if the user makes minor changes to previous tasks.`,
  },
];

// Helper function to summarize older messages
function summarizeMessages(messages) {
  const summary = messages
    .map((msg) => `${msg.role === "user" ? "User" : "Bot"}: ${msg.content}`)
    .join("\n");
  return {
    role: "system",
    content: `Summary of conversation so far: ${summary}`,
  };
}

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    // Add user's new prompt to message history
    messageHistory.push({ role: "user", content: prompt });

    // If the message history is too long, summarize older messages
    if (messageHistory.length > 10) {
      const summary = summarizeMessages(messageHistory.slice(0, -5)); // Summarize older messages
      messageHistory = [summary, ...messageHistory.slice(-5)];
    }

    // Call the OpenAI API with the current message history
    const response = await openai.chat.completions.create({
      model: "liquid/lfm-40b",
      messages: messageHistory,
      max_tokens: 1000,
      temperature: 0.7, // Balanced creativity
      top_p: 0.9, // Slightly focused on high-probability responses
      frequency_penalty: 0.3, // Avoid too much repetition
      presence_penalty: 0.3, // Encourage exploration of new but relevant topics
      n: 1,
    });

    const script =
      response.choices[0]?.message?.content?.trim() || "No script generated.";

    // Add the assistant's response to the message history
    messageHistory.push({ role: "assistant", content: script });

    // Send the response back to the client
    return new Response(JSON.stringify({ script }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate script." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
