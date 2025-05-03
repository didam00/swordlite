/** random sign */

export default function $s(): number {
  return Math.random() < 0.5 ? -1 : 1;
}