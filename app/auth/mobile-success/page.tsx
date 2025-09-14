import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Smartphone } from "lucide-react"

export default function MobileSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <Card className="border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-semibold">Authentication Complete</CardTitle>
            <CardDescription className="text-muted-foreground">You can now return to your mobile app</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              <span>Redirecting to your app...</span>
            </div>
            <p className="text-xs text-muted-foreground">
              If you're not automatically redirected, please close this window and return to your app.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
