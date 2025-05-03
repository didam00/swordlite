export function hsvToHex(h: number, s: number, v: number) {
  // HSV를 RGB로 변환
  let r, g, b;
  
  const i = Math.floor(h / 60) % 6;
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  
  switch (i) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
  }
  
  // RGB 값을 0-255 범위로 변환
  const rgb = {
      r: Math.round(r! * 255),
      g: Math.round(g! * 255),
      b: Math.round(b! * 255)
  };
  
  // RGB를 16진수로 변환 (Phaser의 setTint에 사용할 수 있는 형식)
  return (rgb.r << 16) + (rgb.g << 8) + rgb.b;
}