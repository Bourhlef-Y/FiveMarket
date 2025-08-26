"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { signIn, signInWithDiscord } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Mail } from "lucide-react"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const router = useRouter()

  const validateForm = () => {
    setError("")
    setEmailNotConfirmed(false)
    
    if (!email) {
      setError("L'email est requis")
      return false
    }
    
    if (!password) {
      setError("Le mot de passe est requis")
      return false
    }
    
    return true
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      const { user } = await signIn(email, password)
      router.push("/")
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Email non confirmé") {
          setEmailNotConfirmed(true)
        } else {
          setError(error.message)
        }
      } else {
        setError("Une erreur inattendue s'est produite")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDiscordSignIn = async () => {
    try {
      setLoading(true)
      await signInWithDiscord()
      // La redirection est gérée par Discord
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Une erreur s'est produite lors de la connexion avec Discord")
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800"></div>
      <div className="absolute inset-0 opacity-20 bg-[url('/PleasurePier.jpg?height=1080&width=1920')] bg-cover bg-center"></div>

      <Card className="w-full max-w-md relative z-10 bg-zinc-800/50 backdrop-blur-md border-zinc-700 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold tracking-tight text-center">Welcome back</CardTitle>
          <CardDescription className="text-zinc-400 text-center">
            Sign in to your account to access scripts and tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {emailNotConfirmed && (
            <Alert className="bg-amber-500/20 border-amber-500/50 text-amber-200">
              <Mail className="h-4 w-4" />
              <AlertTitle>Email non confirmé</AlertTitle>
              <AlertDescription>
                Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation pour activer votre compte.
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-amber-200 underline mt-2"
                  onClick={() => setEmailNotConfirmed(false)}
                >
                  Je n'ai pas reçu d'email de confirmation
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSignIn}>
            <div className="space-y-2">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="bg-zinc-900/60 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-[#FF7101]"
              />
            </div>
            <div className="space-y-2">
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="bg-zinc-900/60 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-[#FF7101]"
              />
            </div>
            <div className="flex items-center justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-[#FF7101] hover:text-[#FF7101]/90 underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#FF7101] hover:bg-[#FF7101]/90 text-white mt-4"
              disabled={loading}
            >
              {loading ? "Connexion en cours..." : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-zinc-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-800/50 backdrop-blur-md px-2 text-zinc-400">or</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full bg-[#5865F2] hover:bg-[#5865F2]/90 text-white border-none"
            onClick={handleDiscordSignIn}
            disabled={loading}
          >
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="discord"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 512"
            >
              <path
                fill="currentColor"
                d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z"
              ></path>
            </svg>
            {loading ? "Connexion..." : "Continue with Discord"}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <p className="text-sm text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/sign-up"
              className="text-[#FF7101] hover:text-[#FF7101]/90 underline-offset-4 hover:underline font-medium"
            >
              Create one
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}