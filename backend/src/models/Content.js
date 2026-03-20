const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Module reference is required'],
  },
  type: {
    type: String,
    enum: {
      values: ['video', 'pdf', 'text', 'link', 'hands_on_notes', 'video_upload', 'notes_upload'],
      message: '{VALUE} is not a valid content type',
    },
    required: [true, 'Content type is required'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
  },
  order: {
    type: Number,
    required: [true, 'Order is required'],
    min: 0,
  },
  
  data: {
    // For video/pdf/files
    url: String,
    duration: Number, // For videos (in seconds)
    size: Number, // File size in bytes
    
    // For text content
    htmlContent: String,
    
    // For external links
    externalUrl: String,
    
    // Version control
    version: {
      type: Number,
      default: 1,
    },
    previousVersions: [{
      url: String,
      uploadedAt: Date,
    }],
  },
  
  // AI embeddings for Gemini context (vector embeddings)
  embeddings: [[Number]], // Array of embedding vectors
  embeddingMetadata: {
    model: String,
    generatedAt: Date,
  },
}, {
  timestamps: true,
});

// Indexes
ContentSchema.index({ module: 1, order: 1 });

module.exports = mongoose.model('Content', ContentSchema);
