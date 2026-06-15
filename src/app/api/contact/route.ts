import { Resend } from "resend";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  pageUrl?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(body: { ok: boolean; error?: string }, status = 200) {
  return Response.json(body, { status });
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return jsonResponse({ ok: false, error: "Send a valid contact message." }, 400);
  }

  const name = asTrimmedString(payload.name);
  const email = asTrimmedString(payload.email);
  const message = asTrimmedString(payload.message);
  const pageUrl = asTrimmedString(payload.pageUrl);

  if (!name || !email || !message) {
    return jsonResponse({ ok: false, error: "Name, email and message are required." }, 400);
  }

  if (!emailPattern.test(email)) {
    return jsonResponse({ ok: false, error: "Please enter a valid email address." }, 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL || toEmail || "hello@accountplanningtools.co.uk";
  const text = [
    "APT contact form message",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    pageUrl ? `Page URL: ${pageUrl}` : "",
    "",
    "Message:",
    message,
  ]
    .filter(Boolean)
    .join("\n");

  if (apiKey && toEmail) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: `Account Planning Tools <${fromEmail}>`,
        to: toEmail,
        replyTo: email,
        subject: "APT contact form message",
        text,
      });

      return jsonResponse({ ok: true });
    } catch {
      return jsonResponse({ ok: false, error: "We could not send your message right now. Please try again." }, 502);
    }
  }

  console.info("APT contact form message", { name, email, message, pageUrl });

  if (process.env.NODE_ENV !== "production") {
    return jsonResponse({ ok: true });
  }

  return jsonResponse(
    {
      ok: false,
      error: "Contact form delivery is not available right now. Please try again later.",
    },
    503,
  );
}
