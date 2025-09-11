import { useRef, useState } from "react";

export function useTextToSpeech() {
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState<boolean>();

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const convertTextToSpeech = async (text: string) => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
        setIsGeneratingSpeech(false);
      }

      setIsGeneratingSpeech(true);

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      currentAudioRef.current = audio;

      audio.onended = () => {
        setIsGeneratingSpeech(false);
        currentAudioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsGeneratingSpeech(false);
        currentAudioRef.current = null;
        URL.revokeObjectURL(audioUrl);
        console.error("Error playing audio");
      };

      await audio.play();
    } catch (error) {
      console.error("Error generating speech:", error);
      setIsGeneratingSpeech(false);
      alert("Error generating speech. Please try again.");
    }
  };

  return {
    convertTextToSpeech,
    isGeneratingSpeech,
  };
}
