/**
 * @file Graph Utility.js
 * @description Amplenote Plugin that extracts markdown tables and visualizes them using Chart.js inside an embed block.
 * Supports downloading CSV data, transposing tables, and interactive 3D charts.
 */

import { handleDownload } from "./lib/features/download.js";
import { handleViewer } from "./lib/features/viewer.js";
import { handleUpdate } from "./lib/features/update.js";
import { handleRenderEmbed } from "./lib/features/renderEmbed.js";

/* ----------------------------------- */
const plugin = {
  noteOption: {
    "Download!": handleDownload,
    "Viewer!": handleViewer,
    "Update!": handleUpdate,
  },
  /* ----------------------------------- */
  /* ----------------------------------- */
  /**
   * Renders the interactive Chart.js embed using the current note's tables.
   * @param {Object} app - The Amplenote plugin application context.
   * @param {...any} args - Additional arguments passed to renderEmbed.
   * @returns {Promise<string>} The generated HTML template.
   */
  async renderEmbed(app, ...args) {
    return handleRenderEmbed(app, ...args);
  },
  /* ----------------------------------- */
};

export default plugin;