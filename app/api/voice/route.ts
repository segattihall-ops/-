import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST() {
  const twiml = new twilio.twiml.VoiceResponse();
  const websocketUrl = process.env.REALTIME_WEBSOCKET_URL;

  if (!websocketUrl) {
    twiml.say("WebSocket server not configured.");
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  const connect = twiml.connect();
  connect.stream({ url: websocketUrl });

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
