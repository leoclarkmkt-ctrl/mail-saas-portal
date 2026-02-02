import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8)
  .regex(/[a-z]/, "Must include lowercase")
  .regex(/[A-Z]/, "Must include uppercase")
  .regex(/[0-9]/, "Must include number")
  .regex(/[^A-Za-z0-9]/, "Must include special character");

export const redeemSchema = z.object({
  activation_code: z.string().min(6),
  personal_email: z.string().email().transform((v) => v.toLowerCase()),
  edu_username: z.string().min(2).max(32).regex(/^[a-zA-Z0-9._-]+$/).transform((v) => v.toLowerCase()),
  password: passwordSchema
});

export const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1),
  mode: z.enum(["personal", "edu"]) 
});

export const forgotSchema = z.object({
  personal_email: z.string().email().transform((v) => v.toLowerCase())
});

export const resetSchema = z.object({
  access_token: z.string().min(10),
  new_password: passwordSchema
});

export const renewSchema = z.object({
  activation_code: z.string().min(6)
});

export const changePasswordSchema = z.object({
  old_password: z.string().min(1),
  new_password: passwordSchema
});

export const adminLoginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1)
});

export const adminGenerateCodesSchema = z.object({
  quantity: z.number().int().min(1).max(500),
  prefix: z.string().max(6).optional(),
  length: z.number().int().min(16).max(24).default(20)
});

export const adminRevokeCodeSchema = z.object({
  code: z.string().min(6)
});

export const adminUserActionSchema = z.object({
  user_id: z.string().uuid(),
  years: z.number().int().min(1).max(5).optional(),
  suspend: z.boolean().optional(),
  reason: z.string().max(200).optional(),
  reset_password: z.boolean().optional()
});
