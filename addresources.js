import { monkeypatchSheet } from "./lib/itemSheet5e.js";
import { darkSheetCompat } from "./compat/darksheetCompat.js";

// Setting to always show resources
Hooks.on("init", function () {
  game.settings.register("resourcesplus", "showAll", {
    name: "Show everything",
    hint: "Always show all the available resources on sheets.",
    scope: "client",
    config: true,
    default: false,
    type: Boolean,
  });

  game.settings.register("resourcesplus", "globalLimit", {
    name: "Global resource limit",
    hint: "(requires reload) - Global maximum amount of resources, change this if you use a skin that isn't supported by this module. Might not look nice formatting wise on different sheets.",
    scope: "world",
    config: true,
    range: { min: 1, max: 20, step: 1 },
    default: 20,
    type: Number,
    onChange: (_) => window.location.reload(),
  });

  game.settings.register("resourcesplus", "localLimit", {
    name: "Local resource limit",
    hint: "Local maximum amount of resources",
    scope: "client",
    config: true,
    range: { min: -1, max: 20, step: 1 },
    default: -1,
    type: Number,
  });

  game.settings.register("resourcesplus", "migratedLocalLimit", {
    config: false,
    scope: "client",
    default: false,
    type: Boolean,
  });

  game.settings.register("resourcesplus", "useNewSettingsLocation", {
    name: "Use new settings location?",
    hint: "When enabled moves the resource count setting to the sheet's settings.",
    scope: "client",
    config: true,
    default: true,
    type: Boolean,
  });

  // check migration
  if (!game.settings.get("resourcesplus", "migratedLocalLimit")) {
    if (game.settings.get("resourcesplus", "localLimit") === 0) {
      game.settings.set("resourcesplus", "localLimit", -1);
    }
    game.settings.set("resourcesplus", "migratedLocalLimit", true);
  }

  // Init resource list + resource counter
  let sheetResources = [
    "primary",
    "secondary",
    "tertiary",
    "fourth",
    "fifth",
    "sixth",
    "seventh",
    "eighth",
    "ninth",
    "tenth",
    "eleventh",
    "twelfth",
    "thirteenth",
    "fourteenth",
    "fifteenth",
    "sixteenth",
    "seventeenth",
    "eighteenth",
    "nineteenth",
    "twentieth",
    "count",
  ];
  let globalLimit = game.settings.get("resourcesplus", "globalLimit") || 20;
  // if global mode is on, only enable required resources
  if (globalLimit != 20) {
    sheetResources = sheetResources.slice(0, globalLimit);
    sheetResources.push("count");
  }

  let actorSheetClassName = "ActorSheet5eCharacter";
  if (game.system.id === "sw5e") {
    actorSheetClassName += "New";
    Hooks.once("ready", async () => {
      window.resourcesPlusTranslations = await Localization.prototype._loadTranslationFile(
        Localization.prototype._filterLanguagePaths(game.modules.get("resourcesplus"), "en")
      );
    });
  }

  // Monkeypatch original function
  const originalGetData = game[game.system.id].applications.actor[actorSheetClassName].prototype.getData;
  if (typeof libWrapper === "function") {
    libWrapper.register(
      "resourcesplus",
      `game.${game.system.id}.applications.actor.${actorSheetClassName}.prototype.getData`,
      async function (wrapper, ...args) {
        const sheetData = await wrapper(...args);
        sheetData["resources"] = sheetResources.reduce((arr, r) => {
          const res = sheetData.actor.system.resources[r] || {};
          res.name = r;
          try {
            res.placeholder = game.i18n.translations.DND5E["Resource" + r.titleCase()] || window.resourcesPlusTranslations.DND5E["Resource" + r.titleCase()];
          } catch (_e) {
            res.placeholder = game.i18n.localize("DND5E.Resource" + r.titleCase());
          }
          if (res && res.value === 0 && res.name != "count") delete res.value;
          if (res && res.max === 0 && res.name != "count") delete res.max;
          if (res && res.name === "count") {
            res.max = globalLimit;
            res.label = "Resource Count";
            res.sr = false;
            res.lr = false;
          }
          if (res && res.name === "count" && res.value === null) res.value = 3;
          if (res && res.name === "count" && res.value > globalLimit) res.value = globalLimit;
          return arr.concat([res]);
        }, []);
        return sheetData;
      },
      "WRAPPER"
    );
  } else {
    game[game.system.id].applications.actor[actorSheetClassName].prototype.getData = async function () {
      const sheetData = await originalGetData.call(this);

      // Resources
      sheetData["resources"] = sheetResources.reduce((arr, r) => {
        const res = sheetData.actor.system.resources[r] || {};
        res.name = r;
        try {
          res.placeholder = game.i18n.translations.DND5E["Resource" + r.titleCase()] || window.resourcesPlusTranslations.DND5E["Resource" + r.titleCase()];
        } catch (_e) {
          res.placeholder = game.i18n.localize("DND5E.Resource" + r.titleCase());
        }
        if (res && res.value === 0 && res.name != "count") delete res.value;
        if (res && res.max === 0 && res.name != "count") delete res.max;
        if (res && res.name === "count") {
          res.max = globalLimit;
          res.label = "Resource Count";
          res.sr = false;
          res.lr = false;
        }
        if (res && res.name === "count" && res.value === null) res.value = 3;
        if (res && res.name === "count" && res.value > globalLimit) res.value = globalLimit;
        return arr.concat([res]);
      }, []);

      const classes = this.actor.itemTypes.class;
      return foundry.utils.mergeObject(sheetData, {
        disableExperience: game.settings.get("dnd5e", "disableExperienceTracking"),
        classLabels: classes.map((c) => c.name).join(", "),
        multiclassLabels: classes.map((c) => [c.subclass?.name ?? "", c.name, c.system.levels].filterJoin(" ")).join(", "),
        weightUnit: game.i18n.localize(`DND5E.Abbreviation${game.settings.get("dnd5e", "metricWeightUnits") ? "Kgs" : "Lbs"}`),
      });
    };
  }
  /** @type {string[]} */
  let itemResources = [];

  sheetResources.forEach((resource) => {
    if (!(resource === "count" || resource === "primary" || resource === "secondary" || resource === "tertiary")) {
      itemResources.push(`resources.${resource}.value`);
      game.system.model.Actor.character.resources[resource] = {
        lr: 0,
        max: 0,
        sr: 0,
        value: 0,
      };
    }
  });

  // Monkeypatch item sheet list so it shows up under the resources for items/spells
  monkeypatchSheet(itemResources);

  // Compatibility
  game.modules.forEach((module) => {
    switch (module.id) {
      // darksheet compat
      case "darksheet":
        if (module.active) {
          darkSheetCompat(sheetResources);
        }
        break;
    }
  });
});

