import cloneDeep from 'lodash.clonedeep';
import hotkeys from './hotkeys';
import log from './../log.js';

/**
 *
 *
 * @typedef {Object} HotkeyDefinition
 * @property {String} commandName - Command to call
 * @property {String} label - Display name for hotkey
 * @property {String[]} keys - Keys to bind; Follows Mousetrap.js binding syntax
 */

export class HotkeysManager {
  constructor(commandsManager) {
    this.hotkeyDefinitions = {};
    this.hotkeyDefaults = [];
    this.isEnabled = true;

    if (!commandsManager) {
      log.warn(
        'HotkeysManager instantiated without a commandsManager. Hotkeys will be unable to find and run commands.'
      );
    }

    this._commandsManager = commandsManager;
  }

  /**
   * Disables all hotkeys. Hotkeys added while disabled will not listen for
   * input.
   */
  disable() {
    this.isEnabled = false;
    hotkeys.pause();
  }

  /**
   * Enables all hotkeys.
   */
  enable() {
    this.isEnabled = true;
    hotkeys.unpause();
  }

  /**
   * Registers a list of hotkeydefinitions. Optionally, sets the
   * default hotkey bindings for all provided definitions. These
   * values are used in `this.restoreDefaultBindings`.
   *
   * @param {HotkeyDefinition[] | Object} hotkeyDefinitions
   * @param {Boolean} [isDefaultDefinitions]
   */
  setHotkeys(hotkeyDefinitions, isDefaultDefinitions = false) {
    const definitions = Array.isArray(hotkeyDefinitions)
      ? [...hotkeyDefinitions]
      : this.parseToArrayLike(hotkeyDefinitions);
    definitions.forEach(definition => this.registerHotkeys(definition));

    if (isDefaultDefinitions) {
      this.hotkeyDefaults = definitions;
    }
  }

  parseToArrayLike(hotkeyDefinitionsObj) {
    const copy = { ...hotkeyDefinitionsObj };
    return Object.entries(copy).map(entryValue =>
      this.parseHotKeyToObj(entryValue[0], entryValue[1])
    );
  }

  parseHotKeyToObj(name, props) {
    return {
      commandName: name,
      ...props,
    };
  }

  /**
   * (unbinds and) binds the specified command to one or more key combinations.
   * When a hotkey combination is triggered, the command name and active contexts
   * are used to locate the correct command to call.
   *
   * @param {HotkeyDefinition} commandName
   * @param {String} extension
   * @returns {undefined}
   */
  registerHotkeys({ commandName, keys, label } = {}, extension) {
    if (!commandName) {
      log.warn(`No command was defined for hotkey "${keys}"`);
      return;
    }

    const previouslyRegisteredDefinition = this.hotkeyDefinitions[commandName];

    if (previouslyRegisteredDefinition) {
      const previouslyRegisteredKeys = previouslyRegisteredDefinition.keys;
      this._unbindHotkeys(commandName, previouslyRegisteredKeys);
    }

    // Set definition & bind
    this.hotkeyDefinitions[commandName] = { keys, label };
    this._bindHotkeys(commandName, keys);
  }

  /**
   * Uses most recent
   *
   * @returns {undefined}
   */
  restoreDefaultBindings() {
    this.setHotkeys(this.hotkeyDefaults);
  }

  /**
   *
   */
  destroy() {
    this.hotkeyDefaults = [];
    this.hotkeyDefinitions = {};
    hotkeys.reset();
  }

  /**
   * Binds one or more set of hotkey combinations for a given command
   *
   * @private
   * @param {string} commandName - The name of the command to trigger when hotkeys are used
   * @param {string[]} keys - One or more key combinations that should trigger command
   * @returns {undefined}
   */
  _bindHotkeys(commandName, keys) {
    const isKeyDefined = keys === '' || keys === undefined;
    if (isKeyDefined) {
      return;
    }

    const isKeyArray = keys instanceof Array;
    if (isKeyArray) {
      keys.forEach(key => this._bindHotkeys(commandName, key));
      return;
    }

    hotkeys.bind(keys, evt => {
      this._commandsManager.runCommand(commandName, { evt });
    });
  }

  /**
   * unbinds one or more set of hotkey combinations for a given command
   *
   * @private
   * @param {string} commandName - The name of the previously bound command
   * @param {string[]} keys - One or more sets of previously bound keys
   * @returns {undefined}
   */
  _unbindHotkeys(commandName, keys) {
    const isKeyDefined = keys !== '' && keys !== undefined;
    if (!isKeyDefined) {
      return;
    }

    const isKeyArray = keys instanceof Array;
    if (isKeyArray) {
      keys.forEach(key => this._unbindHotkeys(commandName, key));
      return;
    }

    hotkeys.unbind(keys);
  }
}

export default HotkeysManager;

// Commands Contexts:

// --> Name and Priority
// GLOBAL: 0
// VIEWER::CORNERSTONE: 1
// VIEWER::VTK: 1
