const aiService = require('../services/aiService');
const catchAsync = require('../utils/catchAsync');

exports.generateEmbeddings = catchAsync(async (req, res) => {
    const result = await aiService.generateEmbeddings(req.params.contentId);

    res.status(200).json({
        status: 'success',
        data: result
    });
});

exports.answerQuestion = catchAsync(async (req, res) => {
    const { question, courseId, moduleId } = req.body;

    const result = await aiService.answerQuestion(question, courseId, moduleId);

    res.status(200).json({
        status: 'success',
        data: result
    });
});

exports.getContextualHelp = catchAsync(async (req, res) => {
    const { contentId, timestamp, question } = req.body;

    const result = await aiService.getContextualHelp(contentId, timestamp, question);

    res.status(200).json({
        status: 'success',
        data: result
    });
});
