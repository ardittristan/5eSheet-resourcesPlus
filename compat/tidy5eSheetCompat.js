let initialized = false;

export function tidy5eSheetCompat() {
  if (initialized) {
    return;
  }

  // Applies only when this module is active: https://github.com/kgar/foundry-vtt-tidy-5e-sheets/
  Hooks.once("tidy5e-sheet.ready", () => {
    Hooks.on("tidy5e-sheet.prepareResources", hideResourcesWhichShouldBeHidden);
    Hooks.on("renderEntitySheetConfig", updateResourcesCountOnSubmit);
    Hooks.on("renderDocumentSheetConfig", updateResourcesCountOnSubmit);
  });

  initialized = true;
}

function hideResourcesWhichShouldBeHidden(tidyResources, actor) {
  const configuredNumberOfResources = tidyResources.find(
    (r) => r.name === "count"
  ).value;

  const globalLimit = game.settings.get("resourcesplus", "globalLimit");
  const configuredLocalLimit = game.settings.get("resourcesplus", "localLimit");
  const localLimit =
    configuredLocalLimit == -1 ? globalLimit : configuredLocalLimit;

  const numberOfResourcesToShow = Math.min(
    parseInt(configuredNumberOfResources),
    parseInt(localLimit),
    parseInt(globalLimit)
  );

  if (!isNaN(numberOfResourcesToShow)) {
    tidyResources
      .slice(numberOfResourcesToShow)
      .forEach((r) => r.cssClasses.push("hidden"));
  }
}

function updateResourcesCountOnSubmit(entity, html) {
  if (
    !game.settings.get("resourcesplus", "useNewSettingsLocation") ||
    entity?.object?.type !== "character"
  )
    return;

  html.find("button[type=submit]").on("click", (e) => {
    const oldValue = entity?.object?.system?.resources?.count?.value;
    const newValue = $(e.target.form).find("input#resourceCount").val();
    if (oldValue !== undefined) {
      entity.object.update({ "system.resources.count.value": newValue });
    }
  });
}
