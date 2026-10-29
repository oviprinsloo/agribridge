import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { ENV } from '../config/env';
import { AuthUserPayload } from '../types';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      email,
      password,
      name,
      phone,
      role,
      preferredLanguage,
      farmName,
      village,
      district,
      state,
      latitude,
      longitude,
      totalAreaAcres,
      bankAccountNumber,
      bankIfsc,
      upiId,
      businessName,
      businessType,
      gstin,
      address,
      city,
      pincode,
    } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
        code: 'EMAIL_ALREADY_EXISTS',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name,
          phone,
          role,
          status: 'ACTIVE',
          isVerified: true,
        },
      });

      // Farmer setup
      if (role === 'FARMER') {
        const farmerProfile = await tx.farmerProfile.create({
          data: {
            userId: user.id,
            preferredLanguage: preferredLanguage || 'ta',
            totalAcres: totalAreaAcres || 2.0,
            bankAccountNumber,
            bankIfsc,
            upiId,
          },
        });

        // Create initial farm
        await tx.farm.create({
          data: {
            farmerProfileId: farmerProfile.id,
            farmName: farmName || `${name}'s Farm`,
            village: village || 'Namakkal Rural',
            district: district || 'Namakkal',
            state: state || 'Tamil Nadu',
            latitude: latitude || 11.2189,
            longitude: longitude || 78.1674,
            totalAreaAcres: totalAreaAcres || 2.0,
          },
        });
      }

      // Buyer setup
      if (role === 'BUYER') {
        await tx.buyerProfile.create({
          data: {
            userId: user.id,
            businessName: businessName || `${name} Enterprises`,
            businessType: businessType || 'RETAILER',
            gstin,
            address: address || 'Main Market Road',
            city: city || 'Chennai',
            state: state || 'Tamil Nadu',
            pincode: pincode || '600001',
            latitude: latitude || 13.0827,
            longitude: longitude || 80.2707,
          },
        });
      }

      // Set language preference
      await tx.languagePreference.create({
        data: {
          userId: user.id,
          languageCode: preferredLanguage || (role === 'FARMER' ? 'ta' : 'en'),
        },
      });

      return user;
    });

    const userWithProfile = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        farmerProfile: { include: { farms: true } },
        buyerProfile: true,
      },
    });

    const payload: AuthUserPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role as any,
      name: newUser.name,
      farmerProfileId: userWithProfile?.farmerProfile?.id,
      buyerProfileId: userWithProfile?.buyerProfile?.id,
    };

    const token = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
          farmerProfile: userWithProfile?.farmerProfile,
          buyerProfile: userWithProfile?.buyerProfile,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        farmerProfile: { include: { farms: true } },
        buyerProfile: true,
        languagePref: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact platform administration.',
        code: 'ACCOUNT_SUSPENDED',
      });
      return;
    }

    const payload: AuthUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
      farmerProfileId: user.farmerProfile?.id,
      buyerProfileId: user.buyerProfile?.id,
    };

    const token = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          language: user.languagePref?.languageCode || (user.role === 'FARMER' ? 'ta' : 'en'),
          farmerProfile: user.farmerProfile,
          buyerProfile: user.buyerProfile,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: {
          include: {
            farms: true,
            farmerCrops: { include: { crop: true } },
          },
        },
        buyerProfile: {
          include: {
            purchaseRequirements: { include: { crop: true } },
          },
        },
        languagePref: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const unreadNotificationsCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          language: user.languagePref?.languageCode || 'en',
          farmerProfile: user.farmerProfile,
          buyerProfile: user.buyerProfile,
          unreadNotificationsCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLanguage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { languageCode } = req.body;

    if (!['en', 'ta', 'hi'].includes(languageCode)) {
      res.status(400).json({ success: false, message: 'Supported languages are: en, ta, hi' });
      return;
    }

    const pref = await prisma.languagePreference.upsert({
      where: { userId },
      update: { languageCode },
      create: { userId: userId!, languageCode },
    });

    res.status(200).json({
      success: true,
      message: 'Language preference updated',
      data: pref,
    });
  } catch (error) {
    next(error);
  }
};
