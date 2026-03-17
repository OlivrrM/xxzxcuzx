import { useEffect, useState } from "react";
import clickMeGif from "../assets/download.gif";

export default function CursorGifHover() {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const getDownloadButtonFromEvent = (event) => {
      if (!event.target) return null;
      return event.target.closest?.(".download.button");
    };

    const onPointerMove = (event) => {
      const hit = getDownloadButtonFromEvent(event);
      if (hit) {
        setVisible(true);
        setPosition({ x: event.clientX, y: event.clientY });
      } else {
        setVisible(false);
      }
    };

    const onPointerLeaveDocument = () => {
      setVisible(false);
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerleave", onPointerLeaveDocument);

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeaveDocument);
    };
  }, []);

  if (!visible) return null;

  // Offset so the gif appears slightly above-right of the cursor
  const left = position.x + 15;
  const top = position.y - 35;

  return (
    <img
      src={clickMeGif}
      alt="Hover"
      aria-hidden="true"
      className="pointer-events-none fixed z-[9999] w-7 h-auto"
      style={{ left, top, transform: "translate(0, 0)" }}
    />
  );
}
