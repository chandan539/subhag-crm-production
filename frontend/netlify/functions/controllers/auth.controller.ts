import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  role: z.enum(['ADMIN', 'MANAGER', 'SUPPORT', 'ENGINEER', 'CUSTOMER']).optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const updateUserSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'SUPPORT', 'ENGINEER', 'CUSTOMER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6),
});

const setPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export const setPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = setPasswordSchema.parse(req.body);
    
    // Verify JWT token
    const decoded = jwt.verify(parsed.token, JWT_SECRET as string) as { id: string, email: string };
    
    // Hash new password
    const password_hash = await bcrypt.hash(parsed.password, 10);
    
    // Update user
    await prisma.user.update({
      where: { id: decoded.id },
      data: { password_hash, status: 'ACTIVE' },
    });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(400).json({ error: 'Activation link has expired. Please request a new one.' });
    } else if (error.name === 'JsonWebTokenError') {
      res.status(400).json({ error: 'Invalid activation link.' });
    } else if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      console.error('[API Error in setPassword]:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: parsed.email } });

    if (!user || !(await bcrypt.compare(parsed.password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Account is inactive' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      console.error('[API Error in login]:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({ where: { email: parsed.email } });

    if (existingUser) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }

    const password_hash = await bcrypt.hash(parsed.password, 10);

    const user = await prisma.user.create({
      data: {
        email: parsed.email,
        password_hash,
        first_name: parsed.first_name,
        last_name: parsed.last_name,
        role: parsed.role || 'SUPPORT',
      },
    });

    if (user.role === 'ENGINEER') {
      await prisma.engineer.create({
        data: {
          user_id: user.id,
          territory: 'General',
        }
      });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      console.error('[API Error in register]:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        phone: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('[API Error in getMe]:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          not: 'CUSTOMER',
        }
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        phone: true,
        created_at: true,
      }
    });
    res.json(users);
  } catch (error) {
    console.error('[API Error in getUsers]:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const parsed = updateUserSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id },
      data: parsed,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        phone: true,
      }
    });

    res.json({ message: 'User updated successfully', user });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      console.error('[API Error in updateUser]:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      res.json({ message: 'If an account exists, a reset link will be sent.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, type: 'reset' },
      JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    // In a real app, send an email via Brevo here
    const frontendUrl = process.env.FRONTEND_URL || 'https://warranty.subhag.in';
    const resetLink = `${frontendUrl}/portal/login/forgot-password?token=${token}`;
    
    // Dispatch Email via Brevo API
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (brevoApiKey) {
      try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { email: 'no-reply@subhag.in', name: 'SUBHAG Support' },
            to: [{ email: user.email, name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User' }],
            subject: 'Password Reset Request',
            textContent: `Hello,\n\nYou requested to reset your password. Please use the link below to set a new password:\n\n${resetLink}\n\nThis link will expire in 1 hour.\n\nBest regards,\nSUBHAG Support Team`
          })
        });
        console.log(`[EMAIL DISPATCH SUCCESS] Password reset link sent to ${email}`);
      } catch (err) {
        console.error('[EMAIL DISPATCH ERROR]', err);
      }
    } else {
      console.log(`Password reset link for ${email}: ${resetLink}`);
      console.warn('[EMAIL WARNING] BREVO_API_KEY is not set. Simulating success.');
    }

    res.json({ message: 'If an account exists, a reset link will be sent.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      console.error('[API Error in forgotPassword]:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET as string) as { id: string, email: string, type: string };
    
    if (decoded.type !== 'reset') {
      res.status(400).json({ error: 'Invalid token type' });
      return;
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 10);
    
    // Update user
    await prisma.user.update({
      where: { id: decoded.id },
      data: { password_hash, status: 'ACTIVE' },
    });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(400).json({ error: 'Reset link has expired.' });
    } else if (error.name === 'JsonWebTokenError') {
      res.status(400).json({ error: 'Invalid reset link.' });
    } else if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      console.error('[API Error in resetPassword]:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
