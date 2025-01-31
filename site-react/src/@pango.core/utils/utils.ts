import PRIMARY_COLORS from "../colors/colors";

const formatSectionName = (name: string): string => {
  if (!name) return '';

  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

function getHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function generateColorFromText(text: string): string {
  const hashCode = getHashCode(text);
  return PRIMARY_COLORS[hashCode % PRIMARY_COLORS.length];
}

export class HexColor {
  static fromHex(hexColor: string): string {
    let hex = hexColor.toUpperCase().replace("#", "");
    if (hex.length === 6) {
      hex = "FF" + hex;
    }
    return `#${hex}`;
  }
}

// utils/stringUtils.ts
export const capitalize = (input: string): string => {
  if (!input) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
};

export const titleCase = (text: string): string => {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getInitials = (input: string): string => {
  if (!input) return input;
  return input
    .trim()
    .split(/\s+/)
    .map(s => s.charAt(0))
    .slice(0, 2)
    .join('');
};


export { getHashCode, generateColorFromText, formatSectionName };