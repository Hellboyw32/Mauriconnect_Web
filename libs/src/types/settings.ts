// Defined here (not imported from the client) because this file is shared
// with the api, which has no 'src/theme' path to resolve - client/src/theme
// re-exports these from here to keep its existing imports working.
export type ColorPreset = 'blue' | 'green' | 'indigo' | 'purple';

export type Contrast = 'normal' | 'high';

export type Direction = 'ltr' | 'rtl';

export type PaletteMode = 'dark' | 'light';

export type Layout = 'horizontal' | 'vertical';

export type NavColor = 'blend-in' | 'discrete' | 'evident';

export interface Settings {
  colorPreset?: ColorPreset;
  contrast?: Contrast;
  direction?: Direction;
  layout?: Layout;
  navColor?: NavColor;
  paletteMode?: PaletteMode;
  responsiveFontSizes?: boolean;
  stretch?: boolean;
}
