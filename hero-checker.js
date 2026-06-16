const checker = document.querySelector("#hero-checker");
const result = document.querySelector("#checker-result");
const vagueTerms = ["innovative", "powerful", "seamless", "revolutionary", "next-generation", "all-in-one", "streamline", "unlock", "transform", "modern", "intelligent", "ai-powered", "platform", "solution"];
const weakCtas = ["learn more", "get started", "submit", "click here", "explore", "contact us", "sign up"];
const presets = {
  clear: {
    buyer: "Finance teams at B2B SaaS companies",
    headline: "Close the books without chasing receipts",
    support: "Turn receipts from email and Slack into tax-ready expense reports before month end.",
    cta: "Upload my first receipt",
    proof: "Used by 120 finance teams",
  },
  vague: {
    buyer: "SaaS founders",
    headline: "The innovative all-in-one AI-powered platform",
    support: "Transform your business with our powerful modern solution.",
    cta: "Learn more",
    proof: "",
  },
};
let latestSummary = "";
let latestValues = null;

function normalize(value) {
  return value.trim().replace(/\s+/g, " ");
}

function countWords(value) {
  return normalize(value).split(" ").filter(Boolean).length;
}

function includesNumber(value) {
  return /\d|%|\$|€|£/.test(value);
}

function includesOutcomeLanguage(value) {
  return /\b(save|reduce|increase|grow|close|ship|launch|find|know|prevent|stop|turn|create|publish|collect|convert|recover|avoid|without|before|after|in minutes|in seconds|per week|per month)\b/i.test(value);
}

function vagueMatches(value) {
  const lower = value.toLowerCase();
  return vagueTerms.filter((term) => lower.includes(term));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

function makeCheck(title, detail, passed) {
  return { title, detail, passed };
}

function scoreHero(values) {
  let score = 0;
  const checks = [];
  const combined = `${values.headline} ${values.support}`;
  const headlineWords = countWords(values.headline);
  const supportWords = countWords(values.support);
  const vague = vagueMatches(combined);

  const buyerNamed = values.buyer.length >= 8 && (
    combined.toLowerCase().includes(values.buyer.toLowerCase()) ||
    /\b(for|teams|founders|agencies|developers|marketers|finance|sales|operations|creators|companies|businesses)\b/i.test(combined)
  );
  score += buyerNamed ? 20 : 7;
  checks.push(makeCheck(
    "Buyer recognition",
    buyerNamed ? "The copy gives the intended buyer a way to recognize themselves." : `The buyer is “${values.buyer}”, but the hero does not clearly signal who it is for.`,
    buyerNamed,
  ));

  const outcomeNamed = includesOutcomeLanguage(combined);
  score += outcomeNamed ? 22 : 8;
  checks.push(makeCheck(
    "Visible outcome",
    outcomeNamed ? "The hero uses language that points to a change, task, or avoided pain." : "Add a concrete before-and-after outcome instead of only describing the product category.",
    outcomeNamed,
  ));

  const readable = headlineWords >= 4 && headlineWords <= 14 && supportWords <= 32;
  score += readable ? 16 : 8;
  checks.push(makeCheck(
    "Scan speed",
    readable ? `The ${headlineWords}-word headline and ${supportWords}-word support line are easy to scan.` : `Aim for a 4–14 word headline and a support line under 32 words. Current lengths: ${headlineWords} and ${supportWords}.`,
    readable,
  ));

  const specific = vague.length <= 1 && (includesNumber(combined) || outcomeNamed);
  score += specific ? 18 : 7;
  checks.push(makeCheck(
    "Specificity",
    specific ? "The copy relies on a concrete outcome more than broad category language." : vague.length ? `Replace or prove broad terms such as “${vague.slice(0, 3).join("”, “")}”.` : "Add a number, time frame, named workflow, or other detail a competitor cannot easily copy.",
    specific,
  ));

  const ctaLower = values.cta.toLowerCase();
  const actionCta = countWords(values.cta) >= 2 && !weakCtas.some((term) => ctaLower === term);
  score += actionCta ? 14 : 5;
  checks.push(makeCheck(
    "Next-step CTA",
    actionCta ? "The CTA says more than a generic action and helps set an expectation." : "Replace the generic CTA with the result or artifact the visitor gets next.",
    actionCta,
  ));

  const hasProof = values.proof.length >= 8;
  score += hasProof ? 10 : 2;
  checks.push(makeCheck(
    "Reason to believe",
    hasProof ? "A proof line is present. Make sure it is verifiable and close to the CTA." : "Add one verifiable proof line: customer count, named result, security signal, or product evidence.",
    hasProof,
  ));

  return { score: Math.min(score, 100), checks };
}

function scoreLabel(score) {
  if (score >= 82) return "Clear enough to test";
  if (score >= 65) return "Promising, with one major leak";
  if (score >= 45) return "Understandable, but easy to forget";
  return "The buyer is doing too much decoding";
}

function shareUrl(values) {
  const url = new URL(window.location.href);
  ["buyer", "headline", "support", "cta", "proof"].forEach((field) => {
    if (values[field]) {
      url.searchParams.set(field, values[field]);
    } else {
      url.searchParams.delete(field);
    }
  });
  return url.toString();
}

function fillForm(values) {
  if (!checker) return;
  ["buyer", "headline", "support", "cta", "proof"].forEach((field) => {
    if (checker.elements[field] && values[field]) {
      checker.elements[field].value = values[field];
    }
  });
}

function valuesFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(
    ["buyer", "headline", "support", "cta", "proof"].map((field) => [
      field,
      normalize(params.get(field) || ""),
    ]),
  );
}

