import { Request, Response, NextFunction } from 'express';
import { askAgriBridgeAssistant } from '../services/ai.service';

export const askAssistant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query, language = 'en' } = req.body;
    const userId = req.user?.userId;

    const response = await askAgriBridgeAssistant({
      query,
      userId,
      language: language as 'en' | 'ta' | 'hi',
    });

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};