/**
 * @param {EntitySheetConfig} entity
 * @param {JQuery} html
 */
function renderEntitySheetConfig(entity, html) {
  if (!game.settings.get("resourcesplus", "useNewSettingsLocation") || entity?.object?.type !== "character") return;
  // fix config height
  html.height("auto");
  // add element to config screen
  $(`
        <div class="form-group">
            <label>${
              game.i18n.translations?.DND5E?.ResourceCount || window.resourcesPlusTranslations?.DND5E?.ResourceCount || game.i18n.localize("DND5E.ResourceCount")
            }</label>
            <input type="number" id="resourceCount" min="0" max="20" size="2" value="${entity?.object?.system?.resources?.count?.value}">
            <p class="notes">Set the max resource count</p>
        </div>
    `).insertAfter(html.find(".form-group:last-of-type"));

  // handle submit
  html.find("button[type=submit]").on("click", (e) => {
    const oldValue = entity?.object?.system?.resources?.count?.value;
    const newValue = $(e.target.form).find("input#resourceCount").val();
    if (oldValue !== undefined) {
      entity.object.system.resources.count.value = newValue;
      if (oldValue !== newValue) {
        entity.object.sheet.render(false);
      }
    }
  });
}

Hooks.on("renderEntitySheetConfig", renderEntitySheetConfig);
Hooks.on("renderDocumentSheetConfig", renderEntitySheetConfig);

