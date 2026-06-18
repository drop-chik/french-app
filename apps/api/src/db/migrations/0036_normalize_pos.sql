-- Normalize part_of_speech slugs into the canonical set used by the reading
-- wordMap and the new Dictionary "parts of speech" view. Before: 14 slugs with
-- noise (phrase/particle/reflexive verb each ≤9 rows). After: noun, verb,
-- adjective, adverb, expression, pronoun, preposition, conjunction, number,
-- interjection, determiner.
UPDATE words SET part_of_speech = 'expression' WHERE part_of_speech IN ('phrase', 'particle');
UPDATE words SET part_of_speech = 'verb' WHERE part_of_speech = 'reflexive verb';
