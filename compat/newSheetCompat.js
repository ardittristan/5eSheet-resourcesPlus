let initialized = false;

export function newSheetCompat() {
  if (initialized) {
    return;
  }

  if (!game.system?.applications?.actor?.ActorSheet5eCharacter2) {
    initialized = true;
    return;
  }

  const origGetTemplate = getTemplate;
  getTemplate = async function (path, id, ...misc) {
    if (path != "systems/dnd5e/templates/actors/character-sheet-2.hbs")
      return origGetTemplate(path, id, ...misc);

    if ( !Handlebars.partials.hasOwnProperty(path) ) {
      await new Promise((resolve, reject) => {
        game.socket.emit("template", path, resp => {
          if (resp.error) return reject(new Error(resp.error));

          /// begin custom
          resp.html = resp.html
            .replace(/{{#each favorites}}/, "$&\n                        {{#unless resource}}")
            .replace(/{{\/each}}[ \n\r]+?{{!-- Drop Indicator --}}/, "{{/unless}}\n                        $&")
            .replace(/{{!-- Drop Indicator --}}.*?<\/ul>/s, `$&
          <h3 class="icon" style="margin-top:0.5rem">
            <i class="fas fa-gear"></i>
            <span class="roboto-upper">{{ localize "DND5E.Resources" }}</span>
          </h3>
          <ul class="unlist">
          {{#each resources}}
            <li class="attribute resource" data-resource-id="{{ name }}">
              {{!-- Icon --}}
              <figure class="flexcol">
                  <label class="recharge checkbox">
                      <span>{{ localize "DND5E.AbbreviationSR" }}</span><input name="system.resources.{{name}}.sr" type="checkbox" {{checked sr}}/>
                  </label>
                  <label class="recharge checkbox">
                      <span>{{ localize "DND5E.AbbreviationLR" }}</span><input name="system.resources.{{name}}.lr" type="checkbox" {{checked lr}}/>
                  </label>
              </figure>

              {{!-- Name --}}
              <div class="name-stacked">
                  <h4 style="margin:0" class="attribute-name box-title"><input name="system.resources.{{name}}.label" type="text" value="{{label}}" placeholder="{{placeholder}}" /></h4>
              </div>

              {{!-- Info --}}
              <div class="info">
                  <div class="primary">
                      {{!-- Legacy Resources --}}
                      {{#if @root.actor.isOwner}}
                      <input type="text" class="uninput value" value="{{ value }}"
                              data-dtype="Number" name="system.resources.{{name}}.value" inputmode="numeric"
                              placeholder="0">
                      {{else}}
                      <span class="value">{{ value }}</span>
                      {{/if}}
                      <span class="separator">&sol;</span>
                      {{#if @root.actor.isOwner}}
                      <input type="text" class="uninput max" value="{{ max }}"
                              data-dtype="Number" name="system.resources.{{name}}.max" inputmode="numeric"
                              placeholder="0">
                      {{else}}
                      <span class="max">{{ max }}</span>
                      {{/if}}
                  </div>
                  <div class="secondary">
                  </div>
              </div>
            </li>
          {{/each}}
          </ul>
          `)
          /// end custom

          const compiled = Handlebars.compile(resp.html);
          Handlebars.registerPartial(id ?? path, compiled);
          Handlebars.partials[path] = compiled;
          console.log(`Foundry VTT | Retrieved and compiled template ${path}`);
          resolve(compiled);
        });
      });
    }
    return Handlebars.partials[path];
}

  initialized = true;
}
