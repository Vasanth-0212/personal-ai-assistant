import nodemailer from "nodemailer";
import Imap from "imap";

const GMAIL_EMAIL = process.env.GMAIL_EMAIL!;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD!;

if (!GMAIL_EMAIL || !GMAIL_APP_PASSWORD) {
    throw new Error("Missing Gmail credentials");
}


/**
 * Send Email using Gmail SMTP
 */
export async function sendEmail(
    toEmail: string,
    subject: string,
    body: string
) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: GMAIL_EMAIL,
                pass: GMAIL_APP_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: GMAIL_EMAIL,
            to: toEmail,
            subject,
            text: body,
        });

        return {
            status: "success",
            message: "Email sent successfully",
        }; //eslint-disable-next-line
    } catch (error: any) {
        return {
            status: "error",
            message: error.message,
        }; // eslint-disable-line
    }
}




/**
 * Delete last 15 emails from specific sender
 */
export function deleteEmailsFromSender(senderEmail: string, numberOfEmails: number) {
    return new Promise((resolve, reject) => {
        const imap = new Imap({
            user: GMAIL_EMAIL,
            password: GMAIL_APP_PASSWORD,
            host: "imap.gmail.com",
            port: 993,
            tls: true,
            tlsOptions: {
                rejectUnauthorized: false
            }
        });

        imap.once("ready", () => {
            imap.openBox("INBOX", false, (err, box) => {
                if (err) return reject(err);

                imap.search(
                    [["FROM", senderEmail], "UNSEEN"],
                    (err, results) => {
                        if (err) return reject(err);

                        if (!results.length) {
                            imap.end();
                            return resolve({
                                deleted_count: 0,
                                total_found: 0,
                            });
                        }

                        const emailsToDelete = results.slice(0, numberOfEmails);

                        const f = imap.fetch(emailsToDelete, {
                            bodies: "",
                        });

                        f.once("end", () => {
                            imap.setFlags(
                                emailsToDelete,
                                "\\Deleted",
                                (err) => {
                                    if (err) return reject(err);

                                    imap.expunge(() => {
                                        imap.end();

                                        resolve({
                                            deleted_count: emailsToDelete.length,
                                            total_found: results.length,
                                        });
                                    });
                                }
                            );
                        });
                    }
                );
            });
        });

        imap.once("error", reject);

        imap.connect();
    });
}