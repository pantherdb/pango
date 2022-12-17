import { MatColors } from '@pango/mat-colors';

export function getColor(color: string, hue: string | number) {
    const palette = MatColors.getColor(color);
    if (palette) {
        return palette[hue];
    }

    return null;
}
