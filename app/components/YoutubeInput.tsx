"use client";

import {
  Mic,
  FileText,
  Copy,
  Loader2,
  PlayCircle,
  Eye,
  Code,
  Check,
  Sparkles,
  Loader,
  Bot,
  Download,
} from "lucide-react";
import { useRef, useState, type ComponentPropsWithoutRef } from "react";

import ReactMarkdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

type CodeProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
};

interface TranscriptionResult {
  content: string;
  lang: string;
  availableLangs?: string[];
}

export default function YoutubeInput() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] =
    useState<TranscriptionResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError("Por favor ingresa una URL de YouTube");
      return;
    }

    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|shorts\/|playlist\?list=)?([a-zA-Z0-9_-]{11})(\S*)?$/;
    if (!youtubeRegex.test(url)) {
      setError("Por favor ingresa una URL válida de YouTube");
      return;
    }

    setLoading(true);
    setError(null);
    setTranscription(null);

    try {
      const response = await fetch(
        `/api/process-video?url=${encodeURIComponent(url)}&lang=es`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar el video");
      }

      setTranscription(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al procesar el video";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!transcription?.content) return;
    navigator.clipboard.writeText(transcription.content);
    setCopied(true);
    const timeOutId = setTimeout(() => setCopied(false), 2000);
    clearTimeout(timeOutId);
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const generateSummary = async () => {
    if (!transcription?.content) return;

    setIsGeneratingSummary(true);
    setSummary(null);
    setSummaryError(null);

    try {
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: transcription.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al generar el resumen");
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err: unknown) {
      console.error("Error generating summary:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al generar el resumen";
      setSummaryError(message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const downloadSummary = () => {
    if (!summary) return;

    const element = document.createElement("a");
    const file = new Blob([summary], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `resumen-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const CodeBlock = ({ inline, ...props }: CodeProps) => {
    if (inline) {
      return (
        <code
          className="bg-gray-100 px-1.5 py-0.5 rounded text-sm"
          {...props}
        />
      );
    }

    return (
      <pre className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-x-auto my-4 text-sm">
        <code {...props} />
      </pre>
    );
  };

  const markdownComponents: Components = {
    h1: ({ ...props }) => <h1 className="text-3xl font-bold my-4" {...props} />,
    h2: ({ ...props }) => <h2 className="text-2xl font-bold my-3" {...props} />,
    h3: ({ ...props }) => (
      <h3 className="text-xl font-semibold my-2" {...props} />
    ),
    p: ({ ...props }) => <p className="my-3 leading-relaxed" {...props} />,
    ul: ({ ...props }) => (
      <ul className="list-disc pl-6 my-3 space-y-1" {...props} />
    ),
    ol: ({ ...props }) => (
      <ol className="list-decimal pl-6 my-3 space-y-1" {...props} />
    ),
    li: ({ ...props }) => <li className="my-1" {...props} />,
    strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
    em: ({ ...props }) => <em className="italic" {...props} />,
    blockquote: ({ ...props }) => (
      <blockquote
        className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-600"
        {...props}
      />
    ),
    code: CodeBlock,
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="flex items-center justify-center mb-2">
        <PlayCircle className="w-8 h-8 mr-2  text-blue-600" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center ">
          Resumidor de Videos
        </h1>
      </div>
      <p className="text-center text-gray-600 mb-8">
        Transcribe y resume videos de YouTube en segundos
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label
            htmlFor="youtube-url"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            URL del video de YouTube
          </label>
          <div className="flex gap-2 flex-col sm:flex-row ">
            <input
              type="text"
              id="youtube-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:outline-0  transition-all placeholder:text-gray-600/60 text-gray-800"
              disabled={loading}
              required
              pattern="^(https?:\\/\\/)?(www\\.)?(youtube\\.com|youtu\\.be)\\/(watch\\?v=|embed\\/|v\\/|shorts\\/|playlist\\?list=)?([a-zA-Z0-9_-]{11})(\\S*)?$" // <-- regex para validar que sea una url de youtube
              title="Por favor ingresa una URL válida de YouTube"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2  disabled:opacity-70 disabled:cursor-not-allowed focus:scale-105 active:scale-95 transition-all duration-150 cursor-pointer "
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Transcribir
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      {transcription && (
        <div className="mt-8 bg-gray-50 rounded-xl p-6 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="text-blue-600" />
              Transcripción
            </h2>
            <div className="flex flex-wrap gap-2 action-buttons">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {transcription.lang.toUpperCase()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors relative group"
                  title={showRaw ? "Ver texto formateado" : "Ver JSON"}
                >
                  {showRaw ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <Code className="w-5 h-5" />
                  )}
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {showRaw ? "Ver texto" : "Ver JSON"}
                  </span>
                </button>
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors relative group"
                  title="Copiar al portapapeles"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {copied ? "¡Copiado!" : "Copiar texto"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="scroll-container text-neutral-600 bg-white p-6 rounded-lg border border-gray-200 shadow-sm max-h-96 overflow-y-auto fade-scroll"
            >
              {showRaw ? (
                <pre className="text-sm bg-gray-50 p-4 rounded">
                  {JSON.stringify(transcription, null, 2)}
                </pre>
              ) : (
                <div className="prose max-w-none text-gray-700 space-y-4">
                  {transcription.content.split("\n").map((paragraph, index) => (
                    <p key={index} className="leading-relaxed">
                      {paragraph || <br />}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {transcription && !showRaw && (
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 shadow-inner border border-blue-100">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <Sparkles className="text-purple-600" />
              Resumen Detallado
            </h2>
            <div className="flex w-full gap-2 sm:flex-row sm:gap-0 mt-3 sm:mt-0">
              <button
                onClick={generateSummary}
                disabled={isGeneratingSummary}
                className="px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer sm:mr-2 text-sm  md:text-base md:px-3.5 md:py-1 md:leading-4.5 w-fit lg:px-5 lg:py-2"
              >
                {isGeneratingSummary ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generar Resumen
                  </>
                )}
              </button>
              {summary && (
                <button
                  onClick={downloadSummary}
                  className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Descargar resumen"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Descargar</span>
                </button>
              )}
            </div>
          </div>

          {summaryError && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
              <p className="font-medium">Error</p>
              <p>{summaryError}</p>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            {summary ? (
              <div className="prose max-w-none text-gray-700">
                <ReactMarkdown
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {summary}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>
                  Haz clic en &nbsp; Generar Resumen &nbsp; para obtener un
                  análisis ejecutivo del video.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
