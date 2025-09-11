import { createServerFileRoute } from "@tanstack/react-start/server";
import { openai } from "@ai-sdk/openai";
import { experimental_generateSpeech as generateSpeech } from "ai";

export const ServerRoute = createServerFileRoute("/api/tts").methods({
  POST: async ({ request }) => {
    try {
      const { text } = await request.json();

      if (!text || typeof text !== "string") {
        return new Response(JSON.stringify({ error: "Text is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const audio = await generateSpeech({
        model: openai.speech("tts-1"),
        text: text,
        outputFormat: "mp3",
        voice: "alloy",
      });

      // Return the audio data as a binary response
      return new Response(audio.audio.uint8Array, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": audio.audio.uint8Array.length.toString(),
        },
      });
    } catch (error) {
      console.error("TTS API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate speech" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
});
