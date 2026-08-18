/**
 * @file Graph Utility.js
 * @description Amplenote Plugin that extracts markdown tables and visualizes them using Chart.js inside an interactive dashboard.
 * Supports multi-series visualization, cyclic theming, state persistence, image export to note, and table transposition.
 */

import { launchGraphDashboard, handleEmbedCall, handleRenderEmbed } from "./lib/features/index.js";

const plugin = {
  appOption: {
    "Open Dashboard": async function(app) {
      await launchGraphDashboard(app, null);
    }
  },

  noteOption: {
    "Open Dashboard": async function(app, noteUUID) {
      return launchGraphDashboard(app, noteUUID);
    }
  },

  /**
   * Renders the interactive Chart.js embed using the current note's tables and persisted state.
   * @param {Object} app - The Amplenote plugin application context.
   * @param {...any} args - Additional arguments passed to renderEmbed.
   * @returns {Promise<string>} The generated HTML template.
   */
  async renderEmbed(app, ...args) {
    return handleRenderEmbed(app, ...args);
  },

  /**
   * Responds to messages and action calls from within the interactive embed.
   * Handles note switching, table refreshing, image saving to note, and state persistence.
   * @param {Object} app - The Amplenote plugin application context.
   * @param {string} actionName - Name of the action invoked by the embed.
   * @param {Object} [payload] - Optional parameters.
   * @returns {Promise<any>}
   */
  async onEmbedCall(app, actionName, payload) {
    return handleEmbedCall(app, actionName, payload);
  }
};

export default plugin;