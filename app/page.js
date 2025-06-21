"use client";

import Link from "next/link";
import { Lightbulb, Rocket, Users } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";

// Landing page
export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-6 py-12 sm:px-20 font-sans text-gray-900 relative">
      {/* Beta Version Box */}
      <div className="absolute top-4 left-8 z-50 flex items-center gap-3">
        <div className="inline-block px-4 py-1.5 rounded-full bg-gray-200">
          <span className="text-gray-800 font-semibold text-sm font-mono">Beta V2.6.4</span>
        </div>
        <Link href="/dashboard">
          <button className="px-3 py-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
            <span className="text-gray-800 font-semibold text-sm font-mono">Dev Access</span>
          </button>
        </Link>
      </div>

      {/* Navigation Bar */}
      <nav className="absolute top-4 right-8 z-50">
        <ul className="flex gap-3 items-center text-sm">
          <li>
            <Link href="/#product">
              <span className="text-gray-600 hover:text-gray-800 transition cursor-pointer">Product</span>
            </Link>
          </li>
          <li>
            <Link href="/#pricing">
              <span className="text-gray-600 hover:text-gray-800 transition cursor-pointer">Pricing</span>
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
                  <span className="text-gray-600 hover:text-gray-800 transition cursor-pointer">Sign Out</span>
                </Link>
              </li>
            </>
          ) : (
            <li>
              <button
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="bg-[#4285F4] text-white font-semibold px-3 py-1 rounded-full shadow-sm hover:bg-[#357ae8] transition text-sm"
              >
                Sign In with Google
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Header Section */}
      <header className="max-w-2xl text-center mb-12 mt-24">
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight text-gray-800">
          Automate content that boost your website traffic
        </h1>
        <p className="text-lg font-semibold text-gray-500 mb-6">
          Viral marketing magic, without hiring a whole creative team.
        </p>
        <div className="flex justify-center">
          {session ? (
            <Link href="/dashboard">
              <button className="bg-[#ff4514] text-white font-semibold px-7 py-3.5 rounded-full shadow hover:bg-[#e63e12] transition start-glow">
                Start Now
              </button>
            </Link>
          ) : (
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="bg-[#ff4514] text-white font-semibold px-7 py-3.5 rounded-full shadow hover:bg-[#e63e12] transition start-glow"
            >
              Unlock Now
            </button>
          )}
        </div>
      </header>

      {/* Hero Image */}
      <Image
        src="https://reel.farm/hero.png"
        alt="Hero Image"
        width={800}
        height={400}
        className="mx-auto max-w-full h-auto"
      />

      {/* The Problem */}
      <div
        id="product"
        style={{
          borderLeft: "4px solid #F05252",
          borderRadius: 0,
          padding: "clamp(0.3rem, 1.2vw, 0.5rem) clamp(1rem, 2.5vw, 1.5rem)",
          marginBottom: "clamp(1rem, 2vw, 1.5rem)",
          marginTop: "clamp(3rem, 5vw, 6rem)",
          backgroundColor: "rgba(240, 82, 82, 0.1)",
          textAlign: "left",
          display: "inline-block",
        }}
      >
        <p
          style={{
            fontSize: "clamp(0.875rem, 1.25vw, 1.125rem)",
            lineHeight: 1.2,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "#F05252",
            fontWeight: 700,
          }}
          className="mantine-focus-auto m_b6d8b162 mantine-Text-root"
        >
          The Problem
        </p>
      </div>

      {/* Problem Text */}
      <h1
        className="text-5xl font-extrabold mb-4 tracking-tight text-center text-gray-800"
        style={{ fontWeight: "800" }}
      >
        Creating content that converts takes
        <br />
        <span style={{ color: "red", fontWeight: "900" }}>hours</span> and often
        still <span style={{ color: "red", fontWeight: "900" }}>flops</span>
      </h1>

      {/* The Solution */}
      <div
        style={{
          borderLeft: "4px solid #22C55E",
          borderRadius: 0,
          padding: "clamp(0.3rem, 1.2vw, 0.5rem) clamp(1rem, 2.5vw, 1.5rem)",
          marginBottom: "clamp(1rem, 2vw, 1.5rem)",
          marginTop: "clamp(3rem, 5vw, 6rem)",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          textAlign: "left",
          display: "inline-block",
        }}
      >
        <p
          style={{
            fontSize: "clamp(0.875rem, 1.25vw, 1.125rem)",
            lineHeight: 1.2,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "#22C55E",
            fontWeight: 700,
          }}
          className="mantine-focus-auto m_b6d8b162 mantine-Text-root"
        >
          The Solution
        </p>
      </div>

      {/* Solution Text */}
      <h1
        className="text-5xl font-extrabold mb-16 tracking-tight text-center text-gray-800"
        style={{ fontWeight: "800" }}
      >
        SwiftReel creates{" "}
        <span style={{ fontWeight: "900", color: "#22C55E" }}>self-improving</span>{" "}
        content, so you can post{" "}
        <span style={{ fontWeight: "900", color: "#22C55E" }}>faster</span> and
        grow{" "}
        <span style={{ fontWeight: "900", color: "#22C55E" }}>consistently</span>{" "}
        without the guesswork.
      </h1>

      {/* Comparison Section */}
      <section className="max-w-4xl mx-auto mb-10 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Alternatives are expensive.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">UGC Agencies</h3>
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
            <h3 className="text-lg font-semibold text-gray-800 mb-2">DIY Approach</h3>
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
            SwiftReel&apos;s goal is to automate content that drives traffic to your
            business.{" "}
          </span>
          <span className="text-gray-600">
            The differentiating factor between SwiftReel and competitors is that
            SwiftReel takes the approach of using faceless content to automate
            videos. While other services require you to upload all of your video
            & image assets in order to create &quot;AI ads&quot;, SwiftReel believes in
            organic content with TikTok distribution as a means of getting
            leads/inbound.
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
          .start-glow {
            position: relative;
            box-shadow: 0 0 16px 2px #ffb380, 0 0 8px 2px #ff4514;
            animation: glow-pulse 3s infinite alternate ease-in-out;
          }

          .start-glow::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 9999px;
            background: linear-gradient(45deg, #ff4514, #ffb380, #ff4514);
            z-index: -1;
            animation: rotate-glow 3s linear infinite;
          }

          @keyframes glow-pulse {
            0% {
              box-shadow: 0 2px 12px 1px #ffb380, 0 1px 6px 1px #ff4514;
            }
            50% {
              box-shadow: 0 -2px 20px 3px #ffb380, 0 -1px 10px 3px #ff4514;
            }
            100% {
              box-shadow: 0 2px 12px 1px #ffb380, 0 1px 6px 1px #ff4514;
            }
          }

          @keyframes rotate-glow {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}