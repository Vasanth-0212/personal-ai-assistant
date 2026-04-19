import { deleteEmailsFromSender } from "@/lib/gmail-service";

export async function POST(req: Request) {
  const { sender } = await req.json();

  const result = await deleteEmailsFromSender(sender);

  return Response.json(result);
}