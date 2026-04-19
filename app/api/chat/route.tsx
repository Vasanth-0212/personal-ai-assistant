import { NextRequest, NextResponse } from "next/server";
import { agent } from "@/agent/llm";
import { Command } from "@langchain/langgraph";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { message, decision, editedArgs, thread_id } = body;

    if (!thread_id) {
      return NextResponse.json(
        { error: "thread_id is required for HITL workflow" },
        { status: 400 }
      );
    }

    let result;
    /**
     * CASE 1 — Resume execution after approval/rejection/edit
     */
    if (decision) {
      console.log("Decision:", decision);

      result = await agent.invoke(
        new Command({
          resume: {
            decisions: [
              decision === "edit"
                ? {
                  type: "edit",
                  editedAction: {
                    name: editedArgs.name,
                    args: editedArgs.args,
                  },
                }
                : {
                  type: decision,
                },
            ],
          },
        }),
        {
          configurable: {
            thread_id,
          },
        }
      );

      console.log("Result:", result);
    }

    /**
     * CASE 2 — Normal agent execution
     */
    else {
      if (!message) {
        return NextResponse.json(
          { error: "Message is required" },
          { status: 400 }
        );
      }

      result = await agent.invoke(
        {
          messages: [{ role: "user", content: message }],
        },
        {
          configurable: {
            thread_id,
          },
        }
      );
      console.log("Result12333:", result);
    }

    /**
     * CASE 3 — Interrupt detected (waiting for approval)
     */
    if (result.__interrupt__) {
      return NextResponse.json({
        status: "pending_approval",
        interrupt: result.__interrupt__,
      });
    }

    /**
     * CASE 4 — Normal response
     */
    return NextResponse.json({
      status: "completed",
      response:
        result.messages[result.messages.length - 1].content,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}