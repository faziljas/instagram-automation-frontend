import { z } from 'zod';

// ========================================
// User Registration Schema
// ========================================
export const userRegistrationSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type UserRegistrationFormData = z.infer<typeof userRegistrationSchema>;

// ========================================
// User Login Schema
// ========================================
export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type UserLoginFormData = z.infer<typeof userLoginSchema>;

// ========================================
// Instagram Account Connection Schema
// ========================================
export const instagramAccountConnectionSchema = z.object({
  username: z
    .string()
    .min(1, 'Instagram username is required')
    .regex(/^[a-zA-Z0-9._]+$/, 'Invalid Instagram username format'),
  password: z.string().min(1, 'Instagram password is required'),
});

export type InstagramAccountConnectionFormData = z.infer<
  typeof instagramAccountConnectionSchema
>;

// ========================================
// Automation Rule Creation Schema
// ========================================
export const automationRuleCreationSchema = z.object({
  name: z.string().min(1, 'Rule name is required').max(100, 'Rule name is too long'),
  instagramAccountId: z.string().min(1, 'Instagram account is required'),
  type: z.enum(['auto_like', 'auto_comment', 'auto_follow', 'auto_unfollow', 'scheduled_post'], {
    errorMap: () => ({ message: 'Invalid automation rule type' }),
  }),
  config: z.record(z.unknown()).refine(
    (config) => {
      // Validate config based on rule type (basic validation)
      return Object.keys(config).length > 0;
    },
    {
      message: 'Rule configuration is required',
    }
  ),
  schedule: z
    .object({
      frequency: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    })
    .optional(),
  isActive: z.boolean().optional().default(true),
});

export type AutomationRuleCreationFormData = z.infer<typeof automationRuleCreationSchema>;

// ========================================
// Automation Rule Update Schema
// ========================================
export const automationRuleUpdateSchema = z.object({
  name: z.string().min(1, 'Rule name is required').max(100, 'Rule name is too long').optional(),
  config: z.record(z.unknown()).optional(),
  schedule: z
    .object({
      frequency: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

export type AutomationRuleUpdateFormData = z.infer<typeof automationRuleUpdateSchema>;

// ========================================
// Profile Update Schema
// ========================================
export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// ========================================
// Password Change Schema
// ========================================
export const passwordChangeSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

// ========================================
// Email Update Schema
// ========================================
export const emailUpdateSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required to change email'),
});

export type EmailUpdateFormData = z.infer<typeof emailUpdateSchema>;

// ========================================
// Rule Config Schemas (for specific rule types)
// ========================================

// Auto Like Config
export const autoLikeConfigSchema = z.object({
  targetHashtags: z.array(z.string()).min(1, 'At least one hashtag is required'),
  maxLikesPerDay: z.number().min(1).max(500, 'Maximum 500 likes per day'),
  delayBetweenLikes: z.number().min(30, 'Minimum 30 seconds delay').max(300),
});

export type AutoLikeConfigFormData = z.infer<typeof autoLikeConfigSchema>;

// Auto Comment Config
export const autoCommentConfigSchema = z.object({
  targetHashtags: z.array(z.string()).min(1, 'At least one hashtag is required'),
  commentTemplates: z.array(z.string()).min(1, 'At least one comment template is required'),
  maxCommentsPerDay: z.number().min(1).max(100, 'Maximum 100 comments per day'),
  delayBetweenComments: z.number().min(60, 'Minimum 60 seconds delay').max(600),
});

export type AutoCommentConfigFormData = z.infer<typeof autoCommentConfigSchema>;

// Auto Follow Config
export const autoFollowConfigSchema = z.object({
  targetHashtags: z.array(z.string()).min(1, 'At least one hashtag is required'),
  maxFollowsPerDay: z.number().min(1).max(200, 'Maximum 200 follows per day'),
  delayBetweenFollows: z.number().min(60, 'Minimum 60 seconds delay').max(600),
  followBackOnly: z.boolean().optional().default(false),
});

export type AutoFollowConfigFormData = z.infer<typeof autoFollowConfigSchema>;

// Auto Unfollow Config
export const autoUnfollowConfigSchema = z.object({
  maxUnfollowsPerDay: z.number().min(1).max(200, 'Maximum 200 unfollows per day'),
  delayBetweenUnfollows: z.number().min(60, 'Minimum 60 seconds delay').max(600),
  onlyUnfollowNonFollowers: z.boolean().optional().default(true),
  keepFollowingDays: z.number().min(1, 'Minimum 1 day').max(30).optional(),
});

export type AutoUnfollowConfigFormData = z.infer<typeof autoUnfollowConfigSchema>;

// Scheduled Post Config
export const scheduledPostConfigSchema = z.object({
  caption: z.string().min(1, 'Caption is required').max(2200, 'Caption is too long'),
  imageUrl: z.string().url('Invalid image URL'),
  scheduledTime: z.string().min(1, 'Scheduled time is required'),
  location: z.string().optional(),
  firstComment: z.string().max(2200, 'Comment is too long').optional(),
});

export type ScheduledPostConfigFormData = z.infer<typeof scheduledPostConfigSchema>;

// ========================================
// DM/Message Config Schema (for send_dm/send_message)
// ========================================
export const messageConfigSchema = z.object({
  messageTemplate: z.string().min(1, 'Message template is required').max(1000, 'Message is too long'),
  delay: z.number().min(0, 'Delay must be 0 or greater').max(1440, 'Maximum 1440 minutes (24 hours)'),
});

export type MessageConfigFormData = z.infer<typeof messageConfigSchema>;

// ========================================
// Add to List Config Schema
// ========================================
export const addToListConfigSchema = z.object({
  listName: z.string().min(1, 'List name is required').max(100, 'List name is too long'),
});

export type AddToListConfigFormData = z.infer<typeof addToListConfigSchema>;

// ========================================
// Helper function to validate rule config based on type
// ========================================
export function validateRuleConfig(type: string, config: unknown): boolean {
  try {
    switch (type) {
      case 'auto_like':
        autoLikeConfigSchema.parse(config);
        return true;
      case 'auto_comment':
        autoCommentConfigSchema.parse(config);
        return true;
      case 'auto_follow':
        autoFollowConfigSchema.parse(config);
        return true;
      case 'auto_unfollow':
        autoUnfollowConfigSchema.parse(config);
        return true;
      case 'scheduled_post':
        scheduledPostConfigSchema.parse(config);
        return true;
      case 'send_dm':
      case 'send_message':
        messageConfigSchema.parse(config);
        return true;
      case 'add_to_list':
        addToListConfigSchema.parse(config);
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export function getConfigSchemaByType(type: string): z.ZodSchema | null {
  const schemas: Record<string, z.ZodSchema> = {
    auto_like: autoLikeConfigSchema,
    auto_comment: autoCommentConfigSchema,
    auto_follow: autoFollowConfigSchema,
    auto_unfollow: autoUnfollowConfigSchema,
    scheduled_post: scheduledPostConfigSchema,
    send_dm: messageConfigSchema,
    send_message: messageConfigSchema,
    add_to_list: addToListConfigSchema,
  };

  return schemas[type] || null;
}
