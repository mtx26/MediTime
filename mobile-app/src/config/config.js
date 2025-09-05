import Constants from 'expo-constants';

// Configuration de l'API selon l'environnement
const ENV = {
  dev: {
    API_URL: 'http://localhost:5000', // URL locale pour le développement
  },
  staging: {
    API_URL: 'https://your-staging-api.com', // URL de staging
  },
  prod: {
    API_URL: 'https://your-production-api.com', // URL de production
  }
};

const getEnvVars = (env = Constants.expoConfig?.releaseChannel) => {
  // Si pas de release channel défini, on est en développement
  if (__DEV__) {
    return ENV.dev;
  } else if (env === 'staging') {
    return ENV.staging;
  } else {
    return ENV.prod;
  }
};

export default getEnvVars();
