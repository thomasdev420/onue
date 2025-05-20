import Link from "next/link";
import Counter from "./component/Counter";
import Box from "./component/box";
import { Lightbulb, Rocket, Users } from 'lucide-react'; // optional icons

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-6 py-12 sm:px-20 font-sans text-gray-900">
      {/* Banner */}
      <div className="inline-block bg-white text-gray-500 font-medium text-sm px-4 py-1.5 rounded-full shadow-sm mt-4 mb-5">
        Over 100M+ views across all SwiftReel videos
      </div>

      {/* Header Section */}
      <header className="max-w-2xl text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight text-gray-800">
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

      {/* 10K+ posts published for 750+ happy customers */}
      <p className="text-md font-medium text-gray-500 mb-5">
        10K+ posts published for 750+ happy customers
      </p>

      {/* Box Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
        <Box
          icon={<Lightbulb size={32} />}
          title="Built for Founders"
          description="Tools tailored for ambitious creators who want to move fast."
        />
        <Box
          icon={<Rocket size={32} />}
          title="Launch Fast"
          description="Ship ideas quickly without wasting time on boilerplate."
        />
        <Box
          icon={<Users size={32} />}
          title="Community Driven"
          description="Made with feedback from real builders like you."
        />
      </section>

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