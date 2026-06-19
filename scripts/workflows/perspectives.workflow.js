// @ts-nocheck
/* eslint-disable */
//
// Trend "Perspectives" generation workflow (run by the Workflow tool, NOT the app build).
// The globals `agent`, `pipeline`, `parallel`, `log`, and `args` are injected by the
// workflow runtime. Validated on a 2-trend prototype; see docs/PERSPECTIVES_PLAN.md.
//
// INPUT (args): an array of trends to process, each:
//   { slug, name, category, whatItIs, whatsHappening }
//   The orchestrating chat builds this with scripts/extract-trends-for-perspectives.ts.
//
// PIPELINE (per trend): survey -> shape gate -> per-camp research (dynamic fan-out)
//   -> camp verify -> synthesize -> final-copy verify.
// MODELS: sonnet researches, opus judges/verifies, opus writes (swap synth to 'fable'
//   when Fable is available again if you prefer its voice).
//
// OUTPUT: one object per trend; shape 'skip' => perspectives: null. Save the returned
//   array into prisma/seed-data/trend-perspectives.ts (slug -> perspectives), curate,
//   then seed with scripts/seed-trend-perspectives.ts.

export const meta = {
  name: 'trend-perspectives',
  description: 'Generate the Perspectives section for trends: survey, shape-gate, per-camp research, verify, synthesize, final-verify',
  whenToUse: 'Generate or refresh the Perspectives content for trends (pass the trends as args)',
  phases: [
    { title: 'Survey', detail: 'map the real camps of opinion (sonnet, web research if thin)' },
    { title: 'Gate', detail: 'decide skip/tradeoff/binary/multiple, adversarially (opus)' },
    { title: 'Research', detail: 'steelman each camp with sources, dynamic fan-out (sonnet)' },
    { title: 'Verify', detail: 'fact-check camps for strawmen/false balance/misattribution (opus)' },
    { title: 'Synthesize', detail: 'write collapsed one-liner + full body per stance, dash-free (opus)' },
    { title: 'Final check', detail: 'verify the synthesized copy: claims, attributions, sources, dashes (opus)' },
  ],
}

const SYNTH_MODEL = 'opus' // swap to 'fable' for its voice once Fable is available again

const SURVEY_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    axis: { type: 'string', description: 'the core question people disagree about' },
    camps: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { label: { type: 'string' }, who: { type: 'string' }, gist: { type: 'string' } },
      required: ['label', 'who', 'gist'] } },
    contestedness: { type: 'number', description: '0 settled consensus .. 1 fiercely debated' },
    freshResearchDone: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: ['axis', 'camps', 'contestedness', 'freshResearchDone', 'notes'],
}

const GATE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    shape: { type: 'string', enum: ['skip', 'tradeoff', 'binary', 'multiple'] },
    stances: { type: 'array', items: { type: 'string' }, description: 'camp labels to develop; [] if skip; 2 for binary/tradeoff; 3-4 for multiple' },
    leans: { type: 'string', description: 'the stance the weight of evidence favors, or "genuinely contested"' },
    rationale: { type: 'string' },
  },
  required: ['shape', 'stances', 'leans', 'rationale'],
}

const CAMP_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    label: { type: 'string' },
    proponents: { type: 'string', description: 'camp/archetype or verified orgs/figures; never a fabricated quote' },
    steelman: { type: 'string', description: 'the strongest version of the argument its holders would endorse' },
    evidence: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { claim: { type: 'string' }, source: { type: 'string' }, url: { type: 'string' } },
      required: ['claim', 'source'] } },
  },
  required: ['label', 'proponents', 'steelman', 'evidence'],
}

const CAMP_VERIFY_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    camps: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { label: { type: 'string' }, real: { type: 'boolean' }, accurate: { type: 'boolean' },
        strawman: { type: 'boolean' }, issues: { type: 'string' } },
      required: ['label', 'real', 'accurate', 'strawman', 'issues'] } },
    falseBalance: { type: 'boolean' },
    overallOk: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: ['camps', 'falseBalance', 'overallOk', 'notes'],
}

