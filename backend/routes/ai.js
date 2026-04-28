const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { generateResponse } = require('../services/openaiService');

const router = express.Router();

/**
 * @swagger
 * /api/ai/respond:
 *   post:
 *     summary: Generate a GPT-5.5 response for an authenticated user
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *               context:
 *                 type: string
 *               instructions:
 *                 type: string
 *               previousResponseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful AI response
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Access token required
 *       500:
 *         description: OpenAI request failed
 */
router.post(
  '/respond',
  authenticateToken,
  [
    body('prompt')
      .trim()
      .isLength({ min: 1, max: 8000 })
      .withMessage('prompt must be between 1 and 8000 characters'),
    body('context')
      .optional({ checkFalsy: true })
      .isString()
      .isLength({ max: 12000 })
      .withMessage('context must be at most 12000 characters'),
    body('instructions')
      .optional({ checkFalsy: true })
      .isString()
      .isLength({ max: 4000 })
      .withMessage('instructions must be at most 4000 characters'),
    body('previousResponseId')
      .optional({ checkFalsy: true })
      .isString()
      .isLength({ max: 200 })
      .withMessage('previousResponseId is invalid'),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Invalid AI request',
        errors: errors.array(),
      });
    }

    try {
      const result = await generateResponse({
        prompt: req.body.prompt,
        context: req.body.context,
        instructions: req.body.instructions,
        previousResponseId: req.body.previousResponseId,
      });

      return res.json(result);
    } catch (err) {
      const statusCode = err.status || 500;
      const message = err.message || 'Failed to generate AI response';

      return res.status(statusCode).json({ message });
    }
  }
);

module.exports = router;