Hooks.on(
  "renderActorSheet",
  /** @param dndSheet {ActorSheet} @param html {JQuery} */ function (dndSheet, html) {
    if (dndSheet.constructor.name == "MonsterBlock5e" || dndSheet.actor.type !== "character") return;
    // Get all html elements that are resources
    let list = html[0].querySelectorAll(".attribute.resource");
    let classes = "attribute resource";

    // tidy5esheet compat
    if (dndSheet.constructor.name == "Tidy5eSheet" || game.system.id == "sw5e") {
      list = html[0].querySelectorAll(".attributes .resources .resource");
      classes = "resource";
    }

    // Check if all resources should be visible
    if (game.settings.get("resourcesplus", "showAll")) {
      for (let item of list) {
        // Check if resource is actually a resource and not the counter.
        let resourceIndex = item.innerHTML.match(/(?<=(\<h4)[\s\S]*(placeholder)(.*))([0-9]+)(?=[\s\S]*\<\/h4\>)/g);
        if (resourceIndex == undefined) {
          item.setAttribute("class", classes + " hidden");
        } else {
          item.setAttribute("class", classes + "");
        }
      }
    } else if (game.settings.get("resourcesplus", "localLimit") != -1) {
      try {
        let countValue = game.settings.get("resourcesplus", "localLimit");
        let globalLimit = game.settings.get("resourcesplus", "globalLimit") || 20;
        for (let i = 0; i < list.length; i++) {
          let item = list[i];
          // Extract resource number from placeholder name
          let resourceIndex = item.innerHTML.match(/(?<=(\<h4)[\s\S]*(placeholder)(.*))([0-9]+)(?=[\s\S]*\<\/h4\>)/g);
          if (!(resourceIndex == undefined)) {
            resourceIndex = resourceIndex[0] * 1;
          }

          if (resourceIndex == undefined) {
            item.setAttribute("class", classes + " hidden");
          } else if (!item.className.includes("visible") && (resourceIndex > countValue || resourceIndex > countValue + (globalLimit / (globalLimit + 1)) * (i + 1))) {
            item.setAttribute("class", classes + " hidden");
          } else if (!item.className.includes("hidden")) {
            item.setAttribute("class", classes + " visible");
          }
        }
      } catch (e) {
        console.warn("Sheet value not initialized yet, please change one resource value to update it.");
        console.debug(e);
      }
    } else {
      // Sometimes the sheet value isn't there yet
      try {
        console.log(dndSheet)
        let countValue = dndSheet.actor.system.resources.count.value * 1;
        let globalLimit = game.settings.get("resourcesplus", "globalLimit") || 20;
        for (let i = 0; i < list.length; i++) {
          let item = list[i];
          // Extract resource number from placeholder name
          let resourceIndex = item.innerHTML.match(/(?<=(\<h[4,1])[\s\S]*(placeholder)(.*))([0-9]+)(?=[\s\S]*\<\/h[4,1]\>)/g);
          if (!(resourceIndex == undefined)) {
            resourceIndex = resourceIndex[0] * 1;
          }

          if (resourceIndex == undefined) {
            if (game.settings.get("resourcesplus", "useNewSettingsLocation")) {
              item.setAttribute("class", classes + " hidden");
            } else {
              item.setAttribute("class", classes + " count");
            }
          } else if (!item.className.includes("visible") && (resourceIndex > countValue || resourceIndex > countValue + (globalLimit / (globalLimit + 1)) * (i + 1))) {
            item.setAttribute("class", classes + " hidden");
          } else if (!item.className.includes("hidden")) {
            item.setAttribute("class", classes + " visible");
          }
        }
      } catch (e) {
        console.warn("Sheet value not initialized yet, please change one resource value to update it.");
        console.debug(e);
      }
    }
  }
);
