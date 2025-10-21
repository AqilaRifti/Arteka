// server/utils/ai.ts
import Cerebras from "@cerebras/cerebras_cloud_sdk";

const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

export async function getAIResponse(prompt: string): Promise<string> {
  // Implementation will use Cerebras with qwen3 model
  // This is a placeholder that you'll implement
    const completionCreateResponse = await cerebras.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "qwen-3-235b-a22b-thinking-2507",
      stream: false,
      max_completion_tokens: 65536, // This is the max, use this limit
      temperature: 0.6,
      top_p: 0.95,
    });

  return completionCreateResponse.choices[0].message.content.replace(
    /^[\s\S]*?<\/think>/,
    ""
  );
}
