"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Upload, Shuffle, ChevronLeft, ChevronRight, Download } from "lucide-react";
import Image from "next/image";
import CaptionInput from "./components/CaptionInput";
import MemeSelector from "./components/MemeSelector";
import BackgroundSelector from "./components/BackgroundSelector";
import MemePreview from "./components/MemePreview";
import useDrag from "./hooks/useDrag";

export default function Memes() {
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [customGif, setCustomGif] = useState(null);
  const [customBackground, setCustomBackground] = useState(null);
  const [captionText, setCaptionText] = useState("Edit text here");
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

  const memeThumbnails = useMemo(() => [
    { id: 1, src: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHg3MTQyNThqdm1sbXYxMHEzd2t6MnY2NGszZjVwMnJtbnU0aGVhdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/v1uV0oxObr9ZT48Kpa/giphy.gif", alt: "Chipi Chipi Cat" },
    { id: 2, src: "https://lh6.googleusercontent.com/proxy/5GBEY_L_Wv2AZR95S1FPNJhKJPDgcbKahA1s1yaPl_SXBZAYeRr618__M5bJzqRo6w", alt: "Tenor" },
    { id: 3, src: "https://cdn.cdnstep.com/fVskBJxBMpEvZhUnfoXE/cover-6.thumb256.png", alt: "Meme 4" },
    { id: 4, src: "https://media.tenor.com/L4ncxhqryfQAAAAi/cat.gif", alt: "Cat Meme" },
    { id: 5, src: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGc2dmZ3NTA1YW40aml4aDJlN20xNDR1MGUyOHUwdzQ3OWtlMGo1ayZlcD12MV9pbnRlcm5uYWxfnaWZfYnlfaWQmY3Q9cw/1r1srgmIN9icL74lBR/giphy.gif", alt: "Funny Cat" },
  ], []);

  const backgroundImages = useMemo(() => [
    { id: 1, src: "https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?cs=srgb&dl=pexels-asadphoto-457882.jpg&fm=jpg", alt: "Beach Sunset" },
    { id: 2, src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80", alt: "Snowy Mountains" },
    { id: 3, src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80", alt: "Dense Forest" },
    { id: 4, src: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80", alt: "Desert Dunes" },
    { id: 5, src: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80", alt: "Night City Lights" },
    { id: 6, src: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80", alt: "Tropical Island" },
    { id: 7, src: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80", alt: "Autumn Park" },
    { id: 8, src: "https://eatsleepworkrepeat.com/wp-content/uploads/2020/06/office.jpg", alt: "Modern Office" },
    { id: 9, src: "https://www.nelincs.gov.uk/assets/uploads/2024/01/Weelsby-woods-area-page-1024x683.jpg", alt: "Green Park" },
  ], []);

  const selectedMemeData = useMemo(() => {
    return customGif
      ? { src: customGif, alt: "Custom GIF" }
      : memeThumbnails.find((meme) => meme.id === selectedMeme);
  }, [customGif, selectedMeme, memeThumbnails]);

  const selectedBackgroundData = useMemo(() => {
    return customBackground
      ? { src: customBackground, alt: "Custom Background" }
      : backgroundImages.find((bg) => bg.id === selectedBackground);
  }, [customBackground, selectedBackground, backgroundImages]);

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

  const { handleDragStart, handleDragMove, handleDragEnd } = useDrag(
    memeRef,
    textRef,
    previewRef,
    memePosition,
    setMemePosition,
    textPosition,
    setTextPosition
  );

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
          <CaptionInput captionText={captionText} setCaptionText={setCaptionText} />
          <MemeSelector
            memeThumbnails={memeThumbnails}
            selectedMeme={selectedMeme}
            setSelectedMeme={setSelectedMeme}
            memeFileInputRef={memeFileInputRef}
            handleMemeUpload={handleMemeUpload}
            memeStartIndex={memeStartIndex}
            setMemeStartIndex={setMemeStartIndex}
            setCustomGif={setCustomGif}
          />
          <BackgroundSelector
            backgroundImages={backgroundImages}
            selectedBackground={selectedBackground}
            setSelectedBackground={setSelectedBackground}
            backgroundFileInputRef={backgroundFileInputRef}
            handleBackgroundUpload={handleBackgroundUpload}
            backgroundStartIndex={backgroundStartIndex}
            setBackgroundStartIndex={setBackgroundStartIndex}
            setCustomBackground={setCustomBackground}
          />
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <MemePreview
            previewRef={previewRef}
            selectedBackgroundData={selectedBackgroundData}
            selectedMemeData={selectedMemeData}
            memePosition={memePosition}
            memeRef={memeRef}
            memeSize={memeSize}
            textPosition={textPosition}
            textRef={textRef}
            captionText={captionText}
            textSize={textSize}
            handleDragMove={handleDragMove}
            handleDragEnd={handleDragEnd}
            handleDragStart={handleDragStart}
            handleDownload={handleDownload}
          />
        </div>
      </div>
    </div>
  );
}