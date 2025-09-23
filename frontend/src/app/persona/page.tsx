"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PersonaGallery } from "@/components/persona-gallery";
import { ChatInterface } from "@/components/chat-interface";
import { DebateInterface } from "@/components/debate-interface";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu, X, Home } from "lucide-react";
import { type Persona } from "@/lib/api";

export type ChatMessage = {
  id: string;
  content: string;
  sender: "user" | "persona";
  timestamp: Date;
  citations?: string[];
};

function Header({
  currentView,
  handleBackToGallery,
  isDebateMode,
  toggleDebateMode,
}: {
  currentView: "gallery" | "chat" | "debate";
  handleBackToGallery: () => void;
  isDebateMode: boolean;
  toggleDebateMode: () => void;
}) {
  const router = useRouter();

  const handleHomeClick = () => {
    router.push("/");
  };

  return (
    <header className="border-b border-white/20 bg-white/10 backdrop-blur-xl p-4 flex items-center justify-between rounded-t-xl">
      <div className="flex items-center gap-4">
        {currentView === "gallery" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHomeClick}
            className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        )}
        {currentView !== "gallery" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToGallery}
            className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Gallery
          </Button>
        )}
        <h1 className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-primary drop-shadow-sm">
          Sophia
        </h1>
      </div>
      {currentView === "gallery" && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Debate Mode</span>
          <button
            onClick={toggleDebateMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
              isDebateMode ? "bg-primary/80" : "bg-muted/40"
            }`}
            aria-label="Toggle debate mode"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-md transition-transform ${
                isDebateMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      )}
    </header>
  );
}

function MobileMenuButton({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed top-4 left-4 z-50 md:hidden bg-white/20 backdrop-blur-lg border border-white/30 rounded-full hover:bg-white/30 transition"
      onClick={() => setSidebarOpen(!sidebarOpen)}
      aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
    >
      {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );
}

export default function SophiaApp() {
  const [currentView, setCurrentView] = useState<"gallery" | "chat" | "debate">(
    "gallery"
  );
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [debatePersonas, setDebatePersonas] = useState<
    [Persona | null, Persona | null]
  >([null, null]);
  const [isDebateMode, setIsDebateMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handlePersonaSelect = (persona: Persona) => {
    if (isDebateMode) {
      if (!debatePersonas[0]) {
        setDebatePersonas([persona, null]);
      } else if (!debatePersonas[1] && debatePersonas[0].id !== persona.id) {
        setDebatePersonas([debatePersonas[0], persona]);
        setCurrentView("debate");
      }
    } else {
      setSelectedPersona(persona);
      setCurrentView("chat");
    }
  };

  const handleBackToGallery = () => {
    setCurrentView("gallery");
    setSelectedPersona(null);
    setDebatePersonas([null, null]);
  };

  const toggleDebateMode = () => {
    setIsDebateMode(!isDebateMode);
    setDebatePersonas([null, null]);
    setCurrentView("gallery");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ece7df] via-[#d6cfc0] to-[#b8ab8f] relative overflow-hidden">
      {/* Parchment texture overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('/parchment-texture.png')] bg-cover bg-center" />
      <div className="relative z-10 flex h-screen max-h-screen">
        {/* Mobile toggle */}
        <MobileMenuButton
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          selectedPersona={selectedPersona}
          debatePersonas={debatePersonas}
        />

        {/* Main area */}
        <main className="flex-1 flex flex-col md:ml-0 min-w-0">
          <Header
            currentView={currentView}
            handleBackToGallery={handleBackToGallery}
            isDebateMode={isDebateMode}
            toggleDebateMode={toggleDebateMode}
          />

          <section className="flex-1 overflow-auto p-3 md:p-6">
            {currentView === "gallery" && (
              <PersonaGallery
                onPersonaSelect={handlePersonaSelect}
                isDebateMode={isDebateMode}
                selectedDebatePersonas={debatePersonas}
              />
            )}

            {currentView === "chat" && selectedPersona && (
              <div className="h-full w-full">
                <div className="h-full w-full max-w-6xl mx-auto bg-white/15 backdrop-blur-xl shadow-xl border border-white/20 rounded-2xl overflow-hidden">
                  <ChatInterface persona={selectedPersona} />
                </div>
              </div>
            )}

            {currentView === "debate" &&
              debatePersonas[0] &&
              debatePersonas[1] && (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="w-full max-w-4xl mx-auto bg-white/15 backdrop-blur-xl shadow-xl border border-white/20 rounded-2xl p-4 md:p-8">
                    <DebateInterface
                      selectedPersonas={debatePersonas as [Persona, Persona]}
                      onClose={() => setCurrentView("gallery")}
                    />
                  </div>
                </div>
              )}
          </section>
        </main>
      </div>
    </div>
  );
}
