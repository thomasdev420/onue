import React from "react";
import { Upload, Shuffle, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

export default function MemeSelector({ memeThumbnails, selectedMeme, setSelectedMeme, memeFileInputRef, handleMemeUpload, memeStartIndex, setMemeStartIndex, setCustomGif }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 relative">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Choose Meme</h2>
      <button
        onClick={() => {
          const randomIndex = Math.floor(Math.random() * memeThumbnails.length);
          setSelectedMeme(memeThumbnails[randomIndex].id);
          setCustomGif(null);
        }}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
        title="Random Meme"
      >
        <Shuffle className="w-5 h-5" />
      </button>
      <div className="relative overflow-hidden">
        <div
          className="flex gap-4 py-2 overflow-x-auto scrollbar-hide"
          style={{ transform: `translateX(-${memeStartIndex * 128}px)` }}
        >
          {memeThumbnails.map((meme, idx) => (
            <button
              key={meme.id}
              onClick={() => setSelectedMeme(meme.id)}
              className={`relative w-32 h-20 rounded-lg overflow-hidden transition hover:scale-105 ${selectedMeme === meme.id ? "ring-2 ring-orange-600" : "hover:ring-2 hover:ring-orange-600"} ${idx === 0 ? "ml-2" : ""}`}
            >
              <Image src={meme.src} alt={meme.alt} fill={true} style={{objectFit: "cover"}} />
            </button>
          ))}
          <button
            onClick={() => memeFileInputRef.current?.click()}
            className="w-32 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-orange-600 transition"
          >
            <Upload className="w-8 h-8" />
          </button>
        </div>
        {memeStartIndex > 0 && (
          <button
            onClick={() => setMemeStartIndex((prev) => Math.max(0, prev - 3))}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-gray-700 text-white rounded-full opacity-75 hover:opacity-100 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {memeStartIndex + 3 < memeThumbnails.length + 1 && (
          <button
            onClick={() => setMemeStartIndex((prev) => Math.min(prev + 3, memeThumbnails.length - (memeThumbnails.length % 3 || 3) + 1))}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-gray-700 text-white rounded-full opacity-75 hover:opacity-100 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
      <input type="file" ref={memeFileInputRef} onChange={handleMemeUpload} accept="image/gif" className="hidden" />
    </div>
  );
} 