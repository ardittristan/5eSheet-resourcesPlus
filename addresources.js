import ActorSheet5eCharacter from "./../../systems/dnd5e/module/actor/sheets/character.js";

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
});

Hooks.on('ready', function () {
    // Init resource list + resource counter
    var sheetResources = ["primary", "secondary", "tertiary", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth", "count"];

    // Monkeypatch original function
    const originalGetData = ActorSheet5eCharacter.prototype.getData;
    ActorSheet5eCharacter.prototype.getData = function () {
        const sheetData = originalGetData.call(this);

        sheetData["resources"] = sheetResources.reduce((arr, r) => {
            const res = sheetData.data.resources[r] || {};
            res.name = r;
            res.placeholder = game.i18n.localize("DND5E.Resource" + r.titleCase());
            if (res && res.value === 0 && res.name != "count") delete res.value;
            if (res && res.max === 0 && res.name != "count") delete res.max;
            if (res.name === "count") res.max = 20;
            if (res.name === "count" && res.value === null) res.value = 3;
            return arr.concat([res]);
        }, []);

        return sheetData;

    };
});

Hooks.on('renderActorSheet5eCharacter', function (dndSheet) {
    // Get all html elements that are resources
    var list = document.getElementsByClassName("attribute resource");
    // Check if all resources should be visible
    if (game.settings.get("resourcesplus", "showAll")) {
        for (let item of list) {
            // Check if resource is actually a resource and not the counter.
            var resourceIndex = item.innerHTML.match(/(?<=(\<h4)[\s\S]*(placeholder)(.*))([0-9]+)(?=[\s\S]*\<\/h4\>)/g);
            if (resourceIndex == undefined) {
                item.setAttribute("class", "attribute resource count");
            } else {
                item.setAttribute("class", "attribute resource");
            }
        }
    } else {
        // Sometimes the sheet value isn't there yet
        try {
            var countValue = dndSheet.actor.data.data.resources.count.value;
            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                // Extract resource number from placeholder name
                var resourceIndex = item.innerHTML.match(/(?<=(\<h4)[\s\S]*(placeholder)(.*))([0-9]+)(?=[\s\S]*\<\/h4\>)/g);
                if (!(resourceIndex == undefined)) {
                    resourceIndex = resourceIndex[0];
                }

                if (resourceIndex == undefined) {
                    item.setAttribute("class", "attribute resource count");
                } else if (
                    // Check if already visible, so it doesn't override other sheets
                    (!(item.className.includes("visible"))) && (
                        // This is the only way I could think of doing it, if you know a better method, please tell me because this is ugly af
                        (resourceIndex > countValue) ||
                        (resourceIndex > countValue + 20 && 21 > i + 1) ||
                        (resourceIndex > countValue + 40 && 42 > i + 1) ||
                        (resourceIndex > countValue + 60 && 63 > i + 1) ||
                        (resourceIndex > countValue + 80 && 84 > i + 1) ||
                        (resourceIndex > countValue + 100 && 105 > i + 1) ||
                        (resourceIndex > countValue + 120 && 126 > i + 1) ||
                        (resourceIndex > countValue + 140 && 147 > i + 1) ||
                        (resourceIndex > countValue + 160 && 168 > i + 1) ||
                        (resourceIndex > countValue + 180 && 189 > i + 1)
                    )) {
                    item.setAttribute("class", "attribute resource hidden");
                } else if (!(item.className.includes("hidden"))) {
                    item.setAttribute("class", "attribute resource visible");
                }
            }
        } catch (_) {
            console.error("Sheet value not initialized yet, please change one resource value to update it.")
        }
    }
});
