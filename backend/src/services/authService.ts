import prisma from '../database/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import nodemailer from 'nodemailer';
import { simpleVerifyEmail, simpleResetEmail, simpleWelcomeEmail } from '../emails/templates';

const saltRounds = 12;

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: false,
  auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
});

export async function register(dto: any) {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw new Error('Email already in use');
  const hash = await bcrypt.hash(dto.password, saltRounds);
  const user = await prisma.user.create({ data: { email: dto.email, password: hash, name: dto.name } });

  // create email verification token
  const token = uuidv4();
  await prisma.emailVerificationToken.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) } });

  // send verification email (best-effort)
  if (config.SMTP_USER) {
    await transporter.sendMail({
      from: config.SMTP_USER,
      to: user.email,
      subject: 'Verify your email',
      html: simpleVerifyEmail(user.email, `${config.APP_URL}/api/auth/verify-email?token=${token}`),
    });
  }
  return { success: true };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');
  if (user.lockedUntil && user.lockedUntil > new Date()) throw new Error('Account locked');
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: { increment: 1 } } });
    throw new Error('Invalid credentials');
  }
  await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0 } });

  const accessToken = jwt.sign({ sub: user.id, role: user.role }, config.JWT_ACCESS_TOKEN_SECRET, { expiresIn: config.ACCESS_TOKEN_EXPIRES_IN });
  const refresh = uuidv4();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await prisma.refreshToken.create({ data: { token: refresh, userId: user.id, expiresAt } });

  return { accessToken, refreshToken: refresh };
}

export async function logout(token?: string) {
  if (!token) return;
  await prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
}

export async function refreshToken(token?: string) {
  if (!token) throw new Error('Invalid token');
  const rt = await prisma.refreshToken.findUnique({ where: { token } });
  if (!rt || rt.revoked || rt.expiresAt < new Date()) throw new Error('Invalid token');
  const user = await prisma.user.findUnique({ where: { id: rt.userId } });
  if (!user) throw new Error('User not found');

  // rotation: revoke current and issue new
  const newToken = uuidv4();
  await prisma.refreshToken.update({ where: { token }, data: { revoked: true, replacedBy: newToken } });
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await prisma.refreshToken.create({ data: { token: newToken, userId: user.id, expiresAt } });

  const accessToken = jwt.sign({ sub: user.id, role: user.role }, config.JWT_ACCESS_TOKEN_SECRET, { expiresIn: config.ACCESS_TOKEN_EXPIRES_IN });
  return { accessToken, refreshToken: newToken };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // don't reveal
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
  await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });
  if (config.SMTP_USER) {
    await transporter.sendMail({ from: config.SMTP_USER, to: email, subject: 'Reset your password', html: simpleResetEmail(email, `${config.APP_URL}/reset-password?token=${token}`) });
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const pr = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!pr || pr.used || pr.expiresAt < new Date()) throw new Error('Invalid or expired token');
  const hash = await bcrypt.hash(newPassword, saltRounds);
  await prisma.user.update({ where: { id: pr.userId }, data: { password: hash } });
  await prisma.passwordResetToken.update({ where: { token }, data: { used: true } });
}

export async function verifyEmail(token: string) {
  const ev = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!ev || ev.used || ev.expiresAt < new Date()) throw new Error('Invalid token');
  await prisma.user.update({ where: { id: ev.userId }, data: { isVerified: true } });
  await prisma.emailVerificationToken.update({ where: { token }, data: { used: true } });
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  const token = uuidv4();
  await prisma.emailVerificationToken.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) } });
  if (config.SMTP_USER) {
    await transporter.sendMail({ from: config.SMTP_USER, to: email, subject: 'Verify your email', html: simpleVerifyEmail(email, `${config.APP_URL}/api/auth/verify-email?token=${token}`) });
  }
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  const ok = await bcrypt.compare(oldPassword, user.password);
  if (!ok) throw new Error('Invalid password');
  const hash = await bcrypt.hash(newPassword, saltRounds);
  await prisma.user.update({ where: { id: userId }, data: { password: hash } });
}
