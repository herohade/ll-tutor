/// <reference types="vite/client" />

import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    empty?: PaletteColorOptions;
    first?: PaletteColorOptions;
    follow?: PaletteColorOptions;
  }

  interface PaletteOptions {
    empty?: PaletteColorOptions;
    first?: PaletteColorOptions;
    follow?: PaletteColorOptions;
  }

  interface SimplePaletteColorOptions {
    text?: string;
    main?: string;
    new?: string;
    recent?: string;
    old?: string;
  }
}
