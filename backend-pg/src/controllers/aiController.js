const catchAsync = require('../utils/catchAsync');

const GEMINI_MODELS = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite-preview',
];

async function callGemini(apiKey, prompt, modelIndex = 0) {
  if (modelIndex >= GEMINI_MODELS.length) return null;
  const model = GEMINI_MODELS[modelIndex];
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
      }),
    }
  );
  if (response.status === 404) return callGemini(apiKey, prompt, modelIndex + 1);
  return response;
}

exports.chat = catchAsync(async (req, res) => {
  const { question, courseId } = req.body;
  if (!question?.trim()) return res.status(400).json({ success: false, message: 'Question is required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return res.status(503).json({ success: false, message: 'AI service not configured. Please set GEMINI_API_KEY in backend .env' });
  }

  const systemContext = courseId
    ? 'You are a helpful learning assistant for Coal Learns. The student is studying a course. Answer clearly and concisely.'
    : 'You are a helpful learning assistant for Coal Learns. Answer clearly and concisely.';

  const prompt = `${systemContext}\n\nStudent question: ${question}\n\nResponse:`;
  const response = await callGemini(apiKey, prompt);

  if (!response) return res.status(502).json({ success: false, message: 'No compatible Gemini model found' });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return res.status(502).json({ success: false, message: err?.error?.message || 'AI service error' });
  }

  const data = await response.json();
  const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response. Please try again.';
  res.status(200).json({ success: true, data: { answer } });
});
