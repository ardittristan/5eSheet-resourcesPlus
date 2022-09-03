// taken from the item/sheet.js file from dnd5e since not copying the full function broke it.
let itemResources;

const wrapperFunction = function () {
  const consume = this.item.system.consume || {};
  if (!consume.type) return [];
  const actor = this.item.actor;
  if (!actor) return {};

  // Ammunition
  if (consume.type === "ammo") {
    return actor.itemTypes.consumable.reduce(
      (ammo, i) => {
        if (i.system.consumableType === "ammo") ammo[i.id] = `${i.name} (${i.system.quantity})`;
        return ammo;
      },
      { [this.item.id]: `${this.item.name} (${this.item.system.quantity})` }
    );
  }

  // Attributes --- Edited
  else if (consume.type === "attribute") {
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
      if (["consumable", "loot"].includes(i.type) && !i.system.activation) {
        obj[i.id] = `${i.name} (${i.system.quantity})`;
      }
      return obj;
    }, {});
  }

  // Charges
  else if (consume.type === "charges") {
    return actor.items.reduce((obj, i) => {
      // Limited-use items
      const uses = i.system.uses || {};
      if (uses.per && uses.max) {
        const label =
          uses.per === "charges"
            ? ` (${game.i18n.format("DND5E.AbilityUseChargesLabel", { value: uses.value })})`
            : ` (${game.i18n.format("DND5E.AbilityUseConsumableLabel", { max: uses.max, per: uses.per })})`;
        obj[i.id] = i.name + label;
      }

      // Recharging items
      const recharge = i.system.recharge || {};
      if (recharge.value) obj[i.id] = `${i.name} (${game.i18n.format("DND5E.Recharge")})`;
      return obj;
    }, {});
  } else return {};
};

export function monkeypatchSheet(ItemResources) {
  itemResources = ItemResources;
  if (typeof libWrapper === "function") {
    libWrapper.register("resourcesplus", `game.${game.system.id}.applications.item.ItemSheet5e.prototype._getItemConsumptionTargets`, wrapperFunction, "OVERRIDE");
  } else {
    game[game.system.id].applications.item.ItemSheet5e.prototype._getItemConsumptionTargets = wrapperFunction;
  }
}
