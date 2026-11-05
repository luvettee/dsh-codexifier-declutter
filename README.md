# dsh ui declutter

a cleaner interface for deepseek harness, with a model and effort picker, access menu, and smoother motion.

## install

download or clone this repo, open its folder in powershell, and run:

```powershell
dsh.cmd plugin --profile desktop add (Resolve-Path '.').Path
```

restart deepseek harness. keep the folder in place after installing.

## appearance

open settings → **appearance** to pick a background for the start page and chats:

- **ocean**: ascii sharks, with a species picker
- **silk** and **waves**: webgl shaders
- **custom**: your own png or video, kept across restarts

there's also an optional **glass ask bar** with transparency and blur sliders. everything is off by default. animation pauses when the window is hidden and respects reduced motion.

the background engines live in `src/appearance/` and get bundled into `client.js`. after editing them, run `node scripts/build-appearance.mjs`.

## approve for me

enable **auto authorization review** in deepseek harness's experimental plugins. the option is greyed out until it is available.

deepseek's experimental reviewer uses your current model to review supported tool calls. approved calls run with full access, reviews use additional tokens, and the model can make mistakes. no separate reviewer plugin is required.

tested with deepseek harness desktop 0.2.1-rc.5. other versions may behave differently.
