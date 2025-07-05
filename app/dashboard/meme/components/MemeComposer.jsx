import React, { useRef, useState } from 'react';

export default function MemeComposer({ video, background }) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ width: 200, height: 200 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  // Drag logic
  const onMouseDown = (e) => {
    dragging.current = true;
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    setPosition({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };
  const onMouseUp = () => {
    dragging.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  // Simple resize (bottom-right corner)
  const onResizeMouseDown = (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    const onResizeMove = (moveEvent) => {
      setSize({
        width: Math.max(50, startWidth + (moveEvent.clientX - startX)),
        height: Math.max(50, startHeight + (moveEvent.clientY - startY)),
      });
    };
    const onResizeUp = () => {
      document.removeEventListener('mousemove', onResizeMove);
      document.removeEventListener('mouseup', onResizeUp);
    };
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeUp);
  };

  return (
    <div className="relative mx-auto my-8" style={{ width: 500, height: 500, background: '#eee', borderRadius: 16, overflow: 'hidden' }}>
      <img src={background} alt="Background" className="absolute inset-0 w-full h-full object-cover" />
      <div
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          cursor: 'move',
          zIndex: 2,
        }}
        onMouseDown={onMouseDown}
      >
        <video
          src={video.src}
          controls
          autoPlay
          loop
          style={{ width: '100%', height: '100%', background: 'transparent', pointerEvents: 'none' }}
        />
        {/* Resize handle */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 16,
            height: 16,
            background: '#fff',
            border: '1px solid #aaa',
            borderRadius: 4,
            cursor: 'nwse-resize',
            zIndex: 3,
          }}
          onMouseDown={onResizeMouseDown}
        />
      </div>
    </div>
  );
} 