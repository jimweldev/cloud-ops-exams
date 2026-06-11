// Converts a Tutorials-Dojo style exam .txt dump into the exam JSON schema
// used by this app (see docs/exams/cloud-ops-exam-*.json).
//
// Usage:
//   node scripts/convert-exam.mjs [input.txt] [output.json] [examId]
//
// Defaults convert docs/exams/exam-3.txt -> docs/exams/cloud-ops-exam-3.json
//
// Notes:
//   - `simplifiedQuestion` is intentionally left blank ("") for every question.
//   - `correctAnswers` are extracted from the explanation text and then
//     fuzzy-matched back to the parsed choices so the stored value is always
//     EXACTLY equal to one of the choices. Any question the parser is unsure
//     about is reported as a warning so it can be reviewed by hand.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [, , inArg, outArg, idArg] = process.argv;
const inputPath = resolve(inArg ?? 'docs/exams/exam-3.txt');
const outputPath = resolve(outArg ?? 'docs/exams/cloud-ops-exam-3.json');
const examId = idArg ?? 'cloud-ops-exam-3';
const examTitle = 'Practice Test - AWS Certified CloudOps Engineer Associate';

// --- text helpers ---------------------------------------------------------

const DASH_BULLET = /^[–—•\-]\s*/; // – — • -

/** Collapse whitespace and tidy stray spaces before punctuation. */
function cleanText(s) {
  return s
    .replace(/​/g, '') // zero-width space (present in some headers)
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:?!])/g, '$1')
    .trim();
}

