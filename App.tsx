
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

const ASPECT_RATIOS: { label: string; value: AspectRatio }[] = [
  { label: "Square (1:1)", value: "1:1" },
  { label: "Landscape (16:9)", value: "16:9" },
  { label: "Portrait (9:16)", value: "9:16" },
  { label: "Widescreen (4:3)", value: "4:3" },
  { label: "Tall (3:4)", value: "3:4" },
];

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
    <p className="text-gray-300 text-lg">Generating your masterpiece...</p>
    <p className="text-gray-400 text-sm">This can take a few moments. Please wait.</p>
  </div>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt to generate an image.");
      return;
    }
    if (!process.env.API_KEY) {
      setError("API key is missing. Please make sure it's configured in your environment.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio,
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        const url = `data:image/png;base64,${base64ImageBytes}`;
        setImageUrl(url);
      } else {
        setError("Image generation failed. The API did not return any images.");
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during image generation.";
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, aspectRatio]);

  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'generated-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Advanced AI Image Generator
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Turn your ideas into stunning visuals with Gemini.</p>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Control Panel */}
            <div className="flex flex-col space-y-6">
              <div>
                <label htmlFor="prompt" className="block text-lg font-semibold mb-2 text-gray-200">
                  Your Creative Prompt
                </label>
                <textarea
                  id="prompt"
                  rows={6}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A futuristic car flying over a neon-lit city at night, cinematic lighting"
                  className="w-full p-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="aspectRatio" className="block text-lg font-semibold mb-2 text-gray-200">
                  Aspect Ratio
                </label>
                <select
                  id="aspectRatio"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                  className="w-full p-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                >
                  {ASPECT_RATIOS.map(({ label, value }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGenerateImage}
                disabled={isLoading}
                className="w-full py-4 px-6 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none flex items-center justify-center"
              >
                {isLoading ? 'Generating...' : 'Generate Image'}
              </button>
            </div>

            {/* Image Preview */}
            <div className="flex flex-col">
                <div className="flex-grow w-full h-80 md:h-full bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center p-4">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <div className="text-center text-red-400">
                        <p className="font-semibold">Generation Failed</p>
                        <p className="text-sm mt-2">{error}</p>
                        </div>
                    ) : imageUrl ? (
                        <img src={imageUrl} alt="Generated" className="max-w-full max-h-full object-contain rounded-md shadow-lg" />
                    ) : (
                        <div className="text-center text-gray-500">
                        <p className="text-xl">Your image will appear here</p>
                        <p className="mt-2">Enter a prompt and click "Generate"</p>
                        </div>
                    )}
                </div>
                {imageUrl && !isLoading && (
                    <button
                        onClick={handleDownload}
                        className="mt-4 w-full py-3 px-6 text-md font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500/50 transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
                    >
                        <DownloadIcon className="h-5 w-5" />
                        Download Image
                    </button>
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
