const config = window.SITE_CONFIG || {};
const toast = document.querySelector(".toast");
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
  if (config.checkoutUrl) {
    link.href = config.checkoutUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.setAttribute("aria-label", "Buy the 24-hour landing page review in a new tab");
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
    : "Open for purchase · 3 founding review slots";
  element.classList.toggle("is-live", true);
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
