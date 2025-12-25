/**
 * Script pour analyser tous les retours backend, traduire les messages FR→EN
 * et générer un fichier JSON détaillé pour validation avant ajout des clés i18n
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { v2 as Translate } from '@google-cloud/translate';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const translate = new Translate.Translate({
  key: process.env.VITE_GOOGLE_TRANSLATE_API_KEY,
});

// Mapping fichier → catégorie suggérée
const FILE_TO_CATEGORY = {
  'gemini.py': 'ai',
  'ics.py': 'ics',
  'invitations.py': 'invitations',
  'notifications.py': 'notifications',
  'pdf.py': 'pdf',
  'personnal_calendar.py': 'calendar',
  'personnal_medicines.py': 'boxes',
  'shared_users.py': 'shared_calendar',
  'shared_users_medicines.py': 'shared_boxes',
  'tokens.py': 'tokens',
  'tokens_medicines.py': 'shared_boxes',
  'user.py': 'user',
  'log.py': 'logs',
  'status.py': 'status'
};

/**
 * Détecte tous les retours de type success_response, error_response, warning_response
 */
function analyzeBackendFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const responses = [];

  // Pattern pour détecter les response functions avec leurs paramètres
  const responsePattern = /(success_response|error_response|warning_response)\s*\(/g;
  
  let match;
  while ((match = responsePattern.exec(content)) !== null) {
    const responseType = match[1];
    const startPos = match.index;
    
    // Trouver le numéro de ligne
    const lineNumber = content.substring(0, startPos).split('\n').length;
    
    // Extraire le bloc de code de cette response (jusqu'à la parenthèse fermante)
    let blockEnd = startPos;
    let parenCount = 1;
    let inString = false;
    let stringChar = null;
    
    for (let i = match.index + match[0].length; i < content.length; i++) {
      const char = content[i];
      const prevChar = i > 0 ? content[i - 1] : '';
      
      // Gérer les strings
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = null;
        }
      }
      
      // Compter les parenthèses seulement hors strings
      if (!inString) {
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
        
        if (parenCount === 0) {
          blockEnd = i;
          break;
        }
      }
    }
    
    const block = content.substring(startPos, blockEnd + 1);
    
    // Extraire code="..."
    const codeMatch = block.match(/code\s*=\s*["']([^"']+)["']/);
    const code = codeMatch ? codeMatch[1] : null;
    
    // Extraire message="..." (gère les apostrophes échappées et non-échappées)
    let message = null;
    const messageMatchDouble = block.match(/message\s*=\s*"([^"]*)"/);
    const messageMatchSingle = block.match(/message\s*=\s*'([^']*)'/);
    
    if (messageMatchDouble) {
      message = messageMatchDouble[1];
    } else if (messageMatchSingle) {
      message = messageMatchSingle[1];
    }
    
    // Vérifier si i18n_key existe déjà
    const hasI18nKey = /i18n_key\s*=/.test(block);
    
    if (code && message) {
      const category = path.basename(filePath).replace('.py', '');
      const suggestedCategory = FILE_TO_CATEGORY[fileName] || category;
      
      responses.push({
        file: fileName,
        line: lineNumber,
        category: category,
        suggestedCategory: suggestedCategory,
        code: code,
        responseType: responseType,
        messageFr: message,
        messageEn: null, // Sera rempli par la traduction
        hasI18nKey: hasI18nKey,
        context: {
          isError: responseType === 'error_response',
          isWarning: responseType === 'warning_response',
          isSuccess: responseType === 'success_response'
        }
      });
    }
  }
  
  return responses;
}

/**
 * Traduit un texte du français vers l'anglais
 */
async function translateText(text) {
  try {
    const [translation] = await translate.translate(text, 'en');
    return translation;
  } catch (error) {
    console.error(`❌ Erreur traduction: ${text.substring(0, 30)}...`, error.message);
    return text; // Retourner le texte original en cas d'erreur
  }
}

/**
 * Analyse tous les fichiers de routes
 */
async function analyzeAllRoutes() {
  console.log('🔍 Analyse des fichiers backend...\n');
  
  const routesDir = path.join(__dirname, '..', '..', 'backend', 'app', 'routes');
  const files = fs.readdirSync(routesDir)
    .filter(f => f.endsWith('.py') && f !== '__init__.py');
  
  let allResponses = [];
  
  // Analyser chaque fichier
  for (const file of files) {
    const filePath = path.join(routesDir, file);
    console.log(`📄 Analyse de ${file}...`);
    
    const responses = analyzeBackendFile(filePath);
    allResponses = allResponses.concat(responses);
    
    console.log(`   ✅ ${responses.length} réponses détectées`);
  }
  
  console.log(`\n📊 Total: ${allResponses.length} réponses trouvées`);
  console.log('🌍 Traduction des messages...\n');
  
  // Traduire tous les messages
  for (let i = 0; i < allResponses.length; i++) {
    const response = allResponses[i];
    
    process.stdout.write(`   [${i + 1}/${allResponses.length}] ${response.file}:${response.line} - ${response.code}...`);
    
    response.messageEn = await translateText(response.messageFr);
    
    // Petit délai pour éviter de surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 100));
    
    process.stdout.write(` ✅\n`);
  }
  
  // Sauvegarder le résultat
  const outputPath = path.join(__dirname, 'output', 'backend_analysis.json');
  
  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalResponses: allResponses.length,
      filesAnalyzed: files.length,
      description: 'Analyse complète des réponses backend avec traductions FR→EN'
    },
    responses: allResponses
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`\n✅ Analyse terminée !`);
  console.log(`📁 Fichier généré: ${outputPath}`);
  console.log(`\n📊 Statistiques:`);
  console.log(`   - Fichiers analysés: ${files.length}`);
  console.log(`   - Réponses détectées: ${allResponses.length}`);
  console.log(`   - Avec i18n_key: ${allResponses.filter(r => r.hasI18nKey).length}`);
  console.log(`   - Sans i18n_key: ${allResponses.filter(r => !r.hasI18nKey).length}`);
  
  // Statistiques par type
  const byType = {
    success: allResponses.filter(r => r.context.isSuccess).length,
    error: allResponses.filter(r => r.context.isError).length,
    warning: allResponses.filter(r => r.context.isWarning).length
  };
  
  console.log(`\n📈 Par type:`);
  console.log(`   - Success: ${byType.success}`);
  console.log(`   - Error: ${byType.error}`);
  console.log(`   - Warning: ${byType.warning}`);
}

// Exécution
analyzeAllRoutes().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
