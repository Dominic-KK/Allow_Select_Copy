# 🌹Allow Select & Copy🌹 (允许复制)

A Tampermonkey / ScriptCat userscript that unblocks web pages which disable text selection or copying.

## Features

Five unlocking modes, triggered via the **script menu** or **user config**:

| Mode               | Description                                                          | Side effects     |
| ------------------ | -------------------------------------------------------------------- | ---------------- |
| CSS Allow Select   | Allows selection via `user-select: auto` only, no event interception | Minimal          |
| Allow Select       | Allows selection and removes `selectstart` / `mousedown` blocking    | Small            |
| Allow Copy         | Allows copying and removes `copy` / `cut` blocking                   | Small            |
| Force Allow Select | Aggressively resets styles to ensure selection works                 | May break layout |
| Force Allow Copy   | Aggressively resets styles to ensure copying works                   | May break layout |

## Effect Scope

Two ways to enable a mode:

- **Once (menu)** — Click the script menu items like "CSS Allow Select / Allow Select / Allow Copy". Takes effect on the current page only and resets after a page refresh.
  ![Menu](https://dk-bucket.dominic.dpdns.org/picgo/2026/09/021522-656.png)

- **Global (user config)** — Check the corresponding box in the script's user config. The choice is persisted and auto-applied on every page load; uncheck to disable.
  ![User Config](https://dk-bucket.dominic.dpdns.org/picgo/2026/09/021518-d92.png)

## Usage

1. Install the script (requires ScriptCat or Tampermonkey).
2. On a restricted page:
   - Click the script menu to quickly unlock the current page; or
   - Open the script's user config and check the desired mode for persistent global effect.
3. After switching modes, a non-blocking toast confirms it has taken effect.
  ![Effect Toast](https://dk-bucket.dominic.dpdns.org/picgo/2026/09/021523-db7.png)

## Technical Notes

- Built on the ScriptCat UI library (Arco) for toast notifications; all injected styles and event listeners are restorable and do not permanently pollute the page.
- Menu actions are one-time-only; global state saved in user config persists across page loads.

## Compatibility

Works with Chrome / Edge / Firefox / Safari / Opera (requires a matching userscript manager).

![Star History](https://www.star-history.com/?repos=Dominic-KK%2FAllow_Select_Copy&type=date&legend=top-left)