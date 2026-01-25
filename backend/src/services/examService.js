const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const ProctoringEvent = require('../models/ProctoringEvent');

/**
 * Start exam session
 */
exports.startExam = async (examId, candidateId) => {
  const exam = await Exam.findById(examId)
    .populate({
      path: 'assessment',
      select: '-questions.correctAnswer', // Don't send correct answers
    });

  if (!exam) {
    throw new Error('Exam not found');
  }

  // Check if candidate has access (enrollment check should be done in controller)

  // Create exam attempt
  const examAttempt = new ExamAttempt({
    exam: examId,
    candidate: candidateId,
    status: 'in_progress',
    startedAt: new Date(),
  });

  await examAttempt.save();

  return {
    attemptId: examAttempt._id,
    exam: {
      _id: exam._id,
      assessment: exam.assessment,
      proctoringSettings: exam.proctoringSettings,
      browserSettings: exam.browserSettings,
    },
  };
};

/**
 * Log proctoring violation
 */
exports.logViolation = async (examAttemptId, violationData) => {
  const examAttempt = await ExamAttempt.findById(examAttemptId);

  if (!examAttempt) {
    throw new Error('Exam attempt not found');
  }

  if (examAttempt.status !== 'in_progress') {
    throw new Error('Exam is not in progress');
  }

  const proctoringEvent = new ProctoringEvent({
    examAttempt: examAttemptId,
    type: violationData.type,
    severity: violationData.severity || 'medium',
    data: violationData.data,
  });

  await proctoringEvent.save();

  // Update exam attempt violations
  examAttempt.proctoringData.violations.push(proctoringEvent._id);

  // Calculate risk score (simple weighted sum)
  const severityWeights = { low: 10, medium: 25, high: 50 };
  examAttempt.proctoringData.riskScore += severityWeights[proctoringEvent.severity] || 20;

  // Flag if threshold exceeded
  const exam = await Exam.findById(examAttempt.exam);
  if (examAttempt.proctoringData.violations.length >= exam.proctoringSettings.allowedViolations) {
    examAttempt.proctoringData.flagged = true;
    examAttempt.status = 'flagged';
  }

  await examAttempt.save();

  return {
    violationLogged: true,
    riskScore: examAttempt.proctoringData.riskScore,
    flagged: examAttempt.proctoringData.flagged,
  };
};

/**
 * Submit exam
 */
exports.submitExam = async (examAttemptId, answers) => {
  const examAttempt = await ExamAttempt.findById(examAttemptId)
    .populate({
      path: 'exam',
      populate: { path: 'assessment' },
    });

  if (!examAttempt) {
    throw new Error('Exam attempt not found');
  }

  if (examAttempt.status !== 'in_progress') {
    throw new Error('Exam is not in progress');
  }

  // Use assessment service to grade
  const assessmentService = require('./assessmentService');
  const result = await assessmentService.submitAnswers(
    examAttempt.exam.assessment._id,
    examAttempt.candidate,
    answers,
    examAttemptId
  );

  return result;
};

/**
 * Get exam violations
 */
exports.getViolations = async (examAttemptId) => {
  const violations = await ProctoringEvent.find({ examAttempt: examAttemptId })
    .sort({ timestamp: 1 });

  return violations;
};

module.exports = exports;
