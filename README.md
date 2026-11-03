# dsh ui declutter

a cleaner interface for deepseek harness, with a model and effort picker, access menu, and smoother motion.

## install

download or clone this repo, open its folder in powershell, and run:

```powershell
dsh.cmd plugin --profile desktop add (Resolve-Path '.').Path
```

restart deepseek harness. keep the folder in place after installing.

## approve for me

this is optional. to enable it, run from the same folder:

```powershell
dsh.cmd plugin --profile desktop add (Resolve-Path './local-dsh-codex-reviewer-0.1.12-local.tgz').Path
```

restart deepseek harness again. the option is greyed out if the reviewer is unavailable.

the reviewer is adapted from [dsh-approval-llm](https://github.com/Letter2025/dsh-approval-llm); its mit license is included in the package. it sends relevant instructions and tool arguments to your model provider and uses tokens. it can make mistakes, and falls back to asking you if it cannot review a request. it has not been tested with a real approval request end to end, so try it in a disposable workspace first.

tested with deepseek harness desktop 0.2.1-rc.5. other versions may behave differently.
