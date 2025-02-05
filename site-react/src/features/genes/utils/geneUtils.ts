export const calculateFontSize = (text: string, maxLength = 100): number => {
  const baseSize = 48 // Starting font size (equivalent to text-5xl)
  const minSize = 14
  return Math.max(minSize, baseSize * (1 - (text.length / maxLength) * 0.7))
}
