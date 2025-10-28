import Header from '@/components/Header'

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-20">
        {children}
      </main>
    </div>
  )
}


