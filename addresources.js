import { monkeypatchSheet } from "./lib/itemSheet5e.js";
import { darkSheetCompat } from "./compat/darksheetCompat.js";

// Setting to always show resources
Hooks.on('init', function () {
    game.settings.register("resourcesplus", "showAll", {
        name: "Show everything",
        hint: "Always show all the available resources on sheets.",
        scope: "client",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("resourcesplus", "globalLimit", {
        name: "Global resource limit",
        hint: "(requires reload) - Global maximum amount of resources, change this if you use a skin that isn't supported by this module. Might not look nice formatting wise on different sheets.",
        scope: "world",
        config: true,
        range: { min: 1, max: 20, step: 1 },
        default: 20,
        type: Number,
        onChange: _ => window.location.reload()
    });

    game.settings.register("resourcesplus", "localLimit", {
        name: "Local resource limit",
        hint: "Local maximum amount of resources",
        scope: "client",
        config: true,
        range: { min: -1, max: 20, step: 1 },
        default: -1,
        type: Number
    });

    game.settings.register("resourcesplus", "migratedLocalLimit", {
        config: false,
        scope: "client",
        default: false,
        type: Boolean
    });

    // check migration
    if (!game.settings.get("resourcesplus", "migratedLocalLimit")) {
        if (game.settings.get("resourcesplus", "localLimit") === 0) {
            game.settings.set("resourcesplus", "localLimit", -1);
        }
        game.settings.set("resourcesplus", "migratedLocalLimit", true);
    }

    // Init resource list + resource counter
    var sheetResources = ["primary", "secondary", "tertiary", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth", "count"];
    var globalLimit = game.settings.get("resourcesplus", "globalLimit") || 20;
    // if global mode is on, only enable required resources
    if (globalLimit != 20) {
        sheetResources = sheetResources.slice(0, globalLimit);
        sheetResources.push("count");
    }

    // Monkeypatch original function
    const originalGetData = game.dnd5e.applications.ActorSheet5eCharacter.prototype.getData;
    if (typeof libWrapper === "function") {
        libWrapper.register('resourcesplus', 'game.dnd5e.applications.ActorSheet5eCharacter.prototype.getData', function(wrapper, ...args) {
            const sheetData = originalGetData.call(this);
            sheetData["resources"] = sheetResources.reduce((arr, r) => {
                const res = sheetData.data.resources[r] || {};
                res.name = r;
                res.placeholder = game.i18n.localize("DND5E.Resource" + r.titleCase());
                if (res && res.value === 0 && res.name != "count") delete res.value;
                if (res && res.max === 0 && res.name != "count") delete res.max;
                if (res && res.name === "count") { res.max = globalLimit; res.label = "Resource Count"; res.sr = false; res.lr = false; }
                if (res && res.name === "count" && res.value === null) res.value = 3;
                if (res && res.name === "count" && res.value > globalLimit) res.value = globalLimit;
                return arr.concat([res]);
            }, []);
            wrapper.apply(this, args)
            return sheetData
        }, 'WRAPPER')
    } else {
        game.dnd5e.applications.ActorSheet5eCharacter.prototype.getData = function () {
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
                if (res && res.name === "count") { res.max = globalLimit; res.label = "Resource Count"; res.sr = false; res.lr = false; }
                if (res && res.name === "count" && res.value === null) res.value = 3;
                if (res && res.name === "count" && res.value > globalLimit) res.value = globalLimit;
                return arr.concat([res]);
            }, []);

            // Return data for rendering
            // Experience Tracking
            sheetData["disableExperience"] = game.settings.get("dnd5e", "disableExperienceTracking");

            return sheetData;

        };
    }
    /** @type {string[]} */
    var itemResources = [];

    sheetResources.forEach((resource) => {
        if (!(resource === "count" || resource === "primary" || resource === "secondary" || resource === "tertiary")) {
            itemResources.push(`resources.${resource}.value`);
        }
    });

    // Monkeypatch item sheet list so it shows up under the resources for items/spells
    monkeypatchSheet(itemResources);



    // Compatibility
    game.modules.forEach(module => {
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

Hooks.on('renderActorSheet', function (dndSheet) {
    // Get all html elements that are resources
    var list = document.getElementsByClassName("attribute resource");
    // Check if all resources should be visible
    if (game.settings.get("resourcesplus", "showAll")) {
        for (let item of list) {
            // Check if resource is actually a resource and not the counter.
            var resourceIndex = item.innerHTML.match(/(?<=(\<h4)[\s\S]*(placeholder)(.*))([0-9]+)(?=[\s\S]*\<\/h4\>)/g);
            if (resourceIndex == undefined) {
                item.setAttribute("class", "attribute resource hidden");
            } else {
                item.setAttribute("class", "attribute resource");
            }
        }
    } else if (game.settings.get("resourcesplus", "localLimit") != -1) {
        try {
            var countValue = game.settings.get("resourcesplus", "localLimit");
            var globalLimit = game.settings.get("resourcesplus", "globalLimit") || 20;
            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                // Extract resource number from placeholder name
                var resourceIndex = item.innerHTML.match(/(?<=(\<h4)[\s\S]*(placeholder)(.*))([0-9]+)(?=[\s\S]*\<\/h4\>)/g);
                if (!(resourceIndex == undefined)) {
                    resourceIndex = resourceIndex[0];
                }

                if (resourceIndex == undefined) {
                    item.setAttribute("class", "attribute resource hidden");
                } else if ((!(item.className.includes("visible"))) && ((resourceIndex > countValue) || resourceIndex > countValue + (globalLimit / globalLimit + 1) * (i + 1))) {
                    item.setAttribute("class", "attribute resource hidden");
                } else if (!(item.className.includes("hidden"))) {
                    item.setAttribute("class", "attribute resource visible");
                }
            }
        } catch (_) {
            console.error("Sheet value not initialized yet, please change one resource value to update it.");
        }
    } else {
        // Sometimes the sheet value isn't there yet
        try {
            var countValue = dndSheet.actor.data.data.resources.count.value;
            var globalLimit = game.settings.get("resourcesplus", "globalLimit") || 20;
            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                // Extract resource number from placeholder name
                var resourceIndex = item.innerHTML.match(/(?<=(\<h4)[\s\S]*(placeholder)(.*))([0-9]+)(?=[\s\S]*\<\/h4\>)/g);
                if (!(resourceIndex == undefined)) {
                    resourceIndex = resourceIndex[0];
                }

                if (resourceIndex == undefined) {
                    item.setAttribute("class", "attribute resource count");
                } else if ((!(item.className.includes("visible"))) && ((resourceIndex > countValue) || resourceIndex > countValue + (globalLimit / globalLimit + 1) * (i + 1))) {
                    item.setAttribute("class", "attribute resource hidden");
                } else if (!(item.className.includes("hidden"))) {
                    item.setAttribute("class", "attribute resource visible");
                }
            }
        } catch (_) {
            console.error("Sheet value not initialized yet, please change one resource value to update it.");
        }
    }
});
