import { z } from "zod";

const contentTypeEnum = z.enum(["text", "image", "file"]);

const reactionSchema = z.object({
  userId: z.string(),
  emoji: z.any(),
});

export const createMessageSchema = z.object({
  conversationId: z.string(),
  contentType: contentTypeEnum.optional().default("text"),
  receiverId: z.string(),
  content: z.string(),
  reactions: z.array(reactionSchema).optional(),
  isRead: z.boolean().optional(),
});
