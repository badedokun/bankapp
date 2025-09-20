import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { ConversationalAIService } from '../services/ai-intelligence-service/core/ConversationalAIService';
import IntentClassificationService from '../services/ai-intelligence-service/nlp/IntentClassificationService';
import EntityExtractionService from '../services/ai-intelligence-service/nlp/EntityExtractionService';

const router = express.Router();

const aiService = new ConversationalAIService();
const intentService = new IntentClassificationService();
const entityService = new EntityExtractionService();

router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message || !context) {
      return res.status(400).json({
        error: 'Message and context are required'
      });
    }

    const response = await aiService.processMessage(message, context);
    
    res.json(response);

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      error: 'Failed to process AI chat request',
      message: "I'm sorry, I'm having trouble understanding your request right now. Please try again."
    });
  }
});

router.post('/voice', authenticateToken, async (req, res) => {
  try {
    const { audioData, context } = req.body;
    
    if (!audioData || !context) {
      return res.status(400).json({
        error: 'Audio data and context are required'
      });
    }

    const audioBuffer = Buffer.from(audioData, 'base64');
    const response = await aiService.processVoiceCommand(audioBuffer, context);
    
    res.json(response);

  } catch (error) {
    console.error('AI Voice Error:', error);
    res.status(500).json({
      error: 'Failed to process voice command',
      message: "I couldn't understand the voice command. Please try speaking again."
    });
  }
});

router.post('/intent', authenticateToken, async (req, res) => {
  try {
    const { text, context } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Text is required'
      });
    }

    const intent = await intentService.classifyIntent(text, context);
    
    res.json(intent);

  } catch (error) {
    console.error('Intent Classification Error:', error);
    res.status(500).json({
      error: 'Failed to classify intent'
    });
  }
});

router.post('/entities', authenticateToken, async (req, res) => {
  try {
    const { text, context } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Text is required'
      });
    }

    const result = await entityService.extractEntities(text, context);
    
    res.json(result);

  } catch (error) {
    console.error('Entity Extraction Error:', error);
    res.status(500).json({
      error: 'Failed to extract entities'
    });
  }
});

router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const { context } = req.query;
    
    const contextObj = context ? JSON.parse(context as string) : {
      userId: (req as any).user?.id || 'anonymous',
      tenantId: 'default',
      conversationId: 'suggestions',
      language: 'en',
      bankingContext: {}
    };

    const suggestions = await aiService.generateSuggestions(contextObj);
    
    res.json({ suggestions });

  } catch (error) {
    console.error('AI Suggestions Error:', error);
    res.status(500).json({
      error: 'Failed to generate suggestions',
      suggestions: [
        "Check my account balance",
        "Send money to someone",
        "Show recent transactions",
        "Pay bills",
        "How can you help me?"
      ]
    });
  }
});

router.get('/intent-suggestions', authenticateToken, async (req, res) => {
  try {
    const { partialText } = req.query;
    
    if (!partialText) {
      return res.json({
        suggestions: [
          "Check my balance",
          "Send money",
          "Recent transactions",
          "Pay bills",
          "Help"
        ]
      });
    }

    const suggestions = await intentService.getIntentSuggestions(partialText as string);
    
    res.json({ suggestions });

  } catch (error) {
    console.error('Intent Suggestions Error:', error);
    res.status(500).json({
      error: 'Failed to get intent suggestions',
      suggestions: []
    });
  }
});

router.get('/entity-types', authenticateToken, async (req, res) => {
  try {
    const entityTypes = entityService.getEntityTypes();
    
    res.json({ entityTypes });

  } catch (error) {
    console.error('Entity Types Error:', error);
    res.status(500).json({
      error: 'Failed to get entity types',
      entityTypes: []
    });
  }
});

router.post('/validate-entities', authenticateToken, async (req, res) => {
  try {
    const { entities, context } = req.body;
    
    if (!entities || !Array.isArray(entities)) {
      return res.status(400).json({
        error: 'Entities array is required'
      });
    }

    const validatedEntities = await entityService.validateExtractedEntities(entities, context);
    
    res.json({ entities: validatedEntities });

  } catch (error) {
    console.error('Entity Validation Error:', error);
    res.status(500).json({
      error: 'Failed to validate entities'
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      conversationalAI: 'active',
      intentClassification: 'active',
      entityExtraction: 'active'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;