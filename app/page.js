"use client";

import Link from "next/link";
import Box from "./component/box";
import { Lightbulb, Rocket, Users } from "lucide-react";
import { signIn, useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-6 py-12 sm:px-20 font-sans text-gray-900 relative">
      {/* Navigation Bar */}
      <nav className="absolute top-4 right-8 z-50">
        <ul className="flex gap-3 items-center text-sm">
          <li>
            <Link href="/product">
              <span className="text-gray-600 hover:text-gray-800 transition cursor-pointer">
                Product
              </span>
            </Link>
          </li>
          <li>
            <Link href="/#pricing">
              <span className="text-gray-600 hover:text-gray-800 transition cursor-pointer">
                Pricing
              </span>
            </Link>
          </li>

          {session ? (
            <>
              <li>
                <Link href="/dashboard">
                  <button className="bg-white text-gray-500 font-semibold px-3 py-1 rounded-full shadow-sm hover:bg-gray-100 transition text-sm">
                    Go to app
                  </button>
                </Link>
              </li>
              <li>
                <Link href="/api/auth/signout">
                  <span className="text-gray-600 hover:text-gray-800 transition cursor-pointer">
                    Sign Out
                  </span>
                </Link>
              </li>
            </>
          ) : (
            <li>
              <button
                onClick={() => signIn("google")}
                className="bg-[#4285F4] text-white font-semibold px-3 py-1 rounded-full shadow-sm hover:bg-[#357ae8] transition text-sm"
              >
                Sign In with Google
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Version 2.0 */}
      <div className="absolute bottom-4 left-4 text-black font-medium text-gray-500 mb-5"> 
        Version 2.0
      </div>

      {/* Banner */}
      <div className="inline-block bg-white text-gray-500 font-medium text-sm px-4 py-1.5 rounded-full shadow-sm mt-18 mb-5">
        Over 100M+ views across all SwiftReel videos
      </div>

      {/* Header Section */}
      <header className="max-w-2xl text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight text-gray-800">
          Automate TikToks that drive traffic to your website
        </h1>
        <p className="text-lg font-semibold text-gray-500 mb-6">
          like a gen z marketing team, but way cheaper
        </p>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          {session ? (
            <Link href="/dashboard">
              <button className="bg-[#ff4514] text-white font-semibold px-6 py-3 rounded-full shadow hover:bg-[#e63e12] transition">
                Start Now
              </button>
            </Link>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="bg-[#ff4514] text-white font-semibold px-6 py-3 rounded-full shadow hover:bg-[#e63e12] transition"
            >
              Start Now
            </button>
          )}

          <Link href="/dashboard">
            <button className="bg-white text-gray-800 font-semibold px-6 py-3 rounded-full shadow hover:bg-gray-100 transition">
              Watch Demo
            </button>
          </Link>
        </div>
      </header>

      {/* 10K+ posts published for 750+ happy customers */}
      <p className="pt-4 text-md font-medium text-gray-500 mb-5">
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

      {/* Comparison Section */}
      <section className="max-w-4xl mx-auto mb-10 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Alternatives are expensive.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              UGC Agencies
            </h3>
            <p className="text-gray-600 mb-2">
              Expensive, charging $60-$120 per video, going upwards of $4000 to
              $6000 a month.
            </p>
            <ul className="text-left text-sm space-y-1">
              <li className="flex items-center">
                <span className="text-red-400 mr-2">✗</span> High cost
              </li>
              <li className="flex items-center">
                <span className="text-red-400 mr-2">✗</span> Limited control
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✔</span> Professional quality
              </li>
            </ul>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-300">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">DIY Approach</h2>
            <p className="text-gray-600 mb-2">
              Time-consuming process: research, plan, record, edit, schedule,
              iterate, re-purpose, analyze...
            </p>
            <ul className="text-left text-sm space-y-1">
              <li className="flex items-center">
                <span className="text-red-400 mr-2">✗</span> Time intensive
              </li>
              <li className="flex items-center">
                <span className="text-red-400 mr-2">✗</span> Requires expertise
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✔</span> Full creative control
              </li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">SwiftReel</h3>
            <p className="text-gray-600 mb-2">
              Automatically creates & publishes videos to all platforms for a
              simple monthly subscription.
            </p>
            <ul className="text-left text-sm space-y-1">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✔</span> Cost effective
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✔</span> Fully automated
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✔</span> Multi-platform
                publishing
              </li>
            </ul>
          </div>
        </div>
        <h3 className="mt-6 text-base font-bold text-gray-800">What can it do?</h3>
        <p className="pt-2 text-md font-medium">
          <span className="text-gray-800">
            SwiftReel&apos;s goal is to automate content that drives traffic to
            your business.{" "}
          </span>
          <span className="text-gray-600">
            The differentiating factor between SwiftReel and competitors is that
            SwiftReel takes the approach of using faceless content to automate
            videos. While other services require you to upload all of your video
            & image assets in order to create &quot;AI ads&quot;, SwiftReel
            believes in organic content with TikTok distribution as a means of
            getting leads/inbound.
          </span>
        </p>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-[#FAF9F6]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-start">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Starter</h3>
              <p className="mb-4">
                <span className="text-gray-800 font-bold text-3xl">$19</span>
                <span className="text-gray-400 text-base ml-1">per month</span>
              </p>
              <button className="w-full bg-gray-900 text-white font-semibold py-2 rounded-full mb-4 hover:bg-gray-700 transition">
                Buy Now
              </button>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-center text-gray-600">
                  <span className="text-[#ff4514] mr-2">✔</span> Generate 10 videos per month
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#ff4514] mr-2">✔</span> Use default 200+ UGC avatars included
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#ff4514] mr-2">✔</span> Create your own AI avatars (25 images, 5 videos)
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-[#ff4514] flex flex-col items-start relative">
              <span className="absolute top-4 left-4 bg-[#ff4514] text-white text-xs font-semibold px-2 py-1 rounded-full">
                Most Popular
              </span>
              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-8">Growth</h3>
              <p className="mb-4">
                <span className="text-gray-800 font-bold text-3xl">$49</span>
                <span className="text-gray-400 text-base ml-1">per month</span>
              </p>
              <button className="w-full bg-[#ff4514] text-white font-semibold py-2 rounded-full mb-4 hover:bg-[#e63e12] transition">
                Buy Now
              </button>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-center text-gray-600">
                  <span className="text-[#ff4514] mr-2">✔</span> Everything in Starter, plus...
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#ff4514] mr-2">✔</span> Generate 50 videos per month
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#ff4514] mr-2">✔</span> AI slideshow generator access
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#ff4514] mr-2">✔</span> Create your own AI avatars (100 images, 25 videos)
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#ff4514] mr-2">✔</span> Publish directly to TikTok
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#ff4514] mr-2">✔</span> Schedule and automate videos
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-start">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Scale</h3>
              <p className="mb-4">
                <span className="text-gray-800 font-bold text-3xl">$95</span>
                <span className="text-gray-400 text-base ml-1">per month</span>
              </p>
              <button className="w-full bg-gray-900 text-white font-semibold py-2 rounded-full mb-4 hover:bg-gray-700 transition">
                Buy Now
              </button>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-center text-gray-600">
                  <span className="text-[#ff4514] mr-2">✔</span> Everything in Growth, plus...
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#ff4514] mr-2">✔</span> Generate 150 videos per month
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#ff4514] mr-2">✔</span> Create your own AI avatars (200 images, 50 videos)
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#ff4514] mr-2">✔</span> Priority support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 text-gray-500 text-sm">
        © {new Date().getFullYear()} SwiftReel. All rights reserved.
      </footer>

      <style>
        {`
          html {
            scroll-behavior: smooth;
          }
        `}
      </style>
    </div>
  );
}