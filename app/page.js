import Link from "next/link";
import Counter from "./component/Counter";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-6 py-12 sm:px-20 font-sans text-gray-900">
      {/* Banner */}
      <div className="inline-block bg-white text-gray-500 font-medium text-sm px-4 py-1.5 rounded-full shadow-sm mt-4 mb-5">
        Over 100M+ views across all Swiftreel videos
      </div>

      {/* Header Section */}
      <header className="max-w-2xl text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-gray-700">
          Automate TikToks that drive traffic to your website
        </h1>
        <p className="text-md font-medium text-gray-500 mb-6">
          like a gen z marketing team, but way cheaper
        </p>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard">
            <button className="bg-[#ff4514] text-white font-semibold px-6 py-3 rounded-full shadow hover:bg-[#e63e12] transition">
              Start Now
            </button>
          </Link>

          <Link href="/demo">
            <button className="bg-white text-gray-800 font-semibold px-6 py-3 rounded-full shadow hover:bg-gray-100 transition">
              Watch Demo
            </button>
          </Link>
        </div>
      </header>

      {/* Main Interactive Area */}
      <main className="w-full max-w-xl">
        <Counter title="Engage with Your Counter" />
      </main>

      {/* Footer */}
      <footer className="mt-20 text-gray-500 text-sm">
        © {new Date().getFullYear()} Swiftreel. All rights reserved.
      </footer>
    </div>
  );
}
