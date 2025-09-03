// lib/visuals/themes.ts

// The Theme interface remains the same
export interface Theme {
  name: string;
  fontFamily: string;
  page: {
    background: string | string[];
  };
  header: {
    background: string;
    text: string;
  };
  text: {
    primary: string;
    secondary: string;
    onAccent: string;
  };
  button: {
    background: string | string[];
    text: string;
    shadow: string;
  };
  feedback: {
    correct: string | string[];
  };
}


export const themes: Record<string, Theme> = {
  // --- Original Themes ---
  CafeAuLait: {
    name: 'CafeAuLait',
    fontFamily: 'Poppins',
    page: { background: '#fff4e6' },
    header: { background: 'rgba(60, 47, 47, 0.08)', text: '#3c2f2f' },
    text: { primary: '#3c2f2f', secondary: 'rgba(60, 47, 47, 0.5)', onAccent: '#fff4e6' },
    button: { background: '#be9b7b', text: '#FFFFFF', shadow: 'rgba(0,0,0,0.15)' },
    feedback: { correct: '#854442' },
  },
  
  VintageScroll: {
    name: 'VintageScroll',
    fontFamily: 'Poppins',
    page: { background: '#FFFCF2' },
    header: { background: 'rgba(37, 36, 34, 0.08)', text: '#252422' },
    text: { primary: '#252422', secondary: 'rgba(37, 36, 34, 0.5)', onAccent: '#FFFCF2' },
    button: { background: '#EB5E28', text: '#FFFCF2', shadow: 'rgba(0,0,0,0.2)' },
    feedback: { correct: '#252422' },
  },

  SakuraGrove: {
    name: 'SakuraGrove',
    fontFamily: 'Poppins',
    page: { background: '#FFF5F2' },
    header: { background: 'rgba(6, 66, 50, 0.08)', text: '#064232' },
    text: { primary: '#064232', secondary: 'rgba(6, 66, 50, 0.55)', onAccent: '#FFF5F2' },
    button: { background: '#568F87', text: '#FFF5F2', shadow: 'rgba(0,0,0,0.15)' },
    feedback: { correct: '#064232' },
  },
  
  // --- Gradient Themes ---
  CosmicDawn: {
    name: 'CosmicDawn',
    fontFamily: 'Poppins',
    page: { background: ['#2A1458', '#54226A', '#9B177E'] },
    header: { background: 'rgba(255, 255, 255, 0.1)', text: '#FFEAD8' },
    text: { primary: '#FFEAD8', secondary: 'rgba(255, 234, 216, 0.7)', onAccent: '#FFFFFF' },
    button: { background: ['#9B177E', '#7B1585'], text: '#FFFFFF', shadow: 'rgba(0, 0, 0, 0.3)' },
    feedback: { correct: ['#F7B801', '#F18701'] },
  },

  EmeraldSea: {
    name: 'EmeraldSea',
    fontFamily: 'Poppins',
    page: { background: ['#0A3B4E', '#26667F', '#124170'] },
    header: { background: 'rgba(221, 244, 231, 0.15)', text: '#DDF4E7' },
    text: { primary: '#DDF4E7', secondary: 'rgba(221, 244, 231, 0.7)', onAccent: '#FFFFFF' },
    button: { background: ['#26667F', '#1F566A'], text: '#DDF4E7', shadow: 'rgba(0, 0, 0, 0.3)' },
    feedback: { correct: ['#4CAF50', '#81C784'] },
  },

  // --- 🎨 REFINED THEME ---
  CanyonSunset: {
    name: 'CanyonSunset',
    fontFamily: 'Poppins',
    page: { background: ['#F4F1DE', '#F1E9CB'] }, // Subtle gradient background
    header: { background: 'rgba(61, 64, 91, 0.08)', text: '#3D405B' },
    text: { primary: '#3D405B', secondary: 'rgba(61, 64, 91, 0.5)', onAccent: '#F4F1DE' },
    button: { background: '#E07A5F', text: '#F4F1DE', shadow: 'rgba(0,0,0,0.15)' },
    feedback: { correct: ['#3D405B', '#2C2E40'] }, // Added gradient to feedback
  },

  // --- ✨ NEW THEMES ---

  // 2. Sunset Beach 🌴
  SunsetBeach: {
    name: 'SunsetBeach',
    fontFamily: 'Poppins',
    page: { background: ['#FFF7E0', '#FFDDC1'] },
    header: { background: 'rgba(0, 77, 64, 0.07)', text: '#004D40' },
    text: { primary: '#004D40', secondary: 'rgba(0, 77, 64, 0.6)', onAccent: '#FFFFFF' },
    button: { background: ['#FF8C42', '#FF6347'], text: '#FFFFFF', shadow: 'rgba(139, 69, 19, 0.25)' },
    feedback: { correct: ['#2196F3', '#1976D2'] },
  },
  
  // 3. Enchanted Forest 🌲
  EnchantedForest: {
    name: 'EnchantedForest',
    fontFamily: 'Poppins',
    page: { background: '#0A0F0D' },
    header: { background: 'rgba(224, 239, 230, 0.1)', text: '#E0EFE6' },
    text: { primary: '#E0EFE6', secondary: 'rgba(224, 239, 230, 0.7)', onAccent: '#0A0F0D' },
    button: { background: ['#2E6B4F', '#4A936F'], text: '#E0EFE6', shadow: 'rgba(0, 0, 0, 0.4)' },
    feedback: { correct: ['#FFD700', '#FFC300'] },
  },

  // 4. Minty Fresh 🧼
  MintyFresh: {
    name: 'MintyFresh',
    fontFamily: 'Poppins',
    page: { background: '#F8F9FA' },
    header: { background: 'rgba(33, 37, 41, 0.05)', text: '#212529' },
    text: { primary: '#212529', secondary: 'rgba(33, 37, 41, 0.6)', onAccent: '#FFFFFF' },
    button: { background: ['#64DDBB', '#48BCA8'], text: '#FFFFFF', shadow: 'rgba(0, 0, 0, 0.1)' },
    feedback: { correct: ['#004AAD', '#003580'] },
  },
};