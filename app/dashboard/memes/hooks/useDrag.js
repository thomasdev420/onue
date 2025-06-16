import { useRef, useCallback } from "react";

export default function useDrag(memeRef, textRef, previewRef, memePosition, setMemePosition, textPosition, setTextPosition) {
  const dragState = useRef({ isDragging: false, isMeme: false, start: { x: 0, y: 0 }, lastPos: { x: 0, y: 0 } });

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
  }, [memePosition, textPosition, memeRef, textRef]);

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
  }, [setMemePosition, setTextPosition, previewRef]);

  const handleDragEnd = useCallback(() => {
    if (dragState.current.isDragging) {
      const pos = dragState.current.isMeme ? memePosition : textPosition;
      dragState.current.lastPos = { x: pos.x, y: pos.y };
      dragState.current.isDragging = false;
    }
  }, [memePosition, textPosition]);

  return { handleDragStart, handleDragMove, handleDragEnd };
} 