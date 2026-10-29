import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { schemeEligibilityService } from '../services/schemeEligibility.service';

export const listSchemes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { state } = req.query;
    const where: any = { isActive: true };
    if (state) {
      where.OR = [{ state: 'All India' }, { state: String(state) }];
    }

    const schemes = await prisma.governmentScheme.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: schemes,
      disclaimer:
        'Scheme eligibility shown here is an informational estimate. Eligibility and application requirements may change. Verify details on the official government portal before applying.',
    });
  } catch (error) {
    next(error);
  }
};

export const checkEligibility = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { state, totalLandAcres, cropsGrown, farmerCategory, annualIncome, hasIrrigation } = req.body;

    const evaluation = await schemeEligibilityService.evaluateEligibility({
      state,
      totalLandAcres: parseFloat(totalLandAcres),
      cropsGrown,
      farmerCategory,
      annualIncome: annualIncome ? parseFloat(annualIncome) : undefined,
      hasIrrigation,
    });

    res.status(200).json({
      success: true,
      data: evaluation.results,
      disclaimer: evaluation.disclaimer,
    });
  } catch (error) {
    next(error);
  }
};

export const createScheme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const scheme = await prisma.governmentScheme.create({
      data: req.body,
    });
    res.status(201).json({ success: true, message: 'Scheme created', data: scheme });
  } catch (error) {
    next(error);
  }
};

export const updateScheme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const scheme = await prisma.governmentScheme.update({
      where: { id: String(id) },
      data: req.body,
    });
    res.status(200).json({ success: true, message: 'Scheme updated', data: scheme });
  } catch (error) {
    next(error);
  }
};
