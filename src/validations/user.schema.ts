import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id.");

export const inviteUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  roleId: objectId,
  assignedBranchIds: z.array(objectId).default([]),
  // A real build would email a set-password link via Resend instead of
  // accepting a password directly — see AuditService/EmailService notes
  // in README. Kept direct here to stay runnable without that integration.
  temporaryPassword: z.string().min(8).max(200),
});
export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const updateUserSchema = z.object({
  userId: objectId,
  name: z.string().trim().min(2).max(120).optional(),
  roleId: objectId.optional(),
  assignedBranchIds: z.array(objectId).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
