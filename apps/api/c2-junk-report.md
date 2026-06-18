# C2 junk-entry audit

Two-pass (classify + adversarial defend) over all 2683 C2 lemmas.

> ⚠️ SHORTLIST, not a delete-list. Even this "confirmed" list contains real
> words the model wrongly flagged (framboise, pistache, archipel, silhouetter)
> with hallucinated reasons. Curated by hand before any removal.
>
> 2026-06-18 cleanup: 19 hand-verified entries removed (foreign-language words +
> pure fragments with no legitimate French reading — sprache, della, corriere,
> arriba, nacional, la piazza, issues, talks, barber, datang, les
> studentbostäder, ii, pp, le i, le i - mode, le by, la serra, l'ose,
> anglosaxophone). C2 active words 2683 → 2664. The rest below (misspelling /
> wrong-form / borderline) need a human native editor, NOT auto-deletion.

- Confirmed junk (both passes agree): **65** (2.4%) — 19 removed, rest need review
- Borderline (pass-1 flagged, pass-2 defended → kept): 105

## nonexistent (6)

- **ii** — fragment ou charabia.
- **jusque au** — Expression incorrecte et non utilisée en français.
- **la serra** — le mot 'serra' n'existe pas en français.
- **l'ose** — L'ose n'existe pas en français.
- **nacional** — mot inexistant en français.
- **vertubleu** — n'existe pas en français.

## not-french (23)

- **arriba** — mot espagnol non lexicalisé en français.
- **barber** — mot anglais non lexicalisé en français.
- **corriere** — mot italien non lexicalisé en français.
- **datang** — mot d'origine étrangère (indonésien)
- **della** → della — 'della' est un mot italien.
- **issues** → issues — 'issues' est un mot anglais.
- **la florence** — mot en français mais utilisé dans un contexte incorrect.
- **la piazza** — 'piazza' est un mot italien.
- **la pistache** — 'pizzeria' est un mot italien.
- **la tapa** — 'tapa' est un mot espagnol.
- **le by** — mot d'une autre langue.
- **le go** — 'go' est un mot anglais.
- **le golden** — 'golden' est un mot anglais.
- **le i** — 'le i' n'est pas une expression standard en français.
- **le i - mode** — 'le i - mode' n'est pas une expression standard en français.
- **le junior** — 'le junior' n'est pas une expression standard en français.
- **les studentbostäder** — Le terme 'studentbostäder' est en suédois.
- **micro-web** — terme anglais non lexicalisé en français.
- **pp** — abréviation anglaise.
- **quartet** — emprunt non lexicalisé.
- **rating** — 'rating' est un terme anglais.
- **sprache** — mot d'origine allemande non lexicalisé en français
- **talks** — mot anglais non lexicalisé en français.

## misspelling (25)

- **anglaiser** → angliser — faute d'orthographe.
- **anglosaxophone** → anglo-saxon — faute d'orthographe.
- **au bas** → aux alentours de — faute d'orthographe de l'expression.
- **de où** → d'où — faute d'orthographe, la forme correcte est 'd'où'.
- **d' ordinaire** → d'ordinaire — erreur d'apostrophe.
- **e** → é — le son 'e' est un fragment, pas un mot.
- **jusque à** → jusqu'au — Faute d'orthographe, la forme correcte est 'jusqu'au'.
- **jusque au cas limite où** → jusqu'au — Faute d'orthographe, la forme correcte est 'jusqu'au'.
- **l'apis** → l'abeille — 'apis' est une faute d'orthographe, le terme correct est 'abeille'.
- **l'archipel** → la rés — faute d'orthographe, le mot correct est 'la rés'.
- **laurer** → louer — faute d'orthographe d'un vrai mot.
- **le buton** → bouton — faute d'orthographe d'un vrai mot.
- **le dégras** → le dégrais — Faute d'orthographe, le terme correct est 'le dégrais'.
- **le joseph** → Joseph — 'le joseph' devrait être 'Joseph' sans article.
- **le mar** → le mar — le mar est un terme peu usité, mais il existe.
- **le régale** → régal — Erreur d'orthographe sur le mot 'régal'.
- **lie** → un mensonge — le terme 'lie' est un anglicisme.
- **liser** → liser — Le verbe correct est 'liser'.
- **matir** → matir — Le verbe correct est 'mater'.
- **petit - enfant** → petit-enfant — espace incorrect dans l'expression.
- **quelle que** → quatre heures — erreur d'orthographe, devrait être deux mots.
- **régimer** → régimer — Faute d'orthographe d'un vrai mot.
- **sigler** → silencer — Le verbe correct est 'faire silence' ou 'se taire'.
- **silhouetter** → silhouetter — le verbe correct est 'silhouetter'.
- **uns** → un — faute d'orthographe.

