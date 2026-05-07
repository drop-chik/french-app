export interface ListeningExerciseSeedB2 {
  title: string;
  level: 'B2';
  transcript: string;
  durationSec: number;
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    correct: string;
  }>;
}

export const listeningExercisesB2: ListeningExerciseSeedB2[] = [
  {
    title: 'Débat : la transition écologique',
    level: 'B2',
    transcript: `Modératrice : Ce soir, nous débattons de la transition écologique en France. Est-elle réalisable sans sacrifier la croissance économique ? Élise Arnaud, économiste, vous pensez que ces deux objectifs sont incompatibles ?
Élise : Je ne dirais pas incompatibles, mais ils sont en tension profonde. Toute politique sérieuse de décarbonation implique des coûts immédiats — fermeture d'industries carbonées, reconversion des travailleurs, hausse des prix de l'énergie. Ces coûts pèsent davantage sur les ménages modestes. Si on ne le gère pas politiquement, on crée des fractures sociales explosives, comme on l'a vu avec le mouvement des Gilets jaunes en 2018.
Modératrice : Raphaël Verne, vous représentez une association environnementale. Vous réfutez cette analyse ?
Raphaël : Partiellement. Il est vrai que la transition a un coût. Mais l'inaction a un coût encore plus élevé : catastrophes naturelles, perte de biodiversité, migrations climatiques. Les économistes estiment que chaque euro investi dans la prévention permet d'éviter sept euros de dommages futurs. La vraie question n'est pas « peut-on se le permettre ? » mais « peut-on se permettre de ne pas le faire ? »
Élise : Je suis d'accord sur le fond. Là où on diverge, c'est sur la vitesse et la méthode. Une transition brutale et non accompagnée peut générer des résistances qui la feront reculer de dix ans.
Raphaël : Et une transition trop lente nous condamne à dépasser les seuils irréversibles. C'est le vrai dilemme.`,
    durationSec: 68,
    questions: [
      {
        id: 'q1',
        text: 'Selon Élise, quel mouvement social illustre les risques d\'une mauvaise gestion politique de la transition ?',
        options: ['la grève des cheminots', 'le mouvement des Gilets jaunes', 'les manifestations lycéennes', 'les grèves de 1995'],
        correct: 'le mouvement des Gilets jaunes',
      },
      {
        id: 'q2',
        text: 'Selon Raphaël, quel est le rapport entre coût de prévention et coût des dommages évités ?',
        options: ['1 pour 3', '1 pour 5', '1 pour 7', '1 pour 10'],
        correct: '1 pour 7',
      },
      {
        id: 'q3',
        text: 'Sur quel point Élise et Raphaël sont-ils d\'accord ?',
        options: ['la transition doit être immédiate', 'la transition a un coût réel', 'l\'inaction est sans danger', 'les ménages modestes ne sont pas touchés'],
        correct: 'la transition a un coût réel',
      },
      {
        id: 'q4',
        text: 'Selon Élise, une transition trop brutale risque de :',
        options: ['augmenter les impôts', 'générer des résistances qui la feront reculer', 'provoquer une crise bancaire', 'augmenter les émissions de carbone'],
        correct: 'générer des résistances qui la feront reculer',
      },
      {
        id: 'q5',
        text: 'Comment Raphaël qualifie-t-il le vrai dilemme de la transition ?',
        options: ['vitesse vs qualité', 'transition trop lente vs dépassement des seuils irréversibles', 'coût vs bénéfice', 'local vs global'],
        correct: 'transition trop lente vs dépassement des seuils irréversibles',
      },
    ],
  },
  {
    title: 'Interview : l\'intelligence artificielle en médecine',
    level: 'B2',
    transcript: `Journaliste : Professeur Karim Benali, vous êtes radiologue et vous utilisez l'IA dans votre pratique quotidienne depuis trois ans. Qu'est-ce que ça a changé concrètement ?
Pr Benali : L'IA analyse les images médicales — scanners, IRM, radiographies — avec une précision qui dépasse parfois celle d'un radiologue humain pour certaines tâches répétitives. Sur les dépistages du cancer du sein notamment, les algorithmes détectent des anomalies que l'œil humain aurait pu manquer à un stade très précoce. Dans mon service, nous avons réduit les faux négatifs de vingt-deux pour cent en deux ans.
Journaliste : Cela signifie-t-il que le radiologue va disparaître ?
Pr Benali : Absolument pas. L'IA ne remplace pas le médecin, elle l'augmente. Elle prend en charge les tâches de détection et me libère du temps pour ce que je sais faire mieux qu'une machine : comprendre le patient dans sa globalité, intégrer le contexte clinique, communiquer avec l'équipe soignante. Il faut cependant être honnête : certains sous-spécialités très codifiées sont effectivement menacées.
Journaliste : Quels sont les risques que vous identifiez ?
Pr Benali : Deux principaux. D'abord, le problème des biais algorithmiques : si les données d'entraînement surreprésentent certaines populations, l'IA sera moins performante pour d'autres. C'est un problème d'équité en santé. Ensuite, la responsabilité juridique : en cas d'erreur, qui est responsable — le médecin, l'éditeur du logiciel, l'hôpital ? Cette question n'est pas encore réglée.`,
    durationSec: 65,
    questions: [
      {
        id: 'q1',
        text: 'Combien de temps le Pr Benali utilise-t-il l\'IA dans sa pratique ?',
        options: ['un an', 'deux ans', 'trois ans', 'cinq ans'],
        correct: 'trois ans',
      },
      {
        id: 'q2',
        text: 'De combien le service a-t-il réduit les faux négatifs grâce à l\'IA ?',
        options: ['dix pour cent', 'quinze pour cent', 'dix-huit pour cent', 'vingt-deux pour cent'],
        correct: 'vingt-deux pour cent',
      },
      {
        id: 'q3',
        text: 'Selon le Pr Benali, que peut faire le médecin mieux que la machine ?',
        options: ['analyser les images médicales plus vite', 'détecter les anomalies précoces', 'comprendre le patient dans sa globalité', 'mémoriser les protocoles médicaux'],
        correct: 'comprendre le patient dans sa globalité',
      },
      {
        id: 'q4',
        text: 'Qu\'est-ce qu\'un biais algorithmique selon le Pr Benali ?',
        options: ['une erreur de calcul du logiciel', 'une moindre performance pour des populations sous-représentées dans les données', 'un bug informatique aléatoire', 'une différence de vitesse de traitement'],
        correct: 'une moindre performance pour des populations sous-représentées dans les données',
      },
      {
        id: 'q5',
        text: 'Quelle question juridique reste non résolue selon le Pr Benali ?',
        options: ['le coût des logiciels médicaux', 'le financement par la Sécurité sociale', 'la responsabilité en cas d\'erreur de l\'IA', 'la protection des données patients'],
        correct: 'la responsabilité en cas d\'erreur de l\'IA',
      },
    ],
  },
  {
    title: 'Reportage : la gentrification à Paris',
    level: 'B2',
    transcript: `Voix off : Le quartier de la Goutte d'Or, dans le dix-huitième arrondissement de Paris, est en pleine mutation. Il y a vingt ans, ce quartier populaire, à majorité immigrée, était marqué par la pauvreté et l'insécurité. Aujourd'hui, les loyers ont triplé en dix ans, les commerces ethniques cèdent la place aux coffee shops branchés, et les habitants historiques sont progressivement repoussés vers la périphérie. Ce phénomène s'appelle la gentrification.
Aminata Diallo, habitante depuis trente ans : Ma mère est arrivée ici en 1975, elle a tout construit ici. Mon enfance, c'est ce quartier. Il y a cinq ans, mon propriétaire a doublé le loyer. J'ai dû partir. Beaucoup de mes voisins aussi. On a été remplacés par des gens avec de l'argent qui veulent l' « authenticité » du quartier — mais sans les gens qui lui donnaient cette authenticité.
Journaliste : Renaud Leclerc est urbaniste à la mairie de Paris.
Renaud Leclerc : La gentrification est un processus complexe. Il n'y a pas de volonté délibérée de chasser les populations pauvres. C'est le marché qui produit ces effets. La mairie essaie d'agir avec des outils comme le droit de préemption, le logement social, l'encadrement des loyers. Mais ces outils ont leurs limites face à la pression du marché immobilier parisien, l'un des plus tendus d'Europe.`,
    durationSec: 62,
    questions: [
      {
        id: 'q1',
        text: 'Dans quel arrondissement de Paris se situe la Goutte d\'Or ?',
        options: ['le quinzième', 'le dix-septième', 'le dix-huitième', 'le dix-neuvième'],
        correct: 'le dix-huitième',
      },
      {
        id: 'q2',
        text: 'Combien les loyers ont-ils augmenté en dix ans dans ce quartier ?',
        options: ['ils ont doublé', 'ils ont triplé', 'ils ont quadruplé', 'ils ont augmenté de cinquante pour cent'],
        correct: 'ils ont triplé',
      },
      {
        id: 'q3',
        text: 'Pourquoi Aminata a-t-elle dû quitter le quartier ?',
        options: ['son immeuble a été démoli', 'son propriétaire a doublé le loyer', 'elle a trouvé un appartement plus grand ailleurs', 'elle a perdu son emploi'],
        correct: 'son propriétaire a doublé le loyer',
      },
      {
        id: 'q4',
        text: 'Selon Renaud Leclerc, d\'où vient la gentrification ?',
        options: ['d\'une politique volontaire de la mairie', 'de décisions des promoteurs immobiliers', 'des mécanismes du marché', 'de la spéculation étrangère'],
        correct: 'des mécanismes du marché',
      },
      {
        id: 'q5',
        text: 'Quel outil d\'action la mairie utilise-t-elle face à la gentrification ?',
        options: ['l\'expropriation des propriétaires', 'l\'interdiction de vente aux étrangers', 'l\'encadrement des loyers', 'la construction d\'hôtels sociaux'],
        correct: 'l\'encadrement des loyers',
      },
    ],
  },
  {
    title: 'Émission : les inégalités numériques',
    level: 'B2',
    transcript: `Animatrice : Bienvenue dans « Questions d'avenir ». Nous parlons aujourd'hui de la fracture numérique avec Stéphanie Morin, directrice d'une association d'insertion numérique.
Stéphanie : Merci. Ce sujet me tient particulièrement à cœur car on en parle peu alors qu'il conditionne de plus en plus l'accès aux droits fondamentaux.
Animatrice : Concrètement, qu'est-ce que cela signifie pour les gens que vous accompagnez ?
Stéphanie : Depuis 2015, la France a dématérialisé massivement ses services publics. Pour renouveler ses papiers d'identité, demander des allocations, s'inscrire à Pôle emploi, il faut un ordinateur et savoir s'en servir. Douze millions de Français sont en situation d'illectronisme — incapacité à utiliser correctement les outils numériques. Ce sont souvent les mêmes personnes qui cumulent d'autres difficultés : âge, pauvreté, faible niveau de diplôme, isolement géographique.
Animatrice : L'État n'a-t-il pas mis en place des solutions ?
Stéphanie : Si, les Espaces Publics Numériques et le programme « Aidants Connect ». Mais ces dispositifs sont chroniquement sous-financés. On estime qu'il faudrait trois fois plus de médiateurs numériques pour répondre aux besoins. Il y a une contradiction flagrante : on dématérialise à marche forcée tout en sous-investissant dans l'accompagnement des exclus du numérique.
Animatrice : Est-ce que la fracture va se résorber naturellement avec le temps ?
Stéphanie : C'est l'argument qu'on entend souvent. Mais non. Les seniors qui n'ont pas appris à l'école ne vont pas apprendre seuls. Et pendant ce temps, les technologies évoluent plus vite que les gens ne peuvent s'adapter.`,
    durationSec: 70,
    questions: [
      {
        id: 'q1',
        text: 'Depuis quelle année la France a-t-elle massivement dématérialisé ses services publics ?',
        options: ['2010', '2015', '2018', '2020'],
        correct: '2015',
      },
      {
        id: 'q2',
        text: 'Combien de Français sont en situation d\'illectronisme ?',
        options: ['cinq millions', 'huit millions', 'douze millions', 'vingt millions'],
        correct: 'douze millions',
      },
      {
        id: 'q3',
        text: 'Selon Stéphanie, combien de médiateurs numériques supplémentaires seraient nécessaires ?',
        options: ['deux fois plus', 'trois fois plus', 'quatre fois plus', 'cinq fois plus'],
        correct: 'trois fois plus',
      },
      {
        id: 'q4',
        text: 'Quelle contradiction Stéphanie identifie-t-elle dans la politique de l\'État ?',
        options: ['déployer la fibre mais pas la 4G', 'dématérialiser vite mais sous-investir dans l\'accompagnement', 'former des médiateurs mais mal les payer', 'créer des applications mais sans design intuitif'],
        correct: 'dématérialiser vite mais sous-investir dans l\'accompagnement',
      },
      {
        id: 'q5',
        text: 'Pourquoi Stéphanie rejette-t-elle l\'argument «la fracture se résorbe avec le temps» ?',
        options: ['parce que les seniors ne liront jamais bien', 'parce que les technologies évoluent plus vite que les gens ne peuvent s\'adapter', 'parce que internet est trop cher', 'parce que les entreprises ne forment pas leurs employés'],
        correct: 'parce que les technologies évoluent plus vite que les gens ne peuvent s\'adapter',
      },
    ],
  },
  {
    title: 'Conférence : migrations climatiques',
    level: 'B2',
    transcript: `Intervenant : Je m'appelle Hassan Taibi, je suis chercheur au CNRS et je travaille sur les migrations induites par le changement climatique. C'est un sujet qui va devenir central dans les décennies à venir et pour lequel nous sommes très mal préparés politiquement.
Les projections actuelles indiquent que d'ici 2050, entre deux cent et un milliard deux cents millions de personnes pourraient être contraintes de quitter leur région d'origine à cause de la montée des eaux, des sécheresses, des cyclones ou de l'effondrement de l'agriculture. La fourchette est large parce qu'elle dépend de nos choix collectifs : si le réchauffement se limite à 1,5 degré, le nombre est gérable ; à 3 ou 4 degrés, c'est un bouleversement sans précédent.
Ce qui est important de comprendre, c'est que ces migrants ne seront pas tous des réfugiés internationaux. La grande majorité se déplacera à l'intérieur de leur propre pays — des côtes vers les terres hautes, des zones arides vers des zones avec de l'eau. Mais une partie significative n'aura pas d'autre choix que de franchir des frontières.
La communauté internationale n'est pas préparée. Le droit international ne reconnaît pas les « réfugiés climatiques » comme catégorie juridique. Il faudra réformer la Convention de Genève ou créer un nouveau cadre. Chaque année qu'on attend, ce problème devient plus difficile à résoudre.`,
    durationSec: 72,
    questions: [
      {
        id: 'q1',
        text: 'Selon les projections, combien de personnes pourraient migrer d\'ici 2050 dans le scénario le plus pessimiste ?',
        options: ['deux cents millions', 'cinq cents millions', 'un milliard', 'un milliard deux cents millions'],
        correct: 'un milliard deux cents millions',
      },
      {
        id: 'q2',
        text: 'À quel réchauffement le nombre de migrants climatiques reste-t-il «gérable» selon le chercheur ?',
        options: ['1 degré', '1,5 degré', '2 degrés', '2,5 degrés'],
        correct: '1,5 degré',
      },
      {
        id: 'q3',
        text: 'Où la grande majorité des migrants climatiques se déplacera-t-elle ?',
        options: ['vers l\'Europe et l\'Amérique du Nord', 'vers des zones côtières', 'à l\'intérieur de leur propre pays', 'vers des pays voisins'],
        correct: 'à l\'intérieur de leur propre pays',
      },
      {
        id: 'q4',
        text: 'Quel problème juridique majeur le chercheur souligne-t-il ?',
        options: ['les frontières numériques ne sont pas définies', 'les «réfugiés climatiques» ne sont pas reconnus en droit international', 'les pays riches refusent de signer les accords', 'les ONG n\'ont pas de statut légal'],
        correct: 'les «réfugiés climatiques» ne sont pas reconnus en droit international',
      },
      {
        id: 'q5',
        text: 'Quelle solution juridique Hassan Taibi mentionne-t-il ?',
        options: ['créer des zones franches climatiques', 'réformer la Convention de Genève ou créer un nouveau cadre', 'instaurer un visa climatique mondial', 'renforcer les contrôles aux frontières'],
        correct: 'réformer la Convention de Genève ou créer un nouveau cadre',
      },
    ],
  },
  {
    title: 'Débat : la liberté de presse à l\'ère numérique',
    level: 'B2',
    transcript: `Présentatrice : Bonsoir. La liberté de la presse est-elle menacée par les plateformes numériques ? C'est la question que nous posons ce soir à deux expertes. Laura Petit, journaliste et présidente d'un syndicat de la presse, et Diane Arnoux, chercheuse en communication numérique.
Laura : La liberté de la presse est formellement préservée, mais ses conditions d'exercice sont profondément dégradées. Les médias traditionnels ont perdu des revenus publicitaires colossaux au profit de Google et Meta. Les rédactions ont réduit leurs effectifs. Il y a moins de journalistes pour faire plus de travail, ce qui nuit à la qualité de l'investigation. Et paradoxalement, nous dépendons de ces mêmes plateformes pour toucher notre audience.
Diane : Laura a raison sur le diagnostic économique. Mais je voudrais souligner un autre problème : la désinformation. Les plateformes ont créé un écosystème où une rumeur peut se propager aussi vite — voire plus vite — qu'une information vérifiée. L'algorithme favorise ce qui crée de l'engagement émotionnel, c'est-à-dire souvent l'indignation et la peur, pas la nuance.
Laura : Et les médias mainstream sont pris en étau entre deux feux : s'ils ne couvrent pas les sujets viraux, ils perdent de la visibilité. S'ils les couvrent, ils alimentent parfois la machine à désinformation.
Diane : La régulation est inévitable. Le règlement européen DSA — Digital Services Act — est un premier pas. Mais les plateformes ont des ressources juridiques infiniment supérieures à celles des États pour contester ces régulations.`,
    durationSec: 67,
    questions: [
      {
        id: 'q1',
        text: 'Selon Laura, au profit de qui les médias traditionnels ont-ils perdu des revenus publicitaires ?',
        options: ['des chaînes de télévision privées', 'de Google et Meta', 'des podcasts indépendants', 'de la presse gratuite'],
        correct: 'de Google et Meta',
      },
      {
        id: 'q2',
        text: 'Quel type de contenu l\'algorithme favorise-t-il selon Diane ?',
        options: ['les contenus éducatifs', 'les analyses économiques', 'ce qui crée de l\'engagement émotionnel comme l\'indignation', 'les reportages de terrain'],
        correct: 'ce qui crée de l\'engagement émotionnel comme l\'indignation',
      },
      {
        id: 'q3',
        text: 'Dans quel «étau» les médias mainstream se retrouvent-ils selon Laura ?',
        options: ['entre l\'État et les annonceurs', 'entre couvrir les sujets viraux ou perdre de la visibilité', 'entre la presse papier et numérique', 'entre journalisme et divertissement'],
        correct: 'entre couvrir les sujets viraux ou perdre de la visibilité',
      },
      {
        id: 'q4',
        text: 'Quelle réglementation européenne Diane mentionne-t-elle ?',
        options: ['le RGPD', 'le DMA (Digital Markets Act)', 'le DSA (Digital Services Act)', 'la directive sur le droit d\'auteur'],
        correct: 'le DSA (Digital Services Act)',
      },
      {
        id: 'q5',
        text: 'Quel problème Diane identifie-t-elle concernant la régulation des plateformes ?',
        options: ['les États n\'ont pas de volonté politique', 'les plateformes ont des ressources juridiques bien supérieures à celles des États', 'les lois nationales se contredisent', 'les journalistes ne soutiennent pas la régulation'],
        correct: 'les plateformes ont des ressources juridiques bien supérieures à celles des États',
      },
    ],
  },
  {
    title: 'Interview : une philosophe sur le bonheur',
    level: 'B2',
    transcript: `Journaliste : Adèle Fontaine, vous venez de publier « Le bonheur à contre-courant ». Votre thèse principale est que notre conception du bonheur est devenue contre-productive. Pourquoi ?
Adèle Fontaine : Nous vivons dans une culture qui a fait du bonheur une injonction. Soyez heureux, épanouissez-vous, réalisez votre plein potentiel. Le problème, c'est que cette injonction transforme le malheur en échec personnel. Si vous n'êtes pas heureux, c'est votre faute — vous n'avez pas assez travaillé sur vous, vous n'avez pas fait les bons choix. C'est une vision à la fois individualiste et culpabilisante.
Journaliste : Mais n'est-il pas légitime de chercher le bonheur ?
Adèle Fontaine : Bien sûr. La question est de savoir ce qu'on cherche. Les études de psychologie positive montrent que le bonheur durable vient rarement de la poursuite directe du plaisir ou du succès. Il emerge plutôt comme un sous-produit d'activités qui ont du sens, de relations profondes, d'engagement dans quelque chose qui nous dépasse.
Journaliste : Vous citez les Grecs dans votre livre.
Adèle Fontaine : Oui. Aristote distinguait deux formes de bonheur : l'hédoné, le plaisir immédiat, et l'eudaimonia, que l'on traduit par « épanouissement » ou « vie bonne ». Pour Aristote, la vie bonne n'est pas un état qu'on atteint, c'est une activité permanente — vivre selon ses vertus, contribuer à la cité, cultiver ses amitiés. Cette vision est radicalement différente de la conception consumériste du bonheur.
Journaliste : Que faudrait-il changer concrètement ?
Adèle Fontaine : D'abord, réhabiliter la capacité à supporter le malheur sans en mourir. Les Stoïciens appelaient ça la résilience. Ensuite, distinguer ce qui dépend de nous — nos pensées, nos valeurs, nos réactions — et ce qui ne dépend pas de nous. C'est libérateur de réaliser qu'on n'est pas responsable de tout.`,
    durationSec: 75,
    questions: [
      {
        id: 'q1',
        text: 'Selon Adèle Fontaine, quel problème pose l\'«injonction au bonheur» dans notre culture ?',
        options: ['elle crée trop d\'attentes sur les autres', 'elle transforme le malheur en échec personnel', 'elle pousse à la consommation excessive', 'elle rend les gens trop individualistes dans leurs amitiés'],
        correct: 'elle transforme le malheur en échec personnel',
      },
      {
        id: 'q2',
        text: 'D\'où vient le bonheur durable selon les études de psychologie positive citées ?',
        options: ['de la réussite professionnelle', 'de la poursuite directe du plaisir', 'du succès financier', 'd\'activités ayant du sens et de relations profondes'],
        correct: 'd\'activités ayant du sens et de relations profondes',
      },
      {
        id: 'q3',
        text: 'Qu\'est-ce qu\'Aristote appelle l\'«eudaimonia» ?',
        options: ['le plaisir immédiat', 'l\'absence de souffrance', 'l\'épanouissement ou la vie bonne', 'la sagesse philosophique'],
        correct: 'l\'épanouissement ou la vie bonne',
      },
      {
        id: 'q4',
        text: 'Comment Aristote concevait-il la «vie bonne» selon la philosophe ?',
        options: ['comme un état qu\'on atteint définitivement', 'comme une activité permanente selon ses vertus', 'comme l\'accumulation de plaisirs', 'comme la retraite et le repos'],
        correct: 'comme une activité permanente selon ses vertus',
      },
      {
        id: 'q5',
        text: 'Quel concept stoïcien Adèle Fontaine mentionne-t-elle comme premier changement à opérer ?',
        options: ['l\'ataraxie', 'le logos', 'la résilience', 'le memento mori'],
        correct: 'la résilience',
      },
    ],
  },
  {
    title: 'Table ronde : la semaine de quatre jours',
    level: 'B2',
    transcript: `Modérateur : La semaine de travail de quatre jours est expérimentée dans plusieurs pays — Islande, Royaume-Uni, Belgique. Faut-il la généraliser en France ? Avec nous, Thomas Guérin, DRH d'une PME, et Isabelle Chartier, économiste du travail.
Thomas : J'ai mené une expérimentation dans mon entreprise il y a deux ans. Résultat : la productivité a augmenté de huit pour cent, l'absentéisme a chuté de trente pour cent, et nous n'avons eu aucun départ au cours des douze mois suivants. Le gain de rétention des talents est considérable dans un marché du travail tendu.
Isabelle : Les études internationales confirment globalement ces tendances. Mais il faut nuancer. Premièrement, ces expérimentations concernent souvent des entreprises déjà performantes et motivées — biais de sélection important. Deuxièmement, dans les secteurs de service continu — santé, transport, sécurité — une réduction du temps de travail nécessite des embauches supplémentaires, ce qui a un coût.
Thomas : Sur le deuxième point, je suis d'accord. C'est pour ça que je pense que la semaine de quatre jours ne peut pas être décrétée d'en haut. Chaque secteur doit trouver sa propre formule.
Isabelle : Et il y a une question de fond : veut-on une semaine de quatre jours avec les mêmes horaires — journées de dix heures — ou une véritable réduction du temps de travail ? Ce sont deux modèles très différents avec des effets très différents sur la santé et la vie personnelle.
Modérateur : Quelle est votre position au final ?
Isabelle : Pour, mais progressivement et secteur par secteur, avec des données sérieuses à chaque étape.
Thomas : D'accord. Et avec une vraie négociation sociale, pas une loi uniforme.`,
    durationSec: 71,
    questions: [
      {
        id: 'q1',
        text: 'Dans l\'expérimentation de Thomas, de combien la productivité a-t-elle augmenté ?',
        options: ['cinq pour cent', 'huit pour cent', 'douze pour cent', 'quinze pour cent'],
        correct: 'huit pour cent',
      },
      {
        id: 'q2',
        text: 'De combien l\'absentéisme a-t-il chuté dans l\'entreprise de Thomas ?',
        options: ['dix pour cent', 'vingt pour cent', 'trente pour cent', 'cinquante pour cent'],
        correct: 'trente pour cent',
      },
      {
        id: 'q3',
        text: 'Quel biais méthodologique Isabelle signale-t-elle dans les expérimentations internationales ?',
        options: ['les études sont trop courtes', 'les secteurs testés ne sont pas représentatifs', 'les entreprises testées sont souvent déjà performantes — biais de sélection', 'les résultats sont falsifiés'],
        correct: 'les entreprises testées sont souvent déjà performantes — biais de sélection',
      },
      {
        id: 'q4',
        text: 'Quelle distinction fondamentale Isabelle introduit-elle concernant la semaine de quatre jours ?',
        options: ['entre secteur public et privé', 'entre journées de dix heures et réduction réelle du temps de travail', 'entre CDI et freelance', 'entre grande entreprise et PME'],
        correct: 'entre journées de dix heures et réduction réelle du temps de travail',
      },
      {
        id: 'q5',
        text: 'Sur quoi Thomas et Isabelle s\'accordent-ils à la fin du débat ?',
        options: ['sur une loi nationale uniforme dès 2025', 'sur une approche progressive et sectorielle sans loi uniforme', 'sur un référendum national', 'sur l\'abandon de l\'idée en France'],
        correct: 'sur une approche progressive et sectorielle sans loi uniforme',
      },
    ],
  },
];