const SYNTH_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    intro: { type: 'string', description: 'one-sentence framing of the axis; may be empty' },
    stances: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: {
        label: { type: 'string', description: 'trend-specific stance label' },
        who: { type: 'string', description: 'attribution: camp/archetype or verified orgs' },
        summary: { type: 'string', description: 'ONE sentence; the collapsed-box view' },
        body: { type: 'string', description: 'the fuller reasoning shown when expanded' },
        sources: { type: 'array', items: { type: 'object', additionalProperties: false,
          properties: { title: { type: 'string' }, url: { type: 'string' } }, required: ['title', 'url'] },
          description: 'up to 2 real sources from the camp evidence; omit any without a real URL' },
      },
      required: ['label', 'who', 'summary', 'body', 'sources'] } },
    leans: { type: 'string', description: 'honest synthesis of where evidence points, or that it is genuinely contested' },
  },
  required: ['intro', 'stances', 'leans'],
}

const FINAL_VERIFY_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    ok: { type: 'boolean', description: 'true only if claims are supported, attributions accurate, sources real, and dash-clean' },
    dashClean: { type: 'boolean', description: 'true if NO em dashes or en dashes appear in intro/summary/body/leans' },
    issues: { type: 'array', items: { type: 'string' } },
  },
  required: ['ok', 'dashClean', 'issues'],
}

const WEB = `To research, load web tools via ToolSearch (query "WebSearch" then "WebFetch") and use them.`
const DASH = `CRITICAL: use ZERO em dashes and en dashes in any member-facing text (intro, summary, body, leans). Use plain hyphens, commas, or periods only. Write numeric ranges as "18 to 24", never "18-24" with a dash glyph.`

const TRENDS = Array.isArray(args) ? args : []
if (TRENDS.length === 0) {
  log('No trends passed in args. Pass an array of { slug, name, category, whatItIs, whatsHappening }.')
  return []
}
log(`Generating Perspectives for ${TRENDS.length} trends`)

