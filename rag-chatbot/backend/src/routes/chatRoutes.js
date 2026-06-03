const express = require('express');
const chatController = require('../controllers/chatController');

const router = express.Router();

router.get('/health', chatController.getHealth);
router.post('/query', chatController.handleUserQuery);
router.get('/history/:sessionId', chatController.getChatHistory);
router.delete('/session', chatController.clearChat);
router.post('/evaluate', chatController.runEvaluation);

module.exports = router;
