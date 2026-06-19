import { useEffect } from 'react';

const RAINBOW = ['#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787', '#FF69B4'];
const MIN_DIST = 12;

export function useRainbowCursorTrail() {
  useEffect(() => {
    let colorIndex = 0;
    let lastX = -999;
    let lastY = -999;

    const handleMouseMove = (e) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (dx * dx + dy * dy < MIN_DIST * MIN_DIST) return;
      lastX = e.clientX;
      lastY = e.clientY;

      const color = RAINBOW[colorIndex % RAINBOW.length];
      colorIndex++;

      const dot = document.createElement('div');
      const size = 7 + Math.random() * 5;
      dot.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        box-shadow: 0 0 8px 3px ${color};
        pointer-events: none;
        z-index: 99999;
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
        transition: opacity 0.55s ease-out, transform 0.55s ease-out;
      `;

      document.body.appendChild(dot);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          dot.style.opacity = '0';
          dot.style.transform = 'translate(-50%, -50%) scale(0.2)';
        });
      });

      setTimeout(() => dot.parentNode?.removeChild(dot), 650);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
}
