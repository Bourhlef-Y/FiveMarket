import NavBar from "@/components/NavBar"

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main>
        {children}
      </main>
    </div>
  )
}