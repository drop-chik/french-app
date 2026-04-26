ALTER TABLE "words" ADD COLUMN "part_of_speech" varchar(20);--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "gender" varchar(1);--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "frequency_rank" integer;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "grammar_tag" varchar(100);--> statement-breakpoint
CREATE INDEX "idx_words_level_pos" ON "words" USING btree ("level","part_of_speech");--> statement-breakpoint
CREATE INDEX "idx_words_frequency" ON "words" USING btree ("level","frequency_rank");--> statement-breakpoint

-- ============================================================
-- BACKFILL: part_of_speech from category
-- ============================================================
UPDATE words SET part_of_speech = CASE
  WHEN category IN ('verbs_basic', 'verbs_extra', 'verbs') THEN 'verb'
  WHEN category IN ('adjectives', 'description', 'colors') THEN 'adjective'
  WHEN category = 'prepositions' THEN 'preposition'
  WHEN category = 'numbers' THEN 'number'
  WHEN category = 'basics' THEN 'expression'
  ELSE 'noun'
END;--> statement-breakpoint

-- ============================================================
-- BACKFILL: normalize verb categories → single 'verbs' slug
-- ============================================================
UPDATE words SET category = 'verbs' WHERE category IN ('verbs_basic', 'verbs_extra');--> statement-breakpoint

-- ============================================================
-- BACKFILL: gender — extract from French article prefix
-- ============================================================
UPDATE words SET gender = 'm'
  WHERE part_of_speech = 'noun'
    AND (french LIKE 'le %' OR french LIKE 'un %');--> statement-breakpoint

UPDATE words SET gender = 'f'
  WHERE part_of_speech = 'noun'
    AND (french LIKE 'la %' OR french LIKE 'une %');--> statement-breakpoint

