export const TELLS: Record<string, { name: string; short: string }> = {
  // Category 1: Structural parallelism
  T01: { name: "Negative parallelism", short: "Sets up 'not X but Y' or 'this isn't X, it's Y' contrasts that sound profound but rarely add information." },
  T02: { name: "Balanced symmetrical clauses", short: "Adjacent sentences with mirrored grammar: 'The optimists see growth. The pessimists see collapse.'" },
  T03: { name: "Three-beat list rhythm", short: "Three parallel items in sequence with matching grammatical structure." },
  T04: { name: "Fragment-then-expand opener", short: "A short declarative sentence followed immediately by a longer explanatory one." },
  T05: { name: "Every paragraph lands cleanly", short: "Every paragraph has a tidy concluding beat — no trailing thoughts or interrupted ideas." },

  // Category 2: Punctuation and formatting
  T06: { name: "Em dash overuse", short: "Frequent use of em dashes (—) where periods, commas, or parentheses would do." },
  T07: { name: "Bold text as emphasis crutch", short: "More than two bolded phrases per 500 words, or a bolded thesis in every section." },
  T22: { name: "Comma-splice avoidance", short: "Zero comma splices in informal writing — perfect comma discipline throughout." },
  T23: { name: "Semicolon overuse", short: "More than one semicolon per 500 words in non-academic writing." },
  T45: { name: "Perfect spelling and grammar", short: "Zero errors even in informal contexts where humans usually slip." },
  T46: { name: "Perfectly consistent formatting", short: "Bullet styles, header caps, and spacing are all uniform throughout." },
  T47: { name: "Colon before every list", short: "Every list or enumeration is introduced by a colon. Humans sometimes just start listing." },
  T48: { name: "Quotation marks around concepts", short: "Scare quotes used more than twice per 500 words to flag concepts." },

  // Category 3: Vocabulary tells
  T08: { name: "First-wave AI vocabulary", short: "Words AI overuses: landscape, crucial, tapestry, delve, navigate, realm, testament, intricate, seamlessly." },
  T09: { name: "Authority-performing phrases", short: "Phrases like 'Let's be clear,' 'Make no mistake,' 'The reality is,' 'Simply put.'" },
  T10: { name: "Filler hedging phrases", short: "Phrases like 'It's important to note that,' 'It goes without saying,' 'At the end of the day.'" },
  T11: { name: "Era-framing openers", short: "Openers like 'In today's…,' 'In an era of,' 'In a world where,' 'As we navigate.'" },
  T28: { name: "Latinate over Anglo-Saxon", short: "Prefers utilize over use, demonstrate over show, facilitate over help, prioritize over focus on." },
  T29: { name: "Second-wave AI vocabulary", short: "Newer AI tells: leverage, robust, ecosystem, granular, stakeholder, unpack, reimagine, synergy, at scale." },
  T30: { name: "Adverb stacking", short: "Overuse of adverbs like particularly, increasingly, fundamentally, ultimately, arguably, notably." },
  T31: { name: "'It's worth noting' and cousins", short: "Phrases like 'It's worth noting,' 'What's particularly striking,' 'What's notable here.'" },
  T32: { name: "Missing contractions", short: "'It is' instead of 'it's,' 'do not' instead of 'don't' in otherwise informal writing." },
  T33: { name: "Categorical correction", short: "'This is not a [noun]. This is a [noun]' — categorical pivot that performs insight." },

  // Category 4: Sentence and structure
  T21: { name: "Uniform sentence length", short: "Sentences cluster around 15–22 words with low length variance across a passage." },
  T24: { name: "Subordinate clause front-loading", short: "Many sentences open with 'While X,' 'Although X,' 'As X continues,' before the main clause." },
  T25: { name: "Connector word overuse", short: "Frequent paragraph openers like However, Moreover, Furthermore, Additionally, Consequently." },
  T26: { name: "No parenthetical asides", short: "Zero parentheticals or dashed-off asides in 500+ words of informal writing." },
  T27: { name: "No non-dramatic fragments", short: "Fragments only appear for rhetorical punch; no messy or trailing incomplete thoughts." },
  T34: { name: "Textbook paragraph structure", short: "Every paragraph follows topic sentence → supporting detail → transition." },
  T35: { name: "No digressions", short: "Every paragraph directly serves the thesis — no tangents or related-but-non-essential asides." },
  T36: { name: "Smooth transitions everywhere", short: "Every section has an explicit bridge to the next — no hard jumps." },
  T37: { name: "Frontloaded thesis", short: "Main argument stated in the first one or two sentences with no buildup." },
  T38: { name: "Conclusion mirrors introduction", short: "Closing paragraph echoes the opening's framing, language, or structure." },

  // Category 5: Voice and emotional register
  T12: { name: "No personal anecdote", short: "Zero first-person experience — no 'I saw,' 'A colleague told me,' 'Last week I…'" },
  T13: { name: "Flat emotional register", short: "Consistent tonal authority — no frustration, sarcasm, enthusiasm, or shifts in mood." },
  T14: { name: "Escalate-then-reassure close", short: "Dramatic stakes followed by 'But this is not inevitable' or 'But there's hope.'" },
  T39: { name: "No genuine uncertainty", short: "Hedges like 'this is complex' that perform balance instead of admitting not knowing." },
  T40: { name: "False concession", short: "'While X has merit, Y' where the concession is immediately undermined and never alters the argument." },
  T41: { name: "No risky humor", short: "Zero humor, or only safe signposted humor — no sarcasm, obscure references, or risky jokes." },
  T42: { name: "Emotionally smooth escalation", short: "Emotional intensity builds gradually and predictably, with no spikes or sudden shifts." },
  T43: { name: "Excessive qualification", short: "'It's arguably the case that,' 'One could make the argument that' before clearly held claims." },
  T44: { name: "Reflexive both-sides framing", short: "Presents opposing views even when the piece has a clear position — balance for its own sake." },
  T71: { name: "Positivity bias", short: "Defaults to constructive, solutions-oriented framing even when the subject is bleak." },

  // Category 6: Format and platform
  T15: { name: "Numbered section headers", short: "'1: Topic. 2: Topic. 3: Topic.' Listicle numbering used in non-listicle contexts." },
  T16: { name: "Even section lengths", short: "Word counts per section vary by less than 20% across three or more sections." },
  T17: { name: "Restatement close", short: "Final paragraph that restates or mirrors the structure of the body." },
  T18: { name: "Generic engagement question", short: "Closes with 'Thoughts?' 'What do you think?' 'Agree or disagree?' 'What am I missing?'" },
  T19: { name: "Hook-body-CTA formula", short: "Opening hook, structured body, closing call to action — the standard LinkedIn AI template." },
  T20: { name: "Too long for the platform", short: "LinkedIn posts over 1,300 words — AI tends longer because it doesn't self-edit." },

  // Category 7: Specificity absence
  T49: { name: "No specificity of place or person", short: "Generic references like 'workers across the country' or 'in recent years' with no named entities." },
  T50: { name: "Vague statistics", short: "'Studies show,' 'millions of workers,' 'a significant percentage' without specific citations." },
  T51: { name: "No domain-insider language", short: "Public-facing vocabulary only — no jargon or shorthand that signals an insider author." },
  T52: { name: "Examples too clean or famous", short: "Examples drawn from Uber, Amazon, ChatGPT, Tesla — default AI reference points." },
  T53: { name: "No attribution to specific people", short: "'Experts say,' 'critics argue,' 'some believe' without names or sourced quotes." },

  // Category 8: Linguistic micro-tells
  T54: { name: "No deliberate word repetition", short: "AI avoids repeating words; humans repeat for emphasis: 'That's not a gap. That's a canyon.'" },
  T55: { name: "No mid-sentence course corrections", short: "No self-corrections, restarts, or 'actually, no' moments — AI doesn't model thinking-in-progress." },
  T56: { name: "Metrically regular prose", short: "Prose tends toward iambic or otherwise metrically predictable rhythms." },
  T57: { name: "Anthropomorphic subject-verb", short: "Abstractions given human agency: 'the data suggests,' 'the market rewards,' 'the evidence points to.'" },

  // Category 9: Metaphor and imagery
  T58: { name: "Stock metaphor library", short: "Worn-out figures of speech AI reaches for: race to the bottom, one-way street, path forward, north star." },
  T67: { name: "Metaphor inconsistency", short: "Mixes metaphors freely across sentences or extends one too neatly — humans are messier." },

  // Category 10: Argumentative structure
  T59: { name: "Scope-framing pairs", short: "'This is X. It is not Y.' Paired positive/negative scope statements that perform rigor." },
  T62: { name: "'To be sure' false-concession opener", short: "Sentence-level openers like 'To be sure,' 'To be fair,' 'Granted,' that perform fairness before dismissing." },
  T65: { name: "'Not whether but when' template", short: "'The question is not whether X, but when/how' — sounds incisive but is a formula." },
  T66: { name: "Enumeration signposting", short: "Pre-announces the count before listing: 'There are three reasons,' 'Consider four dynamics.'" },
  T68: { name: "Explicit relevance statement", short: "'This matters because…' 'Here's why this is important' — AI can't trust the reader to see importance." },
  T69: { name: "Formulaic objection handling", short: "'Some might argue…' 'Critics will point out…' 'The obvious counterargument is…'" },
  T70: { name: "Closing-signal words", short: "'Ultimately,' 'In the end,' 'At the end of the day' as landing-gear at section closes." },
  T73: { name: "Theory-meets-practice phrases", short: "Stock phrases like 'survives contact with reality,' 'collides with reality,' 'breaks down in practice.'" },
  T75: { name: "Superlative ranking throat-clear", short: "'The most important thing is,' 'the key insight is,' 'what matters most is' — pre-sorts before stating." },

  // Category 11: Reference handling
  T60: { name: "Synonymic cycling", short: "Cycles through synonyms for the same referent: workers → employees → staff → workforce → labor." },
  T61: { name: "Perfectly parallel bullet points", short: "Every bullet starts with the same part of speech — all gerunds or all imperatives." },
  T63: { name: "Temporal hedging", short: "'In recent months,' 'in recent years,' 'increasingly' — AI can't name specific dates or events." },
  T64: { name: "Mini-conclusions at section boundaries", short: "Sections end with a sentence that restates the section's point before moving on." },

  // Category 12: Atmospheric and physicalizing language
  T72: { name: "Atmospheric softening adverbs", short: "Adverbs like quietly, gently, slowly, subtly paired with verbs of loss, change, or influence." },
  T74: { name: "Physicalizing abstractions", short: "Physical state-change verbs applied to abstract nouns: 'trust hardens,' 'consensus crystallizes.'" },
  T76: { name: "Abstract-noun-plus-modifier compounds", short: "Two-word compounds like 'causal precision,' 'epistemic humility,' 'narrative coherence.'" },
};

export function lookupTell(id: string): { name: string; short: string } {
  return TELLS[id] ?? { name: id, short: "Common AI signal." };
}