function renderResult(values, analysis) {
  const buyer = escapeHtml(values.buyer);
  const cta = escapeHtml(values.cta);
  const outcomePrompt = analysis.checks[1].passed ? "achieve the concrete outcome already named above" : "remove an expensive task or risk";
  const email = window.SITE_CONFIG?.contactEmail || "";
  const checkoutUrl = window.SITE_CONFIG?.checkoutUrl || "";
  const subject = encodeURIComponent(`Hero review request — score ${analysis.score}`);
  const body = encodeURIComponent(`Target buyer: ${values.buyer}\nHeadline: ${values.headline}\nSupporting line: ${values.support}\nCTA: ${values.cta}\nProof: ${values.proof || "None"}\n\nI would like the free 3-point preview.`);
  const failedChecks = analysis.checks.filter((check) => !check.passed).map((check) => check.title);
  latestSummary = [
    `Landing Page Fix hero score: ${analysis.score}/100 — ${scoreLabel(analysis.score)}`,
    `Buyer: ${values.buyer}`,
    `Headline: ${values.headline}`,
    `Main flags: ${failedChecks.length ? failedChecks.join(", ") : "None"}`,
    "Checked locally with the explainable Hero Clarity Checker.",
  ].join("\n");
  latestValues = values;

  result.innerHTML = `
    <div class="result-top">
      <div class="result-score">${analysis.score}<small>/100</small></div>
      <div><h2>${scoreLabel(analysis.score)}</h2><p>This is a clarity diagnostic, not a conversion prediction.</p></div>
    </div>
    <ul class="check-list">
      ${analysis.checks.map((check) => `
        <li class="check-item ${check.passed ? "" : "warning"}">
          <span class="check-icon">${check.passed ? "✓" : "!"}</span>
          <div><h3>${check.title}</h3><p>${escapeHtml(check.detail)}</p></div>
        </li>`).join("")}
    </ul>
    <div class="rewrite-box">
      <span>Rewrite structure</span>
      <h3>Help ${buyer} ${outcomePrompt}</h3>
      <p>Support it with the named workflow, mechanism, or constraint that makes the promise credible. Then place one proof signal beside the CTA.</p>
      <strong>CTA direction: ${cta}</strong>
    </div>
    <div class="result-actions">
      <a class="button button-primary" href="sample-audit.html">See a full sample</a>
      <a class="button tool-email-button" href="mailto:${email}?subject=${subject}&body=${body}">Request 3 human observations</a>
      <button class="copy-result" type="button">Copy score summary</button>
      <button class="share-result" type="button">Copy shareable test link</button>
      ${checkoutUrl ? `<a class="result-checkout-link" href="${escapeHtml(checkoutUrl)}" target="_blank" rel="noopener">Preview the €39 human review checkout ↗</a>` : ""}
    </div>
    <p class="result-note">Shareable links keep the five hero fields in the URL so a founder can reopen the same test. No text is uploaded.</p>`;
}

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    const preset = presets[button.dataset.preset];
    if (!preset || !checker) return;
    Object.entries(preset).forEach(([field, value]) => {
      checker.elements[field].value = value;
    });
    checker.requestSubmit();
  });
});

result?.addEventListener("click", async (event) => {
  const summaryButton = event.target.closest(".copy-result");
  const shareButton = event.target.closest(".share-result");
  if (!summaryButton && !shareButton) return;

  try {
    if (summaryButton && latestSummary) {
      await navigator.clipboard.writeText(latestSummary);
      summaryButton.textContent = "Copied";
    }
    if (shareButton && latestValues) {
      await navigator.clipboard.writeText(shareUrl(latestValues));
      shareButton.textContent = "Link copied";
    }
  } catch {
    const button = summaryButton || shareButton;
    button.textContent = "Copy unavailable";
  }
});

checker?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(checker);
  const values = Object.fromEntries(["buyer", "headline", "support", "cta", "proof"].map((field) => [field, normalize(String(data.get(field) || ""))]));
  renderResult(values, scoreHero(values));
  result.scrollIntoView({ behavior: "smooth", block: "start" });
});

const initialValues = valuesFromUrl();
if (checker && result && initialValues.buyer && initialValues.headline && initialValues.support && initialValues.cta) {
  fillForm(initialValues);
  renderResult(initialValues, scoreHero(initialValues));
}
