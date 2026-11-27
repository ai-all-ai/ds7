# Local notes on DS7

This folder belongs to the project: `ds7 update` replaces everything else in `ds7/` and never touches `ds7/local/`.

| Path | What goes there |
| --- | --- |
| `ds7/local/README.md` | This file: what the project keeps here. |
| `ds7/local/RECURRING-RULES.md` | Rules the owner repeats that the standard does not have yet. |
| `ds7/local/CUSTOM-LAYER.md` | What the project does differently from DS7 and the UI kit, as text. It survives every update and is checked again after each one. The way to carry a changed project. |
| ds7/local/patches/ | Small, stable edits to vendored files. Write one with `npx ds7 patch <file>`; `ds7 update` applies them again. When a patch stops applying, describe it in `CUSTOM-LAYER.md` instead, or update with `--no-patches`. |
| ds7/local/edited/ | Written by `ds7 update` when it finds an edit no patch carries. Put the edit back as a patch, or describe it in `CUSTOM-LAYER.md`, then delete the copy. |

Route agents here from the root `ALL.md` when the project has rules of its own.
