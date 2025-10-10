// lib/visuals/themes.ts

// The Theme interface is updated to include 'incorrect'
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
    incorrect: string | string[]; // ADDED: Incorrect feedback color
  };
}


export const themes: Record<string, Theme> = {
  // --- Original Themes ---
  
  VintageScroll: {
    name: 'VintageScroll',
    fontFamily: 'Poppins',
    page: { background: '#FFFCF2' },
    header: { background: 'rgba(37, 36, 34, 0.08)', text: '#252422' },
    text: { primary: '#252422', secondary: 'rgba(37, 36, 34, 0.5)', onAccent: '#FFFCF2' },
    button: { background: '#EB5E28', text: '#FFFCF2', shadow: 'rgba(0,0,0,0.2)' },
    feedback: { 
        correct: '#252422',
        incorrect: '#9D0208' // Added
    },
  },

  SakuraGrove: {
    name: 'SakuraGrove',
    fontFamily: 'Poppins',
    page: { background: '#FFF5F2' },
    header: { background: 'rgba(6, 66, 50, 0.08)', text: '#064232' },
    text: { primary: '#064232', secondary: 'rgba(6, 66, 50, 0.55)', onAccent: '#FFF5F2' },
    button: { background: '#568F87', text: '#FFF5F2', shadow: 'rgba(0,0,0,0.15)' },
    feedback: { 
        correct: '#064232',
        incorrect: '#D00000' // Added
    },
  },
  
  // --- Gradient Themes ---
  CosmicDawn: {
    name: 'CosmicDawn',
    fontFamily: 'Poppins',
    page: { background: ['#2A1458', '#54226A', '#9B177E'] },
    header: { background: 'rgba(255, 255, 255, 0.1)', text: '#FFEAD8' },
    text: { primary: '#FFEAD8', secondary: 'rgba(255, 234, 216, 0.7)', onAccent: '#FFFFFF' },
    button: { background: ['#9B177E', '#7B1585'], text: '#FFFFFF', shadow: 'rgba(0, 0, 0, 0.3)' },
    feedback: { 
        correct: ['#F7B801', '#F18701'],
        incorrect: ['#FF6F6F', '#E63946'] // Added
    },
  },


  // --- 🎨 REFINED THEME ---
  CanyonSunset: {
    name: 'CanyonSunset',
    fontFamily: 'Poppins',
    page: { background: ['#F4F1DE', '#F1E9CB'] }, // Subtle gradient background
    header: { background: 'rgba(61, 64, 91, 0.08)', text: '#3D405B' },
    text: { primary: '#3D405B', secondary: 'rgba(61, 64, 91, 0.5)', onAccent: '#F4F1DE' },
    button: { background: '#E07A5F', text: '#F4F1DE', shadow: 'rgba(0,0,0,0.15)' },
    feedback: { 
        correct: ['#3D405B', '#2C2E40'], // Added gradient to feedback
        incorrect: ['#C1121F', '#8C0000'] // Added
    },
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
    feedback: { 
        correct: ['#2196F3', '#1976D2'],
        incorrect: ['#EF476F', '#D62828'] // Added
    },
  },
  
  // 3. Enchanted Forest 🌲
  EnchantedForest: {
    name: 'EnchantedForest',
    fontFamily: 'Poppins',
    page: { background: '#0A0F0D' },
    header: { background: 'rgba(224, 239, 230, 0.1)', text: '#E0EFE6' },
    text: { primary: '#E0EFE6', secondary: 'rgba(224, 239, 230, 0.7)', onAccent: '#0A0F0D' },
    button: { background: ['#2E6B4F', '#4A936F'], text: '#E0EFE6', shadow: 'rgba(0, 0, 0, 0.4)' },
    feedback: { 
        correct: ['#FFD700', '#FFC300'],
        incorrect: ['#990011', '#B90022'] // Added
    },
  },

  // 4. Minty Fresh 🧼
  MintyFresh: {
    name: 'MintyFresh',
    fontFamily: 'Poppins',
    page: { background: '#F8F9FA' },
    header: { background: 'rgba(33, 37, 41, 0.05)', text: '#212529' },
    text: { primary: '#212529', secondary: 'rgba(33, 37, 41, 0.6)', onAccent: '#FFFFFF' },
    button: { background: ['#64DDBB', '#48BCA8'], text: '#FFFFFF', shadow: 'rgba(0, 0, 0, 0.1)' },
    feedback: { 
        correct: ['#28A745', '#20C997'],
        incorrect: ['#DC3545', '#C82333'] // Added
    },
  },

  // --- 🚀 PREMIUM VIDEO-OPTIMIZED THEMES ---

  // 6. Sunset Vibes 🌅 - Warm and engaging
  SunsetVibes: {
    name: 'SunsetVibes',
    fontFamily: 'Poppins',
    page: { background: ['#ff9a8b', '#a8e6cf'] },
    header: { background: 'rgba(255, 255, 255, 0.2)', text: '#2c3e50' },
    text: { primary: '#2c3e50', secondary: 'rgba(44, 62, 80, 0.7)', onAccent: '#ffffff' },
    button: { background: ['#ff6b6b', '#4ecdc4'], text: '#ffffff', shadow: 'rgba(255, 107, 107, 0.3)' },
    feedback: { 
        correct: ['#f39c12', '#e67e22'],
        incorrect: ['#e74c3c', '#c0392b'] // Added
    },
  },




  // 9. Golden Hour 🌟 - Premium, luxurious feel
  GoldenHour: {
    name: 'GoldenHour',
    fontFamily: 'Poppins',
    page: { background: ['#f7971e', '#ffd200'] },
    header: { background: 'rgba(0, 0, 0, 0.1)', text: '#2c3e50' },
    text: { primary: '#2c3e50', secondary: 'rgba(44, 62, 80, 0.8)', onAccent: '#ffffff' },
    button: { background: ['#e74c3c', '#c0392b'], text: '#ffffff', shadow: 'rgba(231, 76, 60, 0.3)' },
    feedback: { 
        correct: ['#27ae60', '#2ecc71'],
        incorrect: ['#8e44ad', '#9b59b6'] // Added (using a dark contrast color)
    },
  },

  // 10. Arctic Glow ❄️ - Clean, modern, crisp
  ArcticGlow: {
    name: 'ArcticGlow',
    fontFamily: 'Poppins',
    page: { background: ['#e0eafc', '#cfdef3'] },
    header: { background: 'rgba(52, 73, 94, 0.08)', text: '#34495e' },
    text: { primary: '#2c3e50', secondary: 'rgba(44, 62, 80, 0.7)', onAccent: '#ffffff' },
    button: { background: ['#3498db', '#2980b9'], text: '#ffffff', shadow: 'rgba(52, 152, 219, 0.3)' },
    feedback: {
        correct: ['#1abc9c', '#16a085'],
        incorrect: ['#e67e22', '#d35400'] // Added
    },
  },

  // --- 🎯 2025 EDUCATIONAL RETENTION-OPTIMIZED THEMES ---
  // Research: Avoid pure black/white, reduce blue light, avoid neon saturation
  // Focus: Readability + Eye comfort for 30-60 sec watch time

  // 11. FocusBlue 🎓 - Soft blue reduces eye strain, boosts concentration
  FocusBlue: {
    name: 'FocusBlue',
    fontFamily: 'Poppins',
    page: { background: ['#E8F4F8', '#D6EAF8'] }, // Soft blue backdrop (not harsh)
    header: { background: 'rgba(52, 73, 94, 0.06)', text: '#2C3E50' },
    text: { primary: '#2C3E50', secondary: 'rgba(44, 62, 80, 0.7)', onAccent: '#FFFFFF' }, // Dark gray, not black
    button: { background: ['#FF8C42', '#FF6F3C'], text: '#FFFFFF', shadow: 'rgba(255, 140, 66, 0.3)' }, // Orange for CTA
    feedback: {
        correct: ['#27AE60', '#2ECC71'], // Green
        incorrect: ['#E74C3C', '#C0392B'] // Red
    },
  },

  // 12. LearnGreen 📚 - Green promotes calm, boosts focus, easy on eyes
  LearnGreen: {
    name: 'LearnGreen',
    fontFamily: 'Poppins',
    page: { background: ['#E8F8F5', '#D5F4E6'] }, // Soft green (low wavelength, natural calm)
    header: { background: 'rgba(22, 160, 133, 0.06)', text: '#16A085' },
    text: { primary: '#1E3A32', secondary: 'rgba(30, 58, 50, 0.7)', onAccent: '#FFFFFF' },
    button: { background: ['#F39C12', '#E67E22'], text: '#FFFFFF', shadow: 'rgba(243, 156, 18, 0.3)' }, // Orange energy
    feedback: {
        correct: ['#27AE60', '#2ECC71'],
        incorrect: ['#E74C3C', '#C0392B']
    },
  },


  // 14. SoftYellow 💡 - Muted yellow for alertness without eye strain
  SoftYellow: {
    name: 'SoftYellow',
    fontFamily: 'Poppins',
    page: { background: ['#FFFDE7', '#FFF9C4'] }, // Soft yellow (not neon)
    header: { background: 'rgba(251, 192, 45, 0.1)', text: '#F57C00' },
    text: { primary: '#4E342E', secondary: 'rgba(78, 52, 46, 0.7)', onAccent: '#FFFFFF' },
    button: { background: ['#FF6F00', '#E65100'], text: '#FFFFFF', shadow: 'rgba(255, 111, 0, 0.3)' }, // Orange CTA
    feedback: {
        correct: ['#388E3C', '#4CAF50'],
        incorrect: ['#D32F2F', '#C62828']
    },
  },

  // 15. DeepPurple 🎯 - Authoritative for exam prep, high contrast but readable
  DeepPurple: {
    name: 'DeepPurple',
    fontFamily: 'Poppins',
    page: { background: ['#F3E5F5', '#E1BEE7'] }, // Soft purple
    header: { background: 'rgba(123, 31, 162, 0.08)', text: '#6A1B9A' },
    text: { primary: '#4A148C', secondary: 'rgba(74, 20, 140, 0.7)', onAccent: '#FFFFFF' },
    button: { background: ['#FF6F00', '#F57C00'], text: '#FFFFFF', shadow: 'rgba(255, 111, 0, 0.3)' },
    feedback: {
        correct: ['#4CAF50', '#66BB6A'],
        incorrect: ['#E53935', '#C62828']
    },
  },
};