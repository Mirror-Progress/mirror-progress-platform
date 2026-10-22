import React, { useState } from "react";
import { contact, contactEmail } from "./content/site";

// Sends through the existing /api/sendMail route, which expects email, message and office.text.
export function ContactSection() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const message = `${data.get("note")}\n\nName: ${data.get("name")}\nOrganization: ${data.get("org")}`;
    setState("sending");
    try {
      const res = await fetch("/api/sendMail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), message, office: { text: String(data.get("org") ?? "") } }),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setState("sent");
    } catch {
      setState("failed");
    }
  }

  return (
    <section id="contact" className="site-container contact-section" aria-labelledby="contact-title">
      <div>
        <h2 id="contact-title" className="section-title">{contact.title}</h2>
        <p className="mt-5 select-text text-base text-muted-foreground sm:text-lg">{contactEmail}</p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {contact.fields.map((field) => (
            <label key={field.id} htmlFor={field.id} className={`grid gap-2 text-sm text-muted-foreground ${field.id === "org" ? "sm:col-span-2" : ""}`}>
              {field.label}
              <input id={field.id} name={field.id} type={field.type} autoComplete={field.autoComplete} required className="contact-input" />
            </label>
          ))}
        </div>
        <label htmlFor="note" className="grid gap-2 text-sm text-muted-foreground">
          {contact.noteLabel}
          <textarea id="note" name="note" rows={3} required className="contact-input resize-y py-3" />
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={state === "sending"} className="cta-button before:!animate-none disabled:opacity-60">
            {state === "sending" ? contact.sending : contact.submit}
          </button>
          <p role="status" className="text-sm text-muted-foreground">
            {state === "sent" && contact.sent}
            {state === "failed" && (
              <>
                {contact.failed} <a href={`mailto:${contactEmail}`} className="underline underline-offset-4">{contactEmail}</a>.
              </>
            )}
          </p>
        </div>
      </form>
    </section>
  );
}
