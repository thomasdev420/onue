import Counter from "./component/Counter";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-12 sm:px-20 font-sans text-gray-900">
      
      {/* Header Section */}
      <header className="max-w-2xl text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
        Automate TikToks that drive traffic to your website.
        </h1>
        <p className="text-lg text-gray-600">
          like gen z marketing but wayyyy cheaper</p>
      </header>

      {/* Main Interactive Area */}
      <main className="w-full max-w-xl">
        <Counter title="Engage with Your Counter" />
      </main>

      {/* Footer or additional info */}
      <footer className="mt-20 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Your Startup. All rights reserved.
      </footer>
    </div>
  );
}
