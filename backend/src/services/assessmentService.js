const Assessment = require('../models/Assessment');

/**
 * Start assessment attempt
 */
exports.startAttempt = async (assessmentId, candidateId) => {
  const assessment = await Assessment.findById(assessmentId);
  
  if (!assessment) {
    throw new Error('Assessment not found');
  }

  // Check if questions exist
  if (!assessment.questions) {
    console.error(`Assessment ${assessmentId} has no questions array`);
    assessment.questions = [];
  }

  // Return assessment with questions but without correct answers
  const questionsWithoutAnswers = assessment.questions.map(q => {
    const question = {
      _id: q._id,
      type: q.type,
      question: q.question,
      points: q.points
    };

    if (q.type === 'mcq') {
      question.options = q.options;
    }

    return question;
  });

  return {
    _id: assessment._id,
    title: assessment.title,
    description: assessment.description,
    passingScore: assessment.settings.passingPercentage,
    totalPoints: assessment.totalPoints,
    questions: questionsWithoutAnswers
  };
};

/**
 * Submit assessment and grade it
 */
exports.submitAnswers = async (assessmentId, candidateId, answers) => {
  console.log('[submitAnswers SERVICE] Called with:', { assessmentId, candidateId, answersCount: answers.length });
  
  const assessment = await Assessment.findById(assessmentId);
  
  if (!assessment) {
    throw new Error('Assessment not found');
  }

  console.log('[submitAnswers SERVICE] Assessment found:', assessment.title);
  console.log('[submitAnswers SERVICE] Total questions:', assessment.questions.length);

  let obtainedScore = 0;
  const results = [];

  // Grade each question
  assessment.questions.forEach(question => {
    const answer = answers.find(a => a.questionId === question._id.toString());
    
    if (!answer) {
      results.push({
        questionId: question._id,
        correct: false,
        points: 0,
        maxPoints: question.points
      });
      return;
    }

    let isCorrect = false;

    if (question.type === 'mcq') {
      // For MCQ, compare the selected option with correct answer
      // Handle type coercion: frontend might send string "0" while DB has number 0
      const userAnswer = typeof answer.answer === 'string' ? parseInt(answer.answer, 10) : answer.answer;
      const correctAnswer = typeof question.correctAnswer === 'string' ? parseInt(question.correctAnswer, 10) : question.correctAnswer;
      console.log(userAnswer, correctAnswer);
      isCorrect = userAnswer === correctAnswer;
    } else if (question.type === 'fill_in_the_blank') {
      // For fill in blank, case-insensitive comparison with trimming
      const userAnswer = (answer.answer || '').toString().trim().toLowerCase();
      const correctAnswer = (question.correctAnswer || '').toString().trim().toLowerCase();
      isCorrect = userAnswer === correctAnswer;
    }

    const pointsEarned = isCorrect ? question.points : 0;
    obtainedScore += pointsEarned;

    results.push({
      questionId: question._id,
      correct: isCorrect,
      points: pointsEarned,
      maxPoints: question.points,
      userAnswer: answer.answer,
      correctAnswer: question.correctAnswer
    });
  });

  const percentage = (obtainedScore / assessment.totalPoints) * 100;
  const passed = percentage >= assessment.settings.passingPercentage;

  return {
    assessmentId: assessment._id,
    score: {
      obtained: obtainedScore,
      total: assessment.totalPoints,
      percentage: Math.round(percentage)
    },
    passed,
    results
  };
};

/**
 * Get assessment by ID
 */
exports.getAssessmentById = async (assessmentId) => {
  const assessment = await Assessment.findById(assessmentId);
  
  if (!assessment) {
    throw new Error('Assessment not found');
  }

  return assessment;
};
