"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { signUp } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function SignUp() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const validateForm = () => {
    setError("")
    
    if (!username) {
      setError("Le nom d'utilisateur est requis")
      return false
    }
    
    if (!email) {
      setError("L'email est requis")
      return false
    }
    
    if (!password) {
      setError("Le mot de passe est requis")
      return false
    }
    
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      return false
    }
    
    return true
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      const { user, error: signUpError } = await signUp(email, password, username)
      
      if (signUpError) {
        console.error("Erreur d'inscription:", signUpError.message)
        setError(signUpError.message)
      } else {
        console.log("Utilisateur inscrit:", user)
        // Rediriger vers la page de connexion ou le tableau de bord
        router.push("/auth/sign-in")
      }
    } catch (err) {
      console.error("Erreur:", err)
      setError("Une erreur s'est produite lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800"></div>
      <div className="absolute inset-0 opacity-20 bg-[url('/PleasurePier.jpg?height=1080&width=1920')] bg-cover bg-center"></div>

      <Card className="w-full max-w-md relative z-10 bg-zinc-800/50 backdrop-blur-md border-zinc-700 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold tracking-tight text-center">Create your account</CardTitle>
          <CardDescription className="text-zinc-400 text-center">
            Join the marketplace and start buying or selling FiveM resources.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-200 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSignUp}>
            <div className="space-y-2">
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="bg-zinc-900/60 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-[#FF7101]"
              />
            </div>
            <div className="space-y-2">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
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
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="bg-zinc-900/60 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-[#FF7101]"
              />
              <p className="text-xs text-zinc-500">Le mot de passe doit contenir au moins 6 caractères</p>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#FF7101] hover:bg-[#FF7101]/90 text-white mt-4"
              disabled={loading}
            >
              {loading ? "Inscription en cours..." : "Sign Up"}
            </Button>
          </form>

          
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-4">
          <p className="text-sm text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/auth/sign-in"
              className="text-[#FF7101] hover:text-[#FF7101]/90 underline-offset-4 hover:underline font-medium"
            >
              Sign in here
            </Link>
          </p>
          <p className="text-xs text-zinc-500 text-center">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-zinc-400 hover:text-white underline-offset-4 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-zinc-400 hover:text-white underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

