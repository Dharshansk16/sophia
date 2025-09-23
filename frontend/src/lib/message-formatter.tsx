import React from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface ParsedMessage {
  text: string;
  sources: Array<{
    id: number;
    text: string;
    url: string;
    score?: number;
  }>;
}

export function parseMessageWithSources(content: string): ParsedMessage {
  // Split the message at **Sources** or similar markers
  const sourcesMatch = content.match(/\*\*Sources?\*\*\s*([\s\S]*)/i);

  let mainText = content;
  let sources: Array<{
    id: number;
    text: string;
    url: string;
    score?: number;
  }> = [];

  if (sourcesMatch) {
    mainText = content.substring(0, content.indexOf(sourcesMatch[0])).trim();
    const sourcesText = sourcesMatch[1];

    // Parse sources - looking for patterns like:
    // 1. [URL] (Score: X.XXX)
    // 1. [text](URL) (Score: X.XXX)
    // Handle both formats with and without parentheses
    const sourcePattern =
      /(\d+)\.\s*\[([^\]]+)\]\s*(?:\(.*?Score:\s*([\d.]+).*?\))?/g;

    let match;
    while ((match = sourcePattern.exec(sourcesText)) !== null) {
      const [, id, urlOrText, score] = match;

      // Check if it's a URL or text with URL
      let url = urlOrText;
      let text = urlOrText;

      // If it looks like a URL, extract the filename for display
      if (urlOrText.startsWith("http")) {
        try {
          const urlObj = new URL(urlOrText);
          const pathname = urlObj.pathname;
          const filename = pathname.split("/").pop() || "Document";
          // Remove file extension and decode URL components
          text = decodeURIComponent(filename.replace(/\.[^/.]+$/, ""));
          // Clean up common PDF naming patterns
          text = text.replace(/[-_]/g, " ").replace(/\d+$/, "").trim();
        } catch {
          // If URL parsing fails, use the original text
          text = urlOrText;
        }
        url = urlOrText;
      }

      sources.push({
        id: parseInt(id),
        text: text || "Document",
        url: url,
        score: score ? parseFloat(score) : undefined,
      });
    }
  }

  return {
    text: mainText,
    sources,
  };
}

export function formatText(text: string): React.ReactNode {
  // Split text by line breaks and format each section
  const sections = text.split("\n").filter((line) => line.trim());

  return sections
    .map((section, index) => {
      const trimmed = section.trim();

      // Handle headers (lines that start with - and end with :)
      if (trimmed.match(/^-\s*.+:$/)) {
        return (
          <h4
            key={index}
            className="font-semibold text-sm mt-3 mb-1 text-primary"
          >
            {trimmed.replace(/^-\s*/, "").replace(/:$/, "")}
          </h4>
        );
      }

      // Handle bullet points
      if (trimmed.startsWith("- ")) {
        return (
          <div key={index} className="ml-4 mb-2">
            <span className="text-primary mr-2">•</span>
            <span className="text-sm">{trimmed.substring(2)}</span>
          </div>
        );
      }

      // Handle regular paragraphs
      if (trimmed.length > 0) {
        return (
          <p key={index} className="mb-2 text-sm leading-relaxed">
            {trimmed}
          </p>
        );
      }

      return null;
    })
    .filter(Boolean);
}

interface FormattedMessageProps {
  content: string;
  className?: string;
}

export function FormattedMessage({
  content,
  className = "",
}: FormattedMessageProps) {
  const parsed = parseMessageWithSources(content);

  return (
    <div className={className}>
      {/* Main content */}
      <div className="message-content">{formatText(parsed.text)}</div>

      {/* Sources */}
      {parsed.sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Sources
          </h5>
          <div className="space-y-2">
            {parsed.sources.map((source) => (
              <div key={source.id} className="flex items-start gap-2">
                <Badge
                  variant="outline"
                  className="text-xs px-1.5 py-0.5 shrink-0 mt-0.5"
                >
                  {source.id}
                </Badge>
                <div className="flex-1 min-w-0">
                  {source.url.startsWith("http") ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline break-all"
                    >
                      <span className="truncate">{source.text}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {source.text}
                    </span>
                  )}
                  {source.score && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Relevance: {(source.score * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FormattedMessage;
