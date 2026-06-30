export const COLORS = {
  'um-maize': '#FFCB05',
  'um-blue': '#00274C',
  'um-grey': '#333F48',
  'um-grey-dark-mode': '#9CA3AF',
  'status-open': '#22c55e',
  'status-closed': '#ef4444',
};

export const COLORBLIND_COLORS = {
  'um-maize': '#FFCB05',
  'um-blue': '#00274C',
  'um-grey': '#333F48',
  'um-grey-dark-mode': '#9CA3AF',
  'status-open': '#005AB5',
  'status-closed': '#8F0000',
};

export function getColor(colorName: keyof typeof COLORS, isColorBlindMode: boolean): string {
  if (isColorBlindMode && colorName in COLORBLIND_COLORS) {
    return COLORBLIND_COLORS[colorName as keyof typeof COLORBLIND_COLORS];
  }
  return COLORS[colorName];
}
