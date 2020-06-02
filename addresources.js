import ActorSheet5eCharacter from "./../../systems/dnd5e/module/actor/sheets/character.js";

Hooks.on('init', function () {
    // global resource or journal resource
    game.settings.register("resourcesplus", "typeToggle", {
        name: "Settings type",
        hint: "Global means all sheets will have the same amount of resources\nJournal means sheets will have the value they got assigned in the module's journal\n(requires reload)",
        scope: "world",
        config: false,      //! Change to true when added
        choices: { 0: "Journal", 1: "Global" },
        default: 1,
        type: Number,
        onChange: _ => window.location.reload()
    });

    // global resource amount
    game.settings.register("resourcesplus", "resourceAmount", {
        name: "Resource amount",
        hint: "Amount of resources to show, does nothing when settings type is set to journal.\n(requires reload)",
        scope: "world",
        config: true,
        choices: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: '11', 12: '12', 13: '13', 14: '14', 15: '15', 16: '16', 17: '17', 18: '18', 19: '19', 20: '20' },
        default: 3,
        type: Number,
        onChange: _ => window.location.reload()
    });

    // journal resource location
    game.settings.register("resourcesplus", "journalName", {
        name: "Journal name",
        hint: "Name of the Resource Journal you want to use for resource amounts, does nothing when settings type is set to global.\n(requires reload)",
        scope: "world",
        config: false,      //! Change to true when added
        default: "Resource Count",
        type: String
    });
});

Hooks.on('ready', function () {
    var sheetResources = ["primary", "secondary", "tertiary", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth"];
    // if global mode is on, only enable required resources
    if (game.settings.get("resourcesplus", "typeToggle")) {
        sheetResources = sheetResources.slice(0, game.settings.get("resourcesplus", "resourceAmount") || 3);
    }

    // monkeypatch original function
    const originalGetData = ActorSheet5eCharacter.prototype.getData;
    ActorSheet5eCharacter.prototype.getData = function () {
        const sheetData = originalGetData.call(this);

        sheetData["resources"] = sheetResources.reduce((arr, r) => {
            const res = sheetData.data.resources[r] || {};
            res.name = r;
            res.placeholder = game.i18n.localize("DND5E.Resource" + r.titleCase());
            if (res && res.value === 0) delete res.value;
            if (res && res.max === 0) delete res.max;
            return arr.concat([res]);
        }, []);

        return sheetData;

    };
});

