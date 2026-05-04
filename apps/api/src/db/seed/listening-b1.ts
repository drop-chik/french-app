export interface ListeningExerciseSeedB1 {
  title: string;
  level: 'B1';
  transcript: string;
  durationSec: number;
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    correct: string;
  }>;
}

export const listeningExercisesB1: ListeningExerciseSeedB1[] = [
  {
    title: 'Débat sur le télétravail',
    level: 'B1',
    transcript: `Journaliste : Depuis la pandémie, le télétravail s'est généralisé dans de nombreuses entreprises. Mais est-ce vraiment une bonne chose ? Sophie, vous êtes pour le télétravail ?
Sophie : Absolument. Je travaille depuis chez moi trois jours par semaine et je suis beaucoup plus productive. Je n'ai plus à passer deux heures dans les transports chaque jour. J'ai plus de temps pour ma famille et je me sens moins stressée.
Journaliste : Et vous, Thomas, vous n'êtes pas du même avis ?
Thomas : Non, je pense que le télétravail isole les employés. On perd le lien avec ses collègues, la créativité diminue quand on ne se voit pas en personne. De plus, beaucoup de gens n'ont pas les conditions nécessaires à la maison pour travailler correctement.
Journaliste : Existe-t-il un compromis possible selon vous ?
Thomas : Oui, je crois que deux ou trois jours au bureau par semaine est un bon équilibre. Ni trop peu, ni trop.`,
    durationSec: 42,
    questions: [
      {
        id: 'q1',
        text: 'Combien de jours par semaine Sophie travaille-t-elle en télétravail ?',
        options: ['un jour', 'deux jours', 'trois jours', 'cinq jours'],
        correct: 'trois jours',
      },
      {
        id: 'q2',
        text: 'Quel est l\'avantage principal du télétravail mentionné par Sophie ?',
        options: ['un meilleur salaire', 'moins de temps dans les transports', 'une promotion', 'de meilleurs équipements'],
        correct: 'moins de temps dans les transports',
      },
      {
        id: 'q3',
        text: 'Selon Thomas, quel est l\'inconvénient principal du télétravail ?',
        options: ['le coût d\'internet', 'la fatigue oculaire', 'l\'isolement des employés', 'les horaires décalés'],
        correct: 'l\'isolement des employés',
      },
      {
        id: 'q4',
        text: 'Quelle solution Thomas propose-t-il comme compromis ?',
        options: ['travailler uniquement au bureau', 'travailler uniquement à la maison', 'deux ou trois jours au bureau par semaine', 'une semaine au bureau, une semaine chez soi'],
        correct: 'deux ou trois jours au bureau par semaine',
      },
    ],
  },
  {
    title: 'Émission radio : la cuisine régionale',
    level: 'B1',
    transcript: `Animateur : Bienvenue dans notre émission « Saveurs de France ». Aujourd'hui, nous parlons de la cuisine régionale française avec notre invitée, la chef Isabelle Renard.
Isabelle : Bonjour. Je suis ravie d'être là.
Animateur : Isabelle, vous avez parcouru toutes les régions de France pour votre nouveau livre. Qu'est-ce qui vous a le plus surpris ?
Isabelle : Ce qui m'a le plus frappée, c'est à quel point chaque région garde jalousement ses recettes traditionnelles. Par exemple, en Alsace, on utilise beaucoup la bière dans la cuisine, alors qu'en Provence, c'est l'huile d'olive et les herbes aromatiques qui dominent.
Animateur : Pensez-vous que cette diversité est menacée par la mondialisation ?
Isabelle : Malheureusement, oui. Les jeunes cuisinent de moins en moins les plats de leurs grands-parents. Mais il y a aussi un mouvement de résistance très fort : beaucoup de chefs reviennent aux produits locaux et aux recettes authentiques.
Animateur : Quel plat recommanderiez-vous à quelqu'un qui découvre la cuisine française ?
Isabelle : Sans hésiter, la bouillabaisse marseillaise. C'est un plat qui raconte toute l'histoire de la Méditerranée.`,
    durationSec: 48,
    questions: [
      {
        id: 'q1',
        text: 'Qu\'a fait Isabelle Renard pour son nouveau livre ?',
        options: ['elle a voyagé en Europe', 'elle a parcouru toutes les régions de France', 'elle a interviewé des chefs étrangers', 'elle a étudié la cuisine asiatique'],
        correct: 'elle a parcouru toutes les régions de France',
      },
      {
        id: 'q2',
        text: 'Quel ingrédient est typique de la cuisine alsacienne selon Isabelle ?',
        options: ['le vin blanc', 'la bière', 'l\'huile d\'olive', 'le cidre'],
        correct: 'la bière',
      },
      {
        id: 'q3',
        text: 'Quelle menace pèse sur la cuisine régionale selon Isabelle ?',
        options: ['le manque d\'ingrédients', 'la mondialisation', 'le prix des produits', 'le manque de restaurants'],
        correct: 'la mondialisation',
      },
      {
        id: 'q4',
        text: 'Quel plat Isabelle recommande-t-elle en premier ?',
        options: ['la ratatouille', 'la quiche lorraine', 'la bouillabaisse marseillaise', 'le bœuf bourguignon'],
        correct: 'la bouillabaisse marseillaise',
      },
      {
        id: 'q5',
        text: 'Quel phénomène positif Isabelle mentionne-t-elle ?',
        options: ['l\'augmentation des restaurants', 'le retour aux produits locaux par les chefs', 'l\'ouverture d\'écoles de cuisine', 'la popularité de la cuisine française à l\'étranger'],
        correct: 'le retour aux produits locaux par les chefs',
      },
    ],
  },
  {
    title: 'Interview : un photographe de voyage',
    level: 'B1',
    transcript: `Journaliste : Lucas Martin, vous avez photographié plus de soixante pays. Qu'est-ce qui vous a poussé à choisir ce métier ?
Lucas : J'avais vingt-deux ans quand j'ai fait mon premier voyage en Asie du Sud-Est. J'avais un simple appareil photo numérique, pas de plan précis. Une photo que j'ai prise d'un enfant au Vietnam a été publiée dans un magazine. À partir de ce moment-là, j'ai su que c'était ma voie.
Journaliste : Quel est le pays qui vous a le plus marqué ?
Lucas : Sans aucun doute, l'Éthiopie. La lumière y est incroyable, les paysages sont variés et les gens sont d'une chaleur extraordinaire. J'y suis retourné quatre fois.
Journaliste : Quelles sont les difficultés de votre métier ?
Lucas : L'incertitude financière, d'abord. On ne sait jamais si une mission va être payée correctement. Ensuite, la solitude. On passe des mois loin de chez soi, loin de sa famille. Et parfois, on se retrouve dans des situations dangereuses.
Journaliste : Un conseil pour les jeunes qui veulent se lancer ?
Lucas : Ne pas attendre d'avoir le matériel parfait. Le meilleur appareil photo, c'est celui qu'on a avec soi.`,
    durationSec: 45,
    questions: [
      {
        id: 'q1',
        text: 'Quel âge avait Lucas lors de son premier voyage ?',
        options: ['dix-huit ans', 'vingt ans', 'vingt-deux ans', 'vingt-cinq ans'],
        correct: 'vingt-deux ans',
      },
      {
        id: 'q2',
        text: 'Où a été publiée sa première photo remarquée ?',
        options: ['sur internet', 'dans une galerie', 'dans un magazine', 'dans un livre'],
        correct: 'dans un magazine',
      },
      {
        id: 'q3',
        text: 'Quel pays l\'a le plus marqué et pourquoi ?',
        options: ['le Vietnam, pour ses enfants', 'l\'Éthiopie, pour sa lumière et ses gens', 'l\'Inde, pour ses couleurs', 'le Maroc, pour ses marchés'],
        correct: 'l\'Éthiopie, pour sa lumière et ses gens',
      },
      {
        id: 'q4',
        text: 'Quelle est la première difficulté qu\'il cite ?',
        options: ['les barrières linguistiques', 'les problèmes de visa', 'l\'incertitude financière', 'la chaleur des pays tropicaux'],
        correct: 'l\'incertitude financière',
      },
      {
        id: 'q5',
        text: 'Quel conseil donne-t-il aux jeunes photographes ?',
        options: ['apprendre plusieurs langues', 'investir dans le meilleur matériel', 'ne pas attendre d\'avoir l\'équipement parfait', 'faire des études de journalisme'],
        correct: 'ne pas attendre d\'avoir l\'équipement parfait',
      },
    ],
  },
  {
    title: 'Reportage : le tourisme durable',
    level: 'B1',
    transcript: `Présentatrice : Le tourisme de masse est de plus en plus critiqué pour ses effets négatifs sur l'environnement et les populations locales. Une alternative se développe : le tourisme durable. Notre reporter Camille Dubois a enquêté.
Camille : J'ai rencontré Marie, qui gère un petit hôtel écologique dans les Pyrénées. Elle m'a expliqué sa philosophie.
Marie : Ici, tout est fait pour respecter la nature. On utilise des énergies renouvelables, on achète nos produits chez les agriculteurs locaux, et on limite le nombre de visiteurs à vingt par semaine.
Camille : Cette approche a un coût : l'hôtel est trente pour cent plus cher que la moyenne. Mais les clients fidèles reviennent chaque année.
Marie : Nos clients cherchent une vraie connexion avec la nature. Ils veulent ralentir, observer les oiseaux, faire des randonnées. Ce n'est pas du tout le même état d'esprit que le touriste classique.
Camille : Le tourisme durable représente encore une faible part du marché, mais il connaît une croissance de quinze pour cent par an depuis cinq ans.`,
    durationSec: 44,
    questions: [
      {
        id: 'q1',
        text: 'Où se trouve l\'hôtel de Marie ?',
        options: ['dans les Alpes', 'en Bretagne', 'dans les Pyrénées', 'en Normandie'],
        correct: 'dans les Pyrénées',
      },
      {
        id: 'q2',
        text: 'Combien de visiteurs l\'hôtel accepte-t-il par semaine ?',
        options: ['dix', 'quinze', 'vingt', 'trente'],
        correct: 'vingt',
      },
      {
        id: 'q3',
        text: 'De combien cet hôtel est-il plus cher que la moyenne ?',
        options: ['dix pour cent', 'vingt pour cent', 'trente pour cent', 'cinquante pour cent'],
        correct: 'trente pour cent',
      },
      {
        id: 'q4',
        text: 'Quel est le taux de croissance annuel du tourisme durable ?',
        options: ['cinq pour cent', 'dix pour cent', 'quinze pour cent', 'vingt pour cent'],
        correct: 'quinze pour cent',
      },
      {
        id: 'q5',
        text: 'Qu\'est-ce que les clients de cet hôtel recherchent principalement ?',
        options: ['le luxe et le confort', 'une connexion avec la nature', 'des activités sportives extrêmes', 'la gastronomie locale'],
        correct: 'une connexion avec la nature',
      },
    ],
  },
  {
    title: 'Réunion de travail',
    level: 'B1',
    transcript: `Directrice : Bonjour à tous. Merci d'être venus. Aujourd'hui, nous devons discuter du lancement de notre nouveau produit prévu pour le mois prochain.
Antoine : J'ai analysé les résultats du sondage client. Soixante-dix pour cent des personnes interrogées ont dit qu'elles seraient prêtes à acheter le produit si le prix était en dessous de cinquante euros.
Directrice : Très bien. Et du côté de la production, Léa ?
Léa : Nous pouvons produire mille unités par semaine. Mais j'ai un problème : notre fournisseur principal a annoncé un retard de deux semaines sur la livraison des composants.
Directrice : Deux semaines... Ça compromet notre date de lancement. Est-ce qu'on peut trouver un autre fournisseur ?
Léa : J'ai contacté deux alternatives. L'une est dix pour cent plus chère mais peut livrer dans les délais.
Directrice : Je pense qu'on devrait accepter. On ne peut pas se permettre de retarder le lancement. Antoine, pouvez-vous préparer un plan de communication pour la semaine prochaine ?
Antoine : Bien sûr, je vous envoie une proposition d'ici vendredi.`,
    durationSec: 46,
    questions: [
      {
        id: 'q1',
        text: 'Quel pourcentage de clients seraient prêts à acheter le produit sous cinquante euros ?',
        options: ['cinquante pour cent', 'soixante pour cent', 'soixante-dix pour cent', 'quatre-vingts pour cent'],
        correct: 'soixante-dix pour cent',
      },
      {
        id: 'q2',
        text: 'Combien d\'unités peuvent-ils produire par semaine ?',
        options: ['cinq cents', 'huit cents', 'mille', 'deux mille'],
        correct: 'mille',
      },
      {
        id: 'q3',
        text: 'Quel est le problème avec le fournisseur principal ?',
        options: ['il a augmenté ses prix', 'il a un retard de deux semaines', 'il a fermé ses usines', 'il ne peut pas produire assez'],
        correct: 'il a un retard de deux semaines',
      },
      {
        id: 'q4',
        text: 'Quelle est la différence de prix avec le fournisseur alternatif ?',
        options: ['cinq pour cent moins cher', 'cinq pour cent plus cher', 'dix pour cent plus cher', 'vingt pour cent plus cher'],
        correct: 'dix pour cent plus cher',
      },
      {
        id: 'q5',
        text: 'Quand Antoine doit-il envoyer sa proposition de plan de communication ?',
        options: ['lundi', 'mercredi', 'vendredi', 'le mois prochain'],
        correct: 'vendredi',
      },
    ],
  },
  {
    title: 'Débat : les réseaux sociaux',
    level: 'B1',
    transcript: `Modératrice : Bonsoir. Ce soir, nous débattons de l'impact des réseaux sociaux sur la société. Emma, vous pensez que les réseaux sociaux sont globalement positifs ?
Emma : Oui. Ils permettent de maintenir des liens avec des gens qui vivent loin, de partager des informations rapidement et de donner une voix à des personnes qui n'en avaient pas. Pensez aux mouvements sociaux qui ont émergé grâce à Twitter ou Instagram.
Modératrice : Hugo, vous n'êtes pas d'accord ?
Hugo : Absolument pas. Les études montrent que les réseaux sociaux augmentent l'anxiété et la dépression, surtout chez les adolescents. On est constamment en train de se comparer aux autres. De plus, les algorithmes créent des bulles d'information où on ne voit que ce qu'on veut voir.
Emma : Je suis d'accord qu'il y a des problèmes, mais la solution n'est pas d'interdire les réseaux sociaux. Il faut mieux les réguler et éduquer les utilisateurs.
Hugo : Éduquer, oui. Mais il faut aussi que les plateformes prennent leurs responsabilités. Elles gagnent de l'argent grâce à notre attention, elles doivent en assumer les conséquences.`,
    durationSec: 47,
    questions: [
      {
        id: 'q1',
        text: 'Selon Emma, quel est un avantage important des réseaux sociaux ?',
        options: ['gagner de l\'argent facilement', 'maintenir des liens avec des gens qui vivent loin', 'trouver un emploi rapidement', 'apprendre de nouvelles langues'],
        correct: 'maintenir des liens avec des gens qui vivent loin',
      },
      {
        id: 'q2',
        text: 'Selon les études citées par Hugo, quel problème de santé les réseaux sociaux aggravent-ils ?',
        options: ['les problèmes de dos', 'les troubles du sommeil', 'l\'anxiété et la dépression', 'les maux de tête'],
        correct: 'l\'anxiété et la dépression',
      },
      {
        id: 'q3',
        text: 'Qu\'est-ce qu\'une « bulle d\'information » selon Hugo ?',
        options: ['une application payante', 'un espace où on ne voit que ce qu\'on veut voir', 'une chaîne d\'information en ligne', 'un groupe fermé sur les réseaux sociaux'],
        correct: 'un espace où on ne voit que ce qu\'on veut voir',
      },
      {
        id: 'q4',
        text: 'Quelle solution Emma propose-t-elle ?',
        options: ['interdire les réseaux sociaux', 'taxer les plateformes', 'mieux réguler et éduquer les utilisateurs', 'limiter le temps d\'écran par loi'],
        correct: 'mieux réguler et éduquer les utilisateurs',
      },
    ],
  },
  {
    title: 'Podcast : l\'éducation en France',
    level: 'B1',
    transcript: `Présentateur : Bienvenue dans « La France en questions ». Aujourd'hui, on s'intéresse au système éducatif français avec Nathalie Perrin, sociologue spécialisée dans l'éducation.
Nathalie : Merci de me recevoir.
Présentateur : Le système scolaire français est souvent critiqué pour être trop compétitif et stressant. Qu'en pensez-vous ?
Nathalie : C'est vrai que la note chiffrée sur vingt et les classements créent beaucoup de pression. Les élèves ont peur d'échouer plutôt qu'envie d'apprendre. C'est paradoxal.
Présentateur : Qu'est-ce qui fonctionne bien, selon vous ?
Nathalie : La gratuité de l'enseignement public est un vrai atout. N'importe quel enfant, quelle que soit la situation financière de ses parents, peut accéder à une bonne éducation théoriquement. En pratique, les inégalités restent importantes selon les quartiers.
Présentateur : Comment améliorer le système ?
Nathalie : Il faudrait valoriser davantage les filières professionnelles. En France, on considère encore que les études longues sont supérieures aux formations courtes, ce qui est une erreur. Les besoins du marché du travail ne correspondent pas à cette vision.`,
    durationSec: 45,
    questions: [
      {
        id: 'q1',
        text: 'Sur combien est notée la plupart des travaux en France ?',
        options: ['sur dix', 'sur quinze', 'sur vingt', 'sur cent'],
        correct: 'sur vingt',
      },
      {
        id: 'q2',
        text: 'Quel est l\'effet négatif du système de notation selon Nathalie ?',
        options: ['les élèves trichent plus', 'les élèves ont peur d\'échouer plutôt qu\'envie d\'apprendre', 'les professeurs travaillent moins', 'les parents s\'impliquent trop'],
        correct: 'les élèves ont peur d\'échouer plutôt qu\'envie d\'apprendre',
      },
      {
        id: 'q3',
        text: 'Quel avantage du système français Nathalie reconnaît-elle ?',
        options: ['les petites classes', 'les vacances longues', 'la gratuité de l\'enseignement public', 'les bons résultats aux classements internationaux'],
        correct: 'la gratuité de l\'enseignement public',
      },
      {
        id: 'q4',
        text: 'Quelle amélioration Nathalie suggère-t-elle ?',
        options: ['allonger les études', 'valoriser davantage les filières professionnelles', 'supprimer les notes', 'réduire les vacances scolaires'],
        correct: 'valoriser davantage les filières professionnelles',
      },
    ],
  },
  {
    title: 'Conversation : logement à Paris',
    level: 'B1',
    transcript: `Julien : Alors, tu as trouvé quelque chose pour ton appartement ?
Claire : Oui, enfin ! J'ai visité douze appartements en trois semaines. C'était épuisant. Les prix sont vraiment devenus fous à Paris.
Julien : Tu as pris quoi au final ?
Claire : Un deux-pièces dans le onzième arrondissement. Cinquante mètres carrés pour mille deux cents euros par mois, charges comprises. C'est cher, mais c'est rénové et bien situé, à cinq minutes du métro.
Julien : Tu as eu du mal à convaincre le propriétaire ?
Claire : Oui ! Il voulait absolument un garant français, un CDI depuis plus de deux ans et des revenus trois fois supérieurs au loyer. J'ai dû faire appel à mes parents pour se porter garants.
Julien : C'est vraiment difficile pour les jeunes. Moi, j'ai mis quatre mois à trouver mon studio.
Claire : La situation est insoutenable. Beaucoup de gens qui travaillent à Paris doivent habiter en banlieue parce qu'ils ne peuvent pas se permettre les loyers du centre.`,
    durationSec: 43,
    questions: [
      {
        id: 'q1',
        text: 'Combien d\'appartements Claire a-t-elle visités avant de trouver ?',
        options: ['cinq', 'huit', 'dix', 'douze'],
        correct: 'douze',
      },
      {
        id: 'q2',
        text: 'Dans quel arrondissement est son nouvel appartement ?',
        options: ['le cinquième', 'le dixième', 'le onzième', 'le vingtième'],
        correct: 'le onzième',
      },
      {
        id: 'q3',
        text: 'Quel est le loyer mensuel de l\'appartement de Claire ?',
        options: ['neuf cents euros', 'mille euros', 'mille deux cents euros', 'mille cinq cents euros'],
        correct: 'mille deux cents euros',
      },
      {
        id: 'q4',
        text: 'Quelle condition le propriétaire imposait-il concernant les revenus ?',
        options: ['deux fois le loyer', 'deux fois et demie le loyer', 'trois fois le loyer', 'quatre fois le loyer'],
        correct: 'trois fois le loyer',
      },
      {
        id: 'q5',
        text: 'Combien de temps Julien a-t-il mis pour trouver son studio ?',
        options: ['un mois', 'deux mois', 'trois mois', 'quatre mois'],
        correct: 'quatre mois',
      },
    ],
  },
  {
    title: 'Reportage : les Français à l\'étranger',
    level: 'B1',
    transcript: `Journaliste : Plus de deux millions de Français vivent à l'étranger. Pourquoi quittent-ils la France ? Nous avons rencontré trois expatriés.
Marc, installé au Canada depuis cinq ans : J'ai choisi Montréal pour la qualité de vie et les opportunités professionnelles dans mon domaine, l'informatique. Les salaires sont bien meilleurs qu'en France et les impôts moins élevés. Je ne regrette pas mon choix, même si ma famille me manque.
Fatima, qui vit à Dubaï depuis trois ans : Je suis ingénieure et j'avais du mal à évoluer professionnellement en France. À Dubaï, j'ai été embauchée par une grande entreprise internationale avec un salaire deux fois plus élevé. La vie est très différente, mais je m'y suis adaptée.
Pierre, parti en Australie il y a deux ans : J'ai voulu vivre l'aventure. L'Australie offre un mode de vie plus détendu, plus proche de la nature. Je travaille dans la restauration et j'économise pour voyager. Je rentrerai peut-être un jour en France, mais pas tout de suite.`,
    durationSec: 48,
    questions: [
      {
        id: 'q1',
        text: 'Combien de Français vivent à l\'étranger selon le reportage ?',
        options: ['un million', 'deux millions', 'trois millions', 'cinq millions'],
        correct: 'deux millions',
      },
      {
        id: 'q2',
        text: 'Dans quel secteur travaille Marc ?',
        options: ['la finance', 'la médecine', 'l\'informatique', 'l\'éducation'],
        correct: 'l\'informatique',
      },
      {
        id: 'q3',
        text: 'Pourquoi Fatima a-t-elle quitté la France ?',
        options: ['pour suivre son mari', 'à cause du climat', 'parce qu\'elle avait du mal à évoluer professionnellement', 'pour apprendre une nouvelle langue'],
        correct: 'parce qu\'elle avait du mal à évoluer professionnellement',
      },
      {
        id: 'q4',
        text: 'Dans quel domaine Pierre travaille-t-il en Australie ?',
        options: ['le tourisme', 'la restauration', 'l\'agriculture', 'la construction'],
        correct: 'la restauration',
      },
      {
        id: 'q5',
        text: 'Quel est l\'objectif de Pierre avec ses économies ?',
        options: ['acheter une maison', 'ouvrir un restaurant', 'voyager', 'retourner en France'],
        correct: 'voyager',
      },
    ],
  },
  {
    title: 'Interview : une écrivaine',
    level: 'B1',
    transcript: `Journaliste : Votre roman « Le silence des forêts » vient de recevoir le Prix du livre de l'année. Comment vous sentez-vous ?
Aurélie Blanc : Honnêtement, je suis encore sous le choc. Je n'avais pas du tout prévu cette reconnaissance. J'ai écrit ce livre pendant deux ans, dans ma cuisine, le soir après le travail.
Journaliste : Ce roman parle de la relation entre une mère et sa fille adulte. Est-ce autobiographique ?
Aurélie : En partie. J'ai perdu ma propre mère il y a six ans et cette douleur est dans le livre, c'est vrai. Mais les personnages sont fictifs. J'ai voulu explorer quelque chose d'universel : comment on fait le deuil d'une relation compliquée.
Journaliste : Écrire a-t-il été thérapeutique pour vous ?
Aurélie : Oui et non. Certains chapitres étaient très difficiles à écrire, je pleurais. Mais à la fin, j'avais l'impression d'avoir réglé quelque chose en moi.
Journaliste : Quel est votre prochain projet ?
Aurélie : Je travaille sur quelque chose de très différent : un roman historique qui se passe pendant la Première Guerre mondiale. J'ai besoin de changer d'univers.`,
    durationSec: 46,
    questions: [
      {
        id: 'q1',
        text: 'Quel prix Aurélie Blanc vient-elle de recevoir ?',
        options: ['le Prix Goncourt', 'le Prix du livre de l\'année', 'le Prix Renaudot', 'le Prix Femina'],
        correct: 'le Prix du livre de l\'année',
      },
      {
        id: 'q2',
        text: 'Pendant combien de temps a-t-elle écrit ce roman ?',
        options: ['six mois', 'un an', 'deux ans', 'trois ans'],
        correct: 'deux ans',
      },
      {
        id: 'q3',
        text: 'Quelle expérience personnelle a influencé le roman ?',
        options: ['son divorce', 'la perte de sa mère', 'une maladie', 'un voyage lointain'],
        correct: 'la perte de sa mère',
      },
      {
        id: 'q4',
        text: 'Comment Aurélie décrit-elle l\'écriture de certains chapitres ?',
        options: ['très amusante', 'ennuyeuse', 'très difficile, elle pleurait', 'rapide et facile'],
        correct: 'très difficile, elle pleurait',
      },
      {
        id: 'q5',
        text: 'Sur quoi porte son prochain roman ?',
        options: ['la Seconde Guerre mondiale', 'la Révolution française', 'la Première Guerre mondiale', 'la période médiévale'],
        correct: 'la Première Guerre mondiale',
      },
    ],
  },
  {
    title: 'Émission : la santé au travail',
    level: 'B1',
    transcript: `Présentateur : Le burn-out, ou épuisement professionnel, touche de plus en plus de travailleurs en France. Selon une étude récente, trente-quatre pour cent des salariés français se disent en situation de burn-out. Notre invitée, la psychologue Caroline Vidal, nous explique ce phénomène.
Caroline : Le burn-out n'est pas simplement de la fatigue. C'est un épuisement profond qui touche à la fois le corps, les émotions et le mental. La personne perd toute motivation et a le sentiment que rien de ce qu'elle fait n'a de sens.
Présentateur : Quelles sont les causes principales ?
Caroline : La surcharge de travail bien sûr, mais aussi le manque de reconnaissance, le sentiment de perdre le contrôle de son travail, et de mauvaises relations avec ses supérieurs. La frontière floue entre vie professionnelle et vie personnelle, surtout depuis le télétravail, est aussi un facteur important.
Présentateur : Comment s'en sortir ?
Caroline : D'abord, reconnaître les signes avant-coureurs : troubles du sommeil, irritabilité, perte d'enthousiasme. Ensuite, en parler à un médecin. Il ne faut surtout pas culpabiliser : le burn-out n'est pas une faiblesse, c'est une maladie.`,
    durationSec: 47,
    questions: [
      {
        id: 'q1',
        text: 'Quel pourcentage de salariés français se déclarent en situation de burn-out ?',
        options: ['vingt pour cent', 'vingt-cinq pour cent', 'trente pour cent', 'trente-quatre pour cent'],
        correct: 'trente-quatre pour cent',
      },
      {
        id: 'q2',
        text: 'Selon Caroline, le burn-out est un épuisement qui touche combien de dimensions ?',
        options: ['une seule', 'deux', 'trois', 'quatre'],
        correct: 'trois',
      },
      {
        id: 'q3',
        text: 'Quel facteur lié au télétravail est mentionné ?',
        options: ['l\'isolement', 'la mauvaise connexion internet', 'la frontière floue entre vie pro et vie perso', 'le manque d\'espace de travail'],
        correct: 'la frontière floue entre vie pro et vie perso',
      },
      {
        id: 'q4',
        text: 'Lequel de ces signes avant-coureurs Caroline mentionne-t-elle ?',
        options: ['les maux de dos', 'les troubles du sommeil', 'la prise de poids', 'les problèmes de mémoire'],
        correct: 'les troubles du sommeil',
      },
      {
        id: 'q5',
        text: 'Quel message Caroline veut-elle faire passer concernant le burn-out ?',
        options: ['c\'est une faiblesse personnelle', 'c\'est une maladie, pas une faiblesse', 'c\'est impossible à guérir', 'c\'est dû uniquement au travail excessif'],
        correct: 'c\'est une maladie, pas une faiblesse',
      },
    ],
  },
  {
    title: 'Discussion : l\'identité culturelle',
    level: 'B1',
    transcript: `Professeure : Nous allons discuter aujourd'hui d'un sujet complexe : l'identité culturelle. Est-ce qu'on peut avoir plusieurs identités culturelles ? Karim ?
Karim : Je pense que oui. Moi par exemple, je me sens à la fois français et algérien. Ce n'est pas contradictoire. J'ai grandi en France mais mes parents m'ont transmis la langue, la cuisine et les traditions algériennes. J'aime les deux.
Professeure : Et toi, Yuna ?
Yuna : C'est intéressant. Je suis Coréenne mais j'ai vécu en France depuis l'âge de huit ans. Parfois je ne sais plus vraiment où est « chez moi ». En Corée, on me voit comme une Française. En France, on me voit comme une Coréenne. Je me sens entre les deux cultures.
Professeure : Ce sentiment s'appelle parfois « l'entre-deux culturel ». C'est à la fois une richesse et une source de questionnement. Julien, en tant que Français « de souche », as-tu réfléchi à ta propre identité culturelle ?
Julien : Honnêtement, moins que mes camarades. Mais cette discussion m'a fait réaliser que l'identité n'est pas fixe. On évolue, on rencontre d'autres cultures, et ça nous transforme.`,
    durationSec: 49,
    questions: [
      {
        id: 'q1',
        text: 'Quelles sont les deux identités culturelles que Karim revendique ?',
        options: ['française et marocaine', 'française et tunisienne', 'française et algérienne', 'française et sénégalaise'],
        correct: 'française et algérienne',
      },
      {
        id: 'q2',
        text: 'À quel âge Yuna est-elle arrivée en France ?',
        options: ['à cinq ans', 'à six ans', 'à huit ans', 'à dix ans'],
        correct: 'à huit ans',
      },
      {
        id: 'q3',
        text: 'Comment les Coréens perçoivent-ils Yuna quand elle est en Corée ?',
        options: ['comme une Coréenne', 'comme une Française', 'comme une étrangère', 'comme une touriste'],
        correct: 'comme une Française',
      },
      {
        id: 'q4',
        text: 'Comment s\'appelle le sentiment décrit par la professeure ?',
        options: ['la double nationalité', 'l\'exil culturel', 'l\'entre-deux culturel', 'le choc des cultures'],
        correct: 'l\'entre-deux culturel',
      },
      {
        id: 'q5',
        text: 'Quelle réflexion Julien tire-t-il de la discussion ?',
        options: ['l\'identité est figée et ne change pas', 'l\'identité évolue au contact des autres cultures', 'la culture française est supérieure', 'il faut choisir une seule identité'],
        correct: 'l\'identité évolue au contact des autres cultures',
      },
    ],
  },
];
