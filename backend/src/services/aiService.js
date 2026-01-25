const { GoogleGenerativeAI } = require('@google/generative-ai');
const Content = require('../models/Content');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate embeddings for content
 */
exports.generateEmbeddings = async (contentId) => {
  const content = await Content.findById(contentId);

  if (!content) {
    throw new Error('Content not found');
  }

  // Extract text from content based on type
  let textToEmbed = '';

  if (content.type === 'text' && content.data.htmlContent) {
    // Strip HTML tags for plain text
    textToEmbed = content.data.htmlContent.replace(/<[^>]*>/g, ' ');
  } else if (content.type === 'pdf' || content.type === 'video') {
    // For now, use title and description (actual PDF/video processing would need additional libraries)
    textToEmbed = `${content.title}. ${content.description || ''}`;
  } else {
    textToEmbed = `${content.title}. ${content.description || ''}`;
  }

  if (!textToEmbed.trim()) {
    throw new Error('No text available for embedding');
  }

  try {
    // Use Gemini embedding model
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_EMBEDDING_MODEL || 'embedding-001' });

    const result = await model.embedContent(textToEmbed);
    const embedding = result.embedding.values;

    // Store embedding in content document
    content.embeddings = [embedding];
    content.embeddingMetadata = {
      model: process.env.GEMINI_EMBEDDING_MODEL || 'embedding-001',
      generatedAt: new Date(),
    };

    await content.save();

    return {
      contentId: content._id,
      embeddingGenerated: true,
      dimensions: embedding.length,
    };
  } catch (error) {
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
};

/**
 * Answer question using course context
 */
exports.answerQuestion = async (question, courseId, moduleId = null) => {
  try {
    // Build query to find relevant content
    const query = { module: moduleId };

    // Get content with embeddings
    const courseContents = await Content.find(query)
      .populate('module')
      .limit(10); // Limit content for context

    if (courseContents.length === 0) {
      return {
        answer: "I don't have any course materials to reference yet. Please contact your instructor.",
        sources: [],
      };
    }

    // Build context from content
    const context = courseContents
      .map(c => {
        let text = c.title;
        if (c.data.htmlContent) {
          text += '\n' + c.data.htmlContent.replace(/<[^>]*>/g, ' ').substring(0, 500);
        } else if (c.description) {
          text += '\n' + c.description;
        }
        return text;
      })
      .join('\n\n---\n\n');

    // Create prompt for Gemini
    const prompt = `You are a helpful learning assistant for an online course. Answer the student's question using ONLY the course materials provided below. If the answer is not in the provided materials, clearly state that you don't have that information in the course content.

Course Materials:
${context}

Student Question: ${question}

Instructions:
- Answer based solely on the provided course materials
- If the information is not available in the materials, say "I don't have information about this in the current course content."
- Be concise and helpful
- Cite which materials your answer comes from when possible

Answer:`;

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-pro' });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const answer = response.text();

    return {
      answer,
      sources: courseContents.map(c => ({
        contentId: c._id,
        title: c.title,
        type: c.type,
      })),
    };
  } catch (error) {
    throw new Error(`AI question answering failed: ${error.message}`);
  }
};

/**
 * Get contextual help during video playback
 */
exports.getContextualHelp = async (contentId, timestamp, question) => {
  const content = await Content.findById(contentId);

  if (!content) {
    throw new Error('Content not found');
  }

  // For video content-specific help
  const context = `Content: ${content.title}\nType: ${content.type}\nTimestamp: ${timestamp}s`;

  const prompt = `You are helping a student who is watching a video lecture. They have a question at timestamp ${timestamp} seconds about the content titled "${content.title}".

Student Question: ${question}

Provide a helpful, concise answer that relates to the video content. If you need more information about what's happening at that specific timestamp, ask the student to provide more context.

Answer:`;

  try {
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-pro' });

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    return {
      answer,
      contentId: content._id,
      timestamp,
    };
  } catch (error) {
    throw new Error(`Contextual help failed: ${error.message}`);
  }
};

module.exports = exports;
