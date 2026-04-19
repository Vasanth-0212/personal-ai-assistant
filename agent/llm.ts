import { ChatOpenAI } from "@langchain/openai";
import { createAgent, tool, humanInTheLoopMiddleware, createMiddleware } from "langchain";
import { z } from "zod";
import {
    sendEmail,
    deleteEmailsFromSender,
} from "@/lib/gmail-service";
import { MemorySaver, REMOVE_ALL_MESSAGES } from "@langchain/langgraph";
import { RemoveMessage } from "@langchain/core/messages"

/**
 * LLM CONFIG
 */

const trimMessages = createMiddleware({
  name: "TrimMessages",
  afterModel: (state) => {
    const messages = state.messages;

    if (messages.length <= 15) {
      return; // No changes needed
    }

    const firstMsg = messages[0];
    const recentMessages =
      messages.length % 2 === 0 ? messages.slice(-3) : messages.slice(-4);
    const newMessages = [firstMsg, ...recentMessages];

    return {
      messages: [
        new RemoveMessage({ id: REMOVE_ALL_MESSAGES }),
        ...newMessages,
      ],
    };
  },
});

const llm = new ChatOpenAI({
    model: "openai/gpt-oss-120b:free",
    apiKey: process.env.OPENROUTER_API_KEY,
    temperature: 0.3,
    maxTokens: 10000,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
    },
});

/**
 * TOOL 1 — SEND EMAIL
 */

const sendEmailTool = tool(
    async ({ to, subject, body }) => {
        return await sendEmail(to, subject, body);
    },
    {
        name: "send_email",
        description:
            "Send an email to a recipient with subject and message body",
        schema: z.object({
            to: z.string().describe("Recipient email address"),
            subject: z.string().describe("Subject of the email"),
            body: z.string().describe("Content of the email"),
        }),
    }
);



/**
 * TOOL 2 — DELETE EMAILS FROM SENDER
 */

const deleteEmailsTool = tool(
    async ({ sender, numberOfEmails }) => {
        return await deleteEmailsFromSender(sender, numberOfEmails);
    },
    {
        name: "delete_emails_from_sender",
        description:
            "Delete up to 15 emails from a specific sender email address",
        schema: z.object({
            sender: z.string().describe("Sender email address"),
            numberOfEmails: z.number().describe("Number of emails to delete (max 15)"),
        }),
    }
);

/**
 * CREATE AGENT
 */

export const agent = createAgent({
    model: llm,

    tools: [
        sendEmailTool,
        deleteEmailsTool,
    ],

    middleware: [
        trimMessages,
        humanInTheLoopMiddleware({
            interruptOn: {
                send_email: {
                    allowedDecisions: ["approve", "reject", "edit"],
                    description: "Send Email requires approval from user",
                },
                delete_emails_from_sender: {
                    allowedDecisions: ["approve","edit", "reject"],
                    description: "Delete Email requires approval from user",
                },
            }
        }),
    ],

    systemPrompt: `
        You are an AI email assistant.

        You can:
        1. Send emails
        2. Delete emails from a sender

        Rules:
        - Use tools whenever required
        - When deleting emails, ask for how many emails to delete
        - Respond clearly and concisely
        `,
    checkpointer: new MemorySaver(),
});
