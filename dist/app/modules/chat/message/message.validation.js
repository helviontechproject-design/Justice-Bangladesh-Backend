"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageSchema = void 0;
const zod_1 = require("zod");
const contentTypeEnum = zod_1.z.enum(["text", "image", "file"]);
const reactionSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    emoji: zod_1.z.any(),
});
exports.createMessageSchema = zod_1.z.object({
    conversationId: zod_1.z.string(),
    contentType: contentTypeEnum.optional().default("text"),
    receiverId: zod_1.z.string(),
    content: zod_1.z.string(),
    reactions: zod_1.z.array(reactionSchema).optional(),
    isRead: zod_1.z.boolean().optional(),
});
