import { useState } from "react";
import { useReactMediaRecorder } from "react-media-recorder";

export function useTranscribe(onTranscribe: (text: string) => void) {
  const [isTranscribing, setIsTranscribing] = useState(false);

  const { status, startRecording, stopRecording } = useReactMediaRecorder({
    audio: true,
    blobPropertyBag: { type: "audio/wav" },
    mediaRecorderOptions: {
      mimeType: "audio/wav",
    },
    onStop: (_, blob) => {
      if (blob) {
        transcribeAudio(blob);
      }
    },
  });

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Transcription API error:", errorData);
        throw new Error(
          `Transcription failed: ${errorData.error || "Unknown error"}`
        );
      }

      const data = await response.json();

      if (data.text) {
        onTranscribe(data.text);
      } else {
        console.warn("No text received from transcription");
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      alert(
        `Error transcribing audio: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try again.`
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  return {
    status,
    startRecording,
    stopRecording,
    isTranscribing,
  };
}
