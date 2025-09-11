import { Mic, MicOff } from "lucide-react";

import { useTranscribe } from "../hooks/useTranscribe";

export default function TranscribeButton({
  onTranscribe,
}: {
  onTranscribe: (text: string) => void;
}) {
  const { status, startRecording, stopRecording, isTranscribing } =
    useTranscribe(onTranscribe);

  return (
    <button
      type="button"
      onClick={() => {
        if (status === "recording") {
          stopRecording();
        } else {
          startRecording();
        }
      }}
      disabled={isTranscribing}
      className={`p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
        status === "recording"
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
      }`}
      title={status === "recording" ? "Stop recording" : "Start recording"}
    >
      {status === "recording" ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}
