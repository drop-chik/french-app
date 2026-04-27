export interface ListeningExerciseSeedA2 {
  title: string;
  level: 'A2';
  transcript: string;
  durationSec: number;
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    correct: string;
  }>;
}

export const listeningExercisesA2: ListeningExerciseSeedA2[] = [
  {
    title: 'Réservation d\'hôtel',
    level: 'A2',
    transcript: `Réceptionniste : Hôtel du Lac, bonjour !
Client : Bonjour, je voudrais réserver une chambre double pour deux nuits, du quinze au dix-sept juillet.
Réceptionniste : Nous avons une chambre double disponible avec balcon et vue sur le lac. Elle est à cent vingt euros la nuit, petit-déjeuner compris.
Client : Parfait, je la prends. Est-ce que je peux payer à l'arrivée ?
Réceptionniste : Oui, bien sûr. Votre nom, s'il vous plaît ?
Client : Moreau, Pierre Moreau.`,
    durationSec: 25,
    questions: [
      {
        id: 'q1',
        text: 'Pour combien de nuits réserve-t-il ?',
        options: ['une nuit', 'deux nuits', 'trois nuits', 'une semaine'],
        correct: 'deux nuits',
      },
      {
        id: 'q2',
        text: 'Quel type de chambre réserve-t-il ?',
        options: ['une chambre simple', 'une chambre double', 'une suite', 'un appartement'],
        correct: 'une chambre double',
      },
      {
        id: 'q3',
        text: 'Quel est le prix par nuit ?',
        options: ['quatre-vingts euros', 'cent euros', 'cent vingt euros', 'cent cinquante euros'],
        correct: 'cent vingt euros',
      },
      {
        id: 'q4',
        text: 'Qu\'est-ce qui est inclus dans le prix ?',
        options: ['le dîner', 'le petit-déjeuner', 'le déjeuner et le dîner', 'le parking'],
        correct: 'le petit-déjeuner',
      },
    ],
  },
  {
    title: 'Entretien d\'embauche',
    level: 'A2',
    transcript: `Recruteur : Pouvez-vous me parler de votre expérience professionnelle ?
Candidat : Bien sûr. J'ai travaillé pendant trois ans comme assistant commercial dans une entreprise de logistique. Avant ça, j'ai fait un stage de six mois dans la vente.
Recruteur : Pourquoi voulez-vous travailler chez nous ?
Candidat : Votre entreprise a une excellente réputation et j'aimerais travailler dans une équipe internationale.
Recruteur : Quelles sont vos disponibilités ?
Candidat : Je suis disponible à partir du premier septembre.`,
    durationSec: 27,
    questions: [
      {
        id: 'q1',
        text: 'Combien d\'années a-t-il travaillé comme assistant commercial ?',
        options: ['un an', 'deux ans', 'trois ans', 'cinq ans'],
        correct: 'trois ans',
      },
      {
        id: 'q2',
        text: 'Dans quel secteur a-t-il travaillé ?',
        options: ['dans l\'informatique', 'dans la santé', 'dans la logistique', 'dans l\'éducation'],
        correct: 'dans la logistique',
      },
      {
        id: 'q3',
        text: 'Pourquoi veut-il travailler dans cette entreprise ?',
        options: ['pour le salaire élevé', 'pour la localisation', 'pour son excellente réputation', 'pour les avantages sociaux'],
        correct: 'pour son excellente réputation',
      },
      {
        id: 'q4',
        text: 'À partir de quand est-il disponible ?',
        options: ['le premier juillet', 'le premier août', 'le premier septembre', 'le premier octobre'],
        correct: 'le premier septembre',
      },
    ],
  },
  {
    title: 'Voyage en train',
    level: 'A2',
    transcript: `Hier, j'ai pris le TGV de Paris à Lyon pour rendre visite à ma famille. J'avais réservé ma place la semaine avant, donc j'ai eu une bonne place près de la fenêtre. Le trajet a duré environ deux heures. Dans le train, j'ai lu un roman et j'ai écouté de la musique. À Lyon, ma sœur m'attendait sur le quai. Nous avons passé un excellent week-end ensemble.`,
    durationSec: 25,
    questions: [
      {
        id: 'q1',
        text: 'Où est-il allé en TGV ?',
        options: ['à Marseille', 'à Lyon', 'à Bordeaux', 'à Strasbourg'],
        correct: 'à Lyon',
      },
      {
        id: 'q2',
        text: 'Quand a-t-il réservé sa place ?',
        options: ['le jour même', 'trois jours avant', 'la semaine avant', 'un mois avant'],
        correct: 'la semaine avant',
      },
      {
        id: 'q3',
        text: 'Combien de temps a duré le trajet ?',
        options: ['une heure', 'deux heures', 'trois heures', 'quatre heures'],
        correct: 'deux heures',
      },
      {
        id: 'q4',
        text: 'Que faisait-il dans le train ?',
        options: ['il dormait', 'il travaillait sur son ordinateur', 'il lisait et écoutait de la musique', 'il regardait un film'],
        correct: 'il lisait et écoutait de la musique',
      },
    ],
  },
  {
    title: 'Les loisirs',
    level: 'A2',
    transcript: `Amie : Qu'est-ce que tu fais pendant ton temps libre ?
Lucas : J'aime beaucoup la photographie. Chaque week-end, je pars explorer la ville avec mon appareil. L'année dernière, j'ai participé à un concours et j'ai gagné le troisième prix !
Amie : C'est super ! Depuis quand tu fais ça ?
Lucas : Depuis l'âge de seize ans. Mon père m'a offert mon premier appareil pour mon anniversaire. Et toi, tu as des hobbies ?
Amie : Moi, je fais de la natation trois fois par semaine. C'est excellent pour la santé.`,
    durationSec: 28,
    questions: [
      {
        id: 'q1',
        text: 'Quel est le loisir de Lucas ?',
        options: ['le dessin', 'la peinture', 'la photographie', 'la vidéo'],
        correct: 'la photographie',
      },
      {
        id: 'q2',
        text: 'Qu\'est-ce qu\'il a gagné l\'année dernière ?',
        options: ['le premier prix', 'le deuxième prix', 'le troisième prix', 'une mention spéciale'],
        correct: 'le troisième prix',
      },
      {
        id: 'q3',
        text: 'Depuis quel âge fait-il de la photographie ?',
        options: ['depuis quatorze ans', 'depuis quinze ans', 'depuis seize ans', 'depuis dix-huit ans'],
        correct: 'depuis seize ans',
      },
      {
        id: 'q4',
        text: 'Quel sport pratique son amie ?',
        options: ['le tennis', 'le yoga', 'la natation', 'la course à pied'],
        correct: 'la natation',
      },
    ],
  },
  {
    title: 'Week-end à la campagne',
    level: 'A2',
    transcript: `Le week-end dernier, nous sommes allés à la campagne avec des amis. Nous avions loué une maison près d'un lac. Le samedi matin, nous avons fait une longue randonnée dans la forêt. Il faisait un temps magnifique et les paysages étaient splendides. L'après-midi, nous avons nagé dans le lac. Le soir, nous avons préparé un barbecue ensemble et discuté jusqu'à minuit.`,
    durationSec: 25,
    questions: [
      {
        id: 'q1',
        text: 'Où ont-ils passé le week-end ?',
        options: ['à la mer', 'à la montagne', 'à la campagne', 'en ville'],
        correct: 'à la campagne',
      },
      {
        id: 'q2',
        text: 'Qu\'ont-ils fait le samedi matin ?',
        options: ['ils ont nagé dans le lac', 'une randonnée dans la forêt', 'un barbecue', 'ils ont visité un château'],
        correct: 'une randonnée dans la forêt',
      },
      {
        id: 'q3',
        text: 'Quel temps faisait-il ?',
        options: ['il pleuvait', 'il y avait du vent', 'il faisait froid', 'il faisait un temps magnifique'],
        correct: 'il faisait un temps magnifique',
      },
      {
        id: 'q4',
        text: 'Qu\'ont-ils fait le soir ?',
        options: ['ils vont au restaurant', 'ils regardent un film', 'ils font un barbecue', 'ils jouent aux cartes'],
        correct: 'ils font un barbecue',
      },
    ],
  },
  {
    title: 'Les habitudes alimentaires',
    level: 'A2',
    transcript: `En France, les habitudes alimentaires changent beaucoup. Avant, les gens mangeaient souvent trois repas complets par jour. Maintenant, beaucoup de personnes mangent plus rapidement à cause du travail. Pourtant, le déjeuner reste très important en France. Dans les petites villes, beaucoup de gens rentrent encore chez eux pour manger à midi. Les Français consomment de moins en moins de pain traditionnel mais achètent plus de produits biologiques qu'avant.`,
    durationSec: 27,
    questions: [
      {
        id: 'q1',
        text: 'Combien de repas complets mangeait-on avant par jour ?',
        options: ['deux repas', 'trois repas', 'quatre repas', 'cinq repas'],
        correct: 'trois repas',
      },
      {
        id: 'q2',
        text: 'Pourquoi mange-t-on plus rapidement maintenant ?',
        options: ['à cause du stress', 'à cause du travail', 'à cause des transports', 'à cause des enfants'],
        correct: 'à cause du travail',
      },
      {
        id: 'q3',
        text: 'Quel repas reste très important en France ?',
        options: ['le petit-déjeuner', 'le déjeuner', 'le dîner', 'le goûter'],
        correct: 'le déjeuner',
      },
      {
        id: 'q4',
        text: 'Qu\'achètent de plus en plus les Français ?',
        options: ['des plats préparés', 'de la restauration rapide', 'des produits biologiques', 'des conserves'],
        correct: 'des produits biologiques',
      },
    ],
  },
  {
    title: 'Recette : omelette aux champignons',
    level: 'A2',
    transcript: `Je vais vous expliquer comment préparer une omelette aux champignons. Il vous faut quatre œufs, deux cents grammes de champignons, du beurre, du sel et du poivre. D'abord, coupez les champignons en petits morceaux et faites-les revenir dans le beurre pendant cinq minutes. Ensuite, battez les œufs avec le sel et le poivre. Versez le mélange dans la poêle avec les champignons. Laissez cuire trois minutes et pliez l'omelette. Bon appétit !`,
    durationSec: 25,
    questions: [
      {
        id: 'q1',
        text: 'Combien d\'œufs faut-il pour cette recette ?',
        options: ['deux', 'trois', 'quatre', 'six'],
        correct: 'quatre',
      },
      {
        id: 'q2',
        text: 'Que faut-il faire avec les champignons d\'abord ?',
        options: ['les laver et les faire bouillir', 'les couper et les faire revenir', 'les râper et les mélanger aux œufs', 'les couper et les manger crus'],
        correct: 'les couper et les faire revenir',
      },
      {
        id: 'q3',
        text: 'Combien de temps fait-on revenir les champignons ?',
        options: ['deux minutes', 'trois minutes', 'cinq minutes', 'dix minutes'],
        correct: 'cinq minutes',
      },
      {
        id: 'q4',
        text: 'Combien de temps faut-il cuire l\'omelette ?',
        options: ['une minute', 'deux minutes', 'trois minutes', 'cinq minutes'],
        correct: 'trois minutes',
      },
    ],
  },
  {
    title: 'Un voisin bruyant',
    level: 'A2',
    transcript: `Anna : Lucas, tu as l'air fatigué !
Lucas : Oui, mon voisin du dessus fait du bruit tous les soirs. La nuit dernière, il a joué de la guitare jusqu'à deux heures du matin. Je ne pouvais pas dormir.
Anna : Tu lui as déjà parlé ?
Lucas : Oui, il y a une semaine, mais ça n'a pas changé. Hier soir, j'ai encore entendu de la musique forte à minuit.
Anna : Tu devrais parler au gardien de l'immeuble ou appeler la mairie.
Lucas : Oui, peut-être. Je vais lui parler une dernière fois d'abord.`,
    durationSec: 28,
    questions: [
      {
        id: 'q1',
        text: 'Pourquoi Lucas est-il fatigué ?',
        options: ['il travaille trop', 'son voisin fait du bruit', 'il est malade', 'il a un bébé'],
        correct: 'son voisin fait du bruit',
      },
      {
        id: 'q2',
        text: 'Jusqu\'à quelle heure le voisin a-t-il joué de la guitare ?',
        options: ['jusqu\'à minuit', 'jusqu\'à une heure du matin', 'jusqu\'à deux heures du matin', 'jusqu\'à trois heures du matin'],
        correct: 'jusqu\'à deux heures du matin',
      },
      {
        id: 'q3',
        text: 'Quand Lucas a-t-il parlé au voisin ?',
        options: ['hier', 'avant-hier', 'il y a une semaine', 'il ne lui a jamais parlé'],
        correct: 'il y a une semaine',
      },
      {
        id: 'q4',
        text: 'Que lui conseille Anna ?',
        options: ['appeler la police', 'déménager', 'parler au gardien ou appeler la mairie', 'mettre des bouchons d\'oreilles'],
        correct: 'parler au gardien ou appeler la mairie',
      },
    ],
  },
  {
    title: 'Les smartphones',
    level: 'A2',
    transcript: `Aujourd'hui, les smartphones font partie de notre vie quotidienne. Ils nous permettent de téléphoner, d'envoyer des messages, de lire les actualités et de faire des achats en ligne. Selon une étude récente, les Français regardent leur téléphone en moyenne cent fois par jour. Cela peut créer des problèmes : certaines personnes ont du mal à se concentrer et dorment mal à cause des écrans. Des experts recommandent de ne pas utiliser son téléphone une heure avant de dormir.`,
    durationSec: 27,
    questions: [
      {
        id: 'q1',
        text: 'Combien de fois par jour les Français regardent-ils leur téléphone ?',
        options: ['cinquante fois', 'cent fois', 'cent cinquante fois', 'deux cents fois'],
        correct: 'cent fois',
      },
      {
        id: 'q2',
        text: 'Quel problème les écrans peuvent-ils causer ?',
        options: ['uniquement des problèmes de vue', 'des difficultés de concentration et de sommeil', 'des maux de dos', 'uniquement des problèmes sociaux'],
        correct: 'des difficultés de concentration et de sommeil',
      },
      {
        id: 'q3',
        text: 'Que recommandent les experts ?',
        options: ['ne plus utiliser de smartphone', 'utiliser le téléphone une heure par jour maximum', 'ne pas utiliser son téléphone une heure avant de dormir', 'éteindre le téléphone la nuit'],
        correct: 'ne pas utiliser son téléphone une heure avant de dormir',
      },
      {
        id: 'q4',
        text: 'Que peut-on faire avec un smartphone selon le texte ?',
        options: ['seulement téléphoner et envoyer des messages', 'faire des achats en ligne et lire les actualités', 'regarder des films et jouer aux jeux', 'uniquement lire les actualités'],
        correct: 'faire des achats en ligne et lire les actualités',
      },
    ],
  },
  {
    title: 'Projets de vacances',
    level: 'A2',
    transcript: `Sophie : Alors, qu'est-ce que tu prévois pour les vacances d'été ?
Marc : Je pense aller au Portugal avec ma famille. Nous avons trouvé un appartement à Lisbonne pour deux semaines.
Sophie : Super ! Vous partez quand ?
Marc : Nous partons le quinze août et nous rentrons le trente.
Sophie : Vous y êtes déjà allés ?
Marc : Non, c'est la première fois. On m'a dit que Lisbonne est magnifique, avec beaucoup de monuments à visiter et une cuisine excellente.
Sophie : J'espère que vous allez adorer !`,
    durationSec: 28,
    questions: [
      {
        id: 'q1',
        text: 'Où vont-ils en vacances ?',
        options: ['en Espagne', 'au Portugal', 'en Italie', 'en Grèce'],
        correct: 'au Portugal',
      },
      {
        id: 'q2',
        text: 'Combien de temps durent les vacances ?',
        options: ['une semaine', 'dix jours', 'deux semaines', 'un mois'],
        correct: 'deux semaines',
      },
      {
        id: 'q3',
        text: 'Quand partent-ils ?',
        options: ['le premier août', 'le quinze juillet', 'le quinze août', 'le trente août'],
        correct: 'le quinze août',
      },
      {
        id: 'q4',
        text: 'Est-ce que Marc est déjà allé à Lisbonne ?',
        options: ['oui, plusieurs fois', 'oui, une fois', 'non, c\'est la première fois', 'on ne sait pas'],
        correct: 'non, c\'est la première fois',
      },
    ],
  },
];
