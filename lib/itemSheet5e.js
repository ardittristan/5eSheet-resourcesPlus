// taken from the item/sheet.js file from dnd5e since not copying the full function broke it.

export function monkeypatchSheet(itemResources) {
    if (typeof libWrapper === "function") {
        libWrapper.register('resourcesplus', 'game.dnd5e.applications.ItemSheet5e.prototype._getItemConsumptionTargets', function(wrapper, item) {
            const consume = item.data.consume || {};
            if (!consume.type) return [];
            const actor = this.item.actor;
            if (!actor) return {};

            if (consume.type === "attribute") {
                var attributes = Object.values(CombatTrackerConfig.prototype.getAttributeChoices())[0];
                attributes = attributes.concat(itemResources);
                return attributes.reduce((obj, a) => {
                    obj[a] = a;
                    return obj;
                }, {});
            }

            wrapped.apply(this, item)
        })
    } else {
        game.dnd5e.applications.ItemSheet5e.prototype._getItemConsumptionTargets = function (item) {
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
                var attributes = Object.values(CombatTrackerConfig.prototype.getAttributeChoices())[0];
                attributes = attributes.concat(itemResources);
                return attributes.reduce((obj, a) => {
                    obj[a] = a;
                    return obj;
                }, {});
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
            }
            else return {};
        };
    }
}