import React, {useEffect, useMemo, useState} from "react";

function isRecordingMode() {
  return new URLSearchParams(window.location.search).get("recording") === "1";
}

function safeTargetLabel(target) {
  const element = target?.closest?.("button, a, input, textarea, select, label");
  if (!element) {
    return "Action";
  }
  if (element instanceof HTMLInputElement) {
    if (element.type === "password") {
      return "Typing: protected field";
    }
    return "Typing: text field";
  }
  if (element instanceof HTMLTextAreaElement) {
    return "Typing: text area";
  }
  if (element instanceof HTMLSelectElement) {
    return "Selection changed";
  }
  if (element instanceof HTMLButtonElement) {
    const text = element.textContent?.trim();
    return text ? `Action: ${text.slice(0, 48)}` : "Action: button";
  }
  return "Action";
}

export default function RecordingCues() {
  const active = useMemo(isRecordingMode, []);
  const [ripples, setRipples] = useState([]);
  const [label, setLabel] = useState("Recording cues on");

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    function onPointerDown(event) {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      setRipples((items) => [...items.slice(-5), {id, x: event.clientX, y: event.clientY}]);
      setLabel(safeTargetLabel(event.target));
      window.setTimeout(() => {
        setRipples((items) => items.filter((item) => item.id !== id));
      }, 650);
    }

    function onInput(event) {
      setLabel(safeTargetLabel(event.target));
    }

    window.addEventListener("pointerdown", onPointerDown, {capture: true});
    window.addEventListener("input", onInput, {capture: true});
    window.addEventListener("change", onInput, {capture: true});
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, {capture: true});
      window.removeEventListener("input", onInput, {capture: true});
      window.removeEventListener("change", onInput, {capture: true});
    };
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <div className="recordingCues" aria-live="polite">
      <div className="recordingBadge">
        <span className="recordingDot" aria-hidden="true"/>
        Recording cues on
      </div>
      <div className="recordingLabel">{label}</div>
      {ripples.map((ripple) => (
        <span
          aria-hidden="true"
          className="recordingRipple"
          key={ripple.id}
          style={{left: ripple.x, top: ripple.y}}
        />
      ))}
    </div>
  );
}
