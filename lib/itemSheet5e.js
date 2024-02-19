export function monkeypatchSheet (ItemResources) {
  /** @type {string} */
  const getConsumedAttributes = TokenDocument?.implementation?.getConsumedAttributes?.toString();

  CONFIG.DND5E.consumableResources.push(...ItemResources);

  if (getConsumedAttributes !== undefined && !getConsumedAttributes.match(/return CONFIG\.[A-Z0-9]+\.consumableResources/)?.length) {
    libWrapper.register(
      "resourcesplus",
      `game.${game.system.id}.applications.item.ItemSheet5e.prototype._getItemConsumptionTargets`,
      function (wrapper, ...args) {
        let result = wrapper(...args);
        const consume = this.item.system.consume || {};
        if (!consume.type) return [];
        const actor = this.item.actor;
        if (!actor) return {};

        // Attributes
        if (consume.type === "attribute") {
          let modifiedItemResources = [];
          ItemResources.forEach((resource) => {
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

        return result;
      },
      "WRAPPER"
    );
  }
}
