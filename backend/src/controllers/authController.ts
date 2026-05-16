import { Request, Response } from 'express';
import * as svc from '../services/authService';

export const register = async (req: Request, res: Response) => {
  const dto = req.body;
  const result = await svc.register(dto);
  res.status(201).json(result);
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await svc.login(email, password);
  // set refresh cookie
  res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: false, sameSite: 'lax' });
  res.json({ accessToken: result.accessToken });
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies['refreshToken'] || req.body.refreshToken;
  await svc.logout(token);
  res.clearCookie('refreshToken');
  res.json({ success: true });
};

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies['refreshToken'] || req.body.refreshToken;
  const result = await svc.refreshToken(token);
  // set cookie
  res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: false, sameSite: 'lax' });
  res.json({ accessToken: result.accessToken });
};

export const forgotPassword = async (req: Request, res: Response) => {
  await svc.forgotPassword(req.body.email);
  res.json({ success: true });
};

export const resetPassword = async (req: Request, res: Response) => {
  await svc.resetPassword(req.body.token, req.body.password);
  res.json({ success: true });
};

export const verifyEmail = async (req: Request, res: Response) => {
  await svc.verifyEmail(String(req.query.token || req.body.token));
  res.json({ success: true });
};

export const resendVerification = async (req: Request, res: Response) => {
  await svc.resendVerification(req.body.email);
  res.json({ success: true });
};

export const changePassword = async (req: Request, res: Response) => {
  const userId = req.body.userId; // in production derive from auth middleware
  await svc.changePassword(userId, req.body.oldPassword, req.body.newPassword);
  res.json({ success: true });
};

export const me = async (req: Request, res: Response) => {
  // example - production: read from auth middleware
  res.json({ user: null });
};
