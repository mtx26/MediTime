import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { AppIcons, getPillIcon } from '../assets';

/**
 * Composant pour afficher les icônes de pilules selon le niveau
 * @param {number} level - Niveau de la pilule (0.0 à 1.0)
 * @param {number} size - Taille de l'icône (défaut: 24)
 * @param {object} style - Styles supplémentaires
 */
export const PillIcon = ({ level = 1.0, size = 24, style, ...props }) => {
  const iconSource = getPillIcon(level);
  
  return (
    <Image
      source={iconSource}
      style={[
        styles.pillIcon,
        { width: size, height: size },
        style
      ]}
      resizeMode="contain"
      {...props}
    />
  );
};

/**
 * Composant pour afficher le logo MediTime
 * @param {boolean} white - Utiliser la version blanche du logo
 * @param {number} size - Taille du logo
 * @param {object} style - Styles supplémentaires
 */
export const MediTimeLogo = ({ white = false, size = 120, style, ...props }) => {
  const logoSource = white ? AppIcons.logoWhite : AppIcons.logo;
  
  return (
    <Image
      source={logoSource}
      style={[
        styles.logo,
        { width: size, height: size },
        style
      ]}
      resizeMode="contain"
      {...props}
    />
  );
};

/**
 * Composant pour afficher l'icône principale de l'app
 * @param {number} size - Taille de l'icône
 * @param {object} style - Styles supplémentaires
 */
export const AppIcon = ({ size = 60, style, ...props }) => {
  return (
    <Image
      source={AppIcons.main}
      style={[
        styles.appIcon,
        { width: size, height: size },
        style
      ]}
      resizeMode="contain"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  pillIcon: {
    tintColor: undefined, // Permet de garder les couleurs originales du SVG
  },
  logo: {
    // Styles par défaut pour le logo
  },
  appIcon: {
    borderRadius: 8, // Coins arrondis pour l'icône d'app
  },
});

export default { PillIcon, MediTimeLogo, AppIcon };
