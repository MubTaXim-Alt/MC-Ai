import './App.css'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, BotIcon, ServerIcon, BrainIcon } from "lucide-react"
import { useEffect, useState } from 'react'

function App() {
  const [botStatus, setBotStatus] = useState("Checking...");

  // This is a placeholder. In a real scenario, you might use WebSockets
  // or periodic API calls to get the actual bot status from the backend.
  useEffect(() => {
    // Simulate a status check
    setTimeout(() => {
      setBotStatus("Attempting to connect / Running");
    }, 2000);
  }, []);

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100">
      <Card className="w-full max-w-lg bg-slate-800/70 border-slate-700 shadow-xl backdrop-blur-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BotIcon className="w-16 h-16 text-cyan-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-cyan-400">Suva - AI Minecraft Bot</CardTitle>
          <CardDescription className="text-slate-400">
            Your intelligent companion in the Minecraft world.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
            <ServerIcon className="h-5 w-5 text-cyan-400" />
            <AlertTitle className="font-semibold text-slate-200">Bot Status</AlertTitle>
            <AlertDescription>
              Suva is currently: <span className="font-bold text-cyan-300">{botStatus}</span>
              <p className="text-xs mt-1 text-slate-400">This page indicates the web server is running. The bot operates in the background. Check console logs for detailed bot activity.</p>
            </AlertDescription>
          </Alert>

          <div className="text-sm text-slate-400 space-y-2">
            <p className="flex items-center"><BrainIcon className="w-4 h-4 mr-2 text-purple-400" /> Suva uses Gemini for intelligent responses.</p>
            <p className="flex items-center"><Terminal className="w-4 h-4 mr-2 text-green-400" /> Anti-AFK behaviors are active to keep Suva engaged.</p>
            <p className="flex items-center"><BotIcon className="w-4 h-4 mr-2 text-cyan-400" /> Chat with Suva in-game using the prefix: <code className="bg-slate-700 px-1 py-0.5 rounded text-cyan-300">Suva</code> (e.g., Suva how are you?).</p>
          </div>

          <div className="text-center mt-6">
            <p className="text-xs text-slate-500">
              Ensure your <code>.env</code> file is correctly configured with Minecraft and Gemini API details.
            </p>
          </div>
        </CardContent>
      </Card>

      <footer className="mt-8 text-center text-slate-500 text-xs">
        <p>&copy; {new Date().getFullYear()} Suva Bot Project. Powered by Mineflayer & Gemini.</p>
        <p>This interface is for status display. Bot interaction happens in Minecraft.</p>
      </footer>
    </div>
  )
}

export default App
