const config = window.SITE_CONFIG || {};
const toast = document.querySelector(".toast");
const isPreviewMode = config.previewMode === true;
const requiredLaunchFields = [
  "checkoutUrl",
  "contactEmail",
  "sellerName",
  "sellerLegalStatus",
  "registrationNumber",
  "sellerAddress",
  "sellerCountry",
];
const isLaunchReady = requiredLaunchFields.every((field) =>
  String(config[field] || "").trim(),
);

document.querySelectorAll("[data-checkout]").forEach((link) => {
  if (isLaunchReady || (isPreviewMode && config.checkoutUrl)) {
    link.href = config.checkoutUrl;
    link.target = "_blank";
    link.rel = "noopener";
    if (!isLaunchReady) {
      link.dataset.previewCheckout = "true";
      link.setAttribute("aria-label", "Open the Stripe checkout preview in a new tab");
    }
    return;
  }

  link.addEventListener("click", (event) => {
    event.preventDefault();
    toast.classList.add("visible");
    window.setTimeout(() => toast.classList.remove("visible"), 3500);
  });
});

document.querySelectorAll("[data-launch-state]").forEach((element) => {
  element.textContent = isLaunchReady
    ? "Open for purchase"
    : "MVP preview · checkout shown for validation · purchases not yet open";
  element.classList.toggle("is-live", isLaunchReady);
});

document.querySelectorAll("[data-contact]").forEach((link) => {
  if (config.contactEmail) {
    link.href = `mailto:${config.contactEmail}`;
    return;
  }

  link.removeAttribute("href");
  link.setAttribute("aria-disabled", "true");
});

const legalFields = {
  sellerName: config.sellerName,
  sellerLegalStatus: config.sellerLegalStatus,
  registrationNumber: config.registrationNumber,
  sellerAddress: config.sellerAddress,
  sellerCountry: config.sellerCountry,
  contactEmail: config.contactEmail,
};

Object.entries(legalFields).forEach(([field, value]) => {
  document.querySelectorAll(`[data-legal="${field}"]`).forEach((element) => {
    if (value) {
      element.textContent = value;
      return;
    }

    element.textContent = "Required before launch";
    element.classList.add("missing-legal-value");
  });
});
