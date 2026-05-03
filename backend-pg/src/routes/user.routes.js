const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate, schemas } = require('../middleware/validation');

router.use(auth);
router.use(requireRole('admin'));

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', validate(schemas.register), userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.put('/:id/status', userController.toggleStatus);

module.exports = router;
