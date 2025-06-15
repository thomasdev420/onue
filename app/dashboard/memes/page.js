"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Shuffle, ChevronLeft, ChevronRight, Download } from "lucide-react";

export default function Memes() {
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [customGif, setCustomGif] = useState(null);
  const [customBackground, setCustomBackground] = useState(null);
  const [captionText, setCaptionText] = useState("edit ur text here");
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [memePosition, setMemePosition] = useState({ x: 0, y: 0 });
  const [memeSize, setMemeSize] = useState(100); // Default size in percentage
  const [textSize, setTextSize] = useState(20); // Default text size in pixels
  const [memeStartIndex, setMemeStartIndex] = useState(0);
  const [backgroundStartIndex, setBackgroundStartIndex] = useState(0);

  const memeFileInputRef = useRef(null);
  const backgroundFileInputRef = useRef(null);
  const memeRef = useRef(null);
  const textRef = useRef(null);
  const previewRef = useRef(null);

  const dragState = useRef({ isDragging: false, isMeme: false, start: { x: 0, y: 0 }, lastPos: { x: 0, y: 0 } });

  const memeThumbnails = [
    { id: 1, src: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHg3MTQyNThqdm1sbXYxMHEzd2t6MnY2NGszZjVwMnJtbnU0aGVhdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/v1uV0oxObr9ZT48Kpa/giphy.gif", alt: "Chipi Chipi Cat" },
    { id: 2, src: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/3f4ec842-6f7a-4d31-ab32-a35b7c42e7d8/dgvd6bj-d8c21830-800a-4642-954f-249381540aae.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzNmNGVjODQyLTZmN2EtNGQzMS1hYjMyLWEzNWI3YzQyZTdkOFwvZGd2ZDZiai1kOGMyMTgzMC04MDBhLTQ2NDItOTU0Zi0yNDkzODE1NDBhYWUuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.DXNYAFrTUPlJjEfgUpPXR_YY_znMJ4qNWyu2QEG442E", alt: "Huh Cat" },
    { id: 3, src: "https://lh6.googleusercontent.com/proxy/5GBEY_L_Wv2AZR95S1FPNJhKJPDgcbKahA1s1yaPl_SXBZAYeRr618__M5bJzqRo6w", alt: "Tenor" },
    { id: 4, src: "https://cdn.cdnstep.com/fVskBJxBMpEvZhUnfoXE/cover-6.thumb256.png", alt: "Meme 4" },
    { id: 5, src: "https://media.tenor.com/L4ncxhqryfQAAAAi/cat.gif", alt: "Cat Meme" },
    { id: 6, src: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGc2dmZ3NTA1YW40aml4aDJlN20xNDR1MGUyOHUwdzQ3OWtlMGo1ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/1r1srgmIN9icL74lBR/giphy.gif", alt: "Funny Cat" },
  ];

  const backgroundImages = [
    { id: 1, src: "https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?cs=srgb&dl=pexels-asadphoto-457882.jpg&fm=jpg", alt: "Beach Sunset" },
    { id: 2, src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80", alt: "Snowy Mountains" },
    { id: 3, src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80", alt: "Dense Forest" },
    { id: 4, src: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80", alt: "Desert Dunes" },
    { id: 5, src: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80", alt: "Night City Lights" },
    { id: 6, src: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80", alt: "Tropical Island" },
    { id: 7, src: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80", alt: "Autumn Park" },
    { id: 8, src: "https://eatsleepworkrepeat.com/wp-content/uploads/2020/06/office.jpg", alt: "Modern Office" },
    { id: 9, src: "https://www.nelincs.gov.uk/assets/uploads/2024/01/Weelsby-woods-area-page-1024x683.jpg", alt: "Green Park" },
  ];

  const handleMemeUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file && file.type === "image/gif") {
      setCustomGif(URL.createObjectURL(file));
      setSelectedMeme(1);
    }
  }, []);

  const handleBackgroundUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setCustomBackground(URL.createObjectURL(file));
      setSelectedBackground(1);
    }
  }, []);

  const selectedMemeData = customGif ? { src: customGif, alt: "Custom GIF" } : memeThumbnails.find((meme) => meme.id === selectedMeme);
  const selectedBackgroundData = customBackground ? { src: customBackground, alt: "Custom Background" } : backgroundImages.find((bg) => bg.id === selectedBackground);

  const handleDragStart = useCallback((e, isMeme) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = (isMeme ? memeRef : textRef).current?.getBoundingClientRect();
    if (!rect) return;

    dragState.current = {
      isDragging: true,
      isMeme,
      start: { x: e.clientX, y: e.clientY },
      lastPos: { x: (isMeme ? memePosition : textPosition).x, y: (isMeme ? memePosition : textPosition).y },
    };
  }, [memePosition, textPosition]);

  const handleDragMove = useCallback((e) => {
    if (!dragState.current.isDragging) return;

    const previewRect = previewRef.current?.getBoundingClientRect();
    if (!previewRect) return;

    const dx = e.clientX - dragState.current.start.x;
    const dy = e.clientY - dragState.current.start.y;

    const setPos = dragState.current.isMeme ? setMemePosition : setTextPosition;
    setPos({
      x: Math.max(-previewRect.width / 2, Math.min(dragState.current.lastPos.x + dx, previewRect.width / 2)),
      y: Math.max(-previewRect.height / 2, Math.min(dragState.current.lastPos.y + dy, previewRect.height / 2)),
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragState.current.isDragging) {
      const pos = dragState.current.isMeme ? memePosition : textPosition;
      dragState.current.lastPos = { x: pos.x, y: pos.y };
      dragState.current.isDragging = false;
    }
  }, [memePosition, textPosition]);

  const getCursor = useCallback((e, isMeme) => {
    const ref = isMeme ? memeRef : textRef;
    if (!ref.current) return "move";
    const rect = ref.current.getBoundingClientRect();
    const threshold = 10;
    const nearTop = e.clientY < rect.top + threshold;
    const nearBottom = e.clientY > rect.bottom - threshold;
    const nearLeft = e.clientX < rect.left + threshold;
    const nearRight = e.clientX > rect.right - threshold;

    if ((nearTop && nearLeft) || (nearBottom && nearRight)) return "nwse-resize";
    if ((nearTop && nearRight) || (nearBottom && nearLeft)) return "nesw-resize";
    return "move";
  }, []);

  const handleDownload = useCallback(() => {
    if (!selectedMemeData) return;
    const a = document.createElement("a");
    a.href = selectedMemeData.src;
    a.download = "meme.gif";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [selectedMemeData]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Meme Creator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Text Caption */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Add Caption</h2>
            <input
              type="text"
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff4514]/20 focus:border-[#ff4514] transition"
              placeholder="Enter your caption..."
            />
          </div>

          {/* Meme Selection */}
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
                {memeThumbnails.map((meme) => (
                  <button
                    key={meme.id}
                    onClick={() => setSelectedMeme(meme.id)}
                    className={`relative w-32 h-20 rounded-lg overflow-hidden transition hover:scale-105 ${selectedMeme === meme.id ? "ring-4 ring-gray-600 ring-offset-2" : "hover:ring-2 hover:ring-orange-600"}`}
                  >
                    <img src={meme.src} alt={meme.alt} className="w-full h-full object-cover" />
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

          {/* Background Selection */}
          <div className="bg-white rounded-lg shadow p-4 relative">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Pick Background</h2>
            <button
              onClick={() => {
                const randomIndex = Math.floor(Math.random() * backgroundImages.length);
                setSelectedBackground(backgroundImages[randomIndex].id);
                setCustomBackground(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              title="Random Background"
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <div className="relative overflow-hidden">
              <div
                className="flex gap-4 py-2 overflow-x-auto scrollbar-hide"
                style={{ transform: `translateX(-${backgroundStartIndex * 128}px)` }}
              >
                {backgroundImages.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setSelectedBackground(bg.id)}
                    className={`relative w-32 h-20 rounded-lg overflow-hidden transition hover:scale-105 ${selectedBackground === bg.id ? "ring-4 ring-gray-600 ring-offset-2" : "hover:ring-2 hover:ring-orange-600"}`}
                  >
                    <img src={bg.src} alt={bg.alt} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition" />
                    <span className="absolute bottom-1 left-1 text-white text-xs font-medium drop-shadow">{bg.alt}</span>
                  </button>
                ))}
                <button
                  onClick={() => backgroundFileInputRef.current?.click()}
                  className="w-32 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-orange-600 transition"
                >
                  <Upload className="w-8 h-8" />
                </button>
              </div>
              {backgroundStartIndex > 0 && (
                <button
                  onClick={() => setBackgroundStartIndex((prev) => Math.max(0, prev - 3))}
                  className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-gray-700 text-white rounded-full opacity-75 hover:opacity-100 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {backgroundStartIndex + 3 < backgroundImages.length + 1 && (
                <button
                  onClick={() => setBackgroundStartIndex((prev) => Math.min(prev + 3, backgroundImages.length - (backgroundImages.length % 3 || 3) + 1))}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-gray-700 text-white rounded-full opacity-75 hover:opacity-100 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
            <input type="file" ref={backgroundFileInputRef} onChange={handleBackgroundUpload} accept="image/*" className="hidden" />
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow px-4 pb-4 sticky top-0">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">Live Preview</h2>
            <div
              ref={previewRef}
              className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-gray-100"
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              {selectedBackgroundData && <img src={selectedBackgroundData.src} alt={selectedBackgroundData.alt} className="absolute inset-0 w-full h-full object-cover" />}
              {selectedMemeData && (
                <div style={{ transform: `translate(${memePosition.x}px, ${memePosition.y}px)`, zIndex: 10 }}>
                  <img
                    ref={memeRef}
                    src={selectedMemeData.src}
                    alt={selectedMemeData.alt}
                    style={{ width: `${memeSize}%`, height: `${memeSize}%`, cursor: "move" }}
                    onMouseDown={(e) => handleDragStart(e, true)}
                    onMouseMove={(e) => (memeRef.current.style.cursor = getCursor(e, true))}
                  />
                </div>
              )}
              {captionText && (
                <div style={{ transform: `translate(${textPosition.x}px, ${textPosition.y}px)`, zIndex: 20 }}>
                  <div
                    ref={textRef}
                    className="px-2"
                    style={{ cursor: "move" }}
                    onMouseDown={(e) => handleDragStart(e, false)}
                    onMouseMove={(e) => (textRef.current.style.cursor = getCursor(e, false))}
                  >
                    <p className="text-white text-center font-bold drop-shadow-lg" style={{ fontSize: `${textSize}px` }}>
                      {captionText}
                    </p>
                  </div>
                </div>
              )}
              {!selectedBackgroundData && !selectedMemeData && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Select a background and meme to see preview
                </div>
              )}
            </div>
            <button
              onClick={handleDownload}
              disabled={!selectedMemeData}
              className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md transition ${
                !selectedMemeData ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-[#ff4514] text-white hover:bg-[#ff4514]/90"
              }`}
            >
              <Download className="w-5 h-5" /> Download Meme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}