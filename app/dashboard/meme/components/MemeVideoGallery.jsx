import React from 'react';

export default function MemeVideoGallery({ videos, onSelect, selectedVideo }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-2">Pick a Meme Video</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className={`border-2 rounded-lg p-1 cursor-pointer transition-all duration-150 ${selectedVideo?.id === video.id ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300'}`}
            onClick={() => onSelect(video)}
          >
            <video
              src={video.src}
              controls
              className="w-full h-32 object-contain bg-black rounded"
              style={{ background: 'transparent' }}
            />
            <div className="text-xs text-center mt-1 text-gray-700">{video.alt}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 