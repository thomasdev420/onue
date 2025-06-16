import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Download } from "lucide-react";

export default function MemePreview({
  previewRef,
  selectedBackgroundData,
  selectedMemeData,
  memePosition,
  memeRef,
  memeSize,
  textPosition,
  textRef,
  captionText,
  textSize,
  handleDragMove,
  handleDragEnd,
  handleDragStart,
  handleDownload
}) {
  const [captionColor, setCaptionColor] = useState("white");

  useEffect(() => {
    if (!selectedBackgroundData || !previewRef.current || !textRef.current) {
      setCaptionColor("white");
      return;
    }
    // Create a canvas to sample the background color
    const img = previewRef.current.querySelector("img");
    if (!img) {
      setCaptionColor("white");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // Get the position of the caption relative to the image
    const previewRect = previewRef.current.getBoundingClientRect();
    const textRect = textRef.current.getBoundingClientRect();
    const x = ((textRect.left + textRect.width / 2) - previewRect.left) / previewRect.width * canvas.width;
    const y = ((textRect.top + textRect.height / 2) - previewRect.top) / previewRect.height * canvas.height;
    // Sample a 3x3 area for average color
    let r = 0, g = 0, b = 0, count = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const px = Math.round(x + dx);
        const py = Math.round(y + dy);
        if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
          const data = ctx.getImageData(px, py, 1, 1).data;
          r += data[0];
          g += data[1];
          b += data[2];
          count++;
        }
      }
    }
    if (count > 0) {
      r /= count; g /= count; b /= count;
      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      setCaptionColor(luminance > 180 ? "black" : "white");
    } else {
      setCaptionColor("white");
    }
  }, [selectedBackgroundData, textPosition, captionText, previewRef, textRef]);

  return (
    <div className="bg-white rounded-lg shadow flex flex-col items-center px-4 pb-4 sticky top-0">
      <h2 className="text-lg font-semibold text-gray-800 my-6 text-center w-full">Live Preview</h2>
      <div
        ref={previewRef}
        className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-gray-100"
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {selectedBackgroundData && <Image src={selectedBackgroundData.src} alt={selectedBackgroundData.alt} fill={true} style={{objectFit: "cover"}} />}
        {selectedMemeData && (
          <div 
            style={{ 
              transform: `translate(${memePosition.x}px, ${memePosition.y}px)`,
              position: 'absolute',
              zIndex: 10,
              cursor: 'move'
            }}
            onMouseDown={(e) => handleDragStart(e, true)}
          >
            <Image
              ref={memeRef}
              src={selectedMemeData.src}
              alt={selectedMemeData.alt}
              width={previewRef.current ? memeSize * previewRef.current.offsetWidth / 100 : 0}
              height={previewRef.current ? memeSize * previewRef.current.offsetHeight / 100 : 0}
              style={{objectFit: "contain"}}
            />
          </div>
        )}
        {captionText && (
          <div 
            style={{ 
              transform: `translate(${textPosition.x}px, ${textPosition.y}px)`,
              position: 'absolute',
              zIndex: 20,
              cursor: 'move'
            }}
            onMouseDown={(e) => handleDragStart(e, false)}
          >
            <div
              ref={textRef}
              className="px-2"
            >
              <p className="text-center font-bold drop-shadow-lg" style={{ fontSize: `${textSize}px`, color: captionColor }}>
                {captionText}
              </p>
            </div>
          </div>
        )}
        {!selectedBackgroundData && !selectedMemeData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-xl font-medium select-none">
            <span className="mb-2">Select a background and meme</span>
            <span>to see preview</span>
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
  );
} 