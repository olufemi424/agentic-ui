import { createServerFileRoute } from "@tanstack/react-start/server";
import { openai } from "@ai-sdk/openai";
import { experimental_transcribe as transcribe } from "ai";

export const ServerRoute = createServerFileRoute("/api/transcribe").methods({
  POST: async ({ request }) => {
    try {
      const formData = await request.formData();
      const audioFile = formData.get("audio") as File;

      if (!audioFile) {
        return new Response(
          JSON.stringify({ error: "No audio file provided" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.log("Received audio file:", {
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size,
      });

      // Convert file to buffer
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = new Uint8Array(arrayBuffer);

      // Transcribe the audio using AI SDK v5
      const result = await transcribe({
        model: openai.transcription("whisper-1"),
        audio: audioBuffer,
      });

      return new Response(
        JSON.stringify({
          text: result.text,
          language: result.language,
          durationInSeconds: result.durationInSeconds,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Transcription API error:", error);

      // Return the actual error message to help with debugging
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorDetails =
        error instanceof Error && "cause" in error ? error.cause : null;

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: errorDetails,
          type: "transcription_error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
});
