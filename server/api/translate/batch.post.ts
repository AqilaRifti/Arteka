// server/api/translate/batch.post.ts
export default defineEventHandler(async (event) => {
  const { contents, sourceLanguage, targetLanguage } = await readBody(event);

  const prompt = `Batch translate the following content items from ${
    sourceLanguage || "Indonesian"
  } to ${targetLanguage}.

CONTENT ITEMS:
${contents.map((c: any, i: number) => `${i + 1}. ${c}`).join("\n")}

REQUIREMENTS:
- Maintain consistency in terminology across all items
- Preserve formatting and special characters
- Keep the same energy and tone throughout

Return as JSON array:
[
  { "original": "...", "translated": "..." },
  ...
]`;

  try {
    const response = await getAIResponse(prompt);
    return { success: true, data: JSON.parse(response) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
