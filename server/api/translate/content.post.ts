// server/api/translate/content.post.ts
export default defineEventHandler(async (event) => {
  const { content, sourceLanguage, targetLanguages, contentType } =
    await readBody(event);

  const prompt = `You are a professional translator specializing in content localization for creators.

TASK: Translate the following ${contentType || "content"} from ${
    sourceLanguage || "Indonesian"
  } to ${
    Array.isArray(targetLanguages)
      ? targetLanguages.join(", ")
      : targetLanguages
  }.

REQUIREMENTS:
- Maintain the original tone, style, and cultural context
- Adapt idioms and cultural references appropriately for each target audience
- Preserve formatting, hashtags, and emojis
- Keep brand names and specific terms consistent
- Adapt humor and wordplay to work in the target language

CONTENT TO TRANSLATE:
${content}

OUTPUT FORMAT:
For each target language, provide:
1. The translated content
2. Cultural adaptation notes (if any)
3. Alternative phrasings for key messages

Return as JSON with this structure:
{
  "translations": {
    "language_code": {
      "translated_content": "...",
      "cultural_notes": "...",
      "alternatives": ["...", "..."]
    }
  }
}`;

  try {
    const response = await getAIResponse(prompt);
    return { success: true, data: JSON.parse(response) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
