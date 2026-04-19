import { sendEmail } from "@/lib/gmail-service";

export async function POST(req: Request) {
  const { to, subject, body } = await req.json();

  const result = await sendEmail(to, subject, body);

  return Response.json(result);
}