/**
 * Multiple-choice quiz questions for the Capital Markets & VC track.
 *
 * Two questions per vocab term (42 terms, 84 questions), authored strictly
 * from prisma/seed-data/capital-markets-vocab.ts and the cited research at
 * docs/research/capital-markets-vocab-research.json. No facts appear here
 * that are not in those two sources; scenario numbers only instantiate
 * formulas those sources state (e.g. $500k on a $5M post-money cap = 10%).
 *
 * Authoring rules (enforced by scripts/seed-capital-questions.ts --check):
 *   - conceptSlug is the FULL cm-* Concept slug (matches the live DB rows).
 *   - type is always "MC"; exactly 4 options; exactly one isCorrect.
 *   - difficulty is copied from the term's difficulty in the vocab file.
 *   - Plain English for mixed, non-finance backgrounds; no trick questions;
 *     distractors are plausible but clearly wrong against the vocab (most
 *     describe a DIFFERENT term, which is what members actually confuse).
 *   - No em or en dashes anywhere; hyphens for ranges (10-20%) are fine.
 *
 * The seed script upserts by (conceptSlug, questionText): editing a
 * questionText here creates a NEW question on re-seed and leaves the old
 * row behind (reported as a stray, never auto-deleted, because attempts
 * may reference it).
 */

export interface CapitalQuestionSeed {
  /** Full cm-* concept slug this question belongs to. */
  conceptSlug: string;
  type: "MC";
  questionText: string;
  options: { text: string; isCorrect: boolean }[];
  answerExplanation: string;
  difficulty: "FUNDAMENTALS" | "INTERMEDIATE" | "ADVANCED";
}

