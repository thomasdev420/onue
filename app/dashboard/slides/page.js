"use client";

import { useState } from "react";
import Image from "next/image";

const SLIDESHOW_TYPES = [
  { label: "Educational Listicle", slides: "4-5 slides", color: "#a78bfa", icon: "\u{1F4D6}" },
  { label: "Personal Relatable", slides: "1-2 slides", color: "#60a5fa", icon: "\u{1F464}" },
  { label: "Poetic/Emotional", slides: "2-3 slides", color: "#34d399", icon: "\u{1F49C}" },
  { label: "AI Narrative", slides: "5 slides", color: "#818cf8", icon: "\u{1F916}", soon: true },
  { label: "Text Wall", slides: "1 slide", color: "#fbbf24", icon: "\u{1F4DD}", soon: true },
  { label: "Hook + Demo", slides: "2 slides", color: "#f472b6", icon: "\u{1F4A1}", soon: true },
];

const SLIDES = [
  { img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80", text: "INFJ + INTJ are power couples" },
  { img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80", text: "1. We balance each other perfectly\n\nWe both see logic in the other's way, and we help each other grow emotionally and logically." },
  { img: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=400&q=80", text: "2. We both need alone time\n\nWe totally get when the other person says they need space to recharge and never take it personally." },
];

export default function Slides() {
  const [prompt, setPrompt] = useState("MBTI Test");
  const [context, setContext] = useState("");
  const [typeIdx, setTypeIdx] = useState(0);
  const [selectedSlide, setSelectedSlide] = useState(0);

  return (
    <div className="flex flex-col md:flex-row bg-[#f7f7f4] min-h-screen">
      {/* Sidebar */}
      <aside className="w-full md:w-96 bg-white rounded-2xl shadow-md m-4 md:mr-0 md:ml-8 p-6 flex flex-col gap-8 max-w-md">
        <div>
          <h2 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">1. Prompt / Product Context</h2>
          <select
            className="w-full rounded-lg border border-gray-200 p-2 mb-3 text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-200"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          >
            <option>MBTI Test</option>
            <option>Product Launch</option>
            <option>Travel Guide</option>
          </select>
          <textarea
            className="w-full rounded-lg border border-gray-200 p-3 text-gray-700 bg-gray-50 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-orange-200"
            placeholder="Describe your prompt or context..."
            value={context}
            onChange={e => setContext(e.target.value)}
          />
        </div>
        <div>
          <h2 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">2. Slideshow Type</h2>
          <div className="flex flex-col gap-2">
            {SLIDESHOW_TYPES.map((type, idx) => (
              <button
                key={type.label}
                disabled={type.soon}
                onClick={() => setTypeIdx(idx)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left ${
                  idx === typeIdx ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white hover:bg-gray-50"
                } ${type.soon ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span className="text-2xl" style={{ color: type.color }}>{type.icon}</span>
                <span className="flex-1">
                  <span className="block font-semibold text-gray-800">{type.label}</span>
                  <span className="block text-xs text-gray-500">{type.slides}</span>
                </span>
                {type.soon && <span className="text-xs text-gray-400 ml-2">Coming soon</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-200 transition">Images</button>
          <button className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-200 transition">Sound</button>
        </div>
        <button className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl mt-6 hover:bg-orange-600 transition text-lg flex items-center justify-center gap-2">
          <span>Generate</span>
        </button>
      </aside>

      {/* Preview Editor */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 md:p-12">
        <h2 className="text-lg font-semibold text-gray-500 mb-6 mt-2">Preview Editor</h2>
        <div className="flex flex-col items-center w-full max-w-3xl">
          {/* Slides Preview */}
          <div className="flex gap-6 w-full justify-center mb-6 overflow-x-auto pb-2">
            {SLIDES.map((slide, idx) => (
              <div
                key={idx}
                className={`relative rounded-xl overflow-hidden shadow-md bg-gray-200 aspect-[3/4] w-48 flex-shrink-0 border-2 transition-all duration-200 ${
                  idx === selectedSlide ? "border-orange-500 scale-105" : "border-transparent"
                }`}
                onClick={() => setSelectedSlide(idx)}
                style={{ cursor: "pointer" }}
              >
                <Image src={slide.img} alt="slide" width={192} height={256} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 py-6">
                  <p className="text-white text-center text-base font-semibold drop-shadow-lg whitespace-pre-line">
                    {slide.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* Thumbnails */}
          <div className="flex gap-2 mb-8 mt-2">
            {SLIDES.map((slide, idx) => (
              <button
                key={idx}
                className={`w-10 h-10 rounded-lg overflow-hidden border-2 ${
                  idx === selectedSlide ? "border-orange-500" : "border-gray-200"
                }`}
                onClick={() => setSelectedSlide(idx)}
              >
                <Image src={slide.img} alt="thumb" width={40} height={40} className="w-full h-full object-cover" />
              </button>
            ))}
            <button className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-white hover:border-orange-400 ml-2">
              <span className="text-2xl">+</span>
            </button>
          </div>
          {/* Create Button */}
          <button className="w-full max-w-xs bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition text-lg flex items-center justify-center gap-2">
            <span>Create</span>
          </button>
        </div>
      </main>
    </div>
  );
} 