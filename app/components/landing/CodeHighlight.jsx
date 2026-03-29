'use client';

/**
 * Lightweight syntax coloring for landing code blocks (no extra deps).
 */

export function HighlightBash({ code, className = '' }) {
  const lines = code.split('\n');
  return (
    <code className={`block whitespace-pre-wrap break-words ${className}`}>
      {lines.map((line, i) => (
        <span key={i} className="block">
          {i > 0 ? '\n' : null}
          <BashLine line={line} />
        </span>
      ))}
    </code>
  );
}

function BashLine({ line }) {
  const parts = [];
  let key = 0;
  const re = /('(?:\\.|[^'])*')|("(?:\\.|[^"])*")|(\bcurl\b)|(-[a-zA-Z]\s*)|(https?:\/\/[^\s\\]+)/g;
  let last = 0;
  let m;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) {
      parts.push(
        <span key={key++} className="text-slate-300">
          {line.slice(last, m.index)}
        </span>,
      );
    }
    const chunk = m[0];
    if (m[3]) {
      parts.push(
        <span key={key++} className="text-cyan-400">
          {chunk}
        </span>,
      );
    } else if (m[4]) {
      parts.push(
        <span key={key++} className="text-amber-400">
          {chunk}
        </span>,
      );
    } else if (m[5]) {
      parts.push(
        <span key={key++} className="text-sky-400">
          {chunk}
        </span>,
      );
    } else if (m[1] || m[2]) {
      parts.push(
        <span key={key++} className="text-emerald-400">
          {chunk}
        </span>,
      );
    } else {
      parts.push(
        <span key={key++} className="text-slate-300">
          {chunk}
        </span>,
      );
    }
    last = m.index + chunk.length;
  }
  if (last < line.length) {
    parts.push(
      <span key={key++} className="text-slate-300">
        {line.slice(last)}
      </span>,
    );
  }
  if (!parts.length) {
    return <span className="text-slate-300">{line}</span>;
  }
  return parts;
}

export function HighlightJson({ text, className = '' }) {
  const parts = [];
  let key = 0;
  const re =
    /("(?:\\.|[^"\\])*")|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+\.?\d*(?:e[+-]?\d+)?)/gi;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(
        <span key={key++} className="text-slate-400">
          {text.slice(last, m.index)}
        </span>,
      );
    }
    const chunk = m[0];
    if (m[1]) {
      parts.push(
        <span key={key++} className="text-emerald-400">
          {chunk}
        </span>,
      );
    } else if (m[2]) {
      parts.push(
        <span key={key++} className="text-amber-300">
          {chunk}
        </span>,
      );
    } else if (m[3]) {
      parts.push(
        <span key={key++} className="text-cyan-300">
          {chunk}
        </span>,
      );
    }
    last = m.index + chunk.length;
  }
  if (last < text.length) {
    parts.push(
      <span key={key++} className="text-slate-400">
        {text.slice(last)}
      </span>,
    );
  }
  return (
    <code className={`block whitespace-pre font-mono text-[11px] leading-relaxed sm:text-sm ${className}`}>
      {parts.length ? parts : text}
    </code>
  );
}
