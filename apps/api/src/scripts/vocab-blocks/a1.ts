/**
 * A1 expansion: target +694 new words to reach FLELex Beacco-aligned
 * coverage of 1564 entries. Themes follow the A1 CEFR descriptors
 * (everyday concrete vocabulary, immediate needs, self-presentation).
 */
import type { Block } from './types.js';

export const blocks: Block[] = [
  { category: 'family-extended', themeFr: 'La famille élargie', description: 'Extended family roles and members (cousin, nephew, niece, godparent, brother-in-law, stepfather, twins, only child, grandchild) at A1 register.', targetCount: 50 },
  { category: 'body-parts', themeFr: 'Le corps humain', description: 'Body parts not yet covered (shoulder, ankle, wrist, elbow, calf, eyelash, eyebrow, chin, forehead, lip, tongue, palm, fingernail).', targetCount: 55 },
  { category: 'clothing-everyday', themeFr: 'Les vêtements et accessoires', description: 'Common clothing items: scarf, glove, belt, hat variants, swimsuit, raincoat, sneakers, boots, slippers, suit, dress, skirt, blouse, accessories: backpack, watch, ring, necklace.', targetCount: 60 },
  { category: 'food-products', themeFr: 'Les aliments et boissons', description: 'Common food products: dairy items (butter, yogurt, cream), meat cuts, fish species, fruits (peach, plum, watermelon, pineapple, mango), vegetables (eggplant, zucchini, lettuce types, spinach, broccoli), herbs and spices (parsley, basil, thyme, pepper), drinks (tea, soda, juice flavours).', targetCount: 70 },
  { category: 'home-rooms-furniture', themeFr: 'La maison et les meubles', description: 'Rooms and furniture: hallway, basement, attic, balcony, drawer, shelf, mirror, lamp, blanket, pillow, rug, curtain, faucet, oven, fridge, washing machine.', targetCount: 55 },
  { category: 'colors-shades', themeFr: 'Les couleurs et nuances', description: 'Color shades and visual terms: light/dark variants (light blue, dark green), beige, turquoise, navy, gold, silver, transparent, opaque, striped, dotted, plain.', targetCount: 30 },
  { category: 'numbers-time', themeFr: 'Les nombres, heures, dates', description: 'Numbers 20-100 (vingt, trente, quarante, cinquante, soixante, soixante-dix, quatre-vingts, quatre-vingt-dix, cent), ordinals (premier, deuxième…dixième), time expressions (heure, minute, seconde, midi, minuit, quart, demi).', targetCount: 50 },
  { category: 'basic-verbs', themeFr: 'Les verbes du quotidien', description: 'Common everyday verbs at A1 not yet present: se réveiller, se coucher, se laver, se brosser, se promener, attendre, chercher, trouver, apporter, emporter, montrer, expliquer, oublier, perdre, gagner, ouvrir, fermer, allumer, éteindre, remplir, vider.', targetCount: 60 },
  { category: 'weather', themeFr: 'La météo', description: 'Weather vocabulary: il pleut, il neige, il fait beau/mauvais/chaud/froid/gris, nuage, soleil, lune, étoile, ciel, vent, orage, brouillard, tempête, arc-en-ciel, glace, climat.', targetCount: 35 },
  { category: 'school-classroom', themeFr: 'L\'école et la classe', description: 'School and classroom vocabulary: cartable, classeur, cahier, stylo, crayon, gomme, règle, ciseaux, colle, tableau, craie, écran, ordinateur, devoirs, examen, note, récréation, cantine, sport, dessin.', targetCount: 50 },
  { category: 'health-basic', themeFr: 'La santé et la maladie', description: 'Basic health: avoir mal à, fièvre, rhume, grippe, toux, mal de tête, mal de ventre, médicament, ordonnance, médecin, pharmacie, hôpital, infirmière, dentiste, vaccin.', targetCount: 40 },
  { category: 'animals-common', themeFr: 'Les animaux courants', description: 'Common animals: pets (chien, chat, lapin, hamster, perroquet, poisson rouge), farm (vache, cheval, mouton, cochon, poule, coq, canard), wild (renard, loup, ours, écureuil, lapin sauvage), birds (oiseau, pigeon, moineau).', targetCount: 50 },
  { category: 'transport-everyday', themeFr: 'Les transports du quotidien', description: 'Everyday transport: voiture, vélo, moto, bus, métro, tramway, taxi, train, avion, bateau, à pied. Related: gare, arrêt, station, billet, conducteur, chauffeur, vitesse.', targetCount: 35 },
  { category: 'city-places', themeFr: 'En ville', description: 'City places not yet covered: place, rue, avenue, boulevard, parc, jardin, fontaine, statue, marché, centre commercial, mairie, poste, banque, église, musée, théâtre, cinéma.', targetCount: 35 },
  { category: 'feelings-basic', themeFr: 'Émotions et états simples', description: 'Basic feelings A1: content, triste, fatigué, heureux, malheureux, ennuyé, surpris, fier, gentil, sympa, désolé, jaloux, amoureux, calme, nerveux, occupé.', targetCount: 30 },
  { category: 'daily-routines', themeFr: 'La routine quotidienne', description: 'Daily routine: matin, midi, après-midi, soir, nuit, hier, aujourd\'hui, demain, semaine, weekend, vacances, fête, anniversaire. Routines: prendre le petit déjeuner, déjeuner, dîner, faire ses devoirs, regarder la télé.', targetCount: 40 },
];
