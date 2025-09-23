import { UploadsContent } from "@/components/uploads-content"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"

export default function UploadsPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <UploadsContent />
        </main>
      </div>
    </AuthGuard>
  )
}
