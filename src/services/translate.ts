const API_KEY = 'AIzaSyDzooSr4rIxwWiAZsox8841PvX6vljIfd8';
const ENDPOINT = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;

type NestedObject = { [key: string]: string | NestedObject };

// Helper to flatten an object so we have an array of strings to translate
export const flattenObject = (obj: NestedObject, prefix = ''): { [key: string]: string } => {
  return Object.keys(obj).reduce((acc: { [key: string]: string }, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k] as NestedObject, pre + k));
    } else {
      acc[pre + k] = String(obj[k]);
    }
    return acc;
  }, {});
};

// Helper to unflatten the key-value map back into nested object
export const unflattenObject = (data: { [key: string]: string }): NestedObject => {
  const result: any = {};
  for (const key in data) {
    const keys = key.split('.');
    let current = result;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (i === keys.length - 1) {
        current[k] = data[key];
      } else {
        current[k] = current[k] || {};
        current = current[k];
      }
    }
  }
  return result;
};

export const translateDictionary = async (
  baseDictionary: NestedObject,
  targetLanguage: string
): Promise<NestedObject> => {
  try {
    const flatMap = flattenObject(baseDictionary);
    const keys = Object.keys(flatMap);
    const values = Object.values(flatMap);

    // Google Translate API allows max 128 strings per request.
    const CHUNK_SIZE = 100;
    let allTranslations: any[] = [];
    
    for (let i = 0; i < values.length; i += CHUNK_SIZE) {
      const chunk = values.slice(i, i + CHUNK_SIZE);
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: chunk,
          target: targetLanguage,
          format: 'text',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to translate');
      }
      
      allTranslations = allTranslations.concat(data.data.translations);
    }

    const translations = allTranslations;
    
    // Map translated values back to keys
    const translatedFlatMap: { [key: string]: string } = {};
    keys.forEach((key, index) => {
      // Decode HTML entities (Google sometimes returns decoded but safe is better)
      const translatedText = translations[index].translatedText;
      translatedFlatMap[key] = translatedText;
    });

    return unflattenObject(translatedFlatMap);
  } catch (error) {
    console.error('Translation failed:', error);
    throw error;
  }
};
