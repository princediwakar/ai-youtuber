// lib/visuals/themes.ts

// The new, structured Theme type
export interface Theme {
  name: string;
  fontFamily: string;
  page: {
    background: string;
  };
  text: {
    primary: string;
    secondary: string;
    onAccent: string;
  };
  button: {
    background: string;
    text: string;
  };
  feedback: {
    correct: string;
  };
}

// The full collection of renamed and restructured themes
export const themes: Record<string, Theme> = {
  // Original 'lightCoffee'
  // Original 'lightCoffee'
  CafeAuLait: {
    name: 'CafeAuLait',
    fontFamily: 'Poppins',
    page: { background: '#fff4e6' },
    text: {
      primary: '#3c2f2f', // This is our high-contrast dark brown
      secondary: 'rgba(60, 47, 47, 0.5)',
      onAccent: '#fff4e6',
    },
    button: {
      background: '#be9b7b',
      // ✅ FIX: Changed from light cream to the primary dark brown for max contrast.
      text: '#3c2f2f', 
    },
    feedback: { correct: '#854442' },
  },

  // Original 'warmPaper'
  VintageScroll: {
    name: 'VintageScroll',
    fontFamily: 'Poppins',
    page: { background: '#FFFCF2' },
    text: {
      primary: '#252422',
      secondary: 'rgba(37, 36, 34, 0.5)',
      onAccent: '#FFFCF2',
    },
    button: {
      background: '#EB5E28',
      text: '#FFFCF2',
    },
    feedback: { correct: '#252422' },
  },
  
  // Original 'desertBloom'
  CanyonSunset: {
    name: 'CanyonSunset',
    fontFamily: 'Poppins',
    page: { background: '#F4F1DE' },
    text: {
      primary: '#3D405B',
      secondary: 'rgba(61, 64, 91, 0.5)',
      onAccent: '#F4F1DE',
    },
    button: {
      background: '#E07A5F',
      text: '#F4F1DE',
    },
    // ✅ FIX: Replaced light green with the high-contrast primary text color.
    feedback: { correct: '#3D405B' },
  },

  // Original 'mistyRose'
  SakuraGrove: {
    name: 'SakuraGrove',
    fontFamily: 'Poppins',
    page: { background: '#FFF5F2' },
    text: {
      primary: '#064232',
      secondary: 'rgba(6, 66, 50, 0.55)',
      onAccent: '#FFF5F2',
    },
    button: {
      background: '#568F87',
      text: '#FFF5F2',
    },
    feedback: { correct: '#064232' },
  },

  // Original 'desertTwilight'
  CosmicDawn: {
    name: 'CosmicDawn',
    fontFamily: 'Poppins',
    page: { background: '#FFEAD8' },
    text: {
      primary: '#2A1458',
      secondary: 'rgba(42, 20, 88, 0.6)',
      onAccent: '#FFEAD8',
    },
    button: {
      background: '#9B177E',
      text: '#FFEAD8',
    },
    feedback: { correct: '#2A1458' },
  },

  // Original 'sorbetSplash'
  PastelPlayground: {
    name: 'PastelPlayground',
    fontFamily: 'Poppins',
    page: { background: '#FFF5CD' },
    text: {
      // ✅ FIX: Replaced light salmon text with the accessible dark brown color.
      primary: '#8B4538',
      // ✅ FIX: Adjusted secondary text to be a transparent version of the new primary.
      secondary: 'rgba(139, 69, 56, 0.6)',
      onAccent: '#FFF5CD', // Changed to lighter background for use on dark buttons
    },
    button: {
      background: '#B7E0FF',
      text: '#8B4538', // This accessible choice is now our primary text color.
    },
    // ✅ FIX: Replaced light salmon with the new high-contrast primary text color.
    feedback: { correct: '#8B4538' },
  },

  // Original 'oceanicDeep'
  EmeraldSea: {
    name: 'EmeraldSea',
    fontFamily: 'Poppins',
    page: { background: '#DDF4E7' },
    text: {
      primary: '#124170',
      secondary: 'rgba(18, 65, 112, 0.5)',
      onAccent: '#DDF4E7',
    },
    button: {
      background: '#26667F',
      text: '#DDF4E7',
    },
    // ✅ FIX: Replaced light green with the high-contrast primary text color.
    feedback: { correct: '#124170' },
  },
};