const results = await pipeline(TRENDS, async (t) => {
  // 1. Survey the real landscape of opinion
  const survey = await agent(
    `You are mapping the GENUINE perspectives on a trend for an editorial brief, not manufacturing sides.\n\n` +
    `Trend: ${t.name} (${t.category})\nWhat it is: ${t.whatItIs}\nWhat is happening now: ${t.whatsHappening}\n\n` +
    `Identify the real, genuinely-held camps of opinion on the core question. For each: a short label, who holds it ` +
    `(a camp or archetype or representative orgs, never a fabricated quote), and a one-line gist. State the core axis ` +
    `of disagreement and rate contestedness 0-1. Use the content above first; only do fresh research if it is too thin ` +
    `to name the camps or their current proponents. ${WEB}`,
    { schema: SURVEY_SCHEMA, model: 'sonnet', phase: 'Survey', label: `survey:${t.slug}` },
  )
  if (!survey) return { slug: t.slug, name: t.name, error: 'survey failed' }

  // 2. Adversarial shape gate
  const gate = await agent(
    `Decide HOW or WHETHER to present perspectives on "${t.name}". Survey: ${JSON.stringify(survey)}\n\n` +
    `Be adversarial: actively try to collapse these camps into consensus. If you can, prefer "skip" (genuine consensus, ` +
    `presenting sides would be manufactured) or "tradeoff" (really one fundamental tension with two poles, not camps). ` +
    `Use "binary" for two real opposing camps, "multiple" for 3+ distinct camps (cap 4). List the stance labels to develop ` +
    `(empty if skip). Set "leans" to where the weight of evidence currently points by stance name, or "genuinely contested" ` +
    `if balanced. Do NOT force a 50/50.`,
    { schema: GATE_SCHEMA, model: 'opus', phase: 'Gate', label: `gate:${t.slug}` },
  )
  if (!gate) return { slug: t.slug, name: t.name, error: 'gate failed' }
  if (gate.shape === 'skip' || gate.stances.length === 0) {
    return { slug: t.slug, name: t.name, shape: 'skip', leans: gate.leans, rationale: gate.rationale, perspectives: null }
  }

  // 3. Steelman each camp, with sources (dynamic fan-out sized to the camp count)
  const camps = (await parallel(gate.stances.map((label) => () =>
    agent(
      `Research and STEELMAN one camp's view on "${t.name}". Camp: "${label}". Axis: ${survey.axis}\n\n` +
      `Present the strongest version of this view as its holders would endorse it (no strawman). Give the proponents ` +
      `(camp/archetype or VERIFIED orgs/figures, never a fabricated quote or position), the core reasoning, and 1-3 ` +
      `pieces of evidence each with a real, checkable source (include the url when you have it). ${WEB}`,
      { schema: CAMP_SCHEMA, model: 'sonnet', phase: 'Research', label: `camp:${t.slug}:${label.slice(0, 24)}` },
    )))).filter(Boolean)
  if (camps.length === 0) return { slug: t.slug, name: t.name, error: 'no camps researched' }

  // 4. Adversarial accuracy verify of the raw camps
  const campVerify = await agent(
    `Adversarially fact-check these camps on "${t.name}". Camps: ${JSON.stringify(camps)}\n\n` +
    `For each: is the stance REAL (actually held), ACCURATELY represented, and is it a STRAWMAN? Flag any misattribution ` +
    `or fabricated proponent/quote. Judge falseBalance: are they presented as equal when evidence clearly favors one? ` +
    `Set overallOk false if anything must be fixed before publishing.`,
    { schema: CAMP_VERIFY_SCHEMA, model: 'opus', phase: 'Verify', label: `verify:${t.slug}` },
  )

  // 5. Synthesize the on-page copy (collapsed one-liner + full body per stance)
  const synth = await agent(
    `Write the on-page "Perspectives" section for "${t.name}" (${t.category}). Shape: ${gate.shape}. ` +
    `Verified camps: ${JSON.stringify(camps)}. Evidence-leans: ${gate.leans}. ` +
    `Verifier notes (apply these fixes, e.g. merge near-duplicate camps, drop unverified figures/quotes): ` +
    `${campVerify ? campVerify.notes : 'n/a'}.\n\n` +
    `For EACH stance produce: a trend-SPECIFIC label (for AI safety think doomers vs accelerationists; for capital, ` +
    `the bull case vs the bubble case; never generic "View A/B"); who holds it; a SUMMARY that is exactly ONE sentence ` +
    `(the collapsed view a reader sees before expanding); a BODY of the fuller reasoning; and up to 2 SOURCES drawn only ` +
    `from the camp evidence, each with a real url (omit any source without a real url, never invent one). ` +
    `Length: 2 stances get a ~2-3 sentence body each; 3-4 stances get ~1-2 sentences each. An optional one-sentence intro ` +
    `may name the axis. Convey asymmetry honestly through "leans" rather than forced balance. ${DASH}`,
    { schema: SYNTH_SCHEMA, model: SYNTH_MODEL, phase: 'Synthesize', label: `synth:${t.slug}` },
  )
  if (!synth) {
    return { slug: t.slug, name: t.name, shape: gate.shape, leans: gate.leans, rationale: gate.rationale, camps, error: 'synth failed' }
  }

  // 6. Final-copy verify: check what actually ships, not just the raw camps
  const finalVerify = await agent(
    `Fact-check the FINAL published copy for "${t.name}" against its source camps. ` +
    `Final copy: ${JSON.stringify(synth)}\nSource camps: ${JSON.stringify(camps)}\n\n` +
    `Confirm: every claim in each summary/body is supported by the camp evidence (no new unsupported claim the synth ` +
    `invented), every "who" attribution is accurate, and every source url is real (not fabricated). Then do a DASH SWEEP: ` +
    `set dashClean false if ANY em dash or en dash appears in intro, any summary, any body, or leans. ` +
    `Set ok true only if claims, attributions, and sources are clean AND dashClean is true. List concrete issues.`,
    { schema: FINAL_VERIFY_SCHEMA, model: 'opus', phase: 'Final check', label: `final:${t.slug}` },
  )

  return {
    slug: t.slug, name: t.name, shape: gate.shape, contestedness: survey.contestedness,
    rationale: gate.rationale,
    perspectives: { shape: gate.shape, intro: synth.intro, stances: synth.stances, leans: synth.leans },
    campVerify: campVerify ? { overallOk: campVerify.overallOk, falseBalance: campVerify.falseBalance, notes: campVerify.notes } : null,
    finalVerify: finalVerify || null,
  }
})

return results
