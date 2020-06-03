import ActorSheet5eCharacter from "./../../systems/dnd5e/module/actor/sheets/character.js";

Hooks.on('ready', function () {
    var sheetResources = ["primary", "secondary", "tertiary", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth", "count"];

    // monkeypatch original function
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
            if (res.name === "count" && res.value === null) res.value = 3
            return arr.concat([res]);
        }, []);

        return sheetData;

    };
});

Hooks.on('renderActorSheet5eCharacter', async function (dndSheet) {
    console.log(dndSheet.actor.data.data.resources);
    var list = document.getElementsByClassName("attribute resource");
    try {
        var countValue = dndSheet.actor.data.data.resources.count.value;
        if (countValue == undefined) {
            dndSheet.actor.data.data.resources.count.value = 3;
        }


        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if ((i + 1) > dndSheet.actor.data.data.resources.count.value) {
                item.setAttribute("class", "attribute resource hidden");
            }
        }
        list[list.length - 1].setAttribute("class", "attribute resource count");
    } catch (_) {
        list[list.length - 1].setAttribute("class", "attribute resource count important");
    }
});


