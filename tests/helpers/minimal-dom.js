/**
 * Sets document.body.innerHTML with ALL elements that scripts query at parse time.
 * Mirrors the structure of main.html so IIFEs that run document.getElementById()
 * or querySelectorAll() on load don't crash.
 */
export function setupMinimalDOM() {
  document.body.innerHTML = `
    <!-- Toast Container -->
    <div id="toast-container"></div>

    <!-- Menu Bar -->
    <div id="menu-bar">
      <div id="menu-left">
        <button id="btn-settings" class="menu-btn" title="Settings" data-i18n-title="menu.settings"></button>
        <button id="btn-new-module" class="menu-btn" title="New Module" data-i18n-title="menu.newModuleTitle">
          <span class="mode-label" data-i18n="menu.newModule">New Module</span>
        </button>
      </div>
      <div id="menu-right">
        <div id="mode-switcher">
          <button id="btn-mode-edit" class="menu-btn mode-seg-btn active" title="Edit Mode">
            <span class="mode-label" data-i18n="menu.edit">Edit</span>
          </button>
          <button id="btn-mode-play" class="menu-btn mode-seg-btn" title="Play Mode">
            <span class="mode-label" data-i18n="menu.play">Play</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div id="content">
      <div id="module-grid">
        <div id="empty-state" class="empty-state">
          <span data-i18n="empty.message" data-i18n-html>Click <strong>New Module</strong> to get started</span>
        </div>
      </div>
    </div>

    <!-- Settings Overlay -->
    <div id="settings-overlay" class="settings-overlay" aria-hidden="true">
      <div class="settings-panel">
        <div class="settings-header">
          <h2 class="settings-title" data-i18n="settings.title">Settings</h2>
          <button id="btn-settings-close" class="menu-btn" title="Close Settings" data-i18n-title="settings.close"></button>
        </div>
        <div class="settings-body">
          <!-- Language -->
          <div class="settings-section">
            <label class="settings-label" for="setting-language" data-i18n="settings.language">Language</label>
            <select id="setting-language" class="settings-select">
              <option value="en">English</option>
              <option value="es">Espanol</option>
            </select>
          </div>

          <!-- Theme -->
          <div class="settings-section">
            <label class="settings-label" data-i18n="settings.theme">Theme</label>
            <div class="settings-toggle-group settings-theme-grid">
              <button id="btn-theme-dark" class="settings-toggle-btn active" data-i18n="settings.themeDark">Dark</button>
              <button id="btn-theme-light" class="settings-toggle-btn" data-i18n="settings.themeLight">Light</button>
              <button id="btn-theme-cyberpunk" class="settings-toggle-btn" data-i18n="settings.themeCyberpunk">Cyberpunk</button>
              <button id="btn-theme-scifi" class="settings-toggle-btn" data-i18n="settings.themeSciFi">Sci-Fi</button>
              <button id="btn-theme-angelic" class="settings-toggle-btn" data-i18n="settings.themeAngelic">Angelic</button>
              <button id="btn-theme-demonic" class="settings-toggle-btn" data-i18n="settings.themeDemonic">Demonic</button>
            </div>
          </div>

          <!-- Save / Load -->
          <div class="settings-section">
            <label class="settings-label" data-i18n="settings.saveLoad">Save / Load</label>
            <div class="settings-btn-row">
              <button id="btn-save" class="settings-action-btn btn-primary" data-i18n="settings.save">Save</button>
              <button id="btn-load" class="settings-action-btn btn-primary" data-i18n="settings.load">Load</button>
            </div>
            <div class="settings-checkbox-row">
              <input type="checkbox" id="chk-auto-save">
              <label for="chk-auto-save" data-i18n="settings.autoSave">Save automatically</label>
              <span class="settings-tooltip" data-tip="Save after every change." data-i18n-tip="settings.autoSaveTip">?</span>
            </div>
            <div class="settings-checkbox-row">
              <input type="checkbox" id="chk-auto-load">
              <label for="chk-auto-load" data-i18n="settings.autoLoad">Load automatically</label>
              <span class="settings-tooltip" data-tip="Auto-load on enter." data-i18n-tip="settings.autoLoadTip">?</span>
            </div>
          </div>

          <!-- Troubleshooting -->
          <div class="settings-section">
            <label class="settings-label" data-i18n="settings.troubleshooting">Troubleshooting</label>
            <button id="btn-force-reload" class="settings-action-btn btn-primary settings-action-btn--warning" data-i18n="settings.forceReload">Force Reload</button>
            <div id="window-dimensions" class="settings-dimensions"></div>
          </div>

          <!-- Links -->
          <div class="settings-section settings-links">
            <button id="btn-github-link" class="settings-link" title="GitHub Repository" data-i18n="settings.github" data-i18n-title="settings.githubTitle">
              GitHub
            </button>
          </div>
        </div>
        <div class="settings-footer">
          <span class="settings-version">v0.1</span>
        </div>
      </div>
    </div>

    <!-- New Module Wizard Overlay -->
    <div id="wizard-overlay" class="wizard-overlay" aria-hidden="true">
      <div class="wizard-panel">
        <div class="wizard-header">
          <h2 class="wizard-title" data-i18n="wizard.title">New Module</h2>
          <button id="btn-wizard-close" class="menu-btn" title="Close" data-i18n-title="wizard.close"></button>
        </div>
        <div class="wizard-body">
          <!-- Type Selection -->
          <div class="wizard-section">
            <label class="wizard-label" data-i18n="wizard.type">Type</label>
            <div class="wizard-type-grid">
              <div class="wizard-type-card" data-type="abilities"><span class="wizard-type-name" data-i18n="type.abilities">Abilities</span></div>
              <div class="wizard-type-card" data-type="counters"><span class="wizard-type-name" data-i18n="type.counters">Counters</span></div>
              <div class="wizard-type-card" data-type="condition"><span class="wizard-type-name" data-i18n="type.condition">Conditions</span></div>
              <div class="wizard-type-card" data-type="health"><span class="wizard-type-name" data-i18n="type.health">Health</span></div>
              <div class="wizard-type-card" data-type="hline"><span class="wizard-type-name" data-i18n="type.hline">Horizontal Line</span></div>
              <div class="wizard-type-card" data-type="list"><span class="wizard-type-name" data-i18n="type.list">List</span></div>
              <div class="wizard-type-card" data-type="resistance"><span class="wizard-type-name" data-i18n="type.resistance">Resistances</span></div>
              <div class="wizard-type-card" data-type="savingthrow"><span class="wizard-type-name" data-i18n="type.savingthrow">Saving Throws</span></div>
              <div class="wizard-type-card" data-type="spacer"><span class="wizard-type-name" data-i18n="type.spacer">Spacer</span></div>
              <div class="wizard-type-card" data-type="stat"><span class="wizard-type-name" data-i18n="type.stat">Stat</span></div>
              <div class="wizard-type-card" data-type="text"><span class="wizard-type-name" data-i18n="type.text">Text Box</span></div>
            </div>
          </div>

          <!-- Module Theme -->
          <div id="wizard-theme-section" class="wizard-section">
            <label class="wizard-label" data-i18n="wizard.moduleTheme">Module Theme</label>
            <div class="wizard-color-row">
              <button class="wizard-swatch wizard-swatch-default selected" data-color="" title="Default" data-i18n-title="wizard.swatchDefault"></button>
              <button class="wizard-swatch" data-color="#8B2020" style="background-color: #8B2020;" title="Crimson" data-i18n-title="wizard.swatchCrimson"></button>
              <button class="wizard-swatch wizard-swatch-custom" data-color="custom" title="Custom Color" data-i18n-title="wizard.swatchCustom">#</button>
            </div>
            <div class="wizard-hex-row">
              <input type="text" class="wizard-custom-hex" id="wizard-custom-hex" placeholder="#000000" maxlength="7" spellcheck="false">
            </div>
          </div>

          <!-- Abilities Template -->
          <div id="wizard-abilities-template" class="wizard-stat-template">
            <label class="wizard-label" data-i18n="abilities.templateLabel">Template</label>
            <div class="cv-select" id="wizard-abilities-template-select">
              <button type="button" class="cv-select-trigger" aria-haspopup="listbox" aria-expanded="false">
                <span class="cv-select-value" data-i18n="abilities.templateNone">None (blank)</span>
              </button>
              <ul class="cv-select-menu" role="listbox">
                <li class="cv-select-option selected" data-value="" role="option" data-i18n="abilities.templateNone">None (blank)</li>
                <li class="cv-select-option" data-value="dnd5e" role="option">D&amp;D 5e</li>
              </ul>
            </div>
          </div>

          <!-- Stat Layout Sub-Option -->
          <div id="wizard-stat-layout" class="wizard-stat-layout">
            <label class="wizard-label" data-i18n="stat.layoutLabel">Layout</label>
            <div class="wizard-layout-row">
              <button class="wizard-layout-btn selected" data-layout="large-stat">
                <span class="wizard-layout-label" data-i18n="stat.largeStat">Large Stat</span>
              </button>
              <button class="wizard-layout-btn" data-layout="large-modifier">
                <span class="wizard-layout-label" data-i18n="stat.largeModifier">Large Modifier</span>
              </button>
            </div>
          </div>

          <!-- Stat Template -->
          <div id="wizard-stat-template" class="wizard-stat-template">
            <label class="wizard-label" data-i18n="stat.templateLabel">Template</label>
            <div class="cv-select" id="wizard-stat-template-select">
              <button type="button" class="cv-select-trigger" aria-haspopup="listbox" aria-expanded="false">
                <span class="cv-select-value" data-i18n="stat.templateNone">None (blank)</span>
              </button>
              <ul class="cv-select-menu" role="listbox">
                <li class="cv-select-option selected" data-value="" role="option" data-i18n="stat.templateNone">None (blank)</li>
                <li class="cv-select-option" data-value="dnd5e" role="option">D&amp;D 5e</li>
              </ul>
            </div>
          </div>

          <!-- Saving Throw Template -->
          <div id="wizard-savingthrow-template" class="wizard-stat-template">
            <label class="wizard-label" data-i18n="save.templateLabel">Template</label>
            <div class="cv-select" id="wizard-savingthrow-template-select">
              <button type="button" class="cv-select-trigger" aria-haspopup="listbox" aria-expanded="false">
                <span class="cv-select-value" data-i18n="save.templateNone">None (blank)</span>
              </button>
              <ul class="cv-select-menu" role="listbox">
                <li class="cv-select-option selected" data-value="" role="option" data-i18n="save.templateNone">None (blank)</li>
                <li class="cv-select-option" data-value="dnd5e" role="option">D&amp;D 5e</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="wizard-footer">
          <button id="btn-wizard-cancel" class="wizard-btn-cancel btn-secondary" data-i18n="wizard.cancel">Cancel</button>
          <button id="btn-wizard-create" class="wizard-btn-create btn-primary wide" data-i18n="wizard.addModule">Add Module</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div id="delete-confirm-overlay" class="delete-confirm-overlay" aria-hidden="true">
      <div class="delete-confirm-panel">
        <div class="delete-confirm-title" data-i18n="delete.title">Delete Module</div>
        <div class="delete-confirm-msg" data-i18n="delete.message">Are you sure? This cannot be undone.</div>
        <div class="delete-confirm-actions">
          <button id="btn-delete-cancel" class="delete-confirm-cancel" data-i18n="delete.cancel">Cancel</button>
          <button id="btn-delete-confirm" class="delete-confirm-delete" data-i18n="delete.confirm">Delete</button>
        </div>
      </div>
    </div>

    <!-- List Item Inspect Overlay -->
    <div id="list-inspect-overlay" class="list-inspect-overlay" aria-hidden="true">
      <div id="list-inspect-panel" class="list-inspect-panel"></div>
    </div>
  `;
}