/** Tokenise for fuzzy matching: lowercase alphanumeric words. */
function tokens(s) {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Normalised, space-joined token string (used for substring/prefix tests). */
function normFull(s) {
  return tokens(s).join(' ');
}

/** Jaccard similarity over token sets. */
function similarity(a, b) {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

/**
 * Pick the single choice that best matches `candidate`. Answer sentences in the
 * explanations often equal a choice but then trail off into extra commentary,
 * so a choice that is a prefix of the candidate is treated as a strong match.
 */
function matchChoice(candidate, choices) {
  const cand = normFull(candidate);
  if (!cand) return null;

  // Exact normalised match.
  for (const c of choices) if (normFull(c) === cand) return c;

  // The choice is a prefix of the candidate (answer text + trailing prose).
  let best = null;
  let bestLen = -1;
  for (const c of choices) {
    const n = normFull(c);
    if (n && cand.startsWith(n) && n.length > bestLen) {
      best = c;
      bestLen = n.length;
    }
  }
  if (best) return best;

  // Jaccard fallback.
  let bestScore = 0;
  for (const c of choices) {
    const score = similarity(candidate, c);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return bestScore >= 0.5 ? best : null;
}

/** Return every choice whose text appears (as whole tokens) in `blob`. */
function selectChoicesInText(blob, choices) {
  const b = ` ${normFull(blob)} `;
  const hits = [];
  for (const c of choices) {
    const n = normFull(c);
    if (!n) continue;
    const idx = b.indexOf(` ${n} `);
    if (idx >= 0) hits.push({ c, idx, len: n.length });
  }
  // Drop choices fully contained inside a longer matched choice at the same
  // spot (avoids a short choice matching as part of a longer one).
  const filtered = hits.filter(
    (h) =>
      !hits.some(
        (o) => o !== h && o.idx <= h.idx && o.idx + o.len >= h.idx + h.len,
      ),
  );
  return filtered.sort((a, b2) => a.idx - b2.idx).map((h) => h.c);
}

/** Group consecutive non-blank lines into paragraphs (split on blank lines). */
function groupByBlankLines(lines) {
  const groups = [];
  let cur = [];
  for (const line of lines) {
    if (line.trim() === '') {
      if (cur.length) groups.push(cur);
      cur = [];
    } else {
      cur.push(line.trim());
    }
  }
  if (cur.length) groups.push(cur);
  return groups;
}

function trimBlankEdges(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === '') start++;
  while (end > start && lines[end - 1].trim() === '') end--;
  return lines.slice(start, end);
}

// --- choice splitting ------------------------------------------------------

const PROMPT_END =
  /(\?\s*$)|(\(\s*select\s+(two|2|three|3)\s*\.?\s*\)\s*$)/i;

function isPromptEnd(line) {
  return PROMPT_END.test(line.trim());
}

/**
 * Split a region (everything between the category line and the
 * Incorrect/Correct marker) into the question prompt and the answer choices.
 */
function splitQuestionAndChoices(regionLines, expectedChoices) {
  const region = trimBlankEdges(regionLines);

  // The prompt is the LAST line that ends like a question. Anything after it
  // is part of the answer choices. (Embedded data blocks that appear *after*
  // the question mark are rare and handled as manual patches.)
  let promptEndIdx = -1;
  for (let i = region.length - 1; i >= 0; i--) {
    if (isPromptEnd(region[i])) {
      promptEndIdx = i;
      break;
    }
  }

  let questionLines;
  let choiceLines;
  if (promptEndIdx === -1) {
    // No "?" prompt (the question is phrased as a scenario/instruction). Treat
    // the last `expectedChoices` non-blank lines as the choices.
    const nonBlank = region
      .map((l, i) => ({ l, i }))
      .filter((x) => x.l.trim() !== '');
    if (nonBlank.length > expectedChoices) {
      const firstChoiceIdx = nonBlank[nonBlank.length - expectedChoices].i;
      questionLines = region.slice(0, firstChoiceIdx);
      choiceLines = region.slice(firstChoiceIdx);
    } else {
      questionLines = region;
      choiceLines = [];
    }
  } else {
    questionLines = region.slice(0, promptEndIdx + 1);
    choiceLines = region.slice(promptEndIdx + 1);
  }

  const question = groupByBlankLines(questionLines)
    .map((g) => cleanText(g.join(' ')))
    .join('\n\n');

  const choices = splitChoices(trimBlankEdges(choiceLines), expectedChoices);
  return { question, choices };
}

function splitChoices(choiceLines, expectedChoices) {
  // Blank lines are unreliable separators in these dumps (some single-spaced
  // blocks contain stray blanks), so we flatten first and use the expected
  // choice count to decide how to split.
  const flat = choiceLines.map((l) => l.trim()).filter(Boolean);
  if (flat.length === 0) return [];

  // Numbered multi-step options: each choice is a block of "1. ... 2. ..."
  // lines, so a new choice begins at every line that starts with "1.".
  if (flat.filter((l) => /^1[.)]\s/.test(l)).length >= 2) {
    const groups = [];
    let cur = null;
    for (const line of flat) {
      if (/^1[.)]\s/.test(line)) {
        if (cur) groups.push(cur);
        cur = [line];
      } else if (cur) {
        cur.push(line);
      } else {
        cur = [line];
      }
    }
    if (cur) groups.push(cur);
    return groups.map((g) => cleanText(g.join(' ')));
  }

  // Exactly the expected number of lines -> one choice per line.
  if (flat.length === expectedChoices) {
    return flat.map(cleanText);
  }

  // More lines than choices -> some choices wrapped across lines (usually
  // because of inline code). Re-join: a choice ends when a line ends with
  // terminal punctuation.
  if (flat.length > expectedChoices) {
    const merged = [];
    let cur = '';
    for (const line of flat) {
      cur = cur ? `${cur} ${line}` : line;
      if (/[.?!]$/.test(line)) {
        merged.push(cleanText(cur));
        cur = '';
      }
    }
    if (cur.trim()) merged.push(cleanText(cur));
    return merged;
  }

  // Fewer lines than expected -> best effort, one per line.
  return flat.map(cleanText);
}

// --- correct-answer extraction --------------------------------------------

const STRIP_LEAD = /^(?:hence|therefore|thus|so)\b[,:]?\s*/i;
const MARK_INCORRECT = /\b(?:is|are)\s+(?:both\s+|all\s+)?incorrect\b/i;

