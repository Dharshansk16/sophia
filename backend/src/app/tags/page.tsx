import { TagsContent } from "@/components/tags-content"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"

export default function TagsPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <TagsContent />
        </main>
      </div>
    </AuthGuard>
  )
}
