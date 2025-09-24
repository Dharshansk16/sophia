"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PersonaGallery } from "@/components/persona-gallery";
import { ChatInterface } from "@/components/chat-interface";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu, X, Home, Plus } from "lucide-react";
import { type Persona, conversationsAPI, personasAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { PersonaDialog } from "@/components/persona-dialog";

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
  onCreatePersona,
}: {
  currentView: "gallery" | "chat";
  handleBackToGallery: () => void;
  onCreatePersona: () => void;
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
          Your Personas
        </h1>
      </div>
      {currentView === "gallery" && (
        <Button
          onClick={onCreatePersona}
          className="flex items-center gap-2 rounded-full bg-primary/80 hover:bg-primary backdrop-blur-md"
        >
          <Plus className="h-4 w-4" />
          Create Persona
        </Button>
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

export default function YourPersonaApp() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ece7df] via-[#d6cfc0] to-[#b8ab8f]">
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-black/10 shadow-2xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-black mb-4">
            Loading...
          </h1>
          <p className="text-gray-600">
            Please wait while we prepare the application.
          </p>
        </div>
      </div>
    }>
      <YourPersonaAppContent />
    </Suspense>
  );
}

function YourPersonaAppContent() {
  const [currentView, setCurrentView] = useState<"gallery" | "chat">("gallery");
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [showCreatePersona, setShowCreatePersona] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch user personas
  useEffect(() => {
    const fetchUserPersonas = async () => {
      if (!user) return;
      
      try {
        const userPersonas = await personasAPI.listUser();
        setPersonas(userPersonas);
      } catch (error) {
        console.error("Failed to fetch user personas:", error);
        toast.error("Failed to load your personas");
      } finally {
        setLoading(false);
      }
    };

    fetchUserPersonas();
  }, [user]);

  // Handle session loading from URL parameters
  useEffect(() => {
    const loadSessionFromUrl = async () => {
      const sessionId = searchParams.get("sessionId");
      if (!sessionId || !user) return;
      
      setIsLoadingSession(true);
      
      try {
        // Get conversation details
        const conversation = await conversationsAPI.get(sessionId);
        
        if (conversation.personaId) {
          // Get persona details
          const persona = await personasAPI.get(conversation.personaId);
          
          // Check if this persona belongs to user's personas
          const isUserPersona = personas.find(p => p.id === persona.id);
          if (isUserPersona) {
            setSelectedPersona(persona);
            setCurrentView("chat");
          } else {
            toast.error("This persona doesn't belong to your collection");
          }
        } else {
          toast.error("No persona associated with this conversation");
        }
      } catch (error) {
        console.error("Failed to load conversation:", error);
        toast.error("Failed to load conversation");
      } finally {
        setIsLoadingSession(false);
      }
    };
    
    if (personas.length > 0) {
      loadSessionFromUrl();
    }
  }, [searchParams, user, personas]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ece7df] via-[#d6cfc0] to-[#b8ab8f]">
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-black/10 shadow-2xl text-center">
          <h1 className="text-3xl font-bold text-black mb-4">
            Please Log In
          </h1>
          <p className="text-gray-600 mb-6">
            You must be logged in to access your personas.
          </p>
          <Button
            onClick={() => {
              window.location.href = "/auth/login";
            }}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state when loading a session from URL
  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ece7df] via-[#d6cfc0] to-[#b8ab8f]">
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-black/10 shadow-2xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-black mb-4">
            Loading Session...
          </h1>
          <p className="text-gray-600">
            Please wait while we load your conversation.
          </p>
        </div>
      </div>
    );
  }

  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona);
    setCurrentView("chat");
  };

  const handleBackToGallery = () => {
    setCurrentView("gallery");
    setSelectedPersona(null);
  };

  const handleCreatePersona = () => {
    setShowCreatePersona(true);
  };

  const handlePersonaCreated = async () => {
    setShowCreatePersona(false);
    // Refresh the personas list
    try {
      const userPersonas = await personasAPI.listUser();
      setPersonas(userPersonas);
      toast.success("Persona created successfully!");
    } catch (error) {
      console.error("Failed to refresh personas:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ece7df] via-[#d6cfc0] to-[#b8ab8f] relative overflow-hidden">
      {/* Parchment texture overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" />
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
          debatePersonas={[null, null]}
        />

        {/* Main area */}
        <main className="flex-1 flex flex-col md:ml-0 min-w-0">
          <Header
            currentView={currentView}
            handleBackToGallery={handleBackToGallery}
            onCreatePersona={handleCreatePersona}
          />

          <section className="flex-1 overflow-auto p-3 md:p-6">
            {currentView === "gallery" && (
              <UserPersonaGallery
                personas={personas}
                onPersonaSelect={handlePersonaSelect}
                loading={loading}
                onCreatePersona={handleCreatePersona}
              />
            )}

            {currentView === "chat" && selectedPersona && (
              <div className="h-full w-full">
                <div className="h-full w-full max-w-6xl mx-auto bg-white/15 backdrop-blur-xl shadow-xl border border-white/20 rounded-2xl overflow-hidden">
                  <ChatInterface persona={selectedPersona} />
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Create Persona Dialog */}
      <PersonaDialog
        isOpen={showCreatePersona}
        onClose={() => setShowCreatePersona(false)}
        onSuccess={handlePersonaCreated}
        mode="create"
      />
    </div>
  );
}

interface UserPersonaGalleryProps {
  personas: Persona[];
  onPersonaSelect: (persona: Persona) => void;
  loading: boolean;
  onCreatePersona: () => void;
}

function UserPersonaGallery({ personas, onPersonaSelect, loading, onCreatePersona }: UserPersonaGalleryProps) {
  if (loading) {
    return (
      <div className="p-6 h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold font-[family-name:var(--font-playfair)] text-primary mb-2">
              Loading Your Personas...
            </h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (personas.length === 0) {
    return (
      <div className="p-6 h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold font-[family-name:var(--font-playfair)] text-primary mb-4">
              Your Personal Personas
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Create your own personas - whether it's yourself, someone you admire, or a researcher you'd like to chat with
            </p>
            
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-8 border border-white/30 max-w-md mx-auto">
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="text-xl font-bold mb-4">No Personas Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by creating your first persona. You can create anyone you'd like to have a conversation with!
              </p>
              <Button
                onClick={onCreatePersona}
                className="rounded-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Persona
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-[family-name:var(--font-playfair)] text-primary mb-2">
            Your Personal Personas
          </h2>
          <p className="text-muted-foreground text-lg">
            Chat with the personas you've created
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 bg-white/15 backdrop-blur-xl rounded-2xl border border-white/20 p-6 text-center"
              onClick={() => onPersonaSelect(persona)}
            >
              <div className="relative mb-4">
                <img
                  src={persona.imageUrl || "/placeholder.svg"}
                  alt={persona.name}
                  className="w-24 h-24 rounded-full mx-auto border-4 border-border shadow-lg"
                />
              </div>

              <h3 className="text-xl font-bold font-[family-name:var(--font-playfair)] text-foreground mb-2">
                {persona.name}
              </h3>

              {persona.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {persona.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}