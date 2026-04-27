import type { ListeningExerciseSeed } from './listening-a1.js';

export const listeningExercisesA1Extra: ListeningExerciseSeed[] = [
  {
    title: 'À la boulangerie',
    level: 'A1',
    transcript: `Vendeuse : Bonjour monsieur, qu'est-ce que je vous sers ?
Client : Bonjour ! Je voudrais une baguette tradition, s'il vous plaît.
Vendeuse : Très bien. Et avec ça ?
Client : Je prends aussi quatre croissants, pour le petit-déjeuner.
Vendeuse : Les quatre croissants font deux euros et la baguette, c'est un euro vingt. Ça fait trois euros vingt au total.
Client : Voilà trois euros vingt. Merci !
Vendeuse : Merci, bonne journée !`,
    durationSec: 22,
    questions: [
      {
        id: 'q1',
        text: 'Qu\'est-ce que le client achète en premier ?',
        options: ['un croissant', 'une baguette tradition', 'du pain de campagne', 'un pain au chocolat'],
        correct: 'une baguette tradition',
      },
      {
        id: 'q2',
        text: 'Combien de croissants achète-t-il ?',
        options: ['deux', 'trois', 'quatre', 'cinq'],
        correct: 'quatre',
      },
      {
        id: 'q3',
        text: 'Combien coûte la baguette ?',
        options: ['un euro', 'un euro vingt', 'un euro cinquante', 'deux euros'],
        correct: 'un euro vingt',
      },
      {
        id: 'q4',
        text: 'Combien paie le client en tout ?',
        options: ['deux euros vingt', 'deux euros cinquante', 'trois euros', 'trois euros vingt'],
        correct: 'trois euros vingt',
      },
    ],
  },
  {
    title: 'Mon appartement',
    level: 'A1',
    transcript: `Mon appartement est au troisième étage. Il est petit mais très confortable. Il y a un salon, une chambre, une cuisine et une salle de bains. Dans le salon, il y a un canapé, une table et une télévision. Ma chambre est bleue et calme parce qu'elle donne sur une cour. J'habite seul mais mes voisins sont très sympathiques.`,
    durationSec: 20,
    questions: [
      {
        id: 'q1',
        text: 'À quel étage est l\'appartement ?',
        options: ['au premier étage', 'au deuxième étage', 'au troisième étage', 'au quatrième étage'],
        correct: 'au troisième étage',
      },
      {
        id: 'q2',
        text: 'Combien de pièces a l\'appartement ?',
        options: ['deux', 'trois', 'quatre', 'cinq'],
        correct: 'quatre',
      },
      {
        id: 'q3',
        text: 'De quelle couleur est la chambre ?',
        options: ['blanche', 'verte', 'bleue', 'jaune'],
        correct: 'bleue',
      },
      {
        id: 'q4',
        text: 'Avec qui habite la personne ?',
        options: ['avec un ami', 'avec sa famille', 'avec un colocataire', 'seule'],
        correct: 'seule',
      },
    ],
  },
  {
    title: 'Le bus',
    level: 'A1',
    transcript: `Touriste : Excusez-moi, le bus numéro sept s'arrête ici ?
Passant : Oui, c'est le bon arrêt. Il passe toutes les dix minutes.
Touriste : Merci ! Et combien de temps pour aller en centre-ville ?
Passant : Environ vingt minutes. Le prochain bus est à quinze heures.
Touriste : Il est déjà quatorze heures cinquante-cinq. Je n'ai pas longtemps à attendre !
Passant : Non, bonne journée !`,
    durationSec: 20,
    questions: [
      {
        id: 'q1',
        text: 'Quel numéro est le bus ?',
        options: ['le bus numéro cinq', 'le bus numéro six', 'le bus numéro sept', 'le bus numéro huit'],
        correct: 'le bus numéro sept',
      },
      {
        id: 'q2',
        text: 'Toutes les combien de minutes passe le bus ?',
        options: ['cinq minutes', 'dix minutes', 'quinze minutes', 'vingt minutes'],
        correct: 'dix minutes',
      },
      {
        id: 'q3',
        text: 'Combien de temps dure le trajet en centre-ville ?',
        options: ['dix minutes', 'quinze minutes', 'vingt minutes', 'trente minutes'],
        correct: 'vingt minutes',
      },
      {
        id: 'q4',
        text: 'À quelle heure est le prochain bus ?',
        options: ['à quatorze heures', 'à quatorze heures cinquante', 'à quinze heures', 'à quinze heures dix'],
        correct: 'à quinze heures',
      },
    ],
  },
  {
    title: 'Rendez-vous médical',
    level: 'A1',
    transcript: `Secrétaire : Allô, cabinet médical, bonjour !
Patiente : Bonjour, je voudrais prendre un rendez-vous avec le docteur Blanc, s'il vous plaît.
Secrétaire : Bien sûr. C'est pour quand ?
Patiente : Le plus tôt possible. J'ai mal à la gorge depuis hier.
Secrétaire : Je peux vous proposer jeudi à dix heures ou vendredi à quatorze heures trente.
Patiente : Jeudi à dix heures, c'est parfait.
Secrétaire : Votre nom, s'il vous plaît ?
Patiente : Leroy, Anne Leroy.`,
    durationSec: 22,
    questions: [
      {
        id: 'q1',
        text: 'Avec qui la patiente veut-elle un rendez-vous ?',
        options: ['le docteur Martin', 'le docteur Blanc', 'le docteur Petit', 'le docteur Durand'],
        correct: 'le docteur Blanc',
      },
      {
        id: 'q2',
        text: 'Quel est le problème de la patiente ?',
        options: ['elle a mal à la tête', 'elle a mal au dos', 'elle a mal à la gorge', 'elle a de la fièvre'],
        correct: 'elle a mal à la gorge',
      },
      {
        id: 'q3',
        text: 'Quel rendez-vous choisit la patiente ?',
        options: ['jeudi à dix heures', 'vendredi à dix heures', 'jeudi à quatorze heures trente', 'vendredi à quatorze heures trente'],
        correct: 'jeudi à dix heures',
      },
      {
        id: 'q4',
        text: 'Comment s\'appelle la patiente ?',
        options: ['Marie Leroy', 'Anne Leroy', 'Anne Laurent', 'Marie Laurent'],
        correct: 'Anne Leroy',
      },
    ],
  },
  {
    title: 'Faire les courses',
    level: 'A1',
    transcript: `Je fais mes courses chaque samedi matin. Je vais d'abord chez le boulanger pour acheter du pain. Ensuite, je vais au marché pour les légumes : des tomates, des carottes et des courgettes. Après le marché, je vais au supermarché pour le lait, le fromage et le café. Je dépense environ trente euros chaque semaine.`,
    durationSec: 20,
    questions: [
      {
        id: 'q1',
        text: 'Quand est-ce qu\'il fait ses courses ?',
        options: ['le vendredi soir', 'le samedi matin', 'le dimanche matin', 'le samedi après-midi'],
        correct: 'le samedi matin',
      },
      {
        id: 'q2',
        text: 'Où va-t-il en premier ?',
        options: ['au supermarché', 'au marché', 'chez le boulanger', 'chez le boucher'],
        correct: 'chez le boulanger',
      },
      {
        id: 'q3',
        text: 'Quels légumes achète-t-il au marché ?',
        options: ['des carottes et des pommes de terre', 'des tomates, des carottes et des courgettes', 'des oignons et des tomates', 'des haricots et des courgettes'],
        correct: 'des tomates, des carottes et des courgettes',
      },
      {
        id: 'q4',
        text: 'Combien dépense-t-il par semaine ?',
        options: ['vingt euros', 'vingt-cinq euros', 'trente euros', 'trente-cinq euros'],
        correct: 'trente euros',
      },
    ],
  },
  {
    title: 'Ma journée',
    level: 'A1',
    transcript: `Je me lève à sept heures. Je prends une douche et je mange des céréales avec du lait. Je quitte la maison à huit heures moins le quart. Je travaille de huit heures et demie à dix-huit heures. À midi, je mange à la cantine avec mes collègues. Le soir, je rentre chez moi, je cuisine et je regarde la télévision. Je me couche à vingt-trois heures.`,
    durationSec: 20,
    questions: [
      {
        id: 'q1',
        text: 'À quelle heure se lève-t-il ?',
        options: ['à six heures', 'à six heures trente', 'à sept heures', 'à sept heures trente'],
        correct: 'à sept heures',
      },
      {
        id: 'q2',
        text: 'Que mange-t-il au petit-déjeuner ?',
        options: ['des tartines avec du beurre', 'des œufs et du pain', 'des céréales avec du lait', 'un croissant et du café'],
        correct: 'des céréales avec du lait',
      },
      {
        id: 'q3',
        text: 'Où déjeune-t-il ?',
        options: ['dans un restaurant', 'à la maison', 'à la cantine', 'dans un café'],
        correct: 'à la cantine',
      },
      {
        id: 'q4',
        text: 'À quelle heure se couche-t-il ?',
        options: ['à vingt-deux heures', 'à vingt-deux heures trente', 'à vingt-trois heures', 'à minuit'],
        correct: 'à vingt-trois heures',
      },
    ],
  },
  {
    title: 'Au restaurant',
    level: 'A1',
    transcript: `Serveur : Bonsoir ! Vous avez une réservation ?
Client : Oui, Lefebvre, pour deux personnes à vingt heures.
Serveur : Parfait, voilà votre table. Qu'est-ce que vous désirez ?
Client : Qu'est-ce que vous recommandez ce soir ?
Serveur : La spécialité du jour, c'est le saumon grillé avec des légumes.
Client : Je prends le saumon. Et ma femme prend une salade niçoise. Et une bouteille d'eau plate, s'il vous plaît.
Serveur : Très bien, je vous apporte ça tout de suite.`,
    durationSec: 22,
    questions: [
      {
        id: 'q1',
        text: 'Pour combien de personnes est la réservation ?',
        options: ['une personne', 'deux personnes', 'trois personnes', 'quatre personnes'],
        correct: 'deux personnes',
      },
      {
        id: 'q2',
        text: 'Quelle est la spécialité du jour ?',
        options: ['le poulet rôti', 'le bœuf bourguignon', 'le saumon grillé', 'la soupe de poisson'],
        correct: 'le saumon grillé',
      },
      {
        id: 'q3',
        text: 'Qu\'est-ce que la femme commande ?',
        options: ['le saumon grillé', 'une soupe', 'une salade niçoise', 'des pâtes'],
        correct: 'une salade niçoise',
      },
      {
        id: 'q4',
        text: 'Qu\'est-ce qu\'ils boivent ?',
        options: ['du vin rouge', 'du vin blanc', 'de l\'eau gazeuse', 'de l\'eau plate'],
        correct: 'de l\'eau plate',
      },
    ],
  },
  {
    title: 'Mon animal de compagnie',
    level: 'A1',
    transcript: `J'ai un chien qui s'appelle Rex. C'est un labrador jaune. Il a quatre ans. Rex est très intelligent et très gentil. Il adore jouer dans le parc. Tous les matins, je le promène pendant trente minutes avant d'aller au travail. Le soir, il dort dans sa corbeille dans le salon. Rex mange deux fois par jour. C'est la meilleure compagnie du monde !`,
    durationSec: 20,
    questions: [
      {
        id: 'q1',
        text: 'Comment s\'appelle le chien ?',
        options: ['Max', 'Bobby', 'Rex', 'Fido'],
        correct: 'Rex',
      },
      {
        id: 'q2',
        text: 'Quelle est la race du chien ?',
        options: ['un berger allemand', 'un labrador', 'un golden retriever', 'un caniche'],
        correct: 'un labrador',
      },
      {
        id: 'q3',
        text: 'Combien de temps dure la promenade du matin ?',
        options: ['vingt minutes', 'trente minutes', 'quarante-cinq minutes', 'une heure'],
        correct: 'trente minutes',
      },
      {
        id: 'q4',
        text: 'Combien de fois par jour mange le chien ?',
        options: ['une fois', 'deux fois', 'trois fois', 'quatre fois'],
        correct: 'deux fois',
      },
    ],
  },
];
