"use client";

/**
 * The thin "+" registration marks Lusion places at the corners of its WebGL
 * windows. Renders one at each corner of the parent (which must be relative).
 */
export default function CornerMarks({
  color = "currentColor",
  inset = 10,
  size = 14,
}: {
  color?: string;
  inset?: number;
  size?: number;
}) {
  const positions = [
    { top: inset, left: inset },
    { top: inset, right: inset },
    { bottom: inset, left: inset },
    { bottom: inset, right: inset },
  ];
  return (
    <>
      {positions.map((pos, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute opacity-70"
          style={{ ...pos, width: size, height: size }}
        >
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              width: "100%",
              height: 1,
              background: color,
              transform: "translateY(-50%)",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              height: "100%",
              width: 1,
              background: color,
              transform: "translateX(-50%)",
            }}
          />
        </span>
      ))}
    </>
  );
}
