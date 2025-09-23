import { PersonasContent } from "@/components/personas-content"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"

export default function PersonasPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <PersonasContent />
        </main>
      </div>
    </AuthGuard>
  )
}
