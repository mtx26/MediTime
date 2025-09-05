import React from 'react';
import useI18nMetadata from '../../hooks/useI18nMetadata';

/**
 * Composant simplifié pour les métadonnées internationalisées avec React 19
 * Utilise le hook unifié useI18nMetadata
 */
const I18nHead = ({ title, description, path = '/', addLanguageToUrl = true, customMeta = {} }) => {
  // Le hook fait tout le travail
  useI18nMetadata({ 
    title, 
    description, 
    path, 
    addLanguageToUrl, 
    customMeta 
  });

  // Avec React 19, nous n'avons plus besoin de retourner du JSX pour les métadonnées
  // Le hook met à jour directement le DOM
  return null;
};

export default I18nHead;
