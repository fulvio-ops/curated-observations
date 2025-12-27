export type Locale = 'en' | 'it';

export const translations = {
  en: {
    // Header
    observations: 'Observations',
    objects: 'Objects',
    
    // Hero
    editorialExperiment: 'An editorial experiment',
    heroTitle: 'The world already produces enough content.',
    heroSubtitle: 'The problem is not creation, but selection. This is a space for noticing what is worth noticing.',
    
    // Observations Section
    recentObservations: 'Recent observations',
    filtered: 'Filtered',
    
    // Objects Section
    objectsTitle: 'Objects that exist',
    purchasable: 'Purchasable',
    objectsDisclaimer: 'Objects are selected for their observational value. Affiliate links help sustain this experiment.',
    
    // Footer
    footerByline: 'An editorial experiment by Fulvio Fugallo.',
    footerTagline: 'Selection over creation. Observation over opinion.',
    
    // Micro-judgments
    'This exists.': 'This exists.',
    'Democracy works.': 'Democracy works.',
    'Someone approved this.': 'Someone approved this.',
    'And yet, here we are.': 'And yet, here we are.',
    'Civilization advances.': 'Civilization advances.',
    'Someone needed this.': 'Someone needed this.',
    'Art finds a way.': 'Art finds a way.',
  },
  it: {
    // Header
    observations: 'Osservazioni',
    objects: 'Oggetti',
    
    // Hero
    editorialExperiment: 'Un esperimento editoriale',
    heroTitle: 'Il mondo produce già abbastanza contenuti.',
    heroSubtitle: 'Il problema non è la creazione, ma la selezione. Questo è uno spazio per notare ciò che vale la pena notare.',
    
    // Observations Section
    recentObservations: 'Osservazioni recenti',
    filtered: 'Filtrato',
    
    // Objects Section
    objectsTitle: 'Oggetti che esistono',
    purchasable: 'Acquistabile',
    objectsDisclaimer: 'Gli oggetti sono selezionati per il loro valore osservativo. I link affiliati aiutano a sostenere questo esperimento.',
    
    // Footer
    footerByline: 'Un esperimento editoriale di Fulvio Fugallo.',
    footerTagline: 'Selezione prima della creazione. Osservazione prima dell\'opinione.',
    
    // Micro-judgments
    'This exists.': 'Questo esiste.',
    'Democracy works.': 'La democrazia funziona.',
    'Someone approved this.': 'Qualcuno ha approvato questo.',
    'And yet, here we are.': 'Eppure, eccoci qui.',
    'Civilization advances.': 'La civiltà avanza.',
    'Someone needed this.': 'Qualcuno ne aveva bisogno.',
    'Art finds a way.': 'L\'arte trova sempre una via.',
  },
} as const;

// Observation titles translations
export const observationTitles = {
  en: {
    'Man spends three years building spreadsheet to track every meal he\'s ever eaten': 
      'Man spends three years building spreadsheet to track every meal he\'s ever eaten',
    'Town council votes to rename street after local cat who attended every meeting': 
      'Town council votes to rename street after local cat who attended every meeting',
    'Company introduces mandatory fun training for employees who seem too serious': 
      'Company introduces mandatory fun training for employees who seem too serious',
    'Study finds people who announce gym plans less likely to go': 
      'Study finds people who announce gym plans less likely to go',
  },
  it: {
    'Man spends three years building spreadsheet to track every meal he\'s ever eaten': 
      'Un uomo passa tre anni a costruire un foglio Excel per tracciare ogni pasto mai consumato',
    'Town council votes to rename street after local cat who attended every meeting': 
      'Il consiglio comunale vota per rinominare una strada in onore del gatto locale che ha partecipato a ogni riunione',
    'Company introduces mandatory fun training for employees who seem too serious': 
      'Azienda introduce formazione obbligatoria sul divertimento per i dipendenti che sembrano troppo seri',
    'Study finds people who announce gym plans less likely to go': 
      'Uno studio rivela che chi annuncia i propri piani in palestra ha meno probabilità di andarci',
  },
} as const;

// Object names translations
export const objectNames = {
  en: {
    'Banana Slicer (For people who find bananas too challenging)': 
      'Banana Slicer (For people who find bananas too challenging)',
    'Handerpants (Underwear for your hands)': 
      'Handerpants (Underwear for your hands)',
    'Nicolas Cage Sequin Pillow (Face appears when you rub it)': 
      'Nicolas Cage Sequin Pillow (Face appears when you rub it)',
  },
  it: {
    'Banana Slicer (For people who find bananas too challenging)': 
      'Affettabanane (Per chi trova le banane troppo impegnative)',
    'Handerpants (Underwear for your hands)': 
      'Handerpants (Mutande per le mani)',
    'Nicolas Cage Sequin Pillow (Face appears when you rub it)': 
      'Cuscino con paillettes di Nicolas Cage (Il volto appare quando lo sfreghi)',
  },
} as const;

// Amazon domain based on locale
export const getAmazonDomain = (locale: Locale): string => {
  return locale === 'it' ? 'amazon.it' : 'amazon.com';
};
