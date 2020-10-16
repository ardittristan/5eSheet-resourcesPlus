export function darkSheetCompat(sheetResources) {
  // Import dynamically so it doesn't throw errors when module is not installed.
  try {
    import(
      game.modules
        .get("darksheet")
        .path.match(/[\\/](?=modules)(.*)/g)[0]
        .replace(/\\/g, "/") + "/actor/sheets/character.js"
    ).then((imported) => {
      // Set class
      const ActorSheet5eCharacter = imported.ActorSheet5eCharacter;

      var globalLimit = game.settings.get("resourcesplus", "globalLimit") || 20;

      // Monkeypatch original function
      var originalGetData = ActorSheet5eCharacter.prototype.getData;
      ActorSheet5eCharacter.prototype.getData = function () {
        const sheetData = originalGetData.call(this);

        // Temporary HP
        let hp = sheetData.data.attributes.hp;
        if (hp.temp === 0) delete hp.temp;
        if (hp.tempmax === 0) delete hp.tempmax;

        // Resources
        sheetData["resources"] = sheetResources.reduce((arr, r) => {
          const res = sheetData.data.resources[r] || {};
          res.name = r;
          res.placeholder = game.i18n.localize("DND5E.Resource" + r.titleCase());
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

        // Experience Tracking
        sheetData["disableExperience"] = game.settings.get("dnd5e", "disableExperienceTracking");
        sheetData["slotSetting"] = game.settings.get("darksheet", "slotbasedinventory");

        // Return data for rendering
        return sheetData;
      };
    });
  } catch {}
}