/** Pull answers from an explicit "the correct answer(s) is/are ..." statement. */
function positiveExtract(explanationLines, choices, expectedCorrect) {
  const isStopper = (t) =>
    MARK_INCORRECT.test(t) || /^(the option|the options|the following)\b/i.test(t);

  // Collect the answer text that follows a declaration line: any dash bullets
  // plus inline/continuation text, stopping where the incorrect options begin.
  function gatherAfter(startIdx, firstRemainder) {
    const bullets = [];
    const extra = [];
    if (firstRemainder && firstRemainder.trim()) extra.push(firstRemainder.trim());
    let sawBullet = false;
    for (let j = startIdx + 1; j < explanationLines.length && bullets.length + extra.length < 20; j++) {
      const t = explanationLines[j].trim();
      if (t === '') continue;
      if (isStopper(t)) break;
      if (DASH_BULLET.test(t)) {
        sawBullet = true;
        bullets.push(t.replace(DASH_BULLET, '').trim());
      } else if (sawBullet) {
        break;
      } else {
        extra.push(t);
      }
    }
    return { bullets, extra, sawBullet };
  }

  if (expectedCorrect >= 2) {
    // Forward plural: "correct answers/options ... are[:]" (bullets or inline).
    for (let i = 0; i < explanationLines.length; i++) {
      const m = explanationLines[i].match(
        /correct (?:answers|options)\b[^.:\n]*?(?::|\bare\b:?)\s*(.*)$/i,
      );
      if (!m) continue;
      const { bullets, extra, sawBullet } = gatherAfter(i, m[1]);
      const res = [];
      if (sawBullet) {
        // Match each bullet to its closest choice (robust to paraphrasing).
        for (const b of bullets) {
          const c = matchChoice(b, choices);
          if (c && !res.includes(c)) res.push(c);
        }
      }
      if (res.length < expectedCorrect) {
        // Inline "A and B" form: find choices mentioned verbatim in the text.
        for (const c of selectChoicesInText([...extra, ...bullets].join(' '), choices)) {
          if (!res.includes(c)) res.push(c);
        }
      }
      if (res.length) return res;
    }
    // Reversed plural: "X and Y are the correct answers/options."
    for (const line of explanationLines) {
      const m = line.match(/(.+?)\s+are the correct (?:answers|options)\b/i);
      if (m) {
        const sel = selectChoicesInText(m[1].replace(STRIP_LEAD, ''), choices);
        if (sel.length) return sel;
      }
    }
    return [];
  }

  // Forward singular: "correct answer ... is[:] X" or "correct answer: X".
  // The answer may be inline or on the following line(s) (e.g. numbered steps).
  for (let i = 0; i < explanationLines.length; i++) {
    const m = explanationLines[i].match(/correct answer\b[^.:\n]*?(?::|\bis\b:?)\s*(.*)$/i);
    if (!m) continue;
    const { bullets, extra } = gatherAfter(i, m[1]);
    const c = matchChoice([...extra, ...bullets].join(' '), choices);
    if (c) return [c];
  }
  // Reversed singular: "X is the correct answer."
  for (const line of explanationLines) {
    const m = line.match(/(.+?)\s+is the correct answer\b/i);
    if (m && m[1].trim()) {
      const c = matchChoice(m[1].replace(STRIP_LEAD, '').trim(), choices);
      if (c) return [c];
    }
  }
  return [];
}

/**
 * Elimination fallback: a choice explicitly called out as "... is incorrect"
 * is wrong; whatever choices are left are the answers. Only used when it lands
 * on exactly the expected number of answers.
 */
function eliminateIncorrect(explanationLines, choices, expectedCorrect) {
  const wrong = new Set();
  for (let i = 0; i < explanationLines.length; i++) {
    const raw = explanationLines[i].trim();
    const ln = normFull(raw);
    const incIdx = ln.indexOf('incorrect');
    if (incIdx < 0) continue;
    const pre = ln.slice(0, incIdx); // text stated to be incorrect
    const padded = ` ${pre} `;
    let bestC = null;
    let bestS = 0;
    for (const c of choices) {
      const n = normFull(c);
      if (!n) continue;
      if (padded.includes(` ${n} `)) wrong.add(c); // exact whole-token mention
      const s = similarity(pre, c); // fuzzy (handles paraphrased distractors)
      if (s > bestS) {
        bestS = s;
        bestC = c;
      }
    }
    if (bestC && bestS >= 0.6) wrong.add(bestC);

    // List-header form: "The following options are all incorrect ...:" followed
    // by lines naming the wrong choices.
    if (/:$/.test(raw)) {
      for (let j = i + 1; j < explanationLines.length; j++) {
        const t = explanationLines[j].trim();
        if (t === '') continue;
        const c = matchChoice(t.replace(DASH_BULLET, ''), choices);
        if (c) wrong.add(c);
        else break; // first non-choice line ends the list
      }
    }
  }
  const remaining = choices.filter((c) => !wrong.has(c));
  return remaining.length === expectedCorrect ? remaining : [];
}

