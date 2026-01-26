const certificateService = require('../services/certificateService');
const catchAsync = require('../utils/catchAsync');

exports.generateCertificate = catchAsync(async (req, res) => {
    const { examAttemptId } = req.body;

    const certificate = await certificateService.generateCertificate(examAttemptId);

    res.status(201).json({
        status: 'success',
        data: certificate
    });
});

exports.verifyCertificate = catchAsync(async (req, res) => {
    const { certificateId } = req.params;

    const result = await certificateService.verifyCertificate(certificateId);

    if (!result.valid) {
        return res.status(200).json({
            status: 'fail',
            data: result
        });
    }

    res.status(200).json({
        status: 'success',
        data: result
    });
});

exports.revokeCertificate = catchAsync(async (req, res) => {
    const { reason } = req.body;
    const { certificateId } = req.params;

    const certificate = await certificateService.revokeCertificate(certificateId, req.user._id, reason);

    res.status(200).json({
        status: 'success',
        data: certificate
    });
});
