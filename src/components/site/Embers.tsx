const EMBERS = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 3 + ((i * 7) % 6),
  duration: 9 + ((i * 13) % 12),
  delay: -((i * 17) % 20),
}));

export function Embers() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="ember"
          style={{
            left: `${e.left}%`,
            bottom: "-20px",
            width: e.size,
            height: e.size,
            animationDuration: `${e.duration}s`,
            animationDelay: `${e.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
