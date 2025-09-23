import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Tag, Upload, Activity } from "lucide-react"

const stats = [
  {
    title: "Total Personas",
    value: "12",
    description: "Active personas in system",
    icon: Users,
  },
  {
    title: "Tags",
    value: "24",
    description: "Available tags",
    icon: Tag,
  },
  {
    title: "Uploads",
    value: "156",
    description: "Files uploaded",
    icon: Upload,
  },
  {
    title: "Activity",
    value: "89%",
    description: "System activity",
    icon: Activity,
  },
]

export function DashboardContent() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin dashboard. Manage personas, tags, and uploads.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Create Persona</h3>
                <p className="text-sm text-muted-foreground">Add a new persona to the system</p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Manage Tags</h3>
                <p className="text-sm text-muted-foreground">Create and organize tags</p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Upload Files</h3>
                <p className="text-sm text-muted-foreground">Upload and manage files</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
