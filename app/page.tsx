import Link from "next/link"
import Image from "next/image"
import { Search, Star, ChevronDown, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import NavBar from "@/components/NavBar"
import Logo from "@/components/Logo"
import FeaturedListings from '@/components/FeaturedListings';
import { supabase } from '@/lib/supabaseClient';  // Correction du chemin d'importation

export interface Resource {
  id: string;
  title: string;
  description: string;
  price: number;
  author_id: string;
  framework: 'ESX' | 'QBCore' | 'Standalone';
  category: 'Police' | 'Civilian' | 'UI' | 'Jobs' | 'Vehicles';
  thumbnail_url: string;
  created_at: string;
  // Relations
  profiles: {
    username: string;
    avatar: string
  };
}

export async function getFeaturedResources() {
  const { data, error } = await supabase
    .from('resources')
    .select(`
      *,
      profiles:author_id (
        username,
        avatar
      )
    `)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) {
    console.error('Erreur lors de la récupération des ressources:', error);
    return [];
  }

  return data as Resource[];
}

export default async function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <NavBar />

      <main>
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden bg-zinc-900">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800"></div>
          <div className="absolute inset-0 opacity-20 bg-[url('/sheriff.png?height=1080&width=1920')] bg-cover bg-center"></div>
          <div className="container relative z-10 flex flex-col items-center text-center">
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Find the Best <span className="text-[#FF7101]">FiveM</span> resources !
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-zinc-400">
              Discover high-quality resources for your FiveM server. From ESX to QBCore, we've got everything you need
              to enhance your roleplay experience.
            </p>
            <Button asChild className="mt-8 px-8 py-6 text-lg bg-[#FF7101] hover:bg-[#FF7101]/90 text-white">
              <Link href="/marketplace">Explore Marketplace</Link>
            </Button>
          </div>
        </section>

        {/* Search Section */}
        <section className="py-12 bg-zinc-800/50">
          <div className="container">
            <Card className="bg-zinc-800/50 backdrop-blur-sm border-zinc-700 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col gap-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      type="search"
                      placeholder="Search for scripts, developers..."
                      className="pl-10 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-[#FF7101]"
                    />
                  </div>

                  <Tabs defaultValue="all" className="w-full">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <TabsList className="bg-zinc-800 border border-zinc-700 h-auto p-1">
                        <TabsTrigger
                          value="all"
                          className="data-[state=active]:bg-[#FF7101] data-[state=active]:text-white"
                        >
                          All
                        </TabsTrigger>
                        <TabsTrigger
                          value="esx"
                          className="data-[state=active]:bg-[#FF7101] data-[state=active]:text-white"
                        >
                          ESX
                        </TabsTrigger>
                        <TabsTrigger
                          value="qbcore"
                          className="data-[state=active]:bg-[#FF7101] data-[state=active]:text-white"
                        >
                          QBCore
                        </TabsTrigger>
                        <TabsTrigger
                          value="standalone"
                          className="data-[state=active]:bg-[#FF7101] data-[state=active]:text-white"
                        >
                          Standalone
                        </TabsTrigger>
                      </TabsList>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-white"
                          >
                            Category
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                          <DropdownMenuItem className="hover:bg-zinc-700 focus:bg-zinc-700">Police</DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-zinc-700 focus:bg-zinc-700">Civilian</DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-zinc-700 focus:bg-zinc-700">UI</DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-zinc-700 focus:bg-zinc-700">Jobs</DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-zinc-700 focus:bg-zinc-700">Vehicles</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Tab content can be added here if needed */}
                    <TabsContent value="all"></TabsContent>
                    <TabsContent value="esx"></TabsContent>
                    <TabsContent value="qbcore"></TabsContent>
                    <TabsContent value="standalone"></TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Featured Listings */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-3xl font-bold mb-8">Featured Resources</h2>
            <FeaturedListings />
            <div className="mt-10 text-center">
              <Button
                variant="outline"
                className="border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-[#FF7101] hover:text-white"
              >
                <Link href="/marketplace">View All Resources</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="py-16 bg-zinc-800/30">
          <div className="container">
            <h2 className="text-3xl font-bold mb-12 text-center text-white">Why Choose Our Marketplace</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="bg-zinc-800/50 border-zinc-700">
                  <CardHeader className="pb-2">
                    <div className="h-16 w-16 rounded-full bg-[#FF7101]/20 flex items-center justify-center mx-auto mb-4">
                      {benefit.icon}
                    </div>
                    <CardTitle className="text-xl text-center text-white">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-400 text-center">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Join as Developer */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800"></div>
          <div className="absolute inset-0 opacity-25 bg-[url('/Porsche.png?height=1891&width=1031')] bg-cover bg-center"></div>
          <div className="container relative z-10">
            <Card className="max-w-3xl mx-auto bg-zinc-800/30 border-zinc-700">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl text-white">Partagez vos Créations</CardTitle>
                <CardDescription className="text-zinc-400">
                  Partagez vos ressources avec la communauté FiveM et gagnez de l'argent avec vos créations. Notre marketplace
                  vous offre les outils et l'audience dont vous avez besoin pour réussir.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center pb-8">
                <Button className="px-8 py-6 text-lg bg-[#FF7101] hover:bg-[#FF7101]/90 text-white">
                  Commencer à vendre
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12 bg-zinc-900">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <Logo size="lg" className="mb-2" />
              <p className="text-zinc-400 text-sm">The premier marketplace for FiveM resources</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="#" className="text-sm text-zinc-400 hover:text-white">
                About
              </Link>
              <Link href="#" className="text-sm text-zinc-400 hover:text-white">
                Terms
              </Link>
              <Link href="#" className="text-sm text-zinc-400 hover:text-white">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-zinc-400 hover:text-white">
                Contact
              </Link>
              <Link href="#" className="text-sm text-zinc-400 hover:text-white">
                Discord
              </Link>
            </div>
          </div>
          <Separator className="my-8 bg-zinc-800" />
          <div className="text-center text-zinc-500 text-sm">
            © {new Date().getFullYear()} FiveMarket. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

const benefits = [
  {
    title: "Créateurs Vérifiés",
    description: "Tous nos créateurs sont vérifiés pour assurer des ressources de haute qualité et sécurisées pour votre serveur.",
    icon: (
      <svg
        className="h-8 w-8 text-[#FF7101]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    title: "Instant Downloads",
    description: "Purchase and download resources instantly. No waiting, start using your new scripts right away.",
    icon: (
      <svg
        className="h-8 w-8 text-[#FF7101]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
        />
      </svg>
    ),
  },
  {
    title: "Trusted by 1000+ Users",
    description: "Join a growing community of server owners who trust our marketplace for their FiveM needs.",
    icon: (
      <svg
        className="h-8 w-8 text-[#FF7101]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
]

