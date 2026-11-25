---
name: project-graph
description: Find what uses what, where a file belongs and what a change touches, from the generated site graph, before reading or editing code. Use at the start of any code task and after adding, moving or renaming a file.
---

# Project graph

Purpose: open only the files a task needs. The graph is generated from the source, so it costs a query instead of a tree of file reads (`ds7/08-token-optimization/TOKEN-STRATEGY.md`).

Trigger: any task that changes code, styles or text; before a search across the source folders; after a change that adds, removes, renames or re-links a file.

Prerequisites: the project root, Node, `docs/SITE-GRAPH.md` (create it once with `npx ds7 graph`).

## Steps

1. Read `docs/ARCHITECTURE.md`: the layers and where each kind of file lives. Do not read other files yet.
2. Ask the graph about the thing you will change:
   - `npx ds7 graph --uses <Name>`: who uses a component, composable, data file, or a text group (`home.hero`);
   - `npx ds7 graph --of <route or Component>`: what it is made of, as a tree;
   - `npx ds7 graph --css <class>`: which stylesheet defines a class and which component has it as root;
   - `npx ds7 graph --budget 1500`: the most used files first, within about that many tokens (the map to give a sub-agent that has little room).
   For a wider view read one section of `docs/SITE-GRAPH.md`, not all of it.
3. Open only the files the answer names. Change the component, not its users; if `--uses` lists callers, check them after the change.
4. Put new files where `docs/ARCHITECTURE.md` says. A kind of file with no rule gets its rule under `layout.rules` in `ds7.config.json` first, with the owner's agreement.
5. After the change run `npx ds7 graph`, then `npx ds7 layout`. Read the diff of `docs/SITE-GRAPH.md`: it must show only what you meant to change. Commit it with the change.

## Fallback

- A query finds nothing: the name may be wrong; read the section of `docs/SITE-GRAPH.md` or search with `grep -rl`.
- The command fails: report the error and search by hand; do not edit `docs/SITE-GRAPH.md` yourself.

## Verification

`npx ds7 graph --check` and `npx ds7 layout` pass.

## Limits

Dynamic components (`<component :is>`, marked `dynamic`) and text keys built at run time are not followed. Class usage is matched by root class only.
