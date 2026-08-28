export const applyAvatarFallback = (event) => {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === "true") return;

  image.dataset.fallbackApplied = "true";
  image.src = "/profile-pic.png";
};