function extractCorrectAnswers(explanationLines, choices, expectedCorrect) {
  const positive = positiveExtract(explanationLines, choices, expectedCorrect);
  if (positive.length === expectedCorrect) return positive;
  const elim = eliminateIncorrect(explanationLines, choices, expectedCorrect);
  if (elim.length === expectedCorrect) return elim;
  return positive.length ? positive : elim;
}

// --- explanation assembly --------------------------------------------------

function buildExplanation(explanationLines) {
  // Drop trailing reference/cheat-sheet sections and bare URLs.
  const cut = [];
  for (const line of explanationLines) {
    const t = line.trim();
    if (/^references\s*:?$/i.test(t)) break;
    if (/^check out (this|our)/i.test(t)) break;
    if (/^https?:\/\//i.test(t)) continue;
    cut.push(line);
  }

  const paragraphs = groupByBlankLines(cut).map((g) => cleanText(g.join(' ')));

  // Drop consecutive duplicate paragraphs (some dumps repeat content).
  const deduped = [];
  for (const p of paragraphs) {
    if (deduped[deduped.length - 1] !== p) deduped.push(p);
  }
  return deduped.join('\n\n');
}

// --- manual patches --------------------------------------------------------
// A few questions don't fit the automatic heuristics. Patches are keyed by
// exam id then question number, and receive the parsed question object to fix
// it in place. Keeping them here means the converter remains the single,
// re-runnable source of truth.
const PATCHES_BY_EXAM = {
  'cloud-ops-exam-3': {
    // Q12 embeds a JSON policy *after* the question mark (parsed as a choice).
    12(q) {
    const policy = [
      '{',
      '"Id": "TutorialsDojo.com S3 Policy",',
      '"Version": "2012-10-17",',
      '"Statement": [',
      '{',
      '"Sid": "TutsDojo_S3_GetObject_and_ListBucket_Policy",',
      '"Action": [',
      '"s3:GetObject",',
      '"s3:ListBucket"',
      '],',
      '"Effect": "Allow",',
      '"Resource": "arn:aws:s3:::tutorialsdojo",',
      '"Principal": "*"',
      '}',
      ']',
      '}',
    ].join('\n');
    q.question = `${q.question}\n\n${policy}`;
    q.choices = [
      'You will be prompted with an "Action does not apply to any resource(s) in statement" error.',
      'The tutorialsdojo bucket including all its objects will be publicly accessible and downloadable to anyone.',
      'The tutorialsdojo bucket including all its objects will be publicly visible to anyone.',
      'The tutorialsdojo bucket including all its objects will be publicly visible to anyone but downloading the objects is not allowed.',
    ];
    q.correctAnswers = [q.choices[0]];
    },
    // Q27 states its two answers inline ("... is correct ...") with no bullets.
    27(q) {
      q.correctAnswers = [q.choices[2], q.choices[4]];
    },
    // Q40 is a "which is NOT needed" question with no "correct answer" phrase.
    40(q) {
      q.correctAnswers = [q.choices[3]];
    },
  },

  'cloud-ops-exam-5': {
    // Q27 has a JSON bucket policy embedded inside the first choice.
    27(q) {
      const policy = [
        '{',
        '"Id": "Policy1540805844321",',
        '"Version": "2012-10-17",',
        '"Statement": [',
        '{',
        '"Sid": "Stmt1540806166020",',
        '"Action": [',
        '"s3:GetObject"',
        '],',
        '"Effect": "Deny",',
        '"Resource": "arn:aws:s3:::tutorialsdojo/aws",',
        '"Principal": "*"',
        '}',
        ']',
        '}',
      ].join('\n');
      q.choices = [
        `Set the S3 bucket policy to:\n\n${policy}`,
        'For the new files, set the object ACL to only have a READ_ACP permission.',
        'Verify that the default server-side encryption is enabled in the S3 bucket using AWS KMS keys (SSE-KMS).',
        'Enable the Object Versioning.',
      ];
      q.correctAnswers = [q.choices[2]];
    },
  },

  'cloud-ops-exam-6': {
    // Q40's explanation describes the answer in prose without a "correct
    // answer is" statement and without calling the other options incorrect.
    40(q) {
      q.correctAnswers = [q.choices[3]]; // Dead-Letter Queues
    },
  },

  'cloud-ops-exam-7': {
    // Q1 has no answer/explanation block in the source file. Weighted routing
    // is the standard way to expose a new version to a fraction of users.
    1(q) {
      q.correctAnswers = [q.choices[0]]; // Weighted routing policy
      if (!q.explanation) {
        q.explanation =
          'A weighted routing policy lets you associate multiple resources with a single domain name and control the proportion of traffic routed to each one by assigning relative weights. By giving the new website version a small weight, only a fraction of users are directed to it for testing while the rest continue to reach the existing version.';
      }
    },
  },
};

// --- main parse loop -------------------------------------------------------

const raw = readFileSync(inputPath, 'utf8');
const lines = raw.split(/\r?\n/);

// Find question boundaries: lines like "12. Question".
const starts = [];
for (let i = 0; i < lines.length; i++) {
  if (/^\d+\.\s*Question\s*$/.test(lines[i])) starts.push(i);
}

const questions = [];
const warnings = [];

for (let q = 0; q < starts.length; q++) {
  const blockStart = starts[q];
  const blockEnd = q + 1 < starts.length ? starts[q + 1] : lines.length;
  const block = lines.slice(blockStart, blockEnd);

  const number = parseInt(block[0].match(/^(\d+)\./)[1], 10);

  // Category line (skipped in output, but used to know where content starts).
  let contentStart = 1;
  if (/^Category\s*:/i.test(block[1] ?? '')) contentStart = 2;

  // Find the Incorrect/Correct marker that separates choices from explanation.
  let markerIdx = -1;
  for (let i = contentStart; i < block.length; i++) {
    const t = block[i].trim();
    if (t === 'Incorrect' || t === 'Correct') {
      markerIdx = i;
      break;
    }
  }
  if (markerIdx === -1) {
    // Some source questions (e.g. exam 7 Q1) lack an answer/explanation block.
    // Keep the question (choices only) rather than dropping it.
    warnings.push(`Q${number}: no Incorrect/Correct marker; no explanation.`);
    markerIdx = block.length;
  }

  const regionLines = block.slice(contentStart, markerIdx);
  const explanationLines = block.slice(markerIdx + 1);

  const regionText = regionLines.join('\n');
  const isSelectMultiple = /\bselect\s+(two|2)\b/i.test(regionText);
  const expectedChoices = isSelectMultiple ? 5 : 4;

  const { question, choices } = splitQuestionAndChoices(
    regionLines,
    expectedChoices,
  );
  const expectedCorrect = isSelectMultiple ? 2 : 1;
  const correctAnswers = extractCorrectAnswers(
    explanationLines,
    choices,
    expectedCorrect,
  );
  const explanation = buildExplanation(explanationLines);

  const question_ = {
    number,
    question,
    simplifiedQuestion: '',
    choices,
    correctAnswers,
    explanation,
  };
  const patches = PATCHES_BY_EXAM[examId] ?? {};
  if (patches[number]) patches[number](question_);

  // Most questions have 4 choices; "Select TWO" ones usually have 5 but some
  // legitimately have 4, so only flag counts that are clearly wrong.
  if (question_.choices.length < 3 || question_.choices.length > 6) {
    warnings.push(
      `Q${number}: parsed ${question_.choices.length} choices.`,
    );
  }
  if (question_.correctAnswers.length !== expectedCorrect) {
    warnings.push(
      `Q${number}: matched ${question_.correctAnswers.length} correct answer(s) (expected ${expectedCorrect}).`,
    );
  }

  // Final guard: every correct answer must be exactly one of the choices.
  for (const ans of question_.correctAnswers) {
    if (!question_.choices.includes(ans)) {
      warnings.push(`Q${number}: correct answer not found among choices.`);
    }
  }

  questions.push(question_);
}

const output = { id: examId, title: examTitle, questions };

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n', 'utf8');

console.log(`Parsed ${questions.length} questions -> ${outputPath}`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s) to review:`);
  for (const w of warnings) console.log(`  - ${w}`);
} else {
  console.log('No warnings.');
}
