# Local notes on DS7

This folder belongs to the project: `ds7 update` replaces everything else in `ds7/` and never touches `ds7/local/`.

| Path | What goes there |
| --- | --- |
| `ds7/local/README.md` | This file: what the project keeps here. |
| `ds7/local/RECURRING-RULES.md` | Rules the owner repeats that the standard does not have yet. |
| ds7/local/patches/ | Deliberate edits to vendored files. Write one with `npx ds7 patch <file>`; `ds7 update` applies them again. |
| ds7/local/edited/ | Written by `ds7 update` when it finds an edit no patch carries. Put the edit back, record it as a patch, then delete the copy. |

Route agents here from the root `ALL.md` when the project has rules of its own.
