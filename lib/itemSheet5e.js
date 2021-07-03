// taken from the item/sheet.js file from dnd5e since not copying the full function broke it.
let itemResources;

const wrapperFunction = function (item) {
  const versionCheck = game.data.version.includes("0.7.") || game.data.version.includes("0.6.") || game.data.version.includes("0.5.");
  const consume = item.data.consume || {};
  if (!consume.type) return [];
  const actor = this.item.actor;
  if (!actor) return {};

  // Ammunition
  if (consume.type === "ammo") {
    return actor.itemTypes.consumable.reduce((ammo, i) => {
      if (i.data.data.consumableType === "ammo") {
        ammo[i.id] = `${i.name} (${i.data.data.quantity})`;
      }
      return ammo;
    }, {});
  }

  // Materials --- Edited
  else if (consume.type === "attribute") {
    if (versionCheck) {
      let attributes = Object.values(CombatTrackerConfig.prototype.getAttributeChoices())[0];
      attributes = attributes.concat(itemResources);
      return attributes.reduce((obj, a) => {
        obj[a] = a;
        return obj;
      }, {});
    } else {
      let modifiedItemResources = [];
      itemResources.forEach((resource) => {
        modifiedItemResources.push(["resources", resource]);
      });
      let attributes = TokenDocument.getTrackedAttributes(actor.data.data);
      attributes.bar.concat(modifiedItemResources);
      attributes.bar.forEach((a) => a.push("value"));
      return attributes.bar.concat(attributes.value).reduce((obj, a) => {
        let k = a.join(".");
        obj[k] = k;
        return obj;
      }, {});
    }
  }

  // Materials
  else if (consume.type === "material") {
    return actor.items.reduce((obj, i) => {
      if (["consumable", "loot"].includes(i.data.type) && !i.data.data.activation) {
        obj[i.id] = `${i.name} (${i.data.data.quantity})`;
      }
      return obj;
    }, {});
  }

  // Charges
  else if (consume.type === "charges") {
    return actor.items.reduce((obj, i) => {
      const uses = i.data.data.uses || {};
      if (uses.per && uses.max) {
        const label = uses.per === "charges" ? ` (${uses.value} Charges)` : ` (${uses.max} per ${uses.per})`;
        obj[i.id] = i.name + label;
      }
      return obj;
    }, {});
  } else return {};
};

export function monkeypatchSheet(ItemResources) {
  itemResources = ItemResources;
  if (typeof libWrapper === "function") {
    libWrapper.register("resourcesplus", `game.${game.system.id}.applications.ItemSheet5e.prototype._getItemConsumptionTargets`, wrapperFunction, "OVERRIDE");
  } else {
    game[game.system.id].applications.ItemSheet5e.prototype._getItemConsumptionTargets = wrapperFunction;
  }
}
