// ── Condition Module ──
// Track character conditions with game-system templates, toggle/value types, and cascading sub-conditions.
(function () {
    'use strict';

    // ── Content Shape Guard ──
    function ensureCondContent(data) {
        if (!data.content || typeof data.content === 'string') {
            data.content = {
                template: 'custom',
                applied: [],
                staging: [],
                customConditions: [],
                sortBy: null,
                sortDir: 'asc',
            };
        }
        if (!data.content.template) data.content.template = 'custom';
        if (!Array.isArray(data.content.applied)) data.content.applied = [];
        if (!Array.isArray(data.content.staging)) data.content.staging = [];
        if (!Array.isArray(data.content.customConditions)) data.content.customConditions = [];
        if (!Array.isArray(data.content.savedCustomInstances)) data.content.savedCustomInstances = [];
        if (data.content.sortBy === undefined) data.content.sortBy = null;
        if (!data.content.sortDir) data.content.sortDir = 'asc';
        return data.content;
    }

    // ── Condition Icon Names ──
    // These names resolve through cvIcon(); CONDITION_ICON_ALIAS below routes a few
    // that collide with existing filled RPG icon keys to a stroke-style variant so
    // they stay visually consistent with the rest of this picker.
    const CONDITION_ICON_NAMES = [
        'eye-off',
        'heart',
        'ear-off',
        'zap-off',
        'ghost',
        'grab',
        'lock',
        'eye',
        'shield',
        'gem',
        'skull',
        'arrow-down',
        'chain',
        'star',
        'moon',
        'brain',
        'flame',
        'droplet',
        'target',
        'alert',
        'sword',
        'wind',
        'thermometer',
        'radioactive',
        'syringe',
        'crosshair',
        'shield-off',
        'cloud',
        'x-circle',
        'zap',
        'activity',
        'anchor',
        'slash',
        'clock',
        'frown',
    ];
    const CONDITION_ICON_ALIAS = {
        shield: 'shield-outline',
        brain: 'brain-outline',
        flame: 'flame-outline',
        crosshair: 'crosshair-outline',
        radioactive: 'radioactive-outline',
    };
    function condIcon(name, size) {
        return cvIcon(CONDITION_ICON_ALIAS[name] || name, size);
    }
    // ── Condition Templates ──
    const CONDITION_TEMPLATES = {
        // -- D&D 5e Template (keywords: D&D5e, DND5e, 5e) -- //
        dnd5e: {
            nameKey: 'cond.templateDnd5e',
            conditions: [
                {
                    key: 'dnd5e_blinded',
                    nameKey: 'cond.dnd5e.blinded',
                    icon: 'eye-off',
                    type: 'toggle',
                    descKey: 'cond.dnd5e.blindedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dnd5e_charmed',
                    nameKey: 'cond.dnd5e.charmed',
                    icon: 'heart',
                    type: 'toggle',
                    descKey: 'cond.dnd5e.charmedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dnd5e_deafened',
                    nameKey: 'cond.dnd5e.deafened',
                    icon: 'ear-off',
                    type: 'toggle',
                    descKey: 'cond.dnd5e.deafenedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dnd5e_exhaustion',
                    nameKey: 'cond.dnd5e.exhaustion',
                    icon: 'zap-off',
                    type: 'value',
                    descKey: 'cond.dnd5e.exhaustionDesc',
                    maxValue: 6,
                    subconditions: [],
                },
                {
                    key: 'dnd5e_frightened',
                    nameKey: 'cond.dnd5e.frightened',
                    icon: 'ghost',
                    type: 'toggle',
                    descKey: 'cond.dnd5e.frightenedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dnd5e_grappled',
                    nameKey: 'cond.dnd5e.grappled',
                    icon: 'grab',
                    type: 'toggle',
                    descKey: 'cond.dnd5e.grappledDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dnd5e_incapacitated',
                    nameKey: 'cond.dnd5e.incapacitated',
                    icon: 'lock',
                    type: 'toggle',
                    descKey: 'cond.dnd5e.incapacitatedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dnd5e_invisible',
                    nameKey: 'cond.dnd5e.invisible',
                    icon: 'eye',
                    type: 'toggle',
                    descKey: 'cond.dnd5e.invisibleDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dnd5e_paralyzed',
                    nameKey: 'cond.dnd5e.paralyzed',
                    icon: 'shield',
                    type: 'toggle',
                    descKey: 'cond.dnd5e.paralyzedDesc',
                    maxValue: null,
                    subconditions: ['dnd5e_incapacitated'],
                },
                {
                    key: 'dnd5e_petrified',
                    nameKey: 'cond.dnd5e.petrified',
                    icon: 'gem',
                    type: 'toggle',
                    descKey: 'cond.dnd5e.petrifiedDesc',
                    maxValue: null,
                    subconditions: ['dnd5e_incapacitated'],
                },
                {
                    key: 'dnd5e_poisoned',
                    nameKey: 'cond.dnd5e.poisoned',
                    icon: 'skull',
                    type: 'toggle',
                    descKey: 'cond.dnd5e.poisonedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dnd5e_prone',
                    nameKey: 'cond.dnd5e.prone',
                    icon: 'arrow-down',
                    type: 'toggle',
                    descKey: 'cond.dnd5e.proneDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dnd5e_restrained',
                    nameKey: 'cond.dnd5e.restrained',
                    icon: 'chain',
                    type: 'toggle',
                    descKey: 'cond.dnd5e.restrainedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dnd5e_stunned',
                    nameKey: 'cond.dnd5e.stunned',
                    icon: 'star',
                    type: 'toggle',
                    descKey: 'cond.dnd5e.stunnedDesc',
                    maxValue: null,
                    subconditions: ['dnd5e_incapacitated'],
                },
                {
                    key: 'dnd5e_unconscious',
                    nameKey: 'cond.dnd5e.unconscious',
                    icon: 'moon',
                    type: 'toggle',
                    descKey: 'cond.dnd5e.unconsciousDesc',
                    maxValue: null,
                    subconditions: ['dnd5e_incapacitated', 'dnd5e_prone'],
                },
            ],
        },
        // -- Pathfinder 2e Template (keywords: PF2e, 2e) --//
        pf2e: {
            nameKey: 'cond.templatePf2e',
            conditions: [
                {
                    key: 'pf2e_blinded',
                    nameKey: 'cond.pf2e.blinded',
                    icon: 'eye-off',
                    type: 'toggle',
                    descKey: 'cond.pf2e.blindedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'pf2e_clumsy',
                    nameKey: 'cond.pf2e.clumsy',
                    icon: 'frown',
                    type: 'value',
                    descKey: 'cond.pf2e.clumsyDesc',
                    maxValue: 4,
                    subconditions: [],
                },
                {
                    key: 'pf2e_concealed',
                    nameKey: 'cond.pf2e.concealed',
                    icon: 'cloud',
                    type: 'toggle',
                    descKey: 'cond.pf2e.concealedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'pf2e_confused',
                    nameKey: 'cond.pf2e.confused',
                    icon: 'brain',
                    type: 'toggle',
                    descKey: 'cond.pf2e.confusedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'pf2e_controlled',
                    nameKey: 'cond.pf2e.controlled',
                    icon: 'anchor',
                    type: 'toggle',
                    descKey: 'cond.pf2e.controlledDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'pf2e_dazzled',
                    nameKey: 'cond.pf2e.dazzled',
                    icon: 'star',
                    type: 'toggle',
                    descKey: 'cond.pf2e.dazzledDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'pf2e_deafened',
                    nameKey: 'cond.pf2e.deafened',
                    icon: 'ear-off',
                    type: 'toggle',
                    descKey: 'cond.pf2e.deafenedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'pf2e_dying',
                    nameKey: 'cond.pf2e.dying',
                    icon: 'x-circle',
                    type: 'value',
                    descKey: 'cond.pf2e.dyingDesc',
                    maxValue: 4,
                    subconditions: ['pf2e_unconscious'],
                },
                {
                    key: 'pf2e_fascinated',
                    nameKey: 'cond.pf2e.fascinated',
                    icon: 'heart',
                    type: 'toggle',
                    descKey: 'cond.pf2e.fascinatedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'pf2e_fatigued',
                    nameKey: 'cond.pf2e.fatigued',
                    icon: 'zap-off',
                    type: 'toggle',
                    descKey: 'cond.pf2e.fatiguedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'pf2e_fleeing',
                    nameKey: 'cond.pf2e.fleeing',
                    icon: 'ghost',
                    type: 'toggle',
                    descKey: 'cond.pf2e.fleeingDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'pf2e_grabbed',
                    nameKey: 'cond.pf2e.grabbed',
                    icon: 'grab',
                    type: 'toggle',
                    descKey: 'cond.pf2e.grabbedDesc',
                    maxValue: null,
                    subconditions: ['pf2e_offguard', 'pf2e_immobilized'],
                },
                {
                    key: 'pf2e_hidden',
                    nameKey: 'cond.pf2e.hidden',
                    icon: 'eye',
                    type: 'toggle',
                    descKey: 'cond.pf2e.hiddenDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'pf2e_offguard',
                    nameKey: 'cond.pf2e.offguard',
                    icon: 'shield-off',
                    type: 'toggle',
                    descKey: 'cond.pf2e.offguardDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'pf2e_immobilized',
                    nameKey: 'cond.pf2e.immobilized',
                    icon: 'anchor',
                    type: 'toggle',
                    descKey: 'cond.pf2e.immobilizedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'pf2e_impaired',
                    nameKey: 'cond.pf2e.impaired',
                    icon: 'slash',
                    type: 'toggle',
                    descKey: 'cond.pf2e.impairedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'pf2e_invisible',
                    nameKey: 'cond.pf2e.invisible',
                    icon: 'eye',
                    type: 'toggle',
                    descKey: 'cond.pf2e.invisibleDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'pf2e_paralyzed',
                    nameKey: 'cond.pf2e.paralyzed',
                    icon: 'shield',
                    type: 'toggle',
                    descKey: 'cond.pf2e.paralyzedDesc',
                    maxValue: null,
                    subconditions: ['pf2e_offguard', 'pf2e_immobilized', 'pf2e_incapacitated'],
                },
                {
                    key: 'pf2e_incapacitated',
                    nameKey: 'cond.pf2e.incapacitated',
                    icon: 'lock',
                    type: 'toggle',
                    descKey: 'cond.pf2e.incapacitatedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'pf2e_petrified',
                    nameKey: 'cond.pf2e.petrified',
                    icon: 'gem',
                    type: 'toggle',
                    descKey: 'cond.pf2e.petrifiedDesc',
                    maxValue: null,
                    subconditions: ['pf2e_offguard', 'pf2e_immobilized', 'pf2e_incapacitated'],
                },
                {
                    key: 'pf2e_prone',
                    nameKey: 'cond.pf2e.prone',
                    icon: 'arrow-down',
                    type: 'toggle',
                    descKey: 'cond.pf2e.proneDesc',
                    maxValue: null,
                    subconditions: ['pf2e_offguard'],
                },
                {
                    key: 'pf2e_restrained',
                    nameKey: 'cond.pf2e.restrained',
                    icon: 'chain',
                    type: 'toggle',
                    descKey: 'cond.pf2e.restrainedDesc',
                    maxValue: null,
                    subconditions: ['pf2e_offguard', 'pf2e_immobilized', 'pf2e_incapacitated'],
                },
                {
                    key: 'pf2e_sickened',
                    nameKey: 'cond.pf2e.sickened',
                    icon: 'frown',
                    type: 'value',
                    descKey: 'cond.pf2e.sickenedDesc',
                    maxValue: 4,
                    subconditions: [],
                },
                {
                    key: 'pf2e_slowed',
                    nameKey: 'cond.pf2e.slowed',
                    icon: 'clock',
                    type: 'value',
                    descKey: 'cond.pf2e.slowedDesc',
                    maxValue: 4,
                    subconditions: [],
                },
                {
                    key: 'pf2e_stunned',
                    nameKey: 'cond.pf2e.stunned',
                    icon: 'star',
                    type: 'value',
                    descKey: 'cond.pf2e.stunnedDesc',
                    maxValue: 4,
                    subconditions: [],
                },
                {
                    key: 'pf2e_stupefied',
                    nameKey: 'cond.pf2e.stupefied',
                    icon: 'brain',
                    type: 'value',
                    descKey: 'cond.pf2e.stupefiedDesc',
                    maxValue: 4,
                    subconditions: [],
                },
                {
                    key: 'pf2e_unconscious',
                    nameKey: 'cond.pf2e.unconscious',
                    icon: 'moon',
                    type: 'toggle',
                    descKey: 'cond.pf2e.unconsciousDesc',
                    maxValue: null,
                    subconditions: ['pf2e_offguard', 'pf2e_blinded', 'pf2e_prone'],
                },
            ],
        },
        // -- Call of Cthulu Template (keywords: CoC, Cthulu) --//
        coc: {
            nameKey: 'cond.templateCoc',
            conditions: [
                {
                    key: 'coc_majorwound',
                    nameKey: 'cond.coc.majorwound',
                    icon: 'activity',
                    type: 'toggle',
                    descKey: 'cond.coc.majorwoundDesc',
                    maxValue: null,
                    subconditions: ['coc_prone'],
                },
                {
                    key: 'coc_unconscious',
                    nameKey: 'cond.coc.unconscious',
                    icon: 'moon',
                    type: 'toggle',
                    descKey: 'cond.coc.unconsciousDesc',
                    maxValue: null,
                    subconditions: ['coc_prone'],
                },
                {
                    key: 'coc_dying',
                    nameKey: 'cond.coc.dying',
                    icon: 'x-circle',
                    type: 'toggle',
                    descKey: 'cond.coc.dyingDesc',
                    maxValue: null,
                    subconditions: ['coc_unconscious'],
                },
                {
                    key: 'coc_prone',
                    nameKey: 'cond.coc.prone',
                    icon: 'arrow-down',
                    type: 'toggle',
                    descKey: 'cond.coc.proneDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'coc_incapacitated',
                    nameKey: 'cond.coc.incapacitated',
                    icon: 'lock',
                    type: 'toggle',
                    descKey: 'cond.coc.incapacitatedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'coc_boutofmadness',
                    nameKey: 'cond.coc.boutofmadness',
                    icon: 'brain',
                    type: 'toggle',
                    descKey: 'cond.coc.boutofmadnessDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'coc_tempinsanity',
                    nameKey: 'cond.coc.tempinsanity',
                    icon: 'brain',
                    type: 'toggle',
                    descKey: 'cond.coc.tempinsanityDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'coc_indefinsanity',
                    nameKey: 'cond.coc.indefinsanity',
                    icon: 'brain',
                    type: 'toggle',
                    descKey: 'cond.coc.indefinsanityDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'coc_perminsane',
                    nameKey: 'cond.coc.perminsane',
                    icon: 'brain',
                    type: 'toggle',
                    descKey: 'cond.coc.perminsaneDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'coc_amnesia',
                    nameKey: 'cond.coc.amnesia',
                    icon: 'cloud',
                    type: 'toggle',
                    descKey: 'cond.coc.amnesiaDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'coc_phobia',
                    nameKey: 'cond.coc.phobia',
                    icon: 'ghost',
                    type: 'toggle',
                    descKey: 'cond.coc.phobiaDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'coc_mania',
                    nameKey: 'cond.coc.mania',
                    icon: 'zap',
                    type: 'toggle',
                    descKey: 'cond.coc.maniaDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'coc_paranoia',
                    nameKey: 'cond.coc.paranoia',
                    icon: 'eye',
                    type: 'toggle',
                    descKey: 'cond.coc.paranoiaDesc',
                    maxValue: null,
                    subconditions: [],
                },
            ],
        },
        // -- Vampire: The Masquerade Template (keywords: VTM, VtM) --//
        vtm: {
            nameKey: 'cond.templateVtm',
            conditions: [
                {
                    key: 'vtm_hunger',
                    nameKey: 'cond.vtm.hunger',
                    icon: 'droplet',
                    type: 'value',
                    descKey: 'cond.vtm.hungerDesc',
                    maxValue: 5,
                    subconditions: [],
                },
                {
                    key: 'vtm_impaired',
                    nameKey: 'cond.vtm.impaired',
                    icon: 'slash',
                    type: 'toggle',
                    descKey: 'cond.vtm.impairedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'vtm_bloodbound',
                    nameKey: 'cond.vtm.bloodbound',
                    icon: 'chain',
                    type: 'toggle',
                    descKey: 'cond.vtm.bloodboundDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'vtm_frenzy',
                    nameKey: 'cond.vtm.frenzy',
                    icon: 'flame',
                    type: 'toggle',
                    descKey: 'cond.vtm.frenzyDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'vtm_rotschreck',
                    nameKey: 'cond.vtm.rotschreck',
                    icon: 'ghost',
                    type: 'toggle',
                    descKey: 'cond.vtm.rotschreckDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'vtm_torpor',
                    nameKey: 'cond.vtm.torpor',
                    icon: 'moon',
                    type: 'toggle',
                    descKey: 'cond.vtm.torporDesc',
                    maxValue: null,
                    subconditions: ['vtm_incapacitated'],
                },
                {
                    key: 'vtm_incapacitated',
                    nameKey: 'cond.vtm.incapacitated',
                    icon: 'lock',
                    type: 'toggle',
                    descKey: 'cond.vtm.incapacitatedDesc',
                    maxValue: null,
                    subconditions: ['vtm_impaired'],
                },
                {
                    key: 'vtm_finaldeath',
                    nameKey: 'cond.vtm.finaldeath',
                    icon: 'skull',
                    type: 'toggle',
                    descKey: 'cond.vtm.finaldeathDesc',
                    maxValue: null,
                    subconditions: ['vtm_incapacitated'],
                },
                {
                    key: 'vtm_compulsion',
                    nameKey: 'cond.vtm.compulsion',
                    icon: 'brain',
                    type: 'toggle',
                    descKey: 'cond.vtm.compulsionDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'vtm_messycritical',
                    nameKey: 'cond.vtm.messycritical',
                    icon: 'alert',
                    type: 'toggle',
                    descKey: 'cond.vtm.messycriticalDesc',
                    maxValue: null,
                    subconditions: ['vtm_compulsion'],
                },
                {
                    key: 'vtm_bestialfailure',
                    nameKey: 'cond.vtm.bestialfailure',
                    icon: 'alert',
                    type: 'toggle',
                    descKey: 'cond.vtm.bestialfailureDesc',
                    maxValue: null,
                    subconditions: ['vtm_compulsion'],
                },
                {
                    key: 'vtm_stains',
                    nameKey: 'cond.vtm.stains',
                    icon: 'droplet',
                    type: 'value',
                    descKey: 'cond.vtm.stainsDesc',
                    maxValue: 10,
                    subconditions: [],
                },
            ],
        },
        // -- CyberPunk Red Tempalte (keywords: CP, CPRED, CPR) --//
        cpred: {
            nameKey: 'cond.templateCpred',
            conditions: [
                // Base conditions
                {
                    key: 'cpred_blinded',
                    nameKey: 'cond.cpred.blinded',
                    icon: 'eye-off',
                    type: 'toggle',
                    descKey: 'cond.cpred.blindedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_deafened',
                    nameKey: 'cond.cpred.deafened',
                    icon: 'ear-off',
                    type: 'toggle',
                    descKey: 'cond.cpred.deafenedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_grabbed',
                    nameKey: 'cond.cpred.grabbed',
                    icon: 'grab',
                    type: 'toggle',
                    descKey: 'cond.cpred.grabbedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_onfire',
                    nameKey: 'cond.cpred.onfire',
                    icon: 'flame',
                    type: 'toggle',
                    descKey: 'cond.cpred.onfireDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_poisoned',
                    nameKey: 'cond.cpred.poisoned',
                    icon: 'skull',
                    type: 'toggle',
                    descKey: 'cond.cpred.poisonedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_prone',
                    nameKey: 'cond.cpred.prone',
                    icon: 'arrow-down',
                    type: 'toggle',
                    descKey: 'cond.cpred.proneDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_restrained',
                    nameKey: 'cond.cpred.restrained',
                    icon: 'chain',
                    type: 'toggle',
                    descKey: 'cond.cpred.restrainedDesc',
                    maxValue: null,
                    subconditions: ['cpred_grabbed'],
                },
                {
                    key: 'cpred_stunned',
                    nameKey: 'cond.cpred.stunned',
                    icon: 'star',
                    type: 'toggle',
                    descKey: 'cond.cpred.stunnedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_unconscious',
                    nameKey: 'cond.cpred.unconscious',
                    icon: 'moon',
                    type: 'toggle',
                    descKey: 'cond.cpred.unconsciousDesc',
                    maxValue: null,
                    subconditions: ['cpred_prone'],
                },
                {
                    key: 'cpred_dying',
                    nameKey: 'cond.cpred.dying',
                    icon: 'x-circle',
                    type: 'toggle',
                    descKey: 'cond.cpred.dyingDesc',
                    maxValue: null,
                    subconditions: ['cpred_unconscious'],
                },
                // Critical Injuries — Head
                {
                    key: 'cpred_braininjury',
                    nameKey: 'cond.cpred.braininjury',
                    icon: 'brain',
                    type: 'toggle',
                    descKey: 'cond.cpred.braininjuryDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_brokenjaw',
                    nameKey: 'cond.cpred.brokenjaw',
                    icon: 'alert',
                    type: 'toggle',
                    descKey: 'cond.cpred.brokenjawDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_concussion',
                    nameKey: 'cond.cpred.concussion',
                    icon: 'brain',
                    type: 'toggle',
                    descKey: 'cond.cpred.concussionDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_crackedskull',
                    nameKey: 'cond.cpred.crackedskull',
                    icon: 'skull',
                    type: 'toggle',
                    descKey: 'cond.cpred.crackedskullDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_crushedwindpipe',
                    nameKey: 'cond.cpred.crushedwindpipe',
                    icon: 'alert',
                    type: 'toggle',
                    descKey: 'cond.cpred.crushedwindpipeDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_damagedeye',
                    nameKey: 'cond.cpred.damagedeye',
                    icon: 'eye-off',
                    type: 'toggle',
                    descKey: 'cond.cpred.damagedeyeDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_damagedear',
                    nameKey: 'cond.cpred.damagedear',
                    icon: 'ear-off',
                    type: 'toggle',
                    descKey: 'cond.cpred.damagedearDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_destroyedeye',
                    nameKey: 'cond.cpred.destroyedeye',
                    icon: 'eye-off',
                    type: 'toggle',
                    descKey: 'cond.cpred.destroyedeyeDesc',
                    maxValue: null,
                    subconditions: ['cpred_blinded'],
                },
                {
                    key: 'cpred_lostear',
                    nameKey: 'cond.cpred.lostear',
                    icon: 'ear-off',
                    type: 'toggle',
                    descKey: 'cond.cpred.lostearDesc',
                    maxValue: null,
                    subconditions: ['cpred_deafened'],
                },
                {
                    key: 'cpred_shatteredjaw',
                    nameKey: 'cond.cpred.shatteredjaw',
                    icon: 'alert',
                    type: 'toggle',
                    descKey: 'cond.cpred.shatteredjawDesc',
                    maxValue: null,
                    subconditions: [],
                },
                // Critical Injuries — Body
                {
                    key: 'cpred_brokenarm',
                    nameKey: 'cond.cpred.brokenarm',
                    icon: 'sword',
                    type: 'toggle',
                    descKey: 'cond.cpred.brokenarmDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_brokenleg',
                    nameKey: 'cond.cpred.brokenleg',
                    icon: 'sword',
                    type: 'toggle',
                    descKey: 'cond.cpred.brokenlegDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_brokenribs',
                    nameKey: 'cond.cpred.brokenribs',
                    icon: 'sword',
                    type: 'toggle',
                    descKey: 'cond.cpred.brokenribsDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_collapsedlung',
                    nameKey: 'cond.cpred.collapsedlung',
                    icon: 'wind',
                    type: 'toggle',
                    descKey: 'cond.cpred.collapsedlungDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_crushedfingers',
                    nameKey: 'cond.cpred.crushedfingers',
                    icon: 'grab',
                    type: 'toggle',
                    descKey: 'cond.cpred.crushedfingersDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_dislocshoulder',
                    nameKey: 'cond.cpred.dislocshoulder',
                    icon: 'sword',
                    type: 'toggle',
                    descKey: 'cond.cpred.dislocshoulderDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_dismemberedarm',
                    nameKey: 'cond.cpred.dismemberedarm',
                    icon: 'sword',
                    type: 'toggle',
                    descKey: 'cond.cpred.dismemberedarmDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_dismemberedhand',
                    nameKey: 'cond.cpred.dismemberedhand',
                    icon: 'grab',
                    type: 'toggle',
                    descKey: 'cond.cpred.dismemberedhandDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_dismemberedleg',
                    nameKey: 'cond.cpred.dismemberedleg',
                    icon: 'sword',
                    type: 'toggle',
                    descKey: 'cond.cpred.dismemberedlegDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_foreignobject',
                    nameKey: 'cond.cpred.foreignobject',
                    icon: 'alert',
                    type: 'toggle',
                    descKey: 'cond.cpred.foreignobjectDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_spinalinjury',
                    nameKey: 'cond.cpred.spinalinjury',
                    icon: 'alert',
                    type: 'toggle',
                    descKey: 'cond.cpred.spinalinjuryDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_suckingchest',
                    nameKey: 'cond.cpred.suckingchest',
                    icon: 'wind',
                    type: 'toggle',
                    descKey: 'cond.cpred.suckingchestDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'cpred_tornmuscle',
                    nameKey: 'cond.cpred.tornmuscle',
                    icon: 'sword',
                    type: 'toggle',
                    descKey: 'cond.cpred.tornmuscleDesc',
                    maxValue: null,
                    subconditions: [],
                },
            ],
        },
        // -- Mothership Template (keywords: MS) --//
        mothership: {
            nameKey: 'cond.templateMothership',
            conditions: [
                // General
                {
                    key: 'moth_stress',
                    nameKey: 'cond.moth.stress',
                    icon: 'activity',
                    type: 'value',
                    descKey: 'cond.moth.stressDesc',
                    maxValue: 20,
                    subconditions: [],
                },
                {
                    key: 'moth_wounded',
                    nameKey: 'cond.moth.wounded',
                    icon: 'droplet',
                    type: 'value',
                    descKey: 'cond.moth.woundedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_unconscious',
                    nameKey: 'cond.moth.unconscious',
                    icon: 'moon',
                    type: 'toggle',
                    descKey: 'cond.moth.unconsciousDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_panicked',
                    nameKey: 'cond.moth.panicked',
                    icon: 'alert',
                    type: 'toggle',
                    descKey: 'cond.moth.panickedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                // Panic Results
                {
                    key: 'moth_adrenalinerush',
                    nameKey: 'cond.moth.adrenalinerush',
                    icon: 'zap',
                    type: 'toggle',
                    descKey: 'cond.moth.adrenalinerushDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_anxious',
                    nameKey: 'cond.moth.anxious',
                    icon: 'frown',
                    type: 'toggle',
                    descKey: 'cond.moth.anxiousDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_overwhelmed',
                    nameKey: 'cond.moth.overwhelmed',
                    icon: 'cloud',
                    type: 'toggle',
                    descKey: 'cond.moth.overwhelmedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_cowardice',
                    nameKey: 'cond.moth.cowardice',
                    icon: 'ghost',
                    type: 'toggle',
                    descKey: 'cond.moth.cowardiceDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_hallucinations',
                    nameKey: 'cond.moth.hallucinations',
                    icon: 'eye',
                    type: 'toggle',
                    descKey: 'cond.moth.hallucinationsDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_phobia',
                    nameKey: 'cond.moth.phobia',
                    icon: 'ghost',
                    type: 'toggle',
                    descKey: 'cond.moth.phobiaDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_nightmares',
                    nameKey: 'cond.moth.nightmares',
                    icon: 'moon',
                    type: 'toggle',
                    descKey: 'cond.moth.nightmaresDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_lossconfidence',
                    nameKey: 'cond.moth.lossconfidence',
                    icon: 'frown',
                    type: 'toggle',
                    descKey: 'cond.moth.lossconfidenceDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_paranoid',
                    nameKey: 'cond.moth.paranoid',
                    icon: 'eye',
                    type: 'toggle',
                    descKey: 'cond.moth.paranoidDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_catatonic',
                    nameKey: 'cond.moth.catatonic',
                    icon: 'lock',
                    type: 'toggle',
                    descKey: 'cond.moth.catatonicDesc',
                    maxValue: null,
                    subconditions: ['moth_unconscious'],
                },
                {
                    key: 'moth_rage',
                    nameKey: 'cond.moth.rage',
                    icon: 'flame',
                    type: 'toggle',
                    descKey: 'cond.moth.rageDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_spiraling',
                    nameKey: 'cond.moth.spiraling',
                    icon: 'activity',
                    type: 'toggle',
                    descKey: 'cond.moth.spiralingDesc',
                    maxValue: null,
                    subconditions: [],
                },
                // Wounds
                {
                    key: 'moth_bleeding',
                    nameKey: 'cond.moth.bleeding',
                    icon: 'droplet',
                    type: 'toggle',
                    descKey: 'cond.moth.bleedingDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_broken',
                    nameKey: 'cond.moth.broken',
                    icon: 'sword',
                    type: 'toggle',
                    descKey: 'cond.moth.brokenDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_concussed',
                    nameKey: 'cond.moth.concussed',
                    icon: 'brain',
                    type: 'toggle',
                    descKey: 'cond.moth.concussedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                // Environmental
                {
                    key: 'moth_exhausted',
                    nameKey: 'cond.moth.exhausted',
                    icon: 'zap-off',
                    type: 'toggle',
                    descKey: 'cond.moth.exhaustedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_cryosick',
                    nameKey: 'cond.moth.cryosick',
                    icon: 'thermometer',
                    type: 'toggle',
                    descKey: 'cond.moth.cryosickDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_addicted',
                    nameKey: 'cond.moth.addicted',
                    icon: 'syringe',
                    type: 'toggle',
                    descKey: 'cond.moth.addictedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'moth_irradiated',
                    nameKey: 'cond.moth.irradiated',
                    icon: 'radioactive',
                    type: 'toggle',
                    descKey: 'cond.moth.irradiatedDesc',
                    maxValue: null,
                    subconditions: [],
                },
            ],
        },
        // -- Shadowrun 6e Template (keywords: SR, SR6) --//
        sr6: {
            nameKey: 'cond.templateSr6',
            conditions: [
                {
                    key: 'sr6_blinded',
                    nameKey: 'cond.sr6.blinded',
                    icon: 'eye-off',
                    type: 'toggle',
                    descKey: 'cond.sr6.blindedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_burning',
                    nameKey: 'cond.sr6.burning',
                    icon: 'flame',
                    type: 'toggle',
                    descKey: 'cond.sr6.burningDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_chilled',
                    nameKey: 'cond.sr6.chilled',
                    icon: 'thermometer',
                    type: 'toggle',
                    descKey: 'cond.sr6.chilledDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_confused',
                    nameKey: 'cond.sr6.confused',
                    icon: 'brain',
                    type: 'toggle',
                    descKey: 'cond.sr6.confusedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_corrosive',
                    nameKey: 'cond.sr6.corrosive',
                    icon: 'droplet',
                    type: 'toggle',
                    descKey: 'cond.sr6.corrosiveDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_dazed',
                    nameKey: 'cond.sr6.dazed',
                    icon: 'star',
                    type: 'toggle',
                    descKey: 'cond.sr6.dazedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_deafened',
                    nameKey: 'cond.sr6.deafened',
                    icon: 'ear-off',
                    type: 'toggle',
                    descKey: 'cond.sr6.deafenedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_fatigued',
                    nameKey: 'cond.sr6.fatigued',
                    icon: 'zap-off',
                    type: 'toggle',
                    descKey: 'cond.sr6.fatiguedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_frightened',
                    nameKey: 'cond.sr6.frightened',
                    icon: 'ghost',
                    type: 'toggle',
                    descKey: 'cond.sr6.frightenedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_heightened',
                    nameKey: 'cond.sr6.heightened',
                    icon: 'zap',
                    type: 'toggle',
                    descKey: 'cond.sr6.heightenedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_immobilized',
                    nameKey: 'cond.sr6.immobilized',
                    icon: 'anchor',
                    type: 'toggle',
                    descKey: 'cond.sr6.immobilizedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_invisible',
                    nameKey: 'cond.sr6.invisible',
                    icon: 'eye',
                    type: 'toggle',
                    descKey: 'cond.sr6.invisibleDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_nauseated',
                    nameKey: 'cond.sr6.nauseated',
                    icon: 'frown',
                    type: 'toggle',
                    descKey: 'cond.sr6.nauseatedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_panicked',
                    nameKey: 'cond.sr6.panicked',
                    icon: 'alert',
                    type: 'toggle',
                    descKey: 'cond.sr6.panickedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_paralyzed',
                    nameKey: 'cond.sr6.paralyzed',
                    icon: 'shield',
                    type: 'toggle',
                    descKey: 'cond.sr6.paralyzedDesc',
                    maxValue: null,
                    subconditions: ['sr6_immobilized'],
                },
                {
                    key: 'sr6_petrified',
                    nameKey: 'cond.sr6.petrified',
                    icon: 'gem',
                    type: 'toggle',
                    descKey: 'cond.sr6.petrifiedDesc',
                    maxValue: null,
                    subconditions: ['sr6_immobilized'],
                },
                {
                    key: 'sr6_poisoned',
                    nameKey: 'cond.sr6.poisoned',
                    icon: 'skull',
                    type: 'toggle',
                    descKey: 'cond.sr6.poisonedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_prone',
                    nameKey: 'cond.sr6.prone',
                    icon: 'arrow-down',
                    type: 'toggle',
                    descKey: 'cond.sr6.proneDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_silent',
                    nameKey: 'cond.sr6.silent',
                    icon: 'slash',
                    type: 'toggle',
                    descKey: 'cond.sr6.silentDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_stunned',
                    nameKey: 'cond.sr6.stunned',
                    icon: 'star',
                    type: 'toggle',
                    descKey: 'cond.sr6.stunnedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_unconscious',
                    nameKey: 'cond.sr6.unconscious',
                    icon: 'moon',
                    type: 'toggle',
                    descKey: 'cond.sr6.unconsciousDesc',
                    maxValue: null,
                    subconditions: ['sr6_prone'],
                },
                {
                    key: 'sr6_wet',
                    nameKey: 'cond.sr6.wet',
                    icon: 'droplet',
                    type: 'toggle',
                    descKey: 'cond.sr6.wetDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'sr6_zapped',
                    nameKey: 'cond.sr6.zapped',
                    icon: 'zap',
                    type: 'toggle',
                    descKey: 'cond.sr6.zappedDesc',
                    maxValue: null,
                    subconditions: [],
                },
            ],
        },
        // -- Daggerheart Template (keywords: DH) --//
        daggerheart: {
            nameKey: 'cond.templateDaggerheart',
            conditions: [
                {
                    key: 'dh_bleeding',
                    nameKey: 'cond.dh.bleeding',
                    icon: 'droplet',
                    type: 'toggle',
                    descKey: 'cond.dh.bleedingDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dh_fearful',
                    nameKey: 'cond.dh.fearful',
                    icon: 'ghost',
                    type: 'toggle',
                    descKey: 'cond.dh.fearfulDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dh_hidden',
                    nameKey: 'cond.dh.hidden',
                    icon: 'eye',
                    type: 'toggle',
                    descKey: 'cond.dh.hiddenDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dh_marked',
                    nameKey: 'cond.dh.marked',
                    icon: 'target',
                    type: 'toggle',
                    descKey: 'cond.dh.markedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dh_poisoned',
                    nameKey: 'cond.dh.poisoned',
                    icon: 'skull',
                    type: 'toggle',
                    descKey: 'cond.dh.poisonedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dh_restrained',
                    nameKey: 'cond.dh.restrained',
                    icon: 'chain',
                    type: 'toggle',
                    descKey: 'cond.dh.restrainedDesc',
                    maxValue: null,
                    subconditions: [],
                },
                {
                    key: 'dh_stunned',
                    nameKey: 'cond.dh.stunned',
                    icon: 'star',
                    type: 'toggle',
                    descKey: 'cond.dh.stunnedDesc',
                    maxValue: null,
                    subconditions: ['dh_restrained'],
                },
                {
                    key: 'dh_vulnerable',
                    nameKey: 'cond.dh.vulnerable',
                    icon: 'crosshair',
                    type: 'toggle',
                    descKey: 'cond.dh.vulnerableDesc',
                    maxValue: null,
                    subconditions: [],
                },
            ],
        },
        // -- Custom Game Template --//
        custom: {
            nameKey: 'cond.templateCustom',
            conditions: [],
        },
    };

    // Template Keys
    const TEMPLATE_KEYS = ['dnd5e', 'pf2e', 'coc', 'vtm', 'cpred', 'mothership', 'sr6', 'daggerheart', 'custom'];

    // ── Helpers ──

    function getTemplateDef(typeKey, templateKey) {
        const tpl = CONDITION_TEMPLATES[templateKey];
        if (!tpl) return null;
        return (
            tpl.conditions.find(function (c) {
                return c.key === typeKey;
            }) || null
        );
    }

    function getCondName(item, content) {
        // Check template first
        const def = getTemplateDef(item.typeKey, content.template);
        if (def) return t(def.nameKey);
        // Check custom conditions
        const custom = (content.customConditions || []).find(function (c) {
            return c.key === item.typeKey;
        });
        if (custom) return custom.name;
        return item.typeKey || '?';
    }

    function getCondIconSvg(item, content) {
        // Check template definition
        const def = getTemplateDef(item.typeKey, content.template);
        if (def && def.icon) return condIcon(def.icon);
        // Check custom
        const custom = (content.customConditions || []).find(function (c) {
            return c.key === item.typeKey;
        });
        if (custom && custom.icon) return condIcon(custom.icon);
        // Fallback
        return condIcon('alert');
    }

    function getCondDescription(item, content) {
        if (item.description) return item.description;
        const def = getTemplateDef(item.typeKey, content.template);
        if (def && def.descKey) return t(def.descKey);
        const custom = (content.customConditions || []).find(function (c) {
            return c.key === item.typeKey;
        });
        if (custom && custom.description) return custom.description;
        return '';
    }

    function getCondType(item, content) {
        if (item.type) return item.type;
        const def = getTemplateDef(item.typeKey, content.template);
        if (def) return def.type;
        return 'toggle';
    }

    function getCondMaxValue(item, content) {
        if (item.maxValue !== null && item.maxValue !== undefined) return item.maxValue;
        const def = getTemplateDef(item.typeKey, content.template);
        if (def) return def.maxValue;
        return null;
    }

    function sortAppliedList(applied, content) {
        if (!content.sortBy) return; // custom order — no auto-sort
        const dir = content.sortDir === 'desc' ? -1 : 1;
        if (content.sortBy === 'alpha') {
            applied.sort(function (a, b) {
                return dir * getCondName(a, content).localeCompare(getCondName(b, content));
            });
        } else if (content.sortBy === 'value') {
            applied.sort(function (a, b) {
                const av = getCondType(a, content) === 'value' ? a.value || 0 : a.active ? 1 : 0;
                const bv = getCondType(b, content) === 'value' ? b.value || 0 : b.active ? 1 : 0;
                return dir * (av - bv);
            });
        }
    }

    // ── Cascading Sub-conditions ──

    function activateSubconditions(typeKey, content, visited) {
        if (!visited) visited = {};
        if (visited[typeKey]) return;
        visited[typeKey] = true;

        const def = getTemplateDef(typeKey, content.template);
        if (!def || !def.subconditions || !def.subconditions.length) return;

        def.subconditions.forEach(function (subKey) {
            if (visited[subKey]) return;

            // Already in applied?
            const existing = content.applied.find(function (a) {
                return a.typeKey === subKey;
            });
            if (existing) {
                if (!existing.active) {
                    existing.active = true;
                    if (getCondType(existing, content) === 'value' && existing.value === 0) {
                        existing.value = 1;
                    }
                }
            } else {
                // In staging?
                let stagingIdx = -1;
                for (let i = 0; i < content.staging.length; i++) {
                    if (content.staging[i].typeKey === subKey) {
                        stagingIdx = i;
                        break;
                    }
                }
                if (stagingIdx !== -1) {
                    const moved = content.staging.splice(stagingIdx, 1)[0];
                    moved.active = true;
                    if (getCondType(moved, content) === 'value' && moved.value === 0) moved.value = 1;
                    content.applied.push(moved);
                } else {
                    // Create from template
                    const subDef = getTemplateDef(subKey, content.template);
                    if (subDef) {
                        content.applied.push({
                            id: generateId('cond'),
                            typeKey: subKey,
                            type: subDef.type,
                            value: subDef.type === 'value' ? 1 : 0,
                            active: true,
                            description: null,
                            maxValue: subDef.maxValue,
                        });
                    }
                }
            }

            // One level of recursion for chained sub-conditions
            activateSubconditions(subKey, content, visited);
        });
    }

    // ── Sort Header SVGs ──
    const SORT_ASC_SVG = cvIcon('chevron-up', 10);
    const SORT_DESC_SVG = cvIcon('chevron-down', 10);

    // ── Value Prompt ──

    function showCondValuePrompt(parentEl, defaultValue, maxValue, onConfirm, onCancel) {
        const existing = document.querySelector('.cond-value-prompt');
        if (existing) existing.remove();

        const prompt = document.createElement('div');
        prompt.className = 'cond-value-prompt';

        prompt.innerHTML =
            '<div class="cond-value-prompt-header">' +
            '<span class="cond-value-prompt-title">' +
            escapeHtml(t('cond.valuePrompt')) +
            '</span>' +
            '</div>' +
            '<input type="number" class="cond-value-input" placeholder="' +
            escapeHtml(t('cond.valuePlaceholder')) +
            '" min="0"' +
            (maxValue ? ' max="' + maxValue + '"' : '') +
            ' step="1" spellcheck="false" autocomplete="off">' +
            '<div class="cond-value-prompt-actions">' +
            '<button class="cond-value-cancel btn-secondary sm">' +
            escapeHtml(t('cond.cancel')) +
            '</button>' +
            '<button class="cond-value-ok">' +
            escapeHtml(t('cond.ok')) +
            '</button>' +
            '</div>';

        const input = prompt.querySelector('.cond-value-input');
        const okBtn = prompt.querySelector('.cond-value-ok');
        const cancelBtn = prompt.querySelector('.cond-value-cancel');

        if (defaultValue !== null && defaultValue !== undefined) input.value = defaultValue;

        function clampValue(v) {
            let n = parseInt(v, 10);
            if (isNaN(n) || n < 0) n = 0;
            if (maxValue !== null && maxValue !== undefined && n > maxValue) n = maxValue;
            return n;
        }

        function confirm() {
            const val = clampValue(input.value);
            prompt.remove();
            onConfirm(val);
        }

        function cancel() {
            prompt.remove();
            if (onCancel) onCancel();
        }

        okBtn.addEventListener('click', confirm);
        cancelBtn.addEventListener('click', cancel);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') cancel();
        });

        parentEl.appendChild(prompt);
        input.focus();
        input.select();
    }

    // ── Expand Modal (Play Mode) ──

    function openCondExpandModal(item, content, data, moduleEl) {
        const existing = document.querySelector('.cond-expand-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'cond-expand-overlay';

        const panel = document.createElement('div');
        panel.className = 'cond-expand-panel';

        const condType = getCondType(item, content);
        const condMax = getCondMaxValue(item, content);

        // Header
        const header = document.createElement('div');
        header.className = 'cond-expand-header';

        const iconSvg = getCondIconSvg(item, content);
        if (iconSvg) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'cond-expand-icon';
            iconSpan.innerHTML = iconSvg;
            header.appendChild(iconSpan);
        }

        const titleSpan = document.createElement('span');
        titleSpan.className = 'cond-expand-title';
        titleSpan.textContent = getCondName(item, content);
        header.appendChild(titleSpan);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'cond-expand-close';
        closeBtn.title = t('cond.close');
        closeBtn.innerHTML = cvIcon('x', 14);
        closeBtn.addEventListener('click', function () {
            closeExpandModal();
        });
        header.appendChild(closeBtn);
        panel.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.className = 'cond-expand-body';

        // Active toggle
        const toggleRow = document.createElement('div');
        toggleRow.className = 'cond-expand-row';
        const toggleLabel = document.createElement('span');
        toggleLabel.className = 'cond-expand-label';
        toggleLabel.textContent = t('cond.active');
        toggleRow.appendChild(toggleLabel);
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'cond-expand-toggle-btn' + (item.active ? ' active' : '');
        toggleBtn.textContent = item.active ? t('cond.active') : t('cond.inactive');
        toggleBtn.addEventListener('click', function () {
            item.active = !item.active;
            toggleBtn.classList.toggle('active');
            toggleBtn.textContent = item.active ? t('cond.active') : t('cond.inactive');
            if (item.active && condType === 'value' && item.value === 0) item.value = 1;
            if (item.active) activateSubconditions(item.typeKey, content);
            scheduleSave();
            if (typeof window.logActivity === 'function') {
                window.logActivity({
                    type: 'cond.event.toggle',
                    message: item.active
                        ? t('cond.log.applied', { name: getCondName(item, content) })
                        : t('cond.log.removed', { name: getCondName(item, content) }),
                    sourceModuleId: data.id,
                });
            }
            rerender();
        });
        toggleRow.appendChild(toggleBtn);
        body.appendChild(toggleRow);

        // Value editor (value type only)
        if (condType === 'value') {
            const valueRow = document.createElement('div');
            valueRow.className = 'cond-expand-row';
            const valueLabel = document.createElement('span');
            valueLabel.className = 'cond-expand-label';
            valueLabel.textContent = t('cond.sortValue');
            valueRow.appendChild(valueLabel);

            const valueControls = document.createElement('div');
            valueControls.className = 'cond-expand-value-controls';

            const minusBtn = document.createElement('button');
            minusBtn.className = 'cond-expand-value-btn';
            minusBtn.textContent = '\u2212';
            minusBtn.addEventListener('click', function () {
                if (item.value > 0) {
                    const oldVal = item.value;
                    item.value--;
                    if (item.value === 0) item.active = false;
                    valDisplay.textContent = item.value;
                    toggleBtn.classList.toggle('active', item.active);
                    toggleBtn.textContent = item.active ? t('cond.active') : t('cond.inactive');
                    scheduleSave();
                    if (typeof window.logActivity === 'function') {
                        window.logActivity({
                            type: 'cond.event.value',
                            message: t('cond.log.valueChange', {
                                name: getCondName(item, content),
                                oldVal: oldVal,
                                newVal: item.value,
                            }),
                            sourceModuleId: data.id,
                        });
                    }
                    rerender();
                }
            });
            valueControls.appendChild(minusBtn);

            var valDisplay = document.createElement('span');
            valDisplay.className = 'cond-expand-value-display';
            valDisplay.textContent = item.value || 0;
            valueControls.appendChild(valDisplay);

            const plusBtn = document.createElement('button');
            plusBtn.className = 'cond-expand-value-btn';
            plusBtn.textContent = '+';
            plusBtn.addEventListener('click', function () {
                if (condMax === null || item.value < condMax) {
                    const oldVal = item.value;
                    item.value++;
                    if (!item.active) {
                        item.active = true;
                        activateSubconditions(item.typeKey, content);
                    }
                    valDisplay.textContent = item.value;
                    toggleBtn.classList.toggle('active', item.active);
                    toggleBtn.textContent = item.active ? t('cond.active') : t('cond.inactive');
                    scheduleSave();
                    if (typeof window.logActivity === 'function') {
                        window.logActivity({
                            type: 'cond.event.value',
                            message: t('cond.log.valueChange', {
                                name: getCondName(item, content),
                                oldVal: oldVal,
                                newVal: item.value,
                            }),
                            sourceModuleId: data.id,
                        });
                    }
                    rerender();
                }
            });
            valueControls.appendChild(plusBtn);

            if (condMax !== null) {
                const maxLabel = document.createElement('span');
                maxLabel.className = 'cond-expand-max';
                maxLabel.textContent = '/ ' + condMax;
                valueControls.appendChild(maxLabel);
            }

            valueRow.appendChild(valueControls);
            body.appendChild(valueRow);
        }

        // Description
        const descRow = document.createElement('div');
        descRow.className = 'cond-expand-row cond-expand-desc-row';
        const descLabel = document.createElement('span');
        descLabel.className = 'cond-expand-label';
        descLabel.textContent = t('cond.wizardDescription');
        descRow.appendChild(descLabel);

        const descInput = document.createElement('textarea');
        descInput.className = 'cond-expand-desc';
        descInput.rows = 3;
        descInput.value = getCondDescription(item, content);
        descInput.placeholder = t('cond.wizardDescription');
        descInput.addEventListener('input', function () {
            item.description = descInput.value || null;
            scheduleSave();
        });
        descRow.appendChild(descInput);
        body.appendChild(descRow);

        panel.appendChild(body);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'cond-expand-footer';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'cond-expand-remove-btn';
        removeBtn.textContent = t('cond.remove');
        removeBtn.addEventListener('click', function () {
            // Move back to staging
            const condName = getCondName(item, content);
            const idx = content.applied.findIndex(function (a) {
                return a.id === item.id;
            });
            if (idx !== -1) {
                const removed = content.applied.splice(idx, 1)[0];
                removed.active = false;
                removed.value = 0;
                content.staging.push(removed);
                if (typeof window.logActivity === 'function') {
                    window.logActivity({
                        type: 'cond.event.toggle',
                        message: t('cond.log.removed', { name: condName }),
                        sourceModuleId: data.id,
                    });
                }
            }
            scheduleSave();
            closeExpandModal();
            rerender();
        });
        footer.appendChild(removeBtn);

        const doneBtn = document.createElement('button');
        doneBtn.className = 'cond-expand-done-btn';
        doneBtn.textContent = t('cond.close');
        doneBtn.addEventListener('click', function () {
            closeExpandModal();
        });
        footer.appendChild(doneBtn);

        panel.appendChild(footer);
        overlay.appendChild(panel);

        overlay.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeExpandModal();
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeExpandModal();
        });

        document.body.appendChild(overlay);
        overlay.setAttribute('tabindex', '-1');
        overlay.focus();

        function closeExpandModal() {
            overlay.remove();
            rerender();
        }

        function rerender() {
            const bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl && !document.querySelector('.cond-settings-overlay')) {
                const isPlay = isPlayMode;
                if (isPlay) {
                    renderPlayBody(bodyEl, data);
                } else {
                    renderEditBody(bodyEl, data);
                }
                snapModuleHeight(moduleEl, data);
            }
        }
    }

    // ── Play Mode Rendering ──

    function renderPlayBody(bodyEl, data) {
        const content = ensureCondContent(data);
        bodyEl.innerHTML = '';

        if (!content.applied.length) {
            const empty = document.createElement('div');
            empty.className = 'cond-empty-state';
            empty.textContent = t('cond.emptyState');
            bodyEl.appendChild(empty);
            return;
        }

        const container = document.createElement('div');
        container.className = 'cond-play-container';

        // Sort header
        const sortHeader = buildSortHeader(content, bodyEl, data, true);
        container.appendChild(sortHeader);

        // Sort applied list
        sortAppliedList(content.applied, content);

        // Render items
        const list = document.createElement('div');
        list.className = 'cond-applied-list';

        content.applied.forEach(function (item) {
            const condType = getCondType(item, content);
            const condMax = getCondMaxValue(item, content);

            const row = document.createElement('div');
            row.className = 'cond-play-item' + (item.active === false ? ' inactive' : '');
            row.dataset.id = item.id;

            const desc = getCondDescription(item, content);
            if (desc) row.setAttribute('data-tooltip', desc);

            // Icon
            const iconSvg = getCondIconSvg(item, content);
            if (iconSvg) {
                const iconSpan = document.createElement('span');
                iconSpan.className = 'cond-play-icon';
                iconSpan.innerHTML = iconSvg;
                row.appendChild(iconSpan);
            }

            // Name
            const nameSpan = document.createElement('span');
            nameSpan.className = 'cond-play-name';
            nameSpan.textContent = getCondName(item, content);
            row.appendChild(nameSpan);

            // Row click to toggle (entire row is the click target)
            (function (item) {
                row.addEventListener('click', function (e) {
                    item.active = !item.active;
                    if (item.active) {
                        if (condType === 'value' && item.value === 0) item.value = 1;
                        activateSubconditions(item.typeKey, content);
                    }
                    scheduleSave();
                    if (typeof window.logActivity === 'function') {
                        window.logActivity({
                            type: 'cond.event.toggle',
                            message: item.active
                                ? t('cond.log.applied', { name: getCondName(item, content) })
                                : t('cond.log.removed', { name: getCondName(item, content) }),
                            sourceModuleId: data.id,
                        });
                    }
                    renderPlayBody(bodyEl, data);
                    snapModuleHeight(bodyEl.closest('.module'), data);
                });
            })(item);

            // Value (click to inc, right-click to dec)
            if (condType === 'value') {
                const valSpan = document.createElement('span');
                valSpan.className = 'cond-play-value';
                valSpan.textContent = item.value || 0;
                (function (item, valSpan) {
                    valSpan.addEventListener('click', function (e) {
                        e.stopPropagation();
                        if (condMax === null || item.value < condMax) {
                            const oldVal = item.value;
                            item.value++;
                            if (!item.active) {
                                item.active = true;
                                activateSubconditions(item.typeKey, content);
                            }
                            scheduleSave();
                            if (typeof window.logActivity === 'function') {
                                window.logActivity({
                                    type: 'cond.event.value',
                                    message: t('cond.log.valueChange', {
                                        name: getCondName(item, content),
                                        oldVal: oldVal,
                                        newVal: item.value,
                                    }),
                                    sourceModuleId: data.id,
                                });
                            }
                            renderPlayBody(bodyEl, data);
                            snapModuleHeight(bodyEl.closest('.module'), data);
                        }
                    });
                    valSpan.addEventListener('contextmenu', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (item.value > 0) {
                            const oldVal = item.value;
                            item.value--;
                            if (item.value === 0) item.active = false;
                            scheduleSave();
                            if (typeof window.logActivity === 'function') {
                                window.logActivity({
                                    type: 'cond.event.value',
                                    message: t('cond.log.valueChange', {
                                        name: getCondName(item, content),
                                        oldVal: oldVal,
                                        newVal: item.value,
                                    }),
                                    sourceModuleId: data.id,
                                });
                            }
                            renderPlayBody(bodyEl, data);
                            snapModuleHeight(bodyEl.closest('.module'), data);
                        }
                    });
                })(item, valSpan);
                row.appendChild(valSpan);
            }

            // Expand button
            const expandBtn = document.createElement('button');
            expandBtn.className = 'cond-play-expand';
            expandBtn.title = t('cond.expand');
            expandBtn.innerHTML = cvIcon('maximize-2', 12);
            (function (item) {
                expandBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    openCondExpandModal(item, content, data, bodyEl.closest('.module'));
                });
            })(item);
            row.appendChild(expandBtn);

            list.appendChild(row);
        });

        container.appendChild(list);
        bodyEl.appendChild(container);
    }

    // ── Layout Mode Rendering ──

    function renderEditBody(bodyEl, data) {
        const content = ensureCondContent(data);
        bodyEl.innerHTML = '';

        if (!content.applied.length) {
            const empty = document.createElement('div');
            empty.className = 'cond-empty-state';
            empty.textContent = t('cond.emptyState');
            bodyEl.appendChild(empty);
            return;
        }

        const container = document.createElement('div');
        container.className = 'cond-edit-container';

        // Sort header
        const sortHeader = buildSortHeader(content, bodyEl, data, false);
        container.appendChild(sortHeader);

        // Sort applied list
        sortAppliedList(content.applied, content);

        // Render items
        const list = document.createElement('div');
        list.className = 'cond-applied-list';

        content.applied.forEach(function (item) {
            const condType = getCondType(item, content);

            const row = document.createElement('div');
            row.className = 'cond-edit-item' + (item.active === false ? ' inactive' : '');

            const desc = getCondDescription(item, content);
            if (desc) row.setAttribute('data-tooltip', desc);

            const iconSvg = getCondIconSvg(item, content);
            if (iconSvg) {
                const iconSpan = document.createElement('span');
                iconSpan.className = 'cond-edit-icon';
                iconSpan.innerHTML = iconSvg;
                row.appendChild(iconSpan);
            }

            const nameSpan = document.createElement('span');
            nameSpan.className = 'cond-edit-name';
            nameSpan.textContent = getCondName(item, content);
            row.appendChild(nameSpan);

            if (condType === 'value') {
                const valSpan = document.createElement('span');
                valSpan.className = 'cond-edit-value';
                valSpan.textContent = item.value || 0;
                row.appendChild(valSpan);
            }

            list.appendChild(row);
        });

        container.appendChild(list);
        bodyEl.appendChild(container);
    }

    // ── Sort Header ──

    function buildSortHeader(content, bodyEl, data, isPlayMode) {
        const headerRow = document.createElement('div');
        headerRow.className = 'cond-sort-header';

        // Icon spacer — aligns NAME header with icon column in rows
        const iconSpacer = document.createElement('div');
        iconSpacer.className = 'cond-sort-icon-spacer';
        headerRow.appendChild(iconSpacer);

        // Name column
        const nameIsActive = content.sortBy === 'alpha';
        const nameHeader = document.createElement('div');
        nameHeader.className = 'cond-sort-header-col cond-sort-header-name' + (nameIsActive ? ' active-sort' : '');
        nameHeader.title = escapeHtml(
            nameIsActive ? (content.sortDir === 'asc' ? t('cond.sortDesc') : t('cond.sortManual')) : t('cond.sortAsc')
        );

        const nameLabel = document.createElement('span');
        nameLabel.textContent = t('cond.sortName');
        nameHeader.appendChild(nameLabel);

        if (nameIsActive) {
            const nameIndicator = document.createElement('span');
            nameIndicator.className = 'list-sort-indicator';
            nameIndicator.innerHTML = content.sortDir === 'asc' ? SORT_ASC_SVG : SORT_DESC_SVG;
            nameHeader.appendChild(nameIndicator);
        }

        nameHeader.addEventListener('click', function () {
            if (content.sortBy === 'alpha') {
                if (content.sortDir === 'asc') {
                    content.sortDir = 'desc';
                } else {
                    content.sortBy = null;
                    content.sortDir = 'asc';
                }
            } else {
                content.sortBy = 'alpha';
                content.sortDir = 'asc';
            }
            scheduleSave();
            if (isPlayMode) renderPlayBody(bodyEl, data);
            else renderEditBody(bodyEl, data);
            snapModuleHeight(bodyEl.closest('.module'), data);
        });
        headerRow.appendChild(nameHeader);

        // Value column
        const valueIsActive = content.sortBy === 'value';
        const valueHeader = document.createElement('div');
        valueHeader.className = 'cond-sort-header-col cond-sort-header-value' + (valueIsActive ? ' active-sort' : '');
        valueHeader.title = escapeHtml(
            valueIsActive ? (content.sortDir === 'asc' ? t('cond.sortDesc') : t('cond.sortManual')) : t('cond.sortAsc')
        );

        const valueLabel = document.createElement('span');
        valueLabel.textContent = t('cond.sortValue');
        valueHeader.appendChild(valueLabel);

        if (valueIsActive) {
            const valueIndicator = document.createElement('span');
            valueIndicator.className = 'list-sort-indicator';
            valueIndicator.innerHTML = content.sortDir === 'asc' ? SORT_ASC_SVG : SORT_DESC_SVG;
            valueHeader.appendChild(valueIndicator);
        }

        valueHeader.addEventListener('click', function () {
            if (content.sortBy === 'value') {
                if (content.sortDir === 'asc') {
                    content.sortDir = 'desc';
                } else {
                    content.sortBy = null;
                    content.sortDir = 'asc';
                }
            } else {
                content.sortBy = 'value';
                content.sortDir = 'asc';
            }
            scheduleSave();
            if (isPlayMode) renderPlayBody(bodyEl, data);
            else renderEditBody(bodyEl, data);
            snapModuleHeight(bodyEl.closest('.module'), data);
        });
        headerRow.appendChild(valueHeader);

        // Expand spacer (play mode only) — aligns VALUE header with value column
        if (isPlayMode) {
            const expandSpacer = document.createElement('div');
            expandSpacer.className = 'cond-sort-expand-spacer';
            headerRow.appendChild(expandSpacer);
        }

        return headerRow;
    }

    // ── Settings Panel ──

    function closeCondSettingsPanel(moduleEl, data) {
        const overlay = document.querySelector('.cond-settings-overlay');
        if (!overlay) return;
        if (overlay._keyHandler) document.removeEventListener('keydown', overlay._keyHandler);
        overlay.querySelectorAll('.cond-applied-settings-list, .cond-staging-grid').forEach(function (el) {
            if (el._sortable) {
                el._sortable.destroy();
                el._sortable = null;
            }
        });
        overlay.remove();
        const bodyEl = moduleEl.querySelector('.module-body');
        renderEditBody(bodyEl, data);
        snapModuleHeight(moduleEl, data);
    }

    function openCondSettingsPanel(moduleEl, data) {
        closeCondSettingsPanel(moduleEl, data);
        const content = ensureCondContent(data);

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay cond-settings-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel cond-settings-modal';

        renderSettingsPanelContent(panel, moduleEl, data, content);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        // Close on overlay background click
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeCondSettingsPanel(moduleEl, data);
        });

        const keyHandler = function (e) {
            if (e.key === 'Escape') {
                e.stopPropagation();
                closeCondSettingsPanel(moduleEl, data);
            }
        };
        overlay._keyHandler = keyHandler;
        document.addEventListener('keydown', keyHandler);
    }

    function renderSettingsPanelContent(panel, moduleEl, data, content) {
        panel.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.className = 'cv-modal-header';

        const title = document.createElement('span');
        title.className = 'cv-modal-title';
        title.textContent = t('cond.moduleSettings');
        header.appendChild(title);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'cv-modal-close';
        closeBtn.title = t('cond.close');
        closeBtn.innerHTML = cvIcon('x', 12);
        closeBtn.addEventListener('click', function () {
            closeCondSettingsPanel(moduleEl, data);
        });
        header.appendChild(closeBtn);
        panel.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.className = 'cv-modal-body cond-settings-body';

        // Applied section
        const appliedSection = document.createElement('div');
        appliedSection.className = 'cond-applied-section';

        const appliedLabel = document.createElement('div');
        appliedLabel.className = 'cond-section-label';
        appliedLabel.textContent = t('cond.appliedConditions');
        appliedSection.appendChild(appliedLabel);

        const appliedList = document.createElement('div');
        appliedList.className = 'cond-applied-settings-list';

        sortAppliedList(content.applied, content);

        content.applied.forEach(function (item) {
            const itemEl = createSettingsAppliedItem(item, content, data, moduleEl, panel);
            appliedList.appendChild(itemEl);
        });
        appliedSection.appendChild(appliedList);
        body.appendChild(appliedSection);

        // Staging section
        const stagingSection = document.createElement('div');
        stagingSection.className = 'cond-staging-section';

        const stagingLabel = document.createElement('div');
        stagingLabel.className = 'cond-section-label';
        stagingLabel.textContent = t('cond.availableConditions');
        stagingSection.appendChild(stagingLabel);

        const stagingGrid = document.createElement('div');
        stagingGrid.className = 'cond-staging-grid';

        // Sort staging alphabetically for display
        const sortedStaging = content.staging.slice().sort(function (a, b) {
            return getCondName(a, content).localeCompare(getCondName(b, content));
        });

        sortedStaging.forEach(function (item) {
            const itemEl = document.createElement('div');
            itemEl.className = 'cond-staging-item';
            itemEl.dataset.typeKey = item.typeKey;
            itemEl.dataset.id = item.id;

            const iconSvg = getCondIconSvg(item, content);
            if (iconSvg) {
                const iconSpan = document.createElement('span');
                iconSpan.className = 'cond-staging-icon';
                iconSpan.innerHTML = iconSvg;
                itemEl.appendChild(iconSpan);
            }

            const nameSpan = document.createElement('span');
            nameSpan.className = 'cond-staging-name';
            nameSpan.textContent = getCondName(item, content);
            itemEl.appendChild(nameSpan);

            // Delete from pool — only custom conditions can be deleted
            const isCustom = (content.customConditions || []).some(function (c) {
                return c.key === item.typeKey;
            });
            if (isCustom) {
                const delBtn = document.createElement('button');
                delBtn.className = 'cond-staging-delete';
                delBtn.title = t('cond.remove');
                delBtn.innerHTML = cvIcon('x', 8);
                (function (item) {
                    delBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        const idx = content.staging.findIndex(function (s) {
                            return s.id === item.id;
                        });
                        if (idx !== -1) content.staging.splice(idx, 1);
                        const cIdx = content.customConditions.findIndex(function (c) {
                            return c.key === item.typeKey;
                        });
                        if (cIdx !== -1) content.customConditions.splice(cIdx, 1);
                        scheduleSave();
                        renderSettingsPanelContent(panel, moduleEl, data, content);
                    });
                })(item);
                itemEl.appendChild(delBtn);
            }

            (function (item) {
                itemEl.addEventListener('click', function (e) {
                    if (e.target.closest('.cond-staging-delete')) return;
                    applyConditionFromStaging(item.typeKey, item.id, content, panel, moduleEl, data);
                });
            })(item);

            stagingGrid.appendChild(itemEl);
        });

        stagingSection.appendChild(stagingGrid);

        // Create Custom button
        const createBtn = document.createElement('button');
        createBtn.className = 'cond-create-custom-btn';
        createBtn.innerHTML = cvIcon('plus', 12) + '<span>' + escapeHtml(t('cond.createCustom')) + '</span>';
        createBtn.addEventListener('click', function () {
            openCondWizard(moduleEl, data, panel);
        });
        stagingSection.appendChild(createBtn);

        body.appendChild(stagingSection);
        buildCommonSettingsSection(body, moduleEl, data);
        panel.appendChild(body);

        // ── Footer ──
        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const footerCloseBtn = document.createElement('button');
        footerCloseBtn.type = 'button';
        footerCloseBtn.className = 'btn-secondary sm';
        footerCloseBtn.textContent = t('cond.close');
        footerCloseBtn.addEventListener('click', function () {
            closeCondSettingsPanel(moduleEl, data);
        });
        footer.appendChild(footerCloseBtn);
        panel.appendChild(footer);

        // Init SortableJS
        initCondSettingsSortables(panel, moduleEl, data, content);
    }

    function createSettingsAppliedItem(item, content, data, moduleEl, panel) {
        const condType = getCondType(item, content);

        const el = document.createElement('div');
        el.className = 'cond-assigned-item';
        el.dataset.id = item.id;
        el.dataset.typeKey = item.typeKey;

        const iconSvg = getCondIconSvg(item, content);
        if (iconSvg) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'cond-assigned-icon';
            iconSpan.innerHTML = iconSvg;
            el.appendChild(iconSpan);
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'cond-assigned-name';
        nameSpan.textContent = getCondName(item, content);
        el.appendChild(nameSpan);

        if (condType === 'value') {
            const valSpan = document.createElement('span');
            valSpan.className = 'cond-assigned-value';
            valSpan.textContent = item.value || 0;
            valSpan.addEventListener('click', function (e) {
                e.stopPropagation();
                const settingsBody = el.closest('.cv-modal-body');
                if (!settingsBody) return;
                showCondValuePrompt(settingsBody, item.value, getCondMaxValue(item, content), function (newVal) {
                    item.value = newVal;
                    if (newVal === 0) item.active = false;
                    else item.active = true;
                    scheduleSave();
                    renderSettingsPanelContent(panel, moduleEl, data, content);
                });
            });
            el.appendChild(valSpan);
        }

        const typeBadge = document.createElement('span');
        typeBadge.className = 'cond-assigned-type';
        typeBadge.textContent = condType === 'value' ? t('cond.wizardValue') : t('cond.wizardToggle');
        el.appendChild(typeBadge);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'cond-assigned-delete';
        deleteBtn.title = t('cond.remove');
        deleteBtn.innerHTML = cvIcon('x', 10);
        deleteBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const condName = getCondName(item, content);
            const idx = content.applied.findIndex(function (a) {
                return a.id === item.id;
            });
            if (idx !== -1) {
                const removed = content.applied.splice(idx, 1)[0];
                removed.active = false;
                removed.value = 0;
                content.staging.push(removed);
                if (typeof window.logActivity === 'function') {
                    window.logActivity({
                        type: 'cond.event.toggle',
                        message: t('cond.log.removed', { name: condName }),
                        sourceModuleId: data.id,
                    });
                }
            }
            scheduleSave();
            renderSettingsPanelContent(panel, moduleEl, data, content);
        });
        el.appendChild(deleteBtn);

        return el;
    }

    // ── Apply Condition from Staging ──

    function applyConditionFromStaging(typeKey, itemId, content, panel, moduleEl, data) {
        if (
            content.applied.some(function (a) {
                return a.typeKey === typeKey;
            })
        ) {
            renderSettingsPanelContent(panel, moduleEl, data, content);
            return;
        }
        const stagingItem = content.staging.find(function (s) {
            return s.id === itemId;
        });
        if (!stagingItem) {
            renderSettingsPanelContent(panel, moduleEl, data, content);
            return;
        }
        const condType = getCondType(stagingItem, content);
        if (condType === 'value') {
            const condMax = getCondMaxValue(stagingItem, content);
            showCondValuePrompt(
                panel.querySelector('.cv-modal-body'),
                1,
                condMax,
                function (val) {
                    const idx = content.staging.findIndex(function (s) {
                        return s.id === itemId;
                    });
                    if (idx !== -1) content.staging.splice(idx, 1);
                    stagingItem.value = val;
                    stagingItem.active = val > 0;
                    content.applied.push(stagingItem);
                    if (stagingItem.active) activateSubconditions(typeKey, content);
                    scheduleSave();
                    if (typeof window.logActivity === 'function') {
                        window.logActivity({
                            type: 'cond.event.toggle',
                            message: t('cond.log.applied', { name: getCondName(stagingItem, content) }),
                            sourceModuleId: data.id,
                        });
                    }
                    renderSettingsPanelContent(panel, moduleEl, data, content);
                },
                function () {
                    renderSettingsPanelContent(panel, moduleEl, data, content);
                }
            );
        } else {
            const idx = content.staging.findIndex(function (s) {
                return s.id === itemId;
            });
            if (idx !== -1) content.staging.splice(idx, 1);
            stagingItem.active = true;
            content.applied.push(stagingItem);
            activateSubconditions(typeKey, content);
            scheduleSave();
            if (typeof window.logActivity === 'function') {
                window.logActivity({
                    type: 'cond.event.toggle',
                    message: t('cond.log.applied', { name: getCondName(stagingItem, content) }),
                    sourceModuleId: data.id,
                });
            }
            renderSettingsPanelContent(panel, moduleEl, data, content);
        }
    }

    // ── SortableJS Setup ──

    function initCondSettingsSortables(panel, moduleEl, data, content) {
        const stagingGrid = panel.querySelector('.cond-staging-grid');
        const appliedList = panel.querySelector('.cond-applied-settings-list');

        if (stagingGrid) {
            stagingGrid._sortable = new Sortable(stagingGrid, {
                group: { name: 'cond-assign', pull: 'clone', put: false },
                sort: false,
                animation: 150,
                ghostClass: 'cond-ghost',
                draggable: '.cond-staging-item',
            });
        }

        if (appliedList) {
            appliedList._sortable = new Sortable(appliedList, {
                group: { name: 'cond-assign', pull: true, put: true },
                sort: !content.sortBy, // Manual reorder only when no auto-sort
                animation: 150,
                ghostClass: 'cond-ghost',
                draggable: '.cond-assigned-item',
                onAdd: function (evt) {
                    const isFromStaging = evt.from.classList.contains('cond-staging-grid');
                    const typeKey = evt.item.dataset.typeKey;
                    const itemId = evt.item.dataset.id;

                    evt.item.remove();

                    if (isFromStaging) {
                        applyConditionFromStaging(typeKey, itemId, content, panel, moduleEl, data);
                    }
                },
                onEnd: function (evt) {
                    // Manual reorder — sync data array with DOM order
                    if (!content.sortBy) {
                        const newOrder = [];
                        appliedList.querySelectorAll('.cond-assigned-item').forEach(function (el) {
                            const id = el.dataset.id;
                            const item = content.applied.find(function (a) {
                                return a.id === id;
                            });
                            if (item) newOrder.push(item);
                        });
                        content.applied = newOrder;
                        data.content.applied = newOrder;
                        scheduleSave();
                    }
                },
            });
        }
    }

    function applyTemplate(templateKey, mode, content) {
        const tpl = CONDITION_TEMPLATES[templateKey];
        if (!tpl) return;

        const customKeys = new Set(
            (content.customConditions || []).map(function (c) {
                return c.key;
            })
        );

        if (mode === 'replace') {
            // Stash custom condition instances before clearing so they survive template switches.
            // Each instance is tagged with the homeTemplate from its definition (defaulting to 'custom'
            // for legacy data) so it is restored to the correct template later.
            if (!Array.isArray(content.savedCustomInstances)) content.savedCustomInstances = [];
            const stashedKeys = new Set(
                content.savedCustomInstances.map(function (i) {
                    return i.typeKey;
                })
            );
            const getHomeTemplate = function (typeKey) {
                const def = (content.customConditions || []).find(function (c) {
                    return c.key === typeKey;
                });
                return def && def.homeTemplate ? def.homeTemplate : 'custom';
            };
            content.applied.forEach(function (a) {
                if (customKeys.has(a.typeKey) && !stashedKeys.has(a.typeKey)) {
                    content.savedCustomInstances.push(
                        Object.assign({}, a, { wasApplied: true, homeTemplate: getHomeTemplate(a.typeKey) })
                    );
                    stashedKeys.add(a.typeKey);
                }
            });
            content.staging.forEach(function (s) {
                if (customKeys.has(s.typeKey) && !stashedKeys.has(s.typeKey)) {
                    content.savedCustomInstances.push(
                        Object.assign({}, s, { wasApplied: false, homeTemplate: getHomeTemplate(s.typeKey) })
                    );
                    stashedKeys.add(s.typeKey);
                }
            });
            content.applied = [];
            content.staging = [];
        }

        content.template = templateKey;

        // Restore stashed instances whose homeTemplate matches the new template
        if (Array.isArray(content.savedCustomInstances) && content.savedCustomInstances.length) {
            const existingTypeKeys = new Set(
                content.applied
                    .map(function (a) {
                        return a.typeKey;
                    })
                    .concat(
                        content.staging.map(function (s) {
                            return s.typeKey;
                        })
                    )
            );
            const remaining = [];
            content.savedCustomInstances.forEach(function (inst) {
                if (inst.homeTemplate === templateKey && !existingTypeKeys.has(inst.typeKey)) {
                    const restored = {
                        id: inst.id,
                        typeKey: inst.typeKey,
                        type: inst.type,
                        value: inst.value,
                        active: inst.active,
                        description: inst.description,
                        maxValue: inst.maxValue,
                    };
                    if (inst.wasApplied) {
                        content.applied.push(restored);
                    } else {
                        content.staging.push(restored);
                    }
                    existingTypeKeys.add(inst.typeKey);
                } else {
                    remaining.push(inst);
                }
            });
            content.savedCustomInstances = remaining;
        }

        // Build set of existing typeKeys to skip duplicates when adding template conditions
        const existingKeys = {};
        content.applied.forEach(function (a) {
            existingKeys[a.typeKey] = true;
        });
        content.staging.forEach(function (s) {
            existingKeys[s.typeKey] = true;
        });

        // Add template conditions to staging (skip duplicates)
        tpl.conditions.forEach(function (def) {
            if (!existingKeys[def.key]) {
                content.staging.push({
                    id: generateId('cond'),
                    typeKey: def.key,
                    type: def.type,
                    value: 0,
                    active: false,
                    description: null,
                    maxValue: def.maxValue,
                });
            }
        });

        console.log('[CV] Template applied: ' + templateKey + ' (' + mode + ')');
    }

    // ── Custom Condition Wizard ──

    function openCondWizard(moduleEl, data, settingsPanel) {
        const content = ensureCondContent(data);

        const overlay = document.createElement('div');
        overlay.className = 'cond-wizard-overlay';

        const wizPanel = document.createElement('div');
        wizPanel.className = 'cond-wizard-panel';

        let selectedIcon = null;
        let wizardName = '';
        let wizardType = 'toggle';
        let wizardDesc = '';
        let wizardMaxValue = null;

        // Header
        const header = document.createElement('div');
        header.className = 'cond-wizard-header';

        const titleEl = document.createElement('span');
        titleEl.className = 'cond-wizard-title';
        titleEl.textContent = t('cond.wizardTitle');
        header.appendChild(titleEl);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'cond-wizard-close';
        closeBtn.title = t('cond.close');
        closeBtn.innerHTML = cvIcon('x', 14);
        closeBtn.addEventListener('click', function () {
            overlay.remove();
        });
        header.appendChild(closeBtn);
        wizPanel.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.className = 'cond-wizard-body';

        // Icon section
        const iconSection = document.createElement('div');
        iconSection.className = 'cond-wizard-section';
        const iconLabel = document.createElement('label');
        iconLabel.className = 'cond-wizard-label';
        iconLabel.textContent = t('cond.wizardIcon');
        iconSection.appendChild(iconLabel);

        const iconGrid = document.createElement('div');
        iconGrid.className = 'cond-wizard-icon-grid';

        const iconKeys = [...CONDITION_ICON_NAMES].sort();
        iconKeys.forEach(function (key) {
            const btn = document.createElement('button');
            btn.className = 'cond-wizard-icon-btn';
            btn.dataset.iconKey = key;
            btn.innerHTML = condIcon(key);
            const tipLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');
            let _tip = null;
            btn.addEventListener('mouseenter', function () {
                _tip = document.createElement('div');
                _tip.className = 'cond-wizard-icon-tooltip';
                _tip.textContent = tipLabel;
                document.body.appendChild(_tip);
                const rect = btn.getBoundingClientRect();
                const tw = _tip.offsetWidth;
                const th = _tip.offsetHeight;
                let left = rect.left + rect.width / 2 - tw / 2;
                const top = rect.top - th - 6;
                left = Math.max(4, Math.min(left, window.innerWidth - tw - 4));
                _tip.style.left = left + 'px';
                _tip.style.top = top + 'px';
                _tip.style.opacity = '1';
            });
            btn.addEventListener('mouseleave', function () {
                if (_tip) {
                    _tip.remove();
                    _tip = null;
                }
            });
            btn.addEventListener('click', function () {
                iconGrid.querySelectorAll('.cond-wizard-icon-btn').forEach(function (b) {
                    b.classList.remove('selected');
                });
                btn.classList.add('selected');
                selectedIcon = key;
            });
            iconGrid.appendChild(btn);
        });
        iconSection.appendChild(iconGrid);
        body.appendChild(iconSection);

        // Name section
        const nameSection = document.createElement('div');
        nameSection.className = 'cond-wizard-section';
        const nameLabel = document.createElement('label');
        nameLabel.className = 'cond-wizard-label';
        nameLabel.textContent = t('cond.wizardName');
        nameSection.appendChild(nameLabel);

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'cond-wizard-name-input';
        nameInput.placeholder = t('cond.wizardNamePlaceholder');
        nameInput.spellcheck = false;
        nameInput.autocomplete = 'off';
        nameInput.addEventListener('input', function () {
            wizardName = nameInput.value.trim();
            createBtn.disabled = !wizardName;
        });
        nameSection.appendChild(nameInput);
        body.appendChild(nameSection);

        // Type section
        const typeSection = document.createElement('div');
        typeSection.className = 'cond-wizard-section';
        const typeLabel = document.createElement('label');
        typeLabel.className = 'cond-wizard-label';
        typeLabel.textContent = t('cond.wizardType');
        typeSection.appendChild(typeLabel);

        const typeToggle = document.createElement('div');
        typeToggle.className = 'cond-wizard-type-toggle';

        const toggleTypeBtn = document.createElement('button');
        toggleTypeBtn.className = 'cond-wizard-type-btn selected';
        toggleTypeBtn.textContent = t('cond.wizardToggle');
        toggleTypeBtn.addEventListener('click', function () {
            wizardType = 'toggle';
            toggleTypeBtn.classList.add('selected');
            valueTypeBtn.classList.remove('selected');
            maxValueRow.style.display = 'none';
        });
        typeToggle.appendChild(toggleTypeBtn);

        var valueTypeBtn = document.createElement('button');
        valueTypeBtn.className = 'cond-wizard-type-btn';
        valueTypeBtn.textContent = t('cond.wizardValue');
        valueTypeBtn.addEventListener('click', function () {
            wizardType = 'value';
            valueTypeBtn.classList.add('selected');
            toggleTypeBtn.classList.remove('selected');
            maxValueRow.style.display = '';
        });
        typeToggle.appendChild(valueTypeBtn);
        typeSection.appendChild(typeToggle);

        // Max value input (shown for value type)
        var maxValueRow = document.createElement('div');
        maxValueRow.className = 'cond-wizard-maxvalue-row';
        maxValueRow.style.display = 'none';

        const maxValueLabel = document.createElement('label');
        maxValueLabel.className = 'cond-wizard-label';
        maxValueLabel.textContent = t('cond.wizardMaxValue');
        maxValueRow.appendChild(maxValueLabel);

        const maxValueInput = document.createElement('input');
        maxValueInput.type = 'number';
        maxValueInput.className = 'cond-wizard-maxvalue-input';
        maxValueInput.min = 1;
        maxValueInput.placeholder = t('cond.wizardMaxValuePlaceholder');
        maxValueInput.addEventListener('input', function () {
            const v = parseInt(maxValueInput.value, 10);
            wizardMaxValue = isNaN(v) || v < 1 ? null : v;
        });
        maxValueRow.appendChild(maxValueInput);
        typeSection.appendChild(maxValueRow);

        body.appendChild(typeSection);

        // Description section
        const descSection = document.createElement('div');
        descSection.className = 'cond-wizard-section cond-wizard-section-last';
        const descLabel = document.createElement('label');
        descLabel.className = 'cond-wizard-label';
        descLabel.textContent = t('cond.wizardDescription');
        descSection.appendChild(descLabel);

        const descInput = document.createElement('textarea');
        descInput.className = 'cond-wizard-desc-input';
        descInput.rows = 2;
        descInput.placeholder = t('cond.wizardDescPlaceholder');
        descInput.addEventListener('input', function () {
            wizardDesc = descInput.value.trim();
        });
        descSection.appendChild(descInput);
        body.appendChild(descSection);

        wizPanel.appendChild(body);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'cond-wizard-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cond-wizard-btn-cancel btn-secondary';
        cancelBtn.textContent = t('cond.wizardCancel');
        cancelBtn.addEventListener('click', function () {
            overlay.remove();
        });
        footer.appendChild(cancelBtn);

        var createBtn = document.createElement('button');
        createBtn.className = 'cond-wizard-btn-create btn-primary solid';
        createBtn.textContent = t('cond.wizardCreate');
        createBtn.disabled = true;
        createBtn.addEventListener('click', function () {
            if (!wizardName) return;
            const customKey = generateId('custom');
            content.customConditions.push({
                key: customKey,
                name: wizardName,
                icon: selectedIcon || 'alert',
                type: wizardType,
                description: wizardDesc || '',
                maxValue: wizardType === 'value' ? wizardMaxValue : null,
                subconditions: [],
                homeTemplate: content.template,
            });
            // Add to staging
            content.staging.push({
                id: generateId('cond'),
                typeKey: customKey,
                type: wizardType,
                value: 0,
                active: false,
                description: wizardDesc || null,
                maxValue: wizardType === 'value' ? wizardMaxValue : null,
            });
            scheduleSave();
            overlay.remove();
            if (settingsPanel) {
                renderSettingsPanelContent(settingsPanel, moduleEl, data, content);
            }
            console.log('[CV] Custom condition created: ' + wizardName);
        });
        footer.appendChild(createBtn);
        wizPanel.appendChild(footer);

        // Escape key
        overlay.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') overlay.remove();
        });

        overlay.appendChild(wizPanel);
        document.body.appendChild(overlay);
        nameInput.focus();
    }

    // ── Module Type Registration ──

    registerModuleType('condition', {
        label: 'type.condition',

        renderBody: function (bodyEl, data, isPlayMode) {
            ensureCondContent(data);
            if (isPlayMode) {
                renderPlayBody(bodyEl, data);
            } else {
                renderEditBody(bodyEl, data);
            }
        },

        syncState: function (moduleEl, data) {
            // Data is mutated directly via event handlers; no form sync needed
        },
    });

    // Expose for module-core.js
    window.openCondSettings = function (moduleEl, data) {
        openCondSettingsPanel(moduleEl, data);
    };
    window.applyConditionTemplate = applyTemplate;

    window.getConditionValue = function (key) {
        if (!key) return null;
        for (var i = 0; i < (window.modules || []).length; i++) {
            var m = window.modules[i];
            if (m.type !== 'condition' || !m.content || !Array.isArray(m.content.applied)) continue;
            var item = m.content.applied.find(function (c) {
                return c.typeKey === key && c.active;
            });
            if (item && typeof item.value === 'number') return item.value;
        }
        return null;
    };

    console.log('[CV] Condition module registered');
})();
