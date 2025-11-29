import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const MASSEUR_PHONE = process.env.MASSEUR_PHONE!;

export async function POST(req: Request) {
  const form = await req.formData();
  const fromNumber = form.get("From")?.toString();
  const callStatus = form.get("CallStatus")?.toString();

  const MISSED = ["busy", "no-answer", "failed"];

  if (fromNumber && MISSED.includes(callStatus || "")) {
    await client.messages.create({
      to: fromNumber,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body:
        "We missed your call. A masseur will get back to you soon. You can also reply here.",
    });

    await client.messages.create({
      to: MASSEUR_PHONE,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body: `Missed call from ${fromNumber}. Reply CALL to return the call.`,
    });

    // Cast sync to any
    const syncService: any = client.sync;

    await syncService
      .services("default")
      .maps("callback")
      .items("latest")
      .update({
        data: { number: fromNumber },
      })
      .catch(async () => {
        await syncService
          .services("default")
          .maps("callback")
          .items
          .create({
            key: "latest",
            data: { number: fromNumber },
          });
      });
  }

  return new NextResponse("OK", { status: 200 });
}