## wrong-form (11)

- **avoir partir** → avoir lieu — forme incorrecte du verbe.
- **indéterminer** → indéterminer — forme incorrecte du verbe.
- **la développée** → développée — forme fléchie utilisée à la place du lemme.
- **la framboise** → aggravation — forme fléchie utilisée à la place du lemme.
- **le coll** → collège — forme incorrecte pour désigner un établissement scolaire.
- **le dr** → le doigt — Forme fléchie mise à la place d'un lemme.
- **le prolonge** → le prolonge — forme incorrecte, devrait être 'le prolonge'.
- **le retourne** → retour — Forme incorrecte, 'retourne' devrait être 'retour'.
- **posée** → pose — forme fléchie utilisée à la place du lemme
- **reclure** → récolter — 'récoler' est une forme incorrecte, le verbe correct est 'récolter'.
- **retraire** → retraiter — forme conjuguée utilisée à la place du lemme.

## borderline — kept, eyeball if you want (105)

- affilée [wrong-form] — forme incorrecte de l'adjectif.
- affirmatif [wrong-form] — forme incorrecte de l'adjectif.
- affluer [misspelling] — faute d'orthographe.
- agréablement [misspelling] — faute d'orthographe.
- aigue-marine [misspelling] — L'orthographe correcte est 'aigue-marine'.
- allume [misspelling] — le terme correct est 'allumeur'.
- atterrer [misspelling] — faute d'orthographe du verbe.
- awalé [not-french] — mot d'origine étrangère.
- aztèque [not-french] — emprunt lexicalisé en français.
- boss [not-french] — emprunt anglais non lexicalisé.
- bot [nonexistent] — expression incorrecte.
- branchée [wrong-form] — forme fléchie incorrecte.
- byzantin [misspelling] — faute d'orthographe.
- cabotin [nonexistent] — mot inexistant en français.
- canyon [not-french] — Canyon est un mot anglais.
- castillan [not-french] — mot espagnol.
- conforter [wrong-form] — forme incorrecte, le verbe 'conforter' est utilisé ici.
- consistant [misspelling] — faute d'orthographe, le mot correct est 'consistant'.
- coursier [not-french] — emprunt lexical non intégré.
- dégeler [not-french] — mot anglais non lexicalisé.
- delirium [not-french] — 'delirium' est un mot anglais.
- difficilement [wrong-form] — forme adverbiale incorrecte.
- dock [not-french] — emprunt anglais non lexicalisé.
- dormant [wrong-form] — forme fléchie utilisée à la place du lemme.
- écrevisse [wrong-form] — forme incorrecte du verbe.
- este [misspelling] — Faute d'orthographe d'un vrai mot.
- évadé [not-french] — Mot d'une autre langue.
- fantasmer [misspelling] — le mot 'fat' est une faute d'orthographe pour 'faste'.
- feintise [misspelling] — faute d'orthographe, le terme correct est 'feintise'.
- finaliste [not-french] — emprunt lexicalisé, mais non français.
- foetal [misspelling] — Erreur d'orthographe sur le tréma.
- franquisme [not-french] — Mot espagnol non lexicalisé en français.
- frémissant [wrong-form] — Forme fléchie incorrecte pour le participe passé.
- glucose [wrong-form] — forme fléchie mise à la place d'un lemme.
- grogner [wrong-form] — forme incorrecte du verbe.
- guéret [not-french] — mot d'une autre langue.
- hi-han [misspelling] — erreur d'orthographe dans l'expression.
- hip [not-french] — expression anglaise non lexicalisée en français.
- historiographique [not-french] — mot anglais non lexicalisé en français.
- humérus [wrong-form] — article défini incorrect.
- imaginatif [wrong-form] — article défini incorrect.
- impressionniste [misspelling] — Le verbe 'impréciser' n'existe pas, il faut utiliser 'préciser'.
- inaliénable [wrong-form] — Le verbe 'inachever' doit être utilisé à l'infinitif.
- internationaliste [misspelling] — Le terme correct est 'internationale' pour désigner une personne engagée dans le mouvement internationaliste.
- jointe [wrong-form] — 'jointe' est une forme fléchie, le lemme est 'joint'.
- jumeler [misspelling] — Faute d'orthographe, la forme correcte est 'jusqu'à'.
- kaori [not-french] — prénom japonais.
- le disc-jockey [misspelling] — Faute d'orthographe, le terme correct est 'le disc-jockey'.
- le dresseur [nonexistent] — 'dr' n'existe pas en français.
- légiste [wrong-form] — L'article 'le' est incorrect pour 'légiste' qui est féminin.
- le grand-parent [misspelling] — L'article 'mon le' est incorrect.
- le héros [not-french] — 'huo' n'est pas un mot français.
- le krach [not-french] — 'le kussu' n'est pas un terme standard en français.
- le rachat [not-french] — emprunt lexicalisé en français.
- le rai [wrong-form] — forme incorrecte, devrait être 'le rangement'.
- le saisissement [misspelling] — faute d'orthographe, le mot correct est 'le saisissement'
- le suspens [misspelling] — 'suspens' est une faute d'orthographe, le terme correct est 'suspense'.
- le trompe-l'oeil [misspelling] — faute d'orthographe, le verbe est 'lettrer'.
- le watt [not-french] — emprunt non lexicalisé
- le wisigoth [nonexistent] — mot inexistant en français
- l'expressionnisme [wrong-form] — forme incorrecte de 'habilité'
- loue [misspelling] — Faute d'orthographe de 'loyer'.
- magnifier [not-french] — 'man' est un mot anglais.
- manhattan [not-french] — Manhattan est un nom propre, une ville américaine.
- mixture [not-french] — 'mixture' est un mot anglais.
- moquette [misspelling] — 'moreau' est une faute d'orthographe.
- musquer [not-french] — terme anglais non lexicalisé.
- myrrhe [misspelling] — faute d'orthographe d'un mot français.
- neutraliser [not-french] — Le terme 'nippon' est un emprunt du japonais, mais il n'est pas couramment utilisé en français.
- neutralité [misspelling] — Le verbe 'niquer' est familier et peut être considéré comme vulgaire.
- oecuménisme [misspelling] — faute d'orthographe sur le 'œ'.
- oenologie [misspelling] — faute d'orthographe sur le 'œ'.
- ouvrer [wrong-form] — forme conjuguée utilisée à la place du lemme.
- overdose [misspelling] — emprunt anglais non francisé.
- pager [not-french] — emprunt anglais non francisé.
- people [not-french] — emprunt de l'anglais.
- pharmacologie [misspelling] — erreur d'orthographe dans l'expression.
- pop-corn [misspelling] — emprunt non francisé
- qualifié [wrong-form] — forme incorrecte, devrait être un adjectif.
- quiétude [misspelling] — erreur d'orthographe, devrait être 'qu'il'.
- rabaisser [nonexistent] — mot inexistant en français.
- recru [wrong-form] — Forme fléchie utilisée à la place du lemme.
- réutilisable [not-french] — nom propre d'une agence de presse.
- revenant [wrong-form] — forme conjuguée utilisée à la place du lemme.
- ricaner [misspelling] — faute d'orthographe, le mot correct est 'ris'.
- richement [misspelling] — faute d'orthographe, le mot correct est 'rit'.
- sanscrit [misspelling] — faute d'orthographe, le terme correct est 'sanskrit'.
- saquer [not-french] — mot d'origine indienne, non lexicalisé en français.
- scientiste [misspelling] — Le terme correct est 'scientifique'.
- septante [not-french] — 'Septante' est un terme utilisé en français en Belgique et en Suisse, mais pas en France.
- sexiste [not-french] — 'Shampooing' est un emprunt lexicalisé, mais 'shooter' et 'show-business' ne le sont pas.
- shampooing [not-french] — 'Shooter' est un anglicisme non lexicalisé.
- shooter [not-french] — 'Show-business' est un anglicisme non lexicalisé.
- sidérurgique [misspelling] — Le verbe correct est 'signaler'.
- single [not-french] — emprunt anglais non lexicalisé.
- soudoyer [wrong-form] — forme incorrecte du verbe.
- standing [not-french] — emprunt anglais non lexicalisé en français
- stipulant [wrong-form] — forme incorrecte du verbe stipuler
- subsaharien [misspelling] — faute d'orthographe sur l'adjectif sucré
- surveillant [not-french] — mot d'origine étrangère.
- technicité [not-french] — mot espagnol non lexicalisé en français.
- turf [not-french] — emprunt non lexicalisé.
- ukulélé [not-french] — emprunt non lexicalisé.
- verse [wrong-form] — forme fléchie utilisée à la place du lemme.
- victorieux [wrong-form] — forme fléchie utilisée à la place du lemme.
