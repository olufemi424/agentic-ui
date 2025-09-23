import { Volume2 } from "lucide-react";

import { useTextToSpeech } from "../hooks/useTextToSpeech";

export default function TTSButton({ text }: { text: string }) {
  const { convertTextToSpeech, isGeneratingSpeech } = useTextToSpeech();

  return (
    <button
      type="button"
      onClick={() => {
        convertTextToSpeech(text);
      }}
      disabled={isGeneratingSpeech}
      className={`p-1.5 rounded-lg transition-colors duration-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
        isGeneratingSpeech
          ? "bg-blue-600 text-white"
          : "bg-gray-700 text-gray-400 hover:text-gray-200"
      }`}
      title={
        isGeneratingSpeech
          ? "Generating speech..."
          : isGeneratingSpeech
            ? "Playing"
            : "Play text as speech"
      }
    >
      <Volume2
        className={`w-4 h-4 ${isGeneratingSpeech ? "animate-pulse" : ""}`}
      />
    </button>
  );
}
