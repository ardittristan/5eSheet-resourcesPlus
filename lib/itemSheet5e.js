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
    return actor.itemTypes.consumable.reduce(
      (ammo, i) => {
        if (i.data.data.consumableType === "ammo") {
          ammo[i.id] = `${i.name} (${i.data.data.quantity})`;
        }
        return ammo;
      },
      { [item._id]: `${item.name} (${item.data.quantity})` }
    );
  }

  // Attributes --- Edited
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
      let attributes = TokenDocument?.getTrackedAttributes(actor.data.data) || TokenDocument?.implementation?.getConsumedAttributes(actor.data.data);
      attributes.bar.concat(modifiedItemResources);
      attributes.bar.forEach((a) => a.push("value"));
      return attributes.bar.concat(attributes.value).reduce((obj, a) => {
        let k = a.join(".");
        obj[k] = k;
        return obj;
      }, {});
    }
  }

  // Hit Dice
  else if (consume.type === "hitDice") {
    return {
      smallest: game.i18n.localize("DND5E.ConsumeHitDiceSmallest"),
      ...CONFIG.DND5E.hitDieTypes.reduce((obj, hd) => {
        obj[hd] = hd;
        return obj;
      }, {}),
      largest: game.i18n.localize("DND5E.ConsumeHitDiceLargest"),
    };
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
      // Limited-use items
      const uses = i.data.data.uses || {};
      if (uses.per && uses.max) {
        const label =
          uses.per === "charges"
            ? ` (${game.i18n.format("DND5E.AbilityUseChargesLabel", { value: uses.value })})`
            : ` (${game.i18n.format("DND5E.AbilityUseConsumableLabel", { max: uses.max, per: uses.per })})`;
        obj[i.id] = i.name + label;
      }

      // Recharging items
      const recharge = i.data.data.recharge || {};
      if (recharge.value) obj[i.id] = `${i.name} (${game.i18n.format("DND5E.Recharge")})`;
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
