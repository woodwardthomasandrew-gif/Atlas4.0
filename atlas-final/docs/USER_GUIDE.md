# User Guide

This guide covers the workflows available in Alaruel Atlas 4.0.

## Create and edit assets

Use the sidebar or dashboard to open **Creatures**, **Spells**, **Magic Items**, or **Trait Studio**. Create an entry from its list page, enter a name and content, then save. Existing entries can be searched by name, opened, duplicated, or deleted. Creature, spell, and magic-item editors offer JSON and Markdown export for the current asset.

Creature entries include core statistics, senses, defenses, abilities, spellcasting references, equipment, loot, artwork, tags, and notes. Spell entries cover casting details, components, area, damage or healing, saves, upcasting, classes, and artwork. Magic items include rarity, attunement, weight/value, charges, flavor text, and mechanics.

Trait Studio is the reusable component library. Create and edit shared traits there, then choose them while editing a creature or drag them into Print Studio. Built-in examples are included in a new database.

## Save behavior

Open assets autosave periodically. Change the interval in **Settings** (1–60 minutes; default 5). Use **Save** or **Ctrl+S** to validate and save immediately. Atlas also asks the open editor to save before the window closes. A saved status appears briefly after a successful save.

Undo and redo are available in asset editors with **Ctrl+Z** and **Ctrl+Shift+Z**. Duplicate the current asset with **Ctrl+D**.

## Arrange printable cards

1. Save the creature, spell, or magic item you want to print.
2. Open **Print Studio** and create a layout.
3. Choose US Letter or A4. Drag cards from the library onto the page. Long creature stat blocks can occupy multiple linked card panels.
4. Drag placed cards to position them. Select a card to edit its X/Y position, width, height, rotation, stacking order, or remove it. Add or remove pages as needed.
5. Save the layout. Use **Export PDF** to save a PDF, or **Open PDF to Print** to open the print-ready PDF in the system PDF viewer.

The editor includes grid visibility, zoom controls, Fit to view, and a one-, two-, or three-column arrangement for multi-panel cards. Check the PDF preview and your printer's scaling settings before printing; choose actual size/100% when you need the page dimensions preserved.

## Keyboard shortcuts

Shortcuts are shown in **Settings** and include:

| Shortcut | Action |
| --- | --- |
| `Ctrl+K` | Open command palette |
| `Ctrl+N` | Create a new asset |
| `Ctrl+P` | Open Print Studio |
| `Ctrl+S` | Save current asset |
| `Ctrl+,` | Open Settings |
| `Ctrl+1` through `Ctrl+5` | Dashboard, Magic Items, Creatures, Spells, Print Studio |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / redo |
| `Ctrl+D` | Duplicate current asset |
| `Escape` | Close active modal or overlay |

Shortcuts that are not editing actions are suppressed while typing in a text field.

## Find the database and back up data

Atlas keeps `atlas.db` in Electron's per-user `userData` directory. The exact folder is platform- and installation-dependent. Close Atlas before copying the database file to a backup location. To restore, close Atlas and replace the database with the backup. Keep a separate copy of the current file before replacing it.

