"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type ContactResponse = {
  ok?: boolean;
  error?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    setStatusMessage("");

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setStatusTone("error");
      setStatusMessage("Please complete your name, email and message.");
      return;
    }

    if (!emailPattern.test(trimmedEmail)) {
      setStatusTone("error");
      setStatusMessage("Please enter a valid email address.");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          message: trimmedMessage,
          pageUrl: window.location.href,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as ContactResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "We could not send your message. Please try again.");
      }

      setName("");
      setEmail("");
      setMessage("");
      setStatusTone("success");
      setStatusMessage("Thanks — your message has been sent.");
    } catch (error) {
      setStatusTone("error");
      setStatusMessage(error instanceof Error ? error.message : "We could not send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label className="field">
        <span>Name</span>
        <input
          autoComplete="name"
          disabled={isSubmitting}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          required
          value={name}
        />
      </label>
      <label className="field">
        <span>Email</span>
        <input
          autoComplete="email"
          disabled={isSubmitting}
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.co.uk"
          required
          type="email"
          value={email}
        />
      </label>
      <label className="field contact-message-field">
        <span>Message</span>
        <textarea
          disabled={isSubmitting}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="What would you like to share?"
          required
          value={message}
        />
      </label>
      <div className="contact-form-actions">
        <button className="button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Sending…" : "Send message"}
        </button>
      </div>
      {statusMessage ? (
        <p className={`settings-message settings-message-${statusTone} contact-form-message`} role={statusTone === "error" ? "alert" : "status"}>
          {statusMessage}
        </p>
      ) : null}
    </form>
  );
}
