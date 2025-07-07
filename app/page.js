"use client";

import Link from "next/link";
import { Lightbulb, Rocket, Users, X } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useState, useEffect } from "react";

// Landing page
export default function Home() {
  const { data: session } = useSession();
  const [showDevModal, setShowDevModal] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [devCodeError, setDevCodeError] = useState("");
  const [devAccessGranted, setDevAccessGranted] = useState(false);

  const handleDevAccessClick = () => {
    setShowDevModal(true);
    setDevCode("");
    setDevCodeError("");
    // Clear any existing dev access when opening modal
    setDevAccessGranted(false);
    localStorage.removeItem("devAccessGranted");
  };

  const handleDevCodeSubmit = (e) => {
    e.preventDefault();
    if (devCode === "42069") {
      setDevAccessGranted(true);
      setDevCodeError("");
      // Store in localStorage to persist across sessions
      localStorage.setItem("devAccessGranted", "true");
      // Close modal after a brief delay
      setTimeout(() => {
        setShowDevModal(false);
        window.location.href = "/dashboard";
      }, 1000);
    } else {
      setDevCodeError("Incorrect code. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setShowDevModal(false);
    setDevCode("");
    setDevCodeError("");
    // Reset dev access state when closing modal
    setDevAccessGranted(false);
  };

  // Check if dev access was previously granted
  useEffect(() => {
    const granted = localStorage.getItem("devAccessGranted") === "true";
    setDevAccessGranted(granted);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-6 py-32 sm:px-20 font-sans text-gray-900 relative">
      <div className="absolute top-4 left-8 z-50 flex items-center gap-3">
        <button 
          onClick={handleDevAccessClick}
          className="px-3 py-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          <span className="text-gray-800 font-semibold text-sm font-mono">Dev Access</span>
        </button>
      </div>

      {/* Dev Access Modal */}
      {showDevModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Developer Access</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {!devAccessGranted ? (
              <form onSubmit={handleDevCodeSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Access Code
                  </label>
                  <input
                    type="password"
                    value={devCode}
                    onChange={(e) => setDevCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter code..."
                    autoFocus
                  />
                  {devCodeError && (
                    <p className="text-red-500 text-sm mt-2">{devCodeError}</p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Verify
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <div className="text-green-500 text-6xl mb-4">✓</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Access Granted!</h3>
                <p className="text-gray-600">Redirecting to dashboard...</p>
              </div>
            )}
          </div>
        </div>
      )}

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
      <header className="max-w-2xl text-center mb-12">
        {/* Beta Pill */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          marginBottom: '10px',
          marginTop: '-16px',
        }}>
          <div
            style={{
              display: 'inline-block',
              padding: '2px',
              borderRadius: '9999px',
              background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                borderRadius: '9999px',
                background: '#fef9f6',
                fontWeight: 'bold',
                fontSize: '15px',
                color: '#222',
                padding: '4px 16px',
                lineHeight: 1.2,
              }}
            >
              Version 0.0.7
            </span>
          </div>
        </div>
        <h1 className="text-5xl font-extrabold mb-2 tracking-tight text-gray-800" style={{ fontWeight: "800", marginBottom: '16px' }}>
        Automate content that boosts your website traffic
        </h1>
        <p className="text-lg font-semibold text-gray-500 mb-4" style={{ marginBottom: '18px' }}>
        Generate viral, self-improving content that boosts your traffic on autopilot.
        </p>
        <div className="flex justify-center items-center gap-4" style={{ marginTop: '0', marginBottom: '48px' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {session ? (
              <Link href="/dashboard">
                <button
                  style={{
                    width: '220px',
                    height: '64px',
                    position: 'relative',
                    background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
                    border: 'none',
                    borderRadius: '16px',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: '600',
                    boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset',
                    cursor: 'pointer',
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    transition: 'transform 0.1s ease',
                    letterSpacing: '0.01em',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; }}
                  onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
                >
                  <span style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '55%',
                    borderRadius: '16px 16px 40% 40%/16px 16px 60% 60%',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)',
                    pointerEvents: 'none',
                    zIndex: 1,
                    filter: 'blur(0.5px)',
                  }} />
                  <span style={{ position: 'relative', zIndex: 2 }}>Unlock now</span>
                </button>
              </Link>
            ) :
              <button
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                style={{
                  width: '220px',
                  height: '64px',
                  position: 'relative',
                  background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: '600',
                  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.1s ease',
                  letterSpacing: '0.01em',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
              >
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '55%',
                  borderRadius: '16px 16px 40% 40%/16px 16px 60% 60%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                  filter: 'blur(0.5px)',
                }} />
                <span style={{ position: 'relative', zIndex: 2 }}>Unlock now</span>
              </button>
            }
            <span style={{
              fontSize: '14px',
              color: '#6B7280',
              fontWeight: '500',
                  cursor: 'pointer',
              transition: 'color 0.2s ease',
                }}
            onMouseEnter={e => { e.target.style.color = '#374151'; }}
            onMouseLeave={e => { e.target.style.color = '#6B7280'; }}
              >
            </span>
          </div>
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
      <div style={{
        background: '#fff',
        border: '1.5px solid #f87171',
        borderRadius: '18px',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.06)',
        padding: '36px 32px',
        maxWidth: '900px',
        margin: '0 auto 40px auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <h1
          className="text-4xl font-extrabold mb-4 tracking-tight text-center text-gray-800"
          style={{ fontWeight: "800" }}
        >
          Creating content that actually<br />
          drives results takes <span style={{ color: "red", fontWeight: "900" }}>hours</span><br />
          and often still <span style={{ color: "red", fontWeight: "900" }}>fails</span><br />
          to deliver for most founders.
        </h1>
      </div>

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
      <div style={{
        background: '#fff',
        border: '1.5px solid #22C55E',
        borderRadius: '18px',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.06)',
        padding: '36px 32px',
        maxWidth: '900px',
        margin: '0 auto 40px auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <h1
          className="text-4xl font-extrabold mb-4 tracking-tight text-center text-gray-800"
          style={{ fontWeight: "800" }}
        >
          Swiftreel generates and optimizes<br />
          content that learns what <span style={{ color: "#22C55E", fontWeight: "900" }}>works</span>,<br />
          so you can post <span style={{ color: "#22C55E", fontWeight: "900" }}>faster</span>,<br />
          grow <span style={{ color: "#22C55E", fontWeight: "900" }}>consistently</span> and skip the guesswork.
        </h1>
      </div>

      {/* Comparison Section */}
      <section className="max-w-7xl mx-auto mb-16 px-4 mt-20">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-8 text-center">
          Alternatives are <span className="text-red-600">expensive</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20 items-stretch justify-items-center">
          {/* UGC Agencies */}
          <div className="h-64 w-[350px] flex flex-col justify-between bg-white border-2 border-red-200 rounded-2xl shadow-md p-7 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:border-red-400 cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-bold text-gray-800">UGC Agencies</span>
            </div>
            <p className="text-gray-600 mb-4">
              Expensive, charging $60-$120 per video, going upwards of $4000 to $6000 a month.
            </p>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center"><span className="text-red-400 mr-2">✗</span> High cost</li>
              <li className="flex items-center"><span className="text-red-400 mr-2">✗</span> Limited control</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Professional quality</li>
            </ul>
          </div>
          {/* DIY Approach */}
          <div className="h-64 w-[350px] flex flex-col justify-between bg-white border-2 border-red-200 rounded-2xl shadow-md p-7 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:border-red-400 cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-bold text-gray-800">DIY Approach</span>
            </div>
            <p className="text-gray-600 mb-4">
              Time-consuming process: research, plan, record, edit, schedule, iterate, re-purpose, analyze…
            </p>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center"><span className="text-red-400 mr-2">✗</span> Time intensive</li>
              <li className="flex items-center"><span className="text-red-400 mr-2">✗</span> Requires expertise</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Full creative control</li>
            </ul>
          </div>
          {/* SwiftReel */}
          <div className="h-64 w-[350px] flex flex-col justify-between bg-white border-2 border-green-300 rounded-2xl shadow-lg p-7 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:border-green-400 cursor-pointer relative">
            <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">Best Value</span>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-bold text-gray-800">SwiftReel</span>
            </div>
            <p className="text-gray-700 mb-4">
              Automatically creates & publishes videos to all platforms for a simple monthly subscription.
            </p>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Cost effective</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Fully automated</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Multi-platform publishing</li>
            </ul>
          </div>
        </div>
        <div className="my-10 border-t border-gray-200"></div>
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">What can it do?</h3>
          <p className="text-md text-gray-700 font-medium">
            <span className="font-bold text-gray-900">Swiftreel automatically creates self-improving content that drives users to your website.</span>
            <br />
            The differentiating factor between SwiftReel and competitors is that SwiftReel takes the approach of using faceless content to automate videos. While other services require you to upload all of your video & image assets in order to create &quot;AI ads&quot;, SwiftReel believes in organic content with TikTok distribution as a means of getting leads/inbound.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-[#FAF9F6]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-start">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Starter</h3>
              <p className="mb-4">
                <span className="text-gray-800 font-bold text-3xl">$29</span>
                <span className="text-gray-400 text-base ml-1">per month</span>
              </p>
              {/* Starter Plan Button (black gradient, lifted/glossy) */}
              <button
                style={{
                  position: 'relative',
                  background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '12px 24px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.45), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'inline-block',
                  textAlign: 'center',
                  transition: 'transform 0.1s ease',
                  letterSpacing: '0.01em',
                  overflow: 'hidden',
                  width: '100%',
                  marginBottom: '1rem',
                }}
                onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
              >
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '55%',
                  borderRadius: '16px 16px 40% 40%/16px 16px 60% 60%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                  filter: 'blur(0.5px)',
                }} />
                <span style={{ position: 'relative', zIndex: 2 }}>Buy Now</span>
              </button>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Generate 10 videos per month
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Use default 200+ UGC avatars included
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Create your own AI avatars (25 images, 5 videos)
                </li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-[#3953e6] flex flex-col items-start relative">
              <span className="absolute top-4 left-4 text-white text-xs font-semibold px-2 py-1 rounded-full" style={{background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)'}}>
                Most Popular
              </span>
              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-8">Growth</h3>
              <p className="mb-4">
                <span className="text-gray-800 font-bold text-3xl">$79</span>
                <span className="text-gray-400 text-base ml-1">per month</span>
              </p>
              {/* Growth Plan Button (blue gradient/gloss) */}
              <button
                style={{
                  position: 'relative',
                  background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '12px 24px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.45), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'inline-block',
                  textAlign: 'center',
                  transition: 'transform 0.1s ease',
                  letterSpacing: '0.01em',
                  overflow: 'hidden',
                  width: '100%',
                  marginBottom: '1rem',
                }}
                onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
              >
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '55%',
                  borderRadius: '16px 16px 40% 40%/16px 16px 60% 60%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                  filter: 'blur(0.5px)',
                }} />
                <span style={{ position: 'relative', zIndex: 2 }}>Buy Now</span>
              </button>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Everything in Starter, plus...
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Generate 50 videos per month
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> AI slideshow generator access
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Create your own AI avatars (100 images, 25 videos)
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Publish directly to TikTok
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Schedule and automate videos
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-start">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Scale</h3>
              <p className="mb-4">
                <span className="text-gray-800 font-bold text-3xl">$149</span>
                <span className="text-gray-400 text-base ml-1">per month</span>
              </p>
              {/* Scale Plan Button (black gradient, lifted/glossy) */}
              <button
                style={{
                  position: 'relative',
                  background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '12px 24px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.45), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'inline-block',
                  textAlign: 'center',
                  transition: 'transform 0.1s ease',
                  letterSpacing: '0.01em',
                  overflow: 'hidden',
                  width: '100%',
                  marginBottom: '1rem',
                }}
                onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
              >
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '55%',
                  borderRadius: '16px 16px 40% 40%/16px 16px 60% 60%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                  filter: 'blur(0.5px)',
                }} />
                <span style={{ position: 'relative', zIndex: 2 }}>Buy Now</span>
              </button>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Everything in Growth, plus...
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Generate 150 videos per month
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Create your own AI avatars (200 images, 50 videos)
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Priority support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="absolute bottom-2 left-0 w-full flex flex-col items-center gap-2 text-gray-500 text-sm">
        <div className="flex items-center gap-4">
          <span>© 2025 SwiftReel. All rights reserved.</span>
          <a
            href="/privacy-policy"
            className="px-3 py-1 rounded-full bg-white border border-gray-300 text-gray-500 font-semibold hover:bg-blue-50 hover:text-blue-800 transition"
            style={{ fontSize: '14px' }}
          >
            Privacy Policy
          </a>
          <a
            href="/terms-of-service"
            className="px-3 py-1 rounded-full bg-white border border-gray-300 text-gray-500 font-semibold hover:bg-blue-50 hover:text-blue-800 transition"
            style={{ fontSize: '14px' }}
          >
            Terms of Service
          </a>
        </div>
      </footer>

      <style>
        {`
        `}
      </style>
    </div>
  );
}