-- ============================================================
-- BACKFILL: frequency_rank — known high-frequency French words
-- Based on Lexique 3.84 frequency corpus (approximate ranks)
-- ============================================================
UPDATE words SET frequency_rank = CASE french
  -- Top verbs (rank 1-15, core French grammar)
  WHEN 'être'         THEN 1
  WHEN 'avoir'        THEN 2
  WHEN 'faire'        THEN 3
  WHEN 'pouvoir'      THEN 4
  WHEN 'dire'         THEN 5
  WHEN 'aller'        THEN 7
  WHEN 'voir'         THEN 8
  WHEN 'vouloir'      THEN 9
  WHEN 'venir'        THEN 10
  WHEN 'savoir'       THEN 11
  WHEN 'prendre'      THEN 12
  WHEN 'devoir'       THEN 13
  WHEN 'mettre'       THEN 19
  WHEN 'passer'       THEN 22
  WHEN 'tenir'        THEN 30
  WHEN 'rester'       THEN 31
  WHEN 'partir'       THEN 32
  WHEN 'comprendre'   THEN 45
  WHEN 'trouver'      THEN 52
  WHEN 'donner'       THEN 48
  WHEN 'demander'     THEN 56
  WHEN 'arriver'      THEN 38
  WHEN 'croire'       THEN 60
  WHEN 'penser'       THEN 70
  WHEN 'parler'       THEN 62
  WHEN 'chercher'     THEN 92
  WHEN 'regarder'     THEN 68
  WHEN 'sortir'       THEN 72
  WHEN 'entrer'       THEN 55
  WHEN 'rentrer'      THEN 82
  WHEN 'aimer'        THEN 65
  WHEN 'vivre'        THEN 80
  WHEN 'appeler'      THEN 75
  WHEN 'connaître'    THEN 95
  WHEN 'travailler'   THEN 115
  WHEN 'habiter'      THEN 145
  WHEN 'manger'       THEN 88
  WHEN 'boire'        THEN 175
  WHEN 'dormir'       THEN 215
  WHEN 'lire'         THEN 195
  WHEN 'écrire'       THEN 228
  WHEN 'écouter'      THEN 238
  WHEN 'acheter'      THEN 258
  WHEN 'porter'       THEN 288
  WHEN 'utiliser'     THEN 278
  WHEN 'jouer'        THEN 268
  WHEN 'commencer'    THEN 188
  WHEN 'décider'      THEN 218
  WHEN 'marcher'      THEN 228
  WHEN 'changer'      THEN 248
  WHEN 'continuer'    THEN 258
  WHEN 'rencontrer'   THEN 198
  WHEN 'recevoir'     THEN 358
  WHEN 'ouvrir'       THEN 338
  WHEN 'attendre'     THEN 298
  WHEN 'tomber'       THEN 308
  WHEN 'perdre'       THEN 318
  WHEN 'gagner'       THEN 328
  WHEN 'fermer'       THEN 368
  WHEN 'montrer'      THEN 348
  WHEN 'choisir'      THEN 345
  WHEN 'envoyer'      THEN 378
  WHEN 'aider'        THEN 398
  WHEN 'chanter'      THEN 448
  WHEN 'courir'       THEN 498
  WHEN 'voyager'      THEN 495
  WHEN 'danser'       THEN 595
  WHEN 'nager'        THEN 695
  -- Expressions / basics
  WHEN 'oui'                THEN 18
  WHEN 'non'                THEN 22
  WHEN 'bonjour'            THEN 98
  WHEN 'merci'              THEN 78
  WHEN 'bonsoir'            THEN 198
  WHEN 'au revoir'          THEN 148
  WHEN 's''il vous plaît'   THEN 118
  WHEN 'pardon'             THEN 168
  WHEN 'excusez-moi'        THEN 178
  WHEN 'voilà'              THEN 188
  WHEN 'voici'              THEN 198
  -- Prepositions
  WHEN 'de'       THEN 3
  WHEN 'à'        THEN 4
  WHEN 'dans'     THEN 25
  WHEN 'sur'      THEN 26
  WHEN 'avec'     THEN 31
  WHEN 'pour'     THEN 16
  WHEN 'par'      THEN 22
  WHEN 'entre'    THEN 65
  WHEN 'avant'    THEN 67
  WHEN 'après'    THEN 68
  WHEN 'depuis'   THEN 90
  WHEN 'pendant'  THEN 120
  WHEN 'sans'     THEN 85
  WHEN 'sous'     THEN 105
  WHEN 'vers'     THEN 130
  WHEN 'près'     THEN 140
  WHEN 'loin'     THEN 160
  WHEN 'devant'   THEN 170
  WHEN 'derrière' THEN 175
  WHEN 'entre'    THEN 65
  -- Numbers
  WHEN 'zéro'      THEN 70
  WHEN 'un'        THEN 5
  WHEN 'deux'      THEN 15
  WHEN 'trois'     THEN 22
  WHEN 'quatre'    THEN 28
  WHEN 'cinq'      THEN 34
  WHEN 'six'       THEN 40
  WHEN 'sept'      THEN 46
  WHEN 'huit'      THEN 52
  WHEN 'neuf'      THEN 58
  WHEN 'dix'       THEN 64
  WHEN 'vingt'     THEN 88
  WHEN 'trente'    THEN 98
  WHEN 'quarante'  THEN 108
  WHEN 'cinquante' THEN 118
  WHEN 'cent'      THEN 128
  WHEN 'mille'     THEN 148
  -- Time nouns
  WHEN 'heure'          THEN 50
  WHEN 'minute'         THEN 78
  WHEN 'seconde'        THEN 100
  WHEN 'matin'          THEN 103
  WHEN 'midi'           THEN 160
  WHEN 'après-midi'     THEN 180
  WHEN 'soir'           THEN 113
  WHEN 'nuit'           THEN 123
  WHEN 'jour'           THEN 50
  WHEN 'semaine'        THEN 98
  WHEN 'mois'           THEN 108
  WHEN 'année'          THEN 113
  WHEN 'aujourd''hui'   THEN 68
  WHEN 'demain'         THEN 76
  WHEN 'hier'           THEN 84
  WHEN 'lundi'          THEN 248
  WHEN 'mardi'          THEN 258
  WHEN 'mercredi'       THEN 263
  WHEN 'jeudi'          THEN 268
  WHEN 'vendredi'       THEN 273
  WHEN 'samedi'         THEN 278
  WHEN 'dimanche'       THEN 283
  WHEN 'printemps'      THEN 348
  WHEN 'été'            THEN 298
  WHEN 'automne'        THEN 378
  WHEN 'hiver'          THEN 338
  -- Family nouns
  WHEN 'père'           THEN 108
  WHEN 'mère'           THEN 112
  WHEN 'famille'        THEN 118
  WHEN 'frère'          THEN 148
  WHEN 'sœur'           THEN 153
  WHEN 'fils'           THEN 178
  WHEN 'fille'          THEN 183
  WHEN 'mari'           THEN 188
  WHEN 'enfant'         THEN 42
  WHEN 'bébé'           THEN 398
  WHEN 'grand-père'     THEN 248
  WHEN 'grand-mère'     THEN 253
  WHEN 'oncle'          THEN 348
  WHEN 'tante'          THEN 358
  WHEN 'cousin'         THEN 448
  WHEN 'ami'            THEN 98
  -- Body nouns
  WHEN 'tête'      THEN 88
  WHEN 'main'      THEN 82
  WHEN 'yeux'      THEN 93
  WHEN 'œil'       THEN 95
  WHEN 'nez'       THEN 298
  WHEN 'oreille'   THEN 288
  WHEN 'bouche'    THEN 278
  WHEN 'dos'       THEN 308
  WHEN 'pied'      THEN 318
  WHEN 'jambe'     THEN 328
  WHEN 'bras'      THEN 288
  WHEN 'épaule'    THEN 378
  WHEN 'genou'     THEN 398
  WHEN 'ventre'    THEN 368
  WHEN 'cœur'      THEN 248
  WHEN 'dent'      THEN 348
  -- Common nouns
  WHEN 'homme'      THEN 33
  WHEN 'femme'      THEN 36
  WHEN 'vie'        THEN 48
  WHEN 'monde'      THEN 56
  WHEN 'maison'     THEN 73
  WHEN 'eau'        THEN 128
  WHEN 'ville'      THEN 138
  WHEN 'pays'       THEN 143
  WHEN 'école'      THEN 133
  WHEN 'travail'    THEN 158
  WHEN 'livre'      THEN 153
  WHEN 'table'      THEN 198
  WHEN 'porte'      THEN 208
  WHEN 'rue'        THEN 173
  WHEN 'voiture'    THEN 193
  WHEN 'pain'       THEN 213
  WHEN 'café'       THEN 218
  WHEN 'restaurant' THEN 278
  WHEN 'France'     THEN 298
  WHEN 'Paris'      THEN 308
  -- Adjectives (bare form)
  WHEN 'grand'      THEN 36
  WHEN 'petit'      THEN 42
  WHEN 'bon'        THEN 48
  WHEN 'beau'       THEN 58
  WHEN 'nouveau'    THEN 64
  WHEN 'jeune'      THEN 68
  WHEN 'vieux'      THEN 74
  WHEN 'long'       THEN 83
  WHEN 'premier'    THEN 33
  WHEN 'dernier'    THEN 88
  WHEN 'haut'       THEN 108
  WHEN 'fort'       THEN 103
  WHEN 'gros'       THEN 178
  WHEN 'rapide'     THEN 298
  WHEN 'lent'       THEN 348
  WHEN 'chaud'      THEN 278
  WHEN 'froid'      THEN 283
  WHEN 'facile'     THEN 308
  WHEN 'difficile'  THEN 313
  WHEN 'propre'     THEN 318
  WHEN 'vide'       THEN 338
  WHEN 'plein'      THEN 328
  WHEN 'faible'     THEN 198
  WHEN 'mince'      THEN 398
  -- Colors (adjectives)
  WHEN 'rouge'    THEN 198
  WHEN 'bleu'     THEN 208
  WHEN 'vert'     THEN 223
  WHEN 'blanc'    THEN 233
  WHEN 'noir'     THEN 243
  WHEN 'jaune'    THEN 253
  WHEN 'gris'     THEN 288
  WHEN 'rose'     THEN 338
  WHEN 'marron'   THEN 368
  WHEN 'orange'   THEN 298
  WHEN 'violet'   THEN 348
  ELSE NULL
END
WHERE frequency_rank IS NULL;--> statement-breakpoint

-- Category-based defaults for remaining words without a known rank
UPDATE words SET frequency_rank = CASE category
  WHEN 'basics'       THEN 200
  WHEN 'prepositions' THEN 250
  WHEN 'numbers'      THEN 300
  WHEN 'time'         THEN 400
  WHEN 'family'       THEN 350
  WHEN 'body'         THEN 450
  WHEN 'colors'       THEN 350
  WHEN 'adjectives'   THEN 500
  WHEN 'description'  THEN 550
  WHEN 'food'         THEN 500
  WHEN 'house'        THEN 450
  WHEN 'transport'    THEN 500
  WHEN 'nature'       THEN 550
  WHEN 'school'       THEN 550
  WHEN 'clothes'      THEN 600
  WHEN 'shopping'     THEN 600
  WHEN 'verbs'        THEN 400
  WHEN 'professions'  THEN 650
  WHEN 'leisure'      THEN 650
  ELSE 800
END
WHERE frequency_rank IS NULL;
