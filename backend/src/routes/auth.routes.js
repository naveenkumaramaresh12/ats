const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth.middleware');

router.post('/login', ctrl.login);
router.post('/logout', auth, ctrl.logout);

module.exports = router;