export const CAPITAL_MARKETS_QUESTIONS: CapitalQuestionSeed[] = [
  // ── Venture Financing ──────────────────────────────────────────────────────

  // SAFE
  {
    conceptSlug: "cm-safe",
    type: "MC",
    questionText: "What does an investor receive when they fund a startup through a SAFE?",
    options: [
      { text: "Shares issued immediately at a negotiated per-share price", isCorrect: false },
      { text: "A loan the company must repay in cash, with interest", isCorrect: false },
      { text: "The right to receive shares later, when the company raises its next priced round", isCorrect: true },
      { text: "A guaranteed seat on the company's board of directors", isCorrect: false },
    ],
    answerExplanation:
      "A SAFE (Simple Agreement for Future Equity) is not immediate stock, not debt, and carries no board right. The investor pays cash now and gets the right to shares at the next priced equity round. Y Combinator created it in 2013, and the 2018 post-money version is now the standard form.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-safe",
    type: "MC",
    questionText:
      "A startup raises $500k on a post-money SAFE with a $5M valuation cap. What ownership does that SAFE investor hold when the SAFE converts?",
    options: [
      { text: "It cannot be known until the next priced round sets a share price", isCorrect: false },
      { text: "10%, the purchase amount divided by the post-money valuation cap", isCorrect: true },
      { text: "5%, because founders and investors split the dilution equally", isCorrect: false },
      { text: "25%, the standard ownership for any seed investment", isCorrect: false },
    ],
    answerExplanation:
      "Post-money SAFE ownership is locked at signing: purchase amount / post-money cap, so $500k / $5M = 10%. That up-front certainty is the instrument's main selling point. Note that SAFEs do not dilute each other (founders absorb all of that), and raising an amount equal to the cap would leave founders with 0%.",
    difficulty: "FUNDAMENTALS",
  },

  // Priced Round
  {
    conceptSlug: "cm-priced-round",
    type: "MC",
    questionText: "What makes a financing a priced round?",
    options: [
      { text: "Investors lend money that converts into shares at a discount later", isCorrect: false },
      { text: "The company sets a valuation cap but leaves the share price for later", isCorrect: false },
      { text: "Existing shareholders sell their shares to new buyers", isCorrect: false },
      {
        text: "The company and investors agree on a valuation and per-share price, and investors buy newly issued shares at that price",
        isCorrect: true,
      },
    ],
    answerExplanation:
      "A priced round fixes an actual valuation and per-share price, and investors buy newly issued preferred shares, so everyone knows exactly what percentage changed hands. Caps without prices describe SAFEs and convertible notes, and selling existing shares is a secondary, not a priced round.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-priced-round",
    type: "MC",
    questionText: "Why is a priced round described as the moment a startup's ownership and governance get formally locked in?",
    options: [
      { text: "It triggers the full legal machinery: a term sheet, board seats, and terms like liquidation preferences", isCorrect: true },
      { text: "It is the first time the company is legally allowed to spend investor money", isCorrect: false },
      { text: "It guarantees the company will eventually reach an IPO", isCorrect: false },
      { text: "It permanently prevents any future dilution", isCorrect: false },
    ],
    answerExplanation:
      "Unlike a SAFE or convertible note, a priced round sets a hard valuation and issues real shares, which brings the full legal package with it: the negotiated term sheet, board composition, and investor protections. Series A, B, and C are all priced rounds.",
    difficulty: "FUNDAMENTALS",
  },

  // Series A / B / C
  {
    conceptSlug: "cm-series-abc",
    type: "MC",
    questionText: "A startup announces its Series B. Based on the usual progression, what is this money typically for?",
    options: [
      { text: "Finding a repeatable business model for the first time", isCorrect: false },
      { text: "Scaling a business model that is already working", isCorrect: true },
      { text: "Pre-IPO expansion into new markets", isCorrect: false },
      { text: "Buying back the founders' shares", isCorrect: false },
    ],
    answerExplanation:
      "The conventional arc: Series A funds finding a repeatable business model, Series B funds scaling it, and Series C and beyond fund expansion, new markets, or pre-IPO growth. Each round is typically bigger and at a higher valuation than the last.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-series-abc",
    type: "MC",
    questionText: "What are the Series A, B, and C labels, formally speaking?",
    options: [
      { text: "Legal categories defined by securities regulators", isCorrect: false },
      { text: "Different classes of common stock with different voting rights", isCorrect: false },
      { text: "Naming conventions for sequential, progressively larger priced rounds", isCorrect: true },
      { text: "Credit ratings assigned by the lead investor", isCorrect: false },
    ],
    answerExplanation:
      "The letters are conventions, not legal categories. They still carry real signal: the stage tells you roughly how proven the company is, how much money is involved, and what investors expect next.",
    difficulty: "FUNDAMENTALS",
  },

  // Term Sheet
  {
    conceptSlug: "cm-term-sheet",
    type: "MC",
    questionText: "What is a term sheet?",
    options: [
      { text: "The final, binding legal contract that closes a financing", isCorrect: false },
      {
        text: "A short, mostly non-binding document laying out a deal's key economic and control terms before the full contracts are drafted",
        isCorrect: true,
      },
      { text: "A monthly financial report sent to investors", isCorrect: false },
      { text: "A public filing announcing a funding round", isCorrect: false },
    ],
    answerExplanation:
      "A term sheet sketches the key terms of an investment (valuation, amount, liquidation preference, board seats, investor protections) and is mostly non-binding. Once both sides sign it, lawyers turn it into the binding financing documents.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-term-sheet",
    type: "MC",
    questionText: "If a term sheet is mostly non-binding, why is it still where the most important work in a deal happens?",
    options: [
      { text: "It is the only document securities regulators review", isCorrect: false },
      { text: "It sets the price for a future IPO", isCorrect: false },
      { text: "Signing it transfers the investment money immediately", isCorrect: false },
      { text: "The real negotiation happens there; the final legal documents mostly formalize what it says", isCorrect: true },
    ],
    answerExplanation:
      "The economic and control terms agreed in the term sheet carry through to the binding documents largely unchanged. Knowing how to read one tells you who controls the company and who gets paid first in an exit.",
    difficulty: "FUNDAMENTALS",
  },

  // Cap Table
  {
    conceptSlug: "cm-cap-table",
    type: "MC",
    questionText: "What is a cap table?",
    options: [
      {
        text: "The master list of who owns what in a company: founders, employees, and investors, plus options, SAFEs, and convertible notes",
        isCorrect: true,
      },
      { text: "A table of a company's monthly revenue and expenses", isCorrect: false },
      { text: "The schedule of capital calls a fund sends its LPs", isCorrect: false },
      { text: "A list of the company's board members and their votes", isCorrect: false },
    ],
    answerExplanation:
      "The capitalization table tracks every holder's share count and ownership percentage, including instruments that become shares later. Every financing updates it, and it is the single source of truth for ownership and dilution.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-cap-table",
    type: "MC",
    questionText: "Why does a cap table track options, SAFEs, and convertible notes alongside the shares already issued?",
    options: [
      { text: "They pay regular dividends that must be recorded", isCorrect: false },
      { text: "They convert into shares later, so ignoring them would overstate what everyone else really owns", isCorrect: true },
      { text: "Tax law requires listing them as company debts", isCorrect: false },
      { text: "They give their holders automatic board seats", isCorrect: false },
    ],
    answerExplanation:
      "Options, SAFEs, and notes all become shares eventually, so real ownership math is done on a fully diluted basis that counts them. Looking only at issued shares is one of the classic cap-table trip-ups.",
    difficulty: "FUNDAMENTALS",
  },

  // Dilution
  {
    conceptSlug: "cm-dilution",
    type: "MC",
    questionText:
      "You own 10% of a startup. The company then issues a large batch of new shares to investors in a funding round. What happens to your stake?",
    options: [
      { text: "Your share count is reduced proportionally", isCorrect: false },
      { text: "Your percentage stays at 10%; only the founders are affected", isCorrect: false },
      { text: "Your share count stays the same, but your percentage of the company shrinks", isCorrect: true },
      { text: "The company must buy back your shares first", isCorrect: false },
    ],
    answerExplanation:
      "Dilution works on percentages, not share counts: the new shares make the total pie bigger, so your unchanged slice is a smaller fraction of it. It is a normal cost of raising money, and it compounds across rounds.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-dilution",
    type: "MC",
    questionText: "Which two deal terms exist specifically to manage dilution?",
    options: [
      { text: "Drag-along and tag-along rights", isCorrect: false },
      { text: "Vesting schedules and cliffs", isCorrect: false },
      { text: "Management fees and carried interest", isCorrect: false },
      { text: "Pro-rata rights and anti-dilution provisions", isCorrect: true },
    ],
    answerExplanation:
      "Pro-rata rights let an investor buy into later rounds to keep their percentage, and anti-dilution provisions reprice earlier investors' shares in a down round. The other pairs govern share transfers, earning equity over time, and fund compensation.",
    difficulty: "FUNDAMENTALS",
  },

  // Pre / Post-Money Valuation
  {
    conceptSlug: "cm-pre-post-money-valuation",
    type: "MC",
    questionText: "An investor puts $2M into a startup at an $8M pre-money valuation. What percentage of the company do they own after the round?",
    options: [
      { text: "25%, the investment divided by the $8M pre-money valuation", isCorrect: false },
      { text: "20%, the investment divided by the $10M post-money valuation", isCorrect: true },
      { text: "10%, the standard stake for a new lead investor", isCorrect: false },
      { text: "It cannot be calculated from these numbers", isCorrect: false },
    ],
    answerExplanation:
      "Post-money = pre-money + new cash, so $8M + $2M = $10M, and ownership = investment / post-money = $2M / $10M = 20%. Dividing by the pre-money number to get 25% is the classic mistake this distinction exists to prevent.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-pre-post-money-valuation",
    type: "MC",
    questionText: "A founder and an investor agree the company is 'worth $10M' but say nothing else. Why is the deal still ambiguous?",
    options: [
      { text: "Valuations are only binding after an IPO", isCorrect: false },
      { text: "The valuation must first be approved by regulators", isCorrect: false },
      { text: "It matters whether $10M is pre-money or post-money; the investor's percentage differs between the two", isCorrect: true },
      { text: "Ownership is set by share count, so valuation is irrelevant", isCorrect: false },
    ],
    answerExplanation:
      "If $10M is the post-money valuation, a $2M check buys 20%. If it is pre-money, the post-money is $12M and the same check buys about 17%. Founders who quote a valuation without specifying which one can give away more of the company than they intended.",
    difficulty: "FUNDAMENTALS",
  },

  // Option Pool
  {
    conceptSlug: "cm-option-pool",
    type: "MC",
    questionText: "What is an option pool?",
    options: [
      { text: "A pool of investor money reserved for follow-on rounds", isCorrect: false },
      { text: "A block of shares reserved to grant future employees as stock options, typically 10-20% of the company", isCorrect: true },
      { text: "Shares the founders hold back to sell in a secondary", isCorrect: false },
      { text: "A bonus fund paid out of annual profits", isCorrect: false },
    ],
    answerExplanation:
      "The option pool is a reserved block of equity, carved out of the cap table (usually at an investor's request during a financing) so the startup can pay talent it cannot afford in cash. A typical pool is around 10-20% of the company.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "cm-option-pool",
    type: "MC",
    questionText:
      "In the 'option pool shuffle,' an investor insists the pool be created or topped up from the pre-money valuation, before their money goes in. Who absorbs that dilution?",
    options: [
      { text: "The new investor, since they requested the pool", isCorrect: false },
      { text: "Future employees who receive the options", isCorrect: false },
      { text: "No one; option pools are not dilutive", isCorrect: false },
      { text: "The founders and other existing holders; the new investor's percentage is protected", isCorrect: true },
    ],
    answerExplanation:
      "Because the pool expansion happens before the new money is priced in, it comes out of the existing holders' side of the cap table and lowers the effective price founders receive. The incoming investor's ownership is calculated after the expansion, so they are shielded from it.",
    difficulty: "INTERMEDIATE",
  },

  // Liquidation Preference
  {
    conceptSlug: "cm-liquidation-preference",
    type: "MC",
    questionText: "A startup is sold for less than everyone hoped. What does the investors' 1x liquidation preference mean for the payout?",
    options: [
      { text: "Everyone is paid at the same time, proportional to ownership", isCorrect: false },
      { text: "Founders are paid first because they started the company", isCorrect: false },
      {
        text: "Preferred investors get their money back first, before founders and employees holding common stock see anything",
        isCorrect: true,
      },
      { text: "Employees' options are paid out first to protect them", isCorrect: false },
    ],
    answerExplanation:
      "A 1x preference returns the investor's money before common shareholders are paid at all. In a modest exit, a stack of preferences can mean investors are made whole while founders and employees get little or nothing.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "cm-liquidation-preference",
    type: "MC",
    questionText: "What is the difference between a non-participating and a participating liquidation preference?",
    options: [
      {
        text: "Non-participating investors take the greater of their money back or converting to common; participating investors take their money back and also share in the rest",
        isCorrect: true,
      },
      { text: "Non-participating investors receive no payout in an exit", isCorrect: false },
      { text: "Participating preferences apply only in an IPO, non-participating only in M&A", isCorrect: false },
      { text: "They are two names for the same standard term", isCorrect: false },
    ],
    answerExplanation:
      "Participating preferred 'double-dips': capital back first, then a share of what remains. Non-participating means choosing whichever single path pays more. The founder-friendly market standard is a 1x non-participating preference.",
    difficulty: "INTERMEDIATE",
  },

  // Pro Rata
  {
    conceptSlug: "cm-pro-rata",
    type: "MC",
    questionText:
      "An investor owns 10% of a startup and holds pro-rata rights. The company raises a new round. What does the right let the investor do?",
    options: [
      { text: "Receive free shares so they automatically stay at 10%", isCorrect: false },
      { text: "Invest enough additional money in the new round to keep owning 10%", isCorrect: true },
      { text: "Block the new round until they approve the price", isCorrect: false },
      { text: "Sell their stake back to the company at the new valuation", isCorrect: false },
    ],
    answerExplanation:
      "A pro-rata right is the option to participate in future rounds enough to maintain your ownership percentage. It costs more money each time; nothing is automatic or free. It is a defense against dilution, not a veto or an exit right.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "cm-pro-rata",
    type: "MC",
    questionText: "Why do investors negotiate hard for pro-rata rights?",
    options: [
      { text: "They guarantee a board seat in every future round", isCorrect: false },
      { text: "They exempt the investor from dilution without paying anything", isCorrect: false },
      { text: "They let the investor keep backing winners and protect their stake in breakout companies", isCorrect: true },
      { text: "They entitle the investor to dividends before other holders", isCorrect: false },
    ],
    answerExplanation:
      "When a portfolio company breaks out, the pro-rata right is what lets an early investor maintain their position instead of being diluted down. For founders, granting these rights affects how much room is left for new investors in later rounds.",
    difficulty: "INTERMEDIATE",
  },

  // Convertible Note
  {
    conceptSlug: "cm-convertible-note",
    type: "MC",
    questionText:
      "A SAFE and a convertible note both convert into equity at the next priced round. What does the note have that the SAFE does not?",
    options: [
      { text: "A valuation cap", isCorrect: false },
      { text: "The ability to convert into shares", isCorrect: false },
      { text: "Interest and a maturity date, because a note is actual debt", isCorrect: true },
      { text: "A requirement that the company already be profitable", isCorrect: false },
    ],
    answerExplanation:
      "A convertible note is a loan: it accrues interest and has a maturity date at which it could be called or must convert. A SAFE is not debt and has neither, which removes those obligations and edge cases. Both instruments can carry a discount or a valuation cap.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "cm-convertible-note",
    type: "MC",
    questionText: "What typically rewards a convertible note investor for putting money in early?",
    options: [
      { text: "A guaranteed 2x return at maturity", isCorrect: false },
      { text: "A discount on the next round's share price and/or a valuation cap", isCorrect: true },
      { text: "Automatic majority control of the board", isCorrect: false },
      { text: "A fixed dividend paid every quarter", isCorrect: false },
    ],
    answerExplanation:
      "The discount and the cap give the early investor better conversion terms than the new round's investors get, compensating them for the early risk. The note's defining debt features are its interest and maturity date, not guaranteed returns or board control.",
    difficulty: "INTERMEDIATE",
  },

  // Vesting / Cliff
  {
    conceptSlug: "cm-vesting-cliff",
    type: "MC",
    questionText:
      "An engineer joins a startup with standard 4-year vesting and a 1-year cliff, then leaves after 10 months. How much of their equity do they keep?",
    options: [
      { text: "None; nothing vests before the one-year cliff", isCorrect: true },
      { text: "10 of 48 months' worth, vested monthly from day one", isCorrect: false },
      { text: "25%, the standard first-year amount", isCorrect: false },
      { text: "All of it, because the equity was granted at signing", isCorrect: false },
    ],
    answerExplanation:
      "The cliff is the gotcha: zero equity vests before the 12-month mark, so leaving at month 10 forfeits everything. Staying past the cliff vests 25% all at once, with the rest accruing monthly over the remaining three years.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-vesting-cliff",
    type: "MC",
    questionText: "Why do startups put founders and employees on vesting schedules at all?",
    options: [
      { text: "To delay paying payroll taxes", isCorrect: false },
      { text: "To increase the company's valuation in the next round", isCorrect: false },
      { text: "Because investors cannot legally buy shares from unvested holders", isCorrect: false },
      { text: "To keep the team committed and protect the cap table if someone quits early", isCorrect: true },
    ],
    answerExplanation:
      "Vesting means equity is earned over time rather than owned on day one. If a co-founder walks out in month three, their unvested shares stay with the company instead of leaving with them, which protects everyone still building.",
    difficulty: "FUNDAMENTALS",
  },

  // ── Fund Mechanics ─────────────────────────────────────────────────────────

  // LP
  {
    conceptSlug: "cm-lp",
    type: "MC",
    questionText: "Who are the Limited Partners (LPs) in a venture fund?",
    options: [
      { text: "The partners at the VC firm who pick which startups to back", isCorrect: false },
      {
        text: "The outside investors, like pension funds, endowments, and family offices, who put money into the fund",
        isCorrect: true,
      },
      { text: "The founders of the startups the fund invests in", isCorrect: false },
      { text: "The lawyers who draft the fund's documents", isCorrect: false },
    ],
    answerExplanation:
      "LPs are the ultimate source of VC money: they commit capital to the fund and share in the returns, while the GP manages it. Typical LPs are pension funds, university endowments, family offices, and wealthy individuals.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-lp",
    type: "MC",
    questionText: "What exactly is 'limited' about a limited partner?",
    options: [
      { text: "Their liability and their day-to-day involvement in running the fund", isCorrect: true },
      { text: "The returns they are allowed to earn", isCorrect: false },
      { text: "The number of funds they may invest in", isCorrect: false },
      { text: "How long they are allowed to stay invested", isCorrect: false },
    ],
    answerExplanation:
      "LPs commit capital and share in returns, but they do not run the fund, and their liability is limited. Their incentives (strong, timely returns to justify the risk and illiquidity) explain a lot about why funds behave the way they do.",
    difficulty: "FUNDAMENTALS",
  },

  // GP
  {
    conceptSlug: "cm-gp",
    type: "MC",
    questionText: "In a venture fund, what does the General Partner (GP) do?",
    options: [
      { text: "Provides most of the fund's capital but stays passive", isCorrect: false },
      { text: "Audits the fund's returns on behalf of regulators", isCorrect: false },
      { text: "Raises the fund, picks the investments, and manages the portfolio", isCorrect: true },
      { text: "Runs the day-to-day operations of each portfolio startup", isCorrect: false },
    ],
    answerExplanation:
      "The GP is the firm (and the people) actually running the fund; these are the 'VCs' founders pitch. They invest the LPs' money alongside a small slice of their own. They guide portfolio companies but do not run them day to day.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-gp",
    type: "MC",
    questionText: "How does a GP make money?",
    options: [
      { text: "A salary paid by the startups they invest in", isCorrect: false },
      { text: "An annual management fee plus carried interest, a share of the fund's profits", isCorrect: true },
      { text: "Interest payments on capital they lend to LPs", isCorrect: false },
      { text: "Trading commissions charged on each investment", isCorrect: false },
    ],
    answerExplanation:
      "The GP earns a management fee (classically 2% per year) to operate the fund, plus carry (typically 20% of profits) as the performance reward. This fee-plus-carry structure shapes nearly every incentive in the venture ecosystem.",
    difficulty: "FUNDAMENTALS",
  },

  // Carry
  {
    conceptSlug: "cm-carried-interest",
    type: "MC",
    questionText: "A fund turns $100M of LP capital into $300M. With standard 20% carry, what does the GP earn from carry?",
    options: [
      { text: "$60M: 20% of the full $300M", isCorrect: false },
      { text: "$20M: 20% of the original fund size", isCorrect: false },
      { text: "$200M: the entire profit", isCorrect: false },
      { text: "$40M: 20% of the $200M profit", isCorrect: true },
    ],
    answerExplanation:
      "Carry is a share of profits, not of total value. The fund's profit is $200M ($300M result minus the $100M put in), and 20% of that is $40M. Carry is how VCs get rich, and it aligns them with LPs: they only win big if the fund wins big.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "cm-carried-interest",
    type: "MC",
    questionText: "When does the GP actually collect carry?",
    options: [
      { text: "Every year, as a fixed percentage of committed capital", isCorrect: false },
      { text: "At the fund's first close, as an upfront payment", isCorrect: false },
      { text: "Only after LPs get their capital back, plus any preferred return where one exists", isCorrect: true },
      { text: "Whenever a portfolio company raises its next round", isCorrect: false },
    ],
    answerExplanation:
      "Carry sits at the end of the distribution waterfall: LPs are repaid first, any hurdle is cleared, and only then does carry flow. The fixed annual percentage of capital is the management fee, which is a separate thing.",
    difficulty: "INTERMEDIATE",
  },

  // Management Fee
  {
    conceptSlug: "cm-management-fee",
    type: "MC",
    questionText: "A $50M venture fund charges the classic 2% management fee. What does that produce per year, and what is it for?",
    options: [
      { text: "$1M a year, used to pay the firm's salaries, rent, and diligence costs", isCorrect: true },
      { text: "$1M a year, paid out to LPs as a dividend", isCorrect: false },
      { text: "$10M a year, reserved for follow-on investments", isCorrect: false },
      { text: "$1M a year, but only in years the fund performs well", isCorrect: false },
    ],
    answerExplanation:
      "2% of $50M is $1M a year, and it keeps the lights on at the firm. Unlike carry, the management fee is charged whether or not the fund is performing well, which is exactly why LPs scrutinize fee structures.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "cm-management-fee",
    type: "MC",
    questionText: "During a fund's investment period, what is the 2% management fee usually charged on?",
    options: [
      { text: "Only the capital actually invested so far, from day one", isCorrect: false },
      { text: "Committed capital (the full amount LPs pledged), stepping down to a smaller basis afterward", isCorrect: true },
      { text: "The fund's profits", isCorrect: false },
      { text: "The market value of the portfolio, updated quarterly", isCorrect: false },
    ],
    answerExplanation:
      "During the roughly 5-year investment period the fee runs on committed capital, even before all of it is called. Afterward it typically steps down to invested capital or a lower rate. Larger funds sometimes charge 2.5%. A fee on profits would be carry, not a management fee.",
    difficulty: "INTERMEDIATE",
  },

  // 2-and-20
  {
    conceptSlug: "cm-two-and-twenty",
    type: "MC",
    questionText: "In the standard '2-and-20' fund structure, what are the 2 and the 20?",
    options: [
      { text: "A 2% share of profits and a 20% annual management fee", isCorrect: false },
      { text: "2 general partners and 20 limited partners", isCorrect: false },
      { text: "A 2-year investment period and a 20-year fund life", isCorrect: false },
      { text: "A 2% annual management fee and 20% carried interest on profits", isCorrect: true },
    ],
    answerExplanation:
      "The 2% annual fee funds operations; the 20% of profits (carry) rewards performance. It is the default compensation model across venture and private equity, and the single most important pairing for understanding fund economics.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "cm-two-and-twenty",
    type: "MC",
    questionText: "In a standard distribution waterfall, what order do payouts follow?",
    options: [
      {
        text: "Return LP capital, then any preferred return, then the GP catch-up, then roughly an 80/20 split of the rest",
        isCorrect: true,
      },
      { text: "GP carry first, then LP capital, then fees", isCorrect: false },
      { text: "An 80/20 split of every dollar starting from the first exit", isCorrect: false },
      { text: "Management fees are refunded first, then profits split 50/50", isCorrect: false },
    ],
    answerExplanation:
      "The waterfall orders who gets paid when: LPs get their capital back, any hurdle is cleared (around 8% in private equity, usually none in VC), a GP catch-up tier runs, then the rest splits roughly 80/20. American waterfalls pay carry deal by deal; European ones only after the whole fund is repaid.",
    difficulty: "INTERMEDIATE",
  },

  // Capital Call
  {
    conceptSlug: "cm-capital-call",
    type: "MC",
    questionText: "What is a capital call?",
    options: [
      { text: "A startup asking its investors for emergency bridge funding", isCorrect: false },
      { text: "LPs demanding their money back from the GP", isCorrect: false },
      { text: "The GP asking LPs to send in a portion of the money they committed, as investments come up", isCorrect: true },
      { text: "A broker requiring more collateral on a leveraged stock position", isCorrect: false },
    ],
    answerExplanation:
      "LPs pledge capital up front but do not wire it all on day one; the GP calls it in tranches as deals come up. LPs are contractually obligated to deliver when called, and missing a call carries steep penalties.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "cm-capital-call",
    type: "MC",
    questionText: "Why is a fund's 'committed' capital different from its 'deployed' capital?",
    options: [
      { text: "Committed capital includes profits; deployed capital excludes them", isCorrect: false },
      {
        text: "Committed capital is pledged but only transferred in tranches when called, so not all of it has been invested yet",
        isCorrect: true,
      },
      { text: "Deployed capital counts only public-market investments", isCorrect: false },
      { text: "There is no difference; the words are interchangeable", isCorrect: false },
    ],
    answerExplanation:
      "Commitment is the pledge; deployment happens as the GP calls the capital and invests it. That gap is why LPs must keep cash ready across the fund's investment period.",
    difficulty: "INTERMEDIATE",
  },

  // Vintage Year
  {
    conceptSlug: "cm-vintage-year",
    type: "MC",
    questionText: "What is a fund's vintage year?",
    options: [
      { text: "The year the fund finally returns all LP capital", isCorrect: false },
      { text: "The average founding year of its portfolio companies", isCorrect: false },
      { text: "The year its oldest partner joined the firm", isCorrect: false },
      { text: "The year it first starts investing capital, used to benchmark it against peers from the same period", isCorrect: true },
    ],
    answerExplanation:
      "Like a wine vintage, the label marks when the fund started deploying capital (or had its first close). Funds are benchmarked against other funds of the same vintage because they faced the same market conditions.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "cm-vintage-year",
    type: "MC",
    questionText: "Why is it misleading to compare a 2009-vintage fund's raw returns directly against a 2021-vintage fund's?",
    options: [
      { text: "The two funds invested through very different market environments", isCorrect: true },
      { text: "Newer funds always outperform older ones", isCorrect: false },
      { text: "Older funds report returns in a different format", isCorrect: false },
      { text: "Returns can only be compared once both funds have closed down", isCorrect: false },
    ],
    answerExplanation:
      "A 2021 fund and a 2009 fund lived through very different environments, so a great fund from one vintage can show worse raw numbers than a mediocre fund from another. LPs benchmark within a vintage, and they diversify by spreading commitments across vintages.",
    difficulty: "INTERMEDIATE",
  },

  // DPI
  {
    conceptSlug: "cm-dpi",
    type: "MC",
    questionText: "A fund reports DPI of 0.5x. What does that tell its LPs?",
    options: [
      { text: "The fund has lost half its value", isCorrect: false },
      { text: "They have received cash distributions equal to half the capital they paid in", isCorrect: true },
      { text: "Half the portfolio companies have exited", isCorrect: false },
      { text: "The fund is halfway through its life", isCorrect: false },
    ],
    answerExplanation:
      "DPI (Distributions to Paid-In) counts only realized cash actually returned to LPs, relative to what they put in. A 0.5x DPI says nothing direct about losses: the remaining holdings may still be worth a lot, but that unrealized value shows up in TVPI, not DPI.",
    difficulty: "ADVANCED",
  },
  {
    conceptSlug: "cm-dpi",
    type: "MC",
    questionText: "Why is DPI called the 'show me the money' metric?",
    options: [
      { text: "It includes the GP's projections of future exits", isCorrect: false },
      { text: "It is the only fund metric reported publicly", isCorrect: false },
      { text: "It counts only realized cash distributions, so optimistic paper markups cannot inflate it", isCorrect: true },
      { text: "It measures how quickly the fund returned money", isCorrect: false },
    ],
    answerExplanation:
      "DPI moves only when real cash goes back to LPs. Unlike TVPI it cannot be flattered by markups on unrealized holdings, and unlike IRR it makes no adjustment for timing. A high DPI is the truest sign a fund actually delivered.",
    difficulty: "ADVANCED",
  },

  // TVPI
  {
    conceptSlug: "cm-tvpi",
    type: "MC",
    questionText:
      "A fund has distributed cash worth 0.9x of paid-in capital (DPI) and still holds investments valued at 1.5x of paid-in (RVPI). What is its TVPI?",
    options: [
      { text: "0.6x, the difference between the two", isCorrect: false },
      { text: "1.35x, the two multiplied together", isCorrect: false },
      { text: "1.5x, because TVPI counts only current holdings", isCorrect: false },
      { text: "2.4x, because TVPI equals DPI plus RVPI", isCorrect: true },
    ],
    answerExplanation:
      "TVPI (Total Value to Paid-In) adds realized distributions (DPI) and the current value of remaining holdings (RVPI): 0.9 + 1.5 = 2.4x. The identity holds when all three are measured on the same basis, all gross or all net.",
    difficulty: "ADVANCED",
  },
  {
    conceptSlug: "cm-tvpi",
    type: "MC",
    questionText: "Why can a fund's TVPI move up or down from quarter to quarter even when no cash is distributed?",
    options: [
      { text: "Part of TVPI is unrealized: it rests on the GP's current valuation marks, and those marks change", isCorrect: true },
      { text: "TVPI automatically decays as the fund ages", isCorrect: false },
      { text: "Each capital call mechanically reduces TVPI", isCorrect: false },
      { text: "TVPI excludes any company that has not yet exited", isCorrect: false },
    ],
    answerExplanation:
      "TVPI = DPI + RVPI, and the RVPI part rests on what the GP currently marks the remaining holdings at. Those marks can move without any cash changing hands, which is why TVPI can look optimistic until holdings actually exit.",
    difficulty: "ADVANCED",
  },

  // MOIC
  {
    conceptSlug: "cm-moic",
    type: "MC",
    questionText: "Two investments both return 2x MOIC. One took 2 years, the other took 12. What does MOIC say about them?",
    options: [
      { text: "The 2-year investment shows a higher MOIC", isCorrect: false },
      { text: "They look identical, because MOIC deliberately ignores how long the return took", isCorrect: true },
      { text: "The 12-year investment shows a higher MOIC", isCorrect: false },
      { text: "MOIC cannot be calculated until both investments exit", isCorrect: false },
    ],
    answerExplanation:
      "MOIC (Multiple on Invested Capital) is total value divided by invested capital, with no time adjustment, so a fast double and a slow double score the same. That blind spot is exactly why MOIC must be paired with IRR, which does account for timing.",
    difficulty: "ADVANCED",
  },
  {
    conceptSlug: "cm-moic",
    type: "MC",
    questionText: "How is MOIC calculated?",
    options: [
      { text: "Realized cash only, divided by capital invested", isCorrect: false },
      { text: "The annualized rate that sets the cash flows' net present value to zero", isCorrect: false },
      { text: "Total value created, realized plus unrealized, divided by the capital invested", isCorrect: true },
      { text: "Profit after fees, divided by the number of years invested", isCorrect: false },
    ],
    answerExplanation:
      "MOIC counts both realized proceeds and the current value of unrealized holdings, over invested capital. Realized-cash-only describes DPI, and the NPV-equals-zero rate is IRR. MOIC is often quoted gross of fees and carry; a 'net MOIC' includes them.",
    difficulty: "ADVANCED",
  },

  // IRR
  {
    conceptSlug: "cm-irr",
    type: "MC",
    questionText: "What does IRR capture that MOIC, TVPI, and DPI all ignore?",
    options: [
      { text: "The timing of cash flows: getting money back sooner produces a higher IRR", isCorrect: true },
      { text: "The fees charged by the GP", isCorrect: false },
      { text: "The number of companies in the portfolio", isCorrect: false },
      { text: "The fund's vintage year", isCorrect: false },
    ],
    answerExplanation:
      "IRR is the annualized rate that sets the net present value of all the fund's cash flows to zero, so when money moves matters. The multiples measure how much came back, but not when. Because timing matters, early distributions and capital-call timing can swing IRR dramatically.",
    difficulty: "ADVANCED",
  },
  {
    conceptSlug: "cm-irr",
    type: "MC",
    questionText: "VC LPs often quote a target net IRR of around 20%. How should you read that number?",
    options: [
      { text: "As the legal minimum a fund must return to its LPs", isCorrect: false },
      { text: "As the average return VC funds actually achieve", isCorrect: false },
      { text: "As the management fee percentage in disguise", isCorrect: false },
      { text: "As an aspirational, top-quartile bar; typical realized VC net IRR is closer to 10-15%", isCorrect: true },
    ],
    answerExplanation:
      "The roughly 20% figure is a target, not what funds typically achieve; realized VC net IRRs cluster closer to 10-15%. IRR can also be flattered by early distributions, one more reason to read it alongside the multiples rather than alone.",
    difficulty: "ADVANCED",
  },

  // J-Curve
  {
    conceptSlug: "cm-j-curve",
    type: "MC",
    questionText: "Why do venture fund returns typically look negative in the fund's first few years?",
    options: [
      { text: "Most LPs withdraw part of their money early", isCorrect: false },
      { text: "GPs collect their carry in year one", isCorrect: false },
      { text: "Management fees and startup costs are paid up front while investments have not had time to mature", isCorrect: true },
      { text: "Young funds are required to hold cash instead of investments", isCorrect: false },
    ],
    answerExplanation:
      "Early on, fees and costs go out while the investments have not paid off yet, so measured returns dip below zero before climbing as exits happen. Plotted over time this traces a J shape, and the trough usually lasts about three to five years.",
    difficulty: "ADVANCED",
  },
  {
    conceptSlug: "cm-j-curve",
    type: "MC",
    questionText: "A 3-year-old fund shows DPI near zero. According to the J-curve, what is the most reasonable read?",
    options: [
      { text: "The fund has almost certainly failed", isCorrect: false },
      { text: "Normal: distributions are back-loaded, so cash returns this early say little about final performance", isCorrect: true },
      { text: "The GP must be hiding returns from LPs", isCorrect: false },
      { text: "The LPs must have missed their capital calls", isCorrect: false },
    ],
    answerExplanation:
      "The J-curve's early dip is driven by upfront fees and back-loaded distributions, not bad investing. DPI staying near zero for years is expected, which is why judging a young fund on DPI alone is misleading; weak early numbers are normal.",
    difficulty: "ADVANCED",
  },

  // ── Markets & Metrics ──────────────────────────────────────────────────────

  // TAM / SAM / SOM
  {
    conceptSlug: "cm-tam-sam-som",
    type: "MC",
    questionText: "Which correctly orders the three market-sizing numbers from largest to smallest?",
    options: [
      { text: "SOM, then SAM, then TAM", isCorrect: false },
      { text: "SAM, then TAM, then SOM", isCorrect: false },
      {
        text: "TAM (everyone who could ever use it), then SAM (the slice you can actually serve), then SOM (what you can realistically win soon)",
        isCorrect: true,
      },
      { text: "They are three independent markets of unrelated size", isCorrect: false },
    ],
    answerExplanation:
      "The three nest inside each other: TAM is total demand if you captured 100% of everyone who could ever use the product, SAM narrows to what your model and geography can serve, and SOM is the realistic near-term chunk you can win.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-tam-sam-som",
    type: "MC",
    questionText: "A founder pitches a giant TAM but cannot explain their SAM or SOM. What does that signal to investors?",
    options: [
      { text: "The market is too large for a startup to enter", isCorrect: false },
      { text: "They have not thought hard about who will actually buy the product", isCorrect: true },
      { text: "The company is ready to skip straight to an IPO", isCorrect: false },
      { text: "The TAM figure must be understated", isCorrect: false },
    ],
    answerExplanation:
      "Investors use market sizing to judge whether a startup can get big enough to matter, but a giant TAM is meaningless without a credible path. The serviceable (SAM) and obtainable (SOM) tiers are where the who-actually-buys thinking shows.",
    difficulty: "FUNDAMENTALS",
  },

  // ARR / MRR
  {
    conceptSlug: "cm-arr-mrr",
    type: "MC",
    questionText: "What revenue counts toward ARR (Annual Recurring Revenue)?",
    options: [
      { text: "All cash collected over the last 12 months", isCorrect: false },
      { text: "Recurring revenue plus one-time professional services", isCorrect: false },
      { text: "Projected revenue for the next fiscal year", isCorrect: false },
      { text: "Recurring subscription revenue only; one-time fees, setup charges, and variable usage are excluded", isCorrect: true },
    ],
    answerExplanation:
      "ARR and MRR deliberately count only the predictable, recurring contract revenue, yearly or monthly. Investors pay far more for predictable ARR than for one-off sales, so mislabeling one-time revenue as ARR overstates the health of the business. ARR is roughly MRR times twelve.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-arr-mrr",
    type: "MC",
    questionText: "Why is multiplying one strong month's total bookings by 12 not a valid way to state ARR?",
    options: [
      { text: "That computes an annual run rate that sweeps in one-time and variable fees which are not recurring", isCorrect: true },
      { text: "Because ARR must be computed over 13 months", isCorrect: false },
      { text: "Because bookings legally cannot be annualized", isCorrect: false },
      { text: "It is valid; that is the standard definition of ARR", isCorrect: false },
    ],
    answerExplanation:
      "Per a16z, ARR is not 'annual run rate.' One good month often includes one-time and usage revenue that will not repeat, so multiplying it by 12 overstates true recurring revenue. The whole point of ARR is to isolate the predictable part.",
    difficulty: "FUNDAMENTALS",
  },

  // Net Revenue Retention
  {
    conceptSlug: "cm-net-revenue-retention",
    type: "MC",
    questionText: "A SaaS company reports 120% net revenue retention (NRR). What does that mean?",
    options: [
      { text: "The company gained 20% more customers this year", isCorrect: false },
      { text: "Total revenue grew 120% over the year", isCorrect: false },
      {
        text: "Last year's existing customers now pay 20% more in total, even before counting any new customers",
        isCorrect: true,
      },
      { text: "Exactly 20% of customers churned", isCorrect: false },
    ],
    answerExplanation:
      "NRR tracks only the existing customer base, netting upgrades, downgrades, and churn. Above 100% means the base expands on its own. That is why investors prize high NRR: the company grows even if it stops acquiring customers. Below 100% means the existing base is shrinking.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "cm-net-revenue-retention",
    type: "MC",
    questionText: "Which revenue does NRR deliberately leave out?",
    options: [
      { text: "Expansion revenue from existing customers upgrading", isCorrect: false },
      { text: "Revenue from brand-new customers added during the period", isCorrect: true },
      { text: "Revenue lost to downgrades", isCorrect: false },
      { text: "Revenue lost to churned customers", isCorrect: false },
    ],
    answerExplanation:
      "NRR isolates how the existing base behaves, so new-customer revenue stays out while expansion, downgrades, and churn all net in. That is also what separates it from gross retention, which ignores upsell and therefore caps at 100%.",
    difficulty: "INTERMEDIATE",
  },

  // Burn Rate
  {
    conceptSlug: "cm-burn-rate",
    type: "MC",
    questionText: "What is the difference between gross burn and net burn?",
    options: [
      { text: "Gross burn is total monthly cash out; net burn is cash out minus the cash coming in", isCorrect: true },
      { text: "Gross burn includes taxes; net burn excludes them", isCorrect: false },
      { text: "Gross burn is measured annually; net burn monthly", isCorrect: false },
      { text: "Net burn counts only marketing spend", isCorrect: false },
    ],
    answerExplanation:
      "Gross burn is everything spent in a month; net burn nets out revenue, so it is the rate the bank account actually drains. A startup burning $200k a month net is depleting its account by that much every month.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-burn-rate",
    type: "MC",
    questionText: "Why does burn rate matter so much to founders and investors?",
    options: [
      { text: "It directly sets the company's valuation", isCorrect: false },
      { text: "Regulators require it to stay below a fixed threshold", isCorrect: false },
      { text: "It determines the management fee investors charge", isCorrect: false },
      {
        text: "Together with cash in the bank, it determines how long the company survives before it must raise again or become profitable",
        isCorrect: true,
      },
    ],
    answerExplanation:
      "Burn rate is the speed of the countdown clock: cash divided by net burn gives runway. That number drives when to raise, when to cut costs, and how much pressure the company is under. It is the number that keeps founders up at night.",
    difficulty: "FUNDAMENTALS",
  },

  // Runway
  {
    conceptSlug: "cm-runway",
    type: "MC",
    questionText: "A startup has $2.4M in the bank and a net burn of $200k per month. What is its runway?",
    options: [
      { text: "24 months", isCorrect: false },
      { text: "12 months: cash on hand divided by net monthly burn", isCorrect: true },
      { text: "6 months, after the required safety buffer", isCorrect: false },
      { text: "It cannot be calculated without knowing revenue", isCorrect: false },
    ],
    answerExplanation:
      "Runway = cash / net monthly burn = $2.4M / $200k = 12 months. Net burn already accounts for revenue coming in, so these two numbers are all you need. Runway is the countdown clock of a startup.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-runway",
    type: "MC",
    questionText: "Why do founders typically want to start fundraising with 6 or more months of runway still left?",
    options: [
      { text: "Valuations are frozen once runway drops below 6 months", isCorrect: false },
      { text: "Fundraising itself takes months, so waiting longer risks running out of cash mid-raise", isCorrect: true },
      { text: "Investors are only allowed to meet companies with long runway", isCorrect: false },
      { text: "Banks call startup loans at the 6-month mark", isCorrect: false },
    ],
    answerExplanation:
      "A raise commonly takes months from first meeting to money in the bank, so founders start while they still have comfortable runway. Investors also check runway to gauge how much pressure a company is under.",
    difficulty: "FUNDAMENTALS",
  },

  // CAC / LTV
  {
    conceptSlug: "cm-cac-ltv",
    type: "MC",
    questionText: "What do CAC and LTV measure, and what ratio do investors generally look for?",
    options: [
      { text: "CAC is customer churn and LTV is total revenue; the target ratio is 1x", isCorrect: false },
      {
        text: "CAC is the cost to win one customer and LTV is the profit they generate over the relationship; investors look for LTV/CAC of roughly 3x or more",
        isCorrect: true,
      },
      { text: "CAC is the marketing budget and LTV is the company's valuation; the target is 10x", isCorrect: false },
      { text: "They are interchangeable measures of sales efficiency", isCorrect: false },
    ],
    answerExplanation:
      "If a customer costs more to acquire than they are ever worth, growth destroys value. The common benchmarks: an LTV/CAC ratio of about 3x or higher, with CAC paid back typically within 12-18 months.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "cm-cac-ltv",
    type: "MC",
    questionText: "Per a16z's warning, what must LTV be computed on for the LTV/CAC ratio to be honest?",
    options: [
      { text: "Gross bookings, including one-time fees", isCorrect: false },
      { text: "Total funding raised divided by customer count", isCorrect: false },
      { text: "Net profit or contribution margin, accounting for churn, not raw revenue", isCorrect: true },
      { text: "The company's market capitalization", isCorrect: false },
    ],
    answerExplanation:
      "Computing lifetime value on revenue, or even gross margin, flatters the business. The honest version uses net profit / contribution margin and accounts for churn; otherwise money-losing acquisition can look healthy.",
    difficulty: "INTERMEDIATE",
  },

  // EV Multiples
  {
    conceptSlug: "cm-ev-multiples",
    type: "MC",
    questionText:
      "A profitable, mature company and a fast-growing, not-yet-profitable company are both being valued with multiples. Which pairing is standard?",
    options: [
      { text: "EV/Revenue for the profitable one; EV/EBITDA for the pre-profit one", isCorrect: false },
      { text: "EV/EBITDA for the profitable one; EV/Revenue for the fast-growing, pre-profit one", isCorrect: true },
      { text: "EV/EBITDA for both; revenue multiples are obsolete", isCorrect: false },
      { text: "Neither; multiples cannot be used until a company IPOs", isCorrect: false },
    ],
    answerExplanation:
      "EV/Revenue suits fast-growing companies that have sales but no profits yet; EV/EBITDA compares value to operating cash earnings and suits profitable, mature ones. Which multiple gets used signals the company's stage.",
    difficulty: "ADVANCED",
  },
  {
    conceptSlug: "cm-ev-multiples",
    type: "MC",
    questionText: "Why do these multiples use Enterprise Value (EV) instead of just the company's market cap?",
    options: [
      { text: "EV includes debt and nets out cash, making companies with different capital structures comparable", isCorrect: true },
      { text: "EV is always larger, which makes valuations look better", isCorrect: false },
      { text: "Market cap changes daily, while EV never changes", isCorrect: false },
      { text: "Regulators prohibit using market cap in valuation work", isCorrect: false },
    ],
    answerExplanation:
      "Enterprise value is the company's total value to all investors: debt plus equity, minus cash. Two companies with identical operations but different debt loads get comparable EV multiples where equity-only numbers would mislead.",
    difficulty: "ADVANCED",
  },

  // DCF
  {
    conceptSlug: "cm-dcf",
    type: "MC",
    questionText: "What is the core idea of a discounted cash flow (DCF) valuation?",
    options: [
      { text: "Apply the average valuation multiple of comparable public companies", isCorrect: false },
      { text: "Add up everything investors have paid into the company to date", isCorrect: false },
      {
        text: "Project the company's future cash flows and discount them back to today's dollars, since money later is worth less than money now",
        isCorrect: true,
      },
      { text: "Multiply current revenue by an industry-standard factor", isCorrect: false },
    ],
    answerExplanation:
      "A DCF builds value from fundamentals: project the future cash, discount each year back to present value, and sum it into an estimated intrinsic value. Borrowing multiples from peers is the comps method, a different approach.",
    difficulty: "ADVANCED",
  },
  {
    conceptSlug: "cm-dcf",
    type: "MC",
    questionText: "Which two assumptions can swing a DCF's output wildly?",
    options: [
      { text: "The option pool size and the vesting schedule", isCorrect: false },
      { text: "The discount rate and the terminal growth rate", isCorrect: true },
      { text: "The burn rate and the runway", isCorrect: false },
      { text: "The fund's vintage year and its DPI", isCorrect: false },
    ],
    answerExplanation:
      "Small changes to the discount rate or the terminal growth assumption move the output dramatically; that sensitivity is the method's main weakness. It is also why DCF is rarely used for early-stage startups, whose cash flows are too uncertain to project.",
    difficulty: "ADVANCED",
  },

  // Public Comps
  {
    conceptSlug: "cm-public-comps",
    type: "MC",
    questionText: "How does a public comps valuation work?",
    options: [
      { text: "Discount the company's projected cash flows to present value", isCorrect: false },
      { text: "Average the valuations from the company's previous funding rounds", isCorrect: false },
      { text: "Use the prices paid in recent acquisitions of private startups only", isCorrect: false },
      {
        text: "Find similar publicly traded companies, compute their valuation multiples, and apply those multiples to the company being valued",
        isCorrect: true,
      },
    ],
    answerExplanation:
      "Comps answer 'what is the market paying for businesses like this?' by borrowing multiples like EV/Revenue or EV/EBITDA from comparable public peers. Discounting projected cash flows is a DCF, the other major method.",
    difficulty: "ADVANCED",
  },
  {
    conceptSlug: "cm-public-comps",
    type: "MC",
    questionText: "What is the main strength of comps relative to a model like a DCF?",
    options: [
      { text: "They incorporate the timing of future cash flows", isCorrect: false },
      { text: "They ground the valuation in real, current market prices rather than theoretical projections", isCorrect: true },
      { text: "They remove the need to pick comparable companies", isCorrect: false },
      { text: "They are required for all private financings", isCorrect: false },
    ],
    answerExplanation:
      "Comps anchor a valuation to what investors are actually paying right now, which is why investors and bankers use them constantly to sanity-check what a company should be worth. A DCF instead builds value from explicit assumptions about growth, margins, and risk.",
    difficulty: "ADVANCED",
  },

  // ── Diligence & Terms ──────────────────────────────────────────────────────

  // Due Diligence
  {
    conceptSlug: "cm-due-diligence",
    type: "MC",
    questionText: "What is due diligence?",
    options: [
      { text: "The legal paperwork that transfers shares at closing", isCorrect: false },
      {
        text: "The investigation an investor or acquirer runs before closing a deal, verifying the company is what it claims to be",
        isCorrect: true,
      },
      { text: "A company's annual financial audit", isCorrect: false },
      { text: "The pitch process founders run to attract term sheets", isCorrect: false },
    ],
    answerExplanation:
      "Diligence covers financials, legal structure, technology, customers, and the team. The goal is to surface risks and confirm the story before money changes hands.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-due-diligence",
    type: "MC",
    questionText: "During diligence, an acquirer finds messy records and undisclosed surprises. What typically happens to the deal?",
    options: [
      { text: "Nothing; the signed term sheet already locked in the price", isCorrect: false },
      { text: "The acquirer must close anyway and sue afterward", isCorrect: false },
      { text: "It can fall apart or get repriced, and the company loses time and leverage", isCorrect: true },
      { text: "Regulators step in to set a fair price", isCorrect: false },
    ],
    answerExplanation:
      "Diligence is where deals get validated or fall apart: surprises can kill a term sheet or cut the price, which is possible precisely because term sheets are mostly non-binding. Founders who keep clean records sail through; messy ones pay in time and leverage.",
    difficulty: "FUNDAMENTALS",
  },

  // Data Room
  {
    conceptSlug: "cm-data-room",
    type: "MC",
    questionText: "What is a data room?",
    options: [
      { text: "The server room where a startup hosts its product", isCorrect: false },
      { text: "A public webpage listing the company's key metrics", isCorrect: false },
      { text: "The room where the board meets to vote", isCorrect: false },
      {
        text: "A secure, access-controlled online folder where a company shares confidential documents with investors or buyers during diligence",
        isCorrect: true,
      },
    ],
    answerExplanation:
      "The data room holds the cap table, financials, contracts, IP, and legal records, organized for review, with access controlled and tracked. It is the practical workspace where diligence actually happens.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-data-room",
    type: "MC",
    questionText: "What does a well-organized data room signal to investors?",
    options: [
      { text: "Competence; it speeds up the raise or sale, while a chaotic one slows everything and spooks investors", isCorrect: true },
      { text: "That the company has nothing confidential to protect", isCorrect: false },
      { text: "That diligence can safely be skipped", isCorrect: false },
      { text: "That the valuation can no longer change", isCorrect: false },
    ],
    answerExplanation:
      "Diligence runs through the data room, so its condition directly shapes deal speed and investor confidence. Organized records build momentum; chaos costs time and trust.",
    difficulty: "FUNDAMENTALS",
  },

  // Board Seat
  {
    conceptSlug: "cm-board-seat",
    type: "MC",
    questionText: "What kinds of decisions does a company's board of directors control?",
    options: [
      { text: "Day-to-day product and engineering choices", isCorrect: false },
      { text: "The biggest ones: hiring or firing the CEO, approving budgets, and green-lighting a sale", isCorrect: true },
      { text: "Only ceremonial matters; real power sits elsewhere", isCorrect: false },
      { text: "Setting the prices customers pay", isCorrect: false },
    ],
    answerExplanation:
      "The board is the small group that oversees the company and makes its biggest decisions, which is why lead investors usually negotiate a board seat as part of a priced round. Board composition determines who ultimately controls the company.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "cm-board-seat",
    type: "MC",
    questionText: "A founder still owns a large chunk of their company. Can they nonetheless lose control of it?",
    options: [
      { text: "No; large ownership always means control", isCorrect: false },
      { text: "Only if the company goes public", isCorrect: false },
      { text: "Yes; control follows board composition, and losing the board can mean losing the company", isCorrect: true },
      { text: "Only if they sell their shares in a secondary", isCorrect: false },
    ],
    answerExplanation:
      "Board control is about composition, not ownership percentage. A typical early structure is two founders and one investor, or two founders, one investor, and one independent whose vote can decide tie-breaks. That is why founders watch board composition so closely.",
    difficulty: "INTERMEDIATE",
  },

  // Anti-Dilution
  {
    conceptSlug: "cm-anti-dilution",
    type: "MC",
    questionText: "When does an anti-dilution provision kick in, and what does it do?",
    options: [
      { text: "In any new round; it gives earlier investors free shares to keep their percentage", isCorrect: false },
      {
        text: "In a down round; it retroactively lowers the price at which earlier investors' preferred shares convert, effectively granting them more shares",
        isCorrect: true,
      },
      { text: "At exit; it guarantees investors at least their money back", isCorrect: false },
      { text: "At IPO; it converts all preferred stock to common automatically", isCorrect: false },
    ],
    answerExplanation:
      "Anti-dilution protects earlier investors when the company later sells shares at a lower price than they paid. The mechanism is a conversion-price adjustment, and the pain lands on everyone unprotected: founders and employees. Money-back-at-exit protection is the liquidation preference, a different term.",
    difficulty: "ADVANCED",
  },
  {
    conceptSlug: "cm-anti-dilution",
    type: "MC",
    questionText: "What separates full-ratchet anti-dilution from weighted-average anti-dilution?",
    options: [
      { text: "Weighted-average is the harsher of the two for founders", isCorrect: false },
      { text: "Full-ratchet applies only to very large down rounds", isCorrect: false },
      {
        text: "Full-ratchet resets the conversion price all the way down to the new price regardless of round size; weighted-average adjusts only partially, scaled by the size of the down round",
        isCorrect: true,
      },
      { text: "They differ only in which legal document contains them", isCorrect: false },
    ],
    answerExplanation:
      "Full-ratchet is maximally founder-punishing (even a tiny cheap round fully reprices earlier investors) and is now rare. Weighted-average, the market standard, scales the adjustment to the down round's size; the broad-based variant is milder than narrow-based.",
    difficulty: "ADVANCED",
  },

  // Drag-Along / Tag-Along
  {
    conceptSlug: "cm-drag-along-tag-along",
    type: "MC",
    questionText: "An acquirer wants 100% of a startup, but a few small shareholders refuse to sell. Which right solves this for the majority?",
    options: [
      { text: "Drag-along: the majority can force minority holders to join the sale", isCorrect: true },
      { text: "Tag-along: minorities are automatically forced to participate", isCorrect: false },
      { text: "ROFR: the acquirer can buy the holdouts' shares first", isCorrect: false },
      { text: "Pro rata: the majority absorbs the minority's shares", isCorrect: false },
    ],
    answerExplanation:
      "Drag-along rights exist so a small holdout cannot block a clean exit: the majority drags everyone into the sale and the buyer gets 100%. Tag-along is the mirror image, an optional right that protects minorities rather than compelling them.",
    difficulty: "ADVANCED",
  },
  {
    conceptSlug: "cm-drag-along-tag-along",
    type: "MC",
    questionText: "A major shareholder negotiates to sell their large stake. What does a tag-along right give the minority shareholders?",
    options: [
      { text: "The obligation to sell alongside the major holder", isCorrect: false },
      { text: "The right to block the major holder's sale", isCorrect: false },
      { text: "A discount to buy the major holder's shares themselves", isCorrect: false },
      { text: "The option to join that sale on the same terms, so they are not left behind", isCorrect: true },
    ],
    answerExplanation:
      "Tag-along (co-sale) protects small holders: when a major holder cashes out, minorities may elect to ride along on equal terms. The two rights cut in opposite directions: drag-along protects the buyer and the majority, tag-along protects the minority.",
    difficulty: "ADVANCED",
  },

  // ROFR
  {
    conceptSlug: "cm-rofr",
    type: "MC",
    questionText: "A founder wants to sell some shares to an outside buyer. What does the company's right of first refusal (ROFR) mean for that sale?",
    options: [
      { text: "The sale is prohibited entirely", isCorrect: false },
      {
        text: "The company, and often its investors, get the first chance to match the offer and buy the shares before the outsider can",
        isCorrect: true,
      },
      { text: "The founder must sell at a discount to the outsider", isCorrect: false },
      { text: "The outsider must first buy shares from the option pool", isCorrect: false },
    ],
    answerExplanation:
      "ROFR lets insiders step in front of a sale by matching the offer. The sale is not banned; insiders just get the first chance to buy, which keeps control over who joins the cap table.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "cm-rofr",
    type: "MC",
    questionText: "Why do companies and their investors want a ROFR in place?",
    options: [
      { text: "It guarantees the company can buy shares below market price", isCorrect: false },
      { text: "It forces employees to sell their vested shares back when they quit", isCorrect: false },
      { text: "It stops shares from drifting to unwanted outside owners and keeps control of the ownership base", isCorrect: true },
      { text: "It raises new capital for the company", isCorrect: false },
    ],
    answerExplanation:
      "ROFR is about controlling the cap table, not pricing or fundraising: the match happens at the offered price, and no new capital is raised. For anyone holding startup equity, it is also a practical limit on how freely they can sell.",
    difficulty: "INTERMEDIATE",
  },

  // Down Round
  {
    conceptSlug: "cm-down-round",
    type: "MC",
    questionText: "What makes a financing a 'down round'?",
    options: [
      { text: "The round is smaller in dollars than the previous one", isCorrect: false },
      { text: "The company misses its revenue targets for the year", isCorrect: false },
      { text: "Existing investors decline to participate", isCorrect: false },
      { text: "The company raises at a lower valuation than its previous round", isCorrect: true },
    ],
    answerExplanation:
      "Down rounds are defined by valuation, not by round size: the new shares are priced below the prior round's valuation. It usually means the business stumbled or the market turned; the 2022-2023 market produced many of them.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "cm-down-round",
    type: "MC",
    questionText: "Beyond the lower price itself, what does a down round typically set off?",
    options: [
      {
        text: "Anti-dilution protections for earlier investors, heavy extra dilution for founders, and employee options can end up underwater",
        isCorrect: true,
      },
      { text: "An automatic IPO filing", isCorrect: false },
      { text: "Mandatory cash repayment of all SAFEs", isCorrect: false },
      { text: "Cancellation of the option pool", isCorrect: false },
    ],
    answerExplanation:
      "A down round is the trigger event for anti-dilution clauses: under full-ratchet the founder dilution can be devastating, while weighted-average softens the blow. It can also demoralize employees whose options go underwater, and it carries a real stigma.",
    difficulty: "INTERMEDIATE",
  },

  // Secondary
  {
    conceptSlug: "cm-secondary",
    type: "MC",
    questionText: "In a secondary sale, where does the buyer's money go?",
    options: [
      { text: "Into the company's bank account as new capital", isCorrect: false },
      { text: "To the selling shareholder; the company itself raises nothing", isCorrect: true },
      { text: "Into the option pool for future employees", isCorrect: false },
      { text: "To the company's lenders first", isCorrect: false },
    ],
    answerExplanation:
      "A secondary sells existing shares from one holder to another, so the cash goes to the seller. A primary issues new shares and the money goes to the company. That distinction is the key to the whole term.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "cm-secondary",
    type: "MC",
    questionText: "Why do secondaries exist in venture-backed companies?",
    options: [
      { text: "They are the fastest way for companies to raise emergency capital", isCorrect: false },
      { text: "They permanently replace the need for an IPO", isCorrect: false },
      { text: "They reset the company's valuation after a down round", isCorrect: false },
      {
        text: "They let founders and early employees take some money off the table during long pre-exit years, and let new investors buy in",
        isCorrect: true,
      },
    ],
    answerExplanation:
      "Startups can stay private for many years, and secondaries provide liquidity to early holders before an IPO or acquisition. They do not raise capital for the company, which is exactly what separates a secondary from a primary.",
    difficulty: "INTERMEDIATE",
  },

  // Exit (M&A vs IPO)
  {
    conceptSlug: "cm-exit-ma-ipo",
    type: "MC",
    questionText: "What are the two main exit routes for a venture-backed company, and which is more common?",
    options: [
      { text: "IPO and bankruptcy; IPOs are more common", isCorrect: false },
      { text: "M&A and secondaries; secondaries are the more common exit", isCorrect: false },
      {
        text: "Acquisition (M&A) and IPO; M&A is far more common, while IPOs are rarer and reserved for the largest companies",
        isCorrect: true,
      },
      { text: "Dividends and buybacks; both are equally common", isCorrect: false },
    ],
    answerExplanation:
      "An exit is when investors and founders finally turn equity into cash or liquid stock. Most companies exit by being acquired; going public is the rarer path. A secondary gives individual holders liquidity but is not an exit for the company.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "cm-exit-ma-ipo",
    type: "MC",
    questionText: "A startup gets acquired. What determines who gets paid, and how much, from the sale proceeds?",
    options: [
      { text: "Strict pro-rata ownership, regardless of share class", isCorrect: false },
      { text: "A board vote on how to divide the proceeds", isCorrect: false },
      { text: "Employees are paid first, by law", isCorrect: false },
      {
        text: "The liquidation-preference stack: preferred investors recover their preferences before common holders share the rest",
        isCorrect: true,
      },
    ],
    answerExplanation:
      "The exit is when returns actually get realized (DPI for funds, carry for GPs, wealth for founders), and the liquidation-preference stack governs the payout order. In smaller exits, preferences can consume most of the proceeds before common shareholders see anything.",
    difficulty: "FUNDAMENTALS",
  },
];
