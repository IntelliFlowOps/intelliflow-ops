import { useEffect, useState } from "react";

export default function TypewriterText({ text, speed = 8, onComplete }) {
  const [displayedCount, setDisplayedCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(function () {
    if (!text) return;
    setDisplayedCount(0);
    setDone(false);
    var i = 0;
    var interval = setInterval(function () {
      i++;
      setDisplayedCount(i);
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        if (onComplete) onComplete();
      }
    }, speed);
    return function () { clearInterval(interval); };
  }, [text, speed]);

  return (
    <span>
      {text.slice(0, displayedCount)}
      {!done && <span className="cursor-blink inline-block w-[2px] h-[1em] ml-[1px] align-text-bottom bg-current opacity-60" />}
    </span>
  );
}
