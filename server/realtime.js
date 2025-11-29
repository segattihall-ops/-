/**
 * OpenAI Realtime API WebSocket Proxy for Twilio
 *
 * This server bridges Twilio Media Streams with OpenAI Realtime API
 * using stored prompt: pmpt_692a9f2f6e148195850e91132c55366005098e88b3968255
 */

import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { createClient } from '@supabase/supabase-js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORT = process.env.PORT || 3002;

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create WebSocket server
const server = new WebSocketServer({ port: PORT });
console.log(`🚀 Realtime WS running on port ${PORT}`);

// Store active sessions for waitlist data
const sessions = new Map();

server.on("connection", (twilioClient) => {
  console.log("📞 Twilio client connected");

  let streamSid = null;
  let callSid = null;
  let openaiWs = null;

  // Handle messages from Twilio
  twilioClient.on("message", async (message) => {
    try {
      const msg = JSON.parse(message);

      switch (msg.event) {
        case 'start':
          streamSid = msg.start.streamSid;
          callSid = msg.start.callSid;
          console.log(`🎬 Stream started: ${streamSid}`);

          // Connect to OpenAI Realtime API
          openaiWs = new WebSocket(
            "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
            {
              headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "OpenAI-Beta": "realtime=v1"
              }
            }
          );

          openaiWs.on("open", () => {
            console.log("✅ Connected to OpenAI Realtime API");

            // Configure session with prompt reference
            const sessionConfig = {
              type: "session.update",
              session: {
                modalities: ["text", "audio"],
                voice: "alloy",
                input_audio_format: "g711_ulaw",
                output_audio_format: "g711_ulaw",
                input_audio_transcription: {
                  model: "whisper-1"
                },
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 500
                },
                tools: [
                  {
                    type: "function",
                    name: "save_waitlist_entry",
                    description: "Save a new entry to the MasseurMatch early access waitlist",
                    parameters: {
                      type: "object",
                      properties: {
                        full_name: { type: "string", description: "The person's full name" },
                        phone: { type: "string", description: "The person's phone number" },
                        email: { type: "string", description: "The person's email address" },
                        role: {
                          type: "string",
                          enum: ["therapist", "client"],
                          description: "Whether they are a massage therapist or a client"
                        }
                      },
                      required: ["full_name", "phone", "email", "role"]
                    }
                  }
                ],
                // Reference the stored prompt
                prompt: {
                  id: "pmpt_692a9f2f6e148195850e91132c55366005098e88b3968255",
                  version: "1"
                }
              }
            };

            openaiWs.send(JSON.stringify(sessionConfig));
            sessions.set(callSid, { streamSid, twilioClient, openaiWs });
          });

          // Forward OpenAI messages to Twilio
          openaiWs.on("message", async (data) => {
            try {
              const response = JSON.parse(data);

              // Handle audio responses
              if (response.type === "response.audio.delta" && response.delta) {
                const audioMessage = {
                  event: "media",
                  streamSid: streamSid,
                  media: {
                    payload: response.delta
                  }
                };
                twilioClient.send(JSON.stringify(audioMessage));
              }

              // Handle function calls
              if (response.type === "response.function_call_arguments.done") {
                if (response.name === "save_waitlist_entry") {
                  const args = JSON.parse(response.arguments);
                  await saveToWaitlist(args, callSid);

                  // Send function result back to OpenAI
                  openaiWs.send(JSON.stringify({
                    type: "conversation.item.create",
                    item: {
                      type: "function_call_output",
                      call_id: response.call_id,
                      output: JSON.stringify({ success: true })
                    }
                  }));
                }
              }

              // Log transcripts
              if (response.type === "conversation.item.input_audio_transcription.completed") {
                console.log("👤 User:", response.transcript);
              }
              if (response.type === "response.audio_transcript.done") {
                console.log("🤖 Assistant:", response.transcript);
              }

            } catch (error) {
              console.error("Error processing OpenAI message:", error);
            }
          });

          openaiWs.on("error", (error) => {
            console.error("OpenAI WebSocket error:", error);
          });

          openaiWs.on("close", () => {
            console.log("🔌 Disconnected from OpenAI");
          });
          break;

        case 'media':
          // Forward audio from Twilio to OpenAI
          if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
            openaiWs.send(JSON.stringify({
              type: "input_audio_buffer.append",
              audio: msg.media.payload
            }));
          }
          break;

        case 'stop':
          console.log(`🛑 Stream stopped: ${streamSid}`);
          if (openaiWs) {
            openaiWs.close();
          }
          sessions.delete(callSid);
          break;
      }
    } catch (error) {
      console.error("Error processing Twilio message:", error);
    }
  });

  // Cleanup on disconnect
  twilioClient.on("close", () => {
    console.log("📴 Twilio client disconnected");
    if (openaiWs) {
      openaiWs.close();
    }
    if (callSid) {
      sessions.delete(callSid);
    }
  });
});

/**
 * Save waitlist entry to Supabase
 */
async function saveToWaitlist(data, callSid) {
  try {
    console.log("💾 Saving to waitlist:", data);

    const { error } = await supabase
      .from('waitlist')
      .insert([data]);

    if (error) {
      console.error("Supabase error:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Successfully saved to waitlist");
    return { success: true };
  } catch (error) {
    console.error("Error saving to waitlist:", error);
    return { success: false, error: error.message };
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 Shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
