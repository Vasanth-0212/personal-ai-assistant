import { deleteEmailsFromSender } from "@/lib/gmail-service";

export async function POST(req: Request) {
  const { sender, numberOfEmails } = await req.json();

  const result = await deleteEmailsFromSender(sender, numberOfEmails);

  return Response.json(result);
}