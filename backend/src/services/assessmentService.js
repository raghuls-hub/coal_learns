const Assessment = require('../models/Assessment');
const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');

/**
 * Create assessment
 */
exports.createAssessment = async (assessmentData, userId, userRole) => {
  // Verify ownership of course/module
  if (assessmentData.module) {
    const Module = require('../models/Module');
    const module = await Module.findById(assessmentData.module).populate('course');

    if (!module) {
      throw new Error('Module not found');
    }

    if (userRole !== 'admin' && module.course.courseHandler.toString() !== userId) {
      throw new Error('Unauthorized to create assessment for this module');
    }
  }

  const assessment = new Assessment(assessmentData);
  await assessment.save();

  // If module assessment, link to module
  if (assessmentData.module) {
    const Module = require('../models/Module');
    await Module.findByIdAndUpdate(assessmentData.module, {
      assessment: assessment._id,
    });
  }

  return assessment;
};

/**
 * Get assessment by ID
 */
exports.getAssessmentById = async (assessmentId) => {
  const assessment = await Assessment.findById(assessmentId)
    .populate('module')
    .populate('course');

  if (!assessment) {
    throw new Error('Assessment not found');
  }

  return assessment;
};

/**
 * Start assessment attempt
 */
exports.startAttempt = async (assessmentId, candidateId) => {
  const assessment = await Assessment.findById(assessmentId);

  if (!assessment) {
    throw new Error('Assessment not found');
  }

  // Check daily attempt limit for mini-tests
  if (assessment.type === 'mini_test' && assessment.settings.attemptsPerDay) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attemptsToday = await ExamAttempt.countDocuments({
      'exam.assessment': assessmentId,
      candidate: candidateId,
      createdAt: { $gte: today },
    });

    if (attemptsToday >= assessment.settings.attemptsPerDay) {
      throw new Error('Daily attempt limit reached for this assessment');
    }
  }

  // Shuffle questions if enabled
  let questions = [...assessment.questions];
  if (assessment.settings.shuffleQuestions) {
    questions = shuffleArray(questions);
  }

  // Shuffle options if enabled
  if (assessment.settings.shuffleOptions) {
    questions = questions.map(q => ({
      ...q.toObject(),
      options: q.options ? shuffleArray([...q.options]) : q.options,
    }));
  }

  // Remove correct answers from client response
  const sanitizedQuestions = questions.map(q => ({
    _id: q._id,
    type: q.type,
    question: q.question,
    options: q.options,
    points: q.points,
  }));

  return {
    assessment: {
      _id: assessment._id,
      title: assessment.title,
      type: assessment.type,
      settings: assessment.settings,
    },
    questions: sanitizedQuestions,
  };
};

/**
 * Submit assessment answers
 */
exports.submitAnswers = async (assessmentId, candidateId, answers, examAttemptId = null) => {
  const assessment = await Assessment.findById(assessmentId);

  if (!assessment) {
    throw new Error('Assessment not found');
  }

  // Grade answers
  let totalPoints = 0;
  let earnedPoints = 0;

  const gradedAnswers = answers.map(submittedAnswer => {
    const question = assessment.questions.id(submittedAnswer.questionId);

    if (!question) {
      return null;
    }

    totalPoints += question.points;

    const isCorrect = checkAnswer(question, submittedAnswer.answer);
    const pointsEarned = isCorrect ? question.points : 0;
    earnedPoints += pointsEarned;

    return {
      questionId: question._id,
      answer: submittedAnswer.answer,
      isCorrect,
      pointsEarned,
    };
  }).filter(a => a !== null);

  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = percentage >= assessment.settings.passingPercentage;

  // If this is part of an exam attempt, update it
  if (examAttemptId) {
    const examAttempt = await ExamAttempt.findById(examAttemptId);

    if (!examAttempt) {
      throw new Error('Exam attempt not found');
    }

    examAttempt.answers = gradedAnswers;
    examAttempt.score = {
      obtained: earnedPoints,
      total: totalPoints,
      percentage,
    };
    examAttempt.status = 'evaluated';
    examAttempt.submittedAt = new Date();

    await examAttempt.save();

    return {
      attemptId: examAttempt._id,
      score: examAttempt.score,
      passed,
    };
  }

  // Return results directly (for non-exam assessments)
  return {
    score: {
      obtained: earnedPoints,
      total: totalPoints,
      percentage,
    },
    passed,
    answers: assessment.settings.showAnswers ? gradedAnswers : undefined,
  };
};

/**
 * Helper: Check if answer is correct
 */
function checkAnswer(question, submittedAnswer) {
  const correctAnswer = question.correctAnswer;

  if (question.type === 'mcq' || question.type === 'true_false' || question.type === 'short_answer') {
    return submittedAnswer === correctAnswer;
  }

  if (question.type === 'multiple_select') {
    if (!Array.isArray(submittedAnswer) || !Array.isArray(correctAnswer)) {
      return false;
    }

    if (submittedAnswer.length !== correctAnswer.length) {
      return false;
    }

    const sortedSubmitted = [...submittedAnswer].sort();
    const sortedCorrect = [...correctAnswer].sort();

    return sortedSubmitted.every((ans, idx) => ans === sortedCorrect[idx]);
  }

  return false;
}

/**
 * Helper: Shuffle array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = exports;
