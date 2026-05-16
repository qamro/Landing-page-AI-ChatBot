export const simpleVerifyEmail = (to: string, link: string) => `
  <p>Hi ${to},</p>
  <p>Click the link below to verify your email:</p>
  <p><a href="${link}">${link}</a></p>
  <p>This link expires in 24 hours.</p>
`;

export const simpleResetEmail = (to: string, link: string) => `
  <p>Hi ${to},</p>
  <p>Click the link below to reset your password:</p>
  <p><a href="${link}">${link}</a></p>
  <p>This link expires in 1 hour.</p>
`;

export const simpleWelcomeEmail = (to: string) => `
  <p>Welcome ${to}!</p>
  <p>Thanks for signing up.</p>
`;
