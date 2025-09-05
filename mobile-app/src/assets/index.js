// Assets configuration for MediTime Mobile App
// Logos et icônes disponibles

export const AppIcons = {
  // Logo principal de l'application
  main: require('./icon.png'),
  
  // Logos avec texte
  logo: require('./logo.png'),
  logoWhite: require('./logo_white.png'),
  
  // Icônes de pilules par niveau
  pills: {
    empty: require('./pills/0.00_pills.svg'),
    quarter: require('./pills/0.25_pills.svg'),
    half: require('./pills/0.50_pills.svg'),
    threeQuarter: require('./pills/0.75_pills.svg'),
    full: require('./pills/1.00_pills.svg'),
  },
};

// Fonction utilitaire pour obtenir l'icône de pilule selon le niveau
export const getPillIcon = (level) => {
  if (level <= 0) return AppIcons.pills.empty;
  if (level <= 0.25) return AppIcons.pills.quarter;
  if (level <= 0.5) return AppIcons.pills.half;
  if (level <= 0.75) return AppIcons.pills.threeQuarter;
  return AppIcons.pills.full;
};

export default AppIcons;
