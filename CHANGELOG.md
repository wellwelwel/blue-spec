# Changelog

## [0.9.2](https://github.com/wellwelwel/lagune/compare/v0.9.1...v0.9.2) (2026-07-10)


### Miscellaneous Chores

* release 0.9.2 ([657c930](https://github.com/wellwelwel/lagune/commit/657c9304898a182c320b116c9ac2302cf7d3bf6b))

## [0.9.1](https://github.com/wellwelwel/blue-spec/compare/v0.9.0...v0.9.1) (2026-07-08)


### Bug Fixes

* ensure `/.bluespec/proofs` is git ignored on init ([9a36756](https://github.com/wellwelwel/blue-spec/commit/9a3675695efd6665f4e348e9116fc2132f657fc0))
* mark scaffolded commands as internal (skills.sh convention) ([735369e](https://github.com/wellwelwel/blue-spec/commit/735369ed1ae71133c66fd6ce5ad19efc9b021454))
* remove `all` skill management ([db47814](https://github.com/wellwelwel/blue-spec/commit/db4781443b57d408c925dad89a010f7b8ee022ef))

## [0.9.0](https://github.com/wellwelwel/blue-spec/compare/v0.8.0...v0.9.0) (2026-07-06)


### Features

* create `bluespec` universal command ([2934e95](https://github.com/wellwelwel/blue-spec/commit/2934e953861d3a168fd9e3d1155198b522a9460f))
* improve sub-skill listing for weaker agents ([8c69d9d](https://github.com/wellwelwel/blue-spec/commit/8c69d9d2ed148fd9e0c17e03719fc3435153d1f7))
* introduce a local and private Dashboard ([#11](https://github.com/wellwelwel/blue-spec/issues/11)) ([4a3f07b](https://github.com/wellwelwel/blue-spec/commit/4a3f07beb8167018fb94d645426d7467a28e2fa5))
* keep the history of all past runs ([73e9393](https://github.com/wellwelwel/blue-spec/commit/73e9393c7038b83fa2ae77c712b34cca9bd26243))
* **plan:** rate each finding by CVSS v4.0 category and score ([f13acd9](https://github.com/wellwelwel/blue-spec/commit/f13acd9909fa0d20f7353d2db9d9ab261daacb19))


### Bug Fixes

* **dashboard:** improve history layout ([aa22aa8](https://github.com/wellwelwel/blue-spec/commit/aa22aa8ecc0bc72ed7dd70408cab20e3bea7ee52))
* ensure `bluespec` universal command is git ignored by default ([c40ecad](https://github.com/wellwelwel/blue-spec/commit/c40ecad978f19e8124c933ba3e31c21d16e3e6d3))

## [0.8.0](https://github.com/wellwelwel/blue-spec/compare/v0.7.0...v0.8.0) (2026-07-02)


### Features

* **cli:** add `pull` command to reinstall Blue Spec from the manifest ([9d288b1](https://github.com/wellwelwel/blue-spec/commit/9d288b1c6888c7e2dbc70e5cd0384cfee4d3dc6d))
* mature the `harden` command through charter's principles ([4e27678](https://github.com/wellwelwel/blue-spec/commit/4e27678f473f5257fa2d7d2da324b74f6bd6b4c3))
* mature the `verify` command ([61583d1](https://github.com/wellwelwel/blue-spec/commit/61583d15b6a3027c9210240209aa18125c4bdf35))


### Bug Fixes

* condense Skills and commands descriptions ([0399b27](https://github.com/wellwelwel/blue-spec/commit/0399b27e57733888ef79de0d6b6d05e36c445a94))

## [0.7.0](https://github.com/wellwelwel/blue-spec/compare/v0.6.0...v0.7.0) (2026-06-30)


### Features

* **cli:** add `update` command ([39fdac3](https://github.com/wellwelwel/blue-spec/commit/39fdac33a3a8db943c417180fda6aab3ec34931d))
* mature the `detect` command ([9478325](https://github.com/wellwelwel/blue-spec/commit/9478325da5134f84d4635c3b5bc8f80031897f06))
* mature the `plan` command ([d0493b5](https://github.com/wellwelwel/blue-spec/commit/d0493b568c27913ab060e0e11b2103c1ca25a77b))


### Bug Fixes

* align `harden` with the new `plan` apprach ([22e2c40](https://github.com/wellwelwel/blue-spec/commit/22e2c402c42184986320eda5a0b7e9f9bc425d0b))
* **cli:** improve `init` DX ([db48e8d](https://github.com/wellwelwel/blue-spec/commit/db48e8dbf4cfa66eb86bbedb95029922c5c053c4))
* **hooks:** improve output for agents and humans ([96de8e7](https://github.com/wellwelwel/blue-spec/commit/96de8e74f373254081212397f0e7925d2025c133))
* improve templates overview ([c754613](https://github.com/wellwelwel/blue-spec/commit/c754613da39ad66b0bf88a1e95ad3d1189c87b34))

## [0.6.0](https://github.com/wellwelwel/blue-spec/compare/v0.5.0...v0.6.0) (2026-06-26)


### Features

* add comprehensive specialization in `OWASP` tracks ([31fe9c9](https://github.com/wellwelwel/blue-spec/commit/31fe9c9c369a1eb79f574e4673cf36ade3b280cc))
* add specialization in `.NET` defense ([7397bb7](https://github.com/wellwelwel/blue-spec/commit/7397bb7fd81deaab555a86995ff3059376a03452))
* add specialization in `Infrastructure` defense ([7017420](https://github.com/wellwelwel/blue-spec/commit/7017420cecad03483229cf3423407509eb422700))
* add specialization in `LLM` defense ([0e42f47](https://github.com/wellwelwel/blue-spec/commit/0e42f475e4f428d8e395b5d53f693e7422202d3c))
* add specialization in `Lovable` and `Supabase` defense ([1dd1977](https://github.com/wellwelwel/blue-spec/commit/1dd19771492a0eb848a462f7714443da201ef169))
* improve CLI layout and interactivity (`TTY`) ([df3fb95](https://github.com/wellwelwel/blue-spec/commit/df3fb95a5cf986e50f4de341eab73d7712bb0194))


### Bug Fixes

* drop `list` hook ([b517f4d](https://github.com/wellwelwel/blue-spec/commit/b517f4d49b61d06d06efa52761b1e1af860793d8))

## [0.5.0](https://github.com/wellwelwel/blue-spec/compare/v0.4.0...v0.5.0) (2026-06-26)


### Features

* add specialization in `C` and `C++` defense ([e274060](https://github.com/wellwelwel/blue-spec/commit/e274060d1b1e0051bd4931f78cf28e3799eb8ff6))
* add specialization in `Golang` defense ([8d5737f](https://github.com/wellwelwel/blue-spec/commit/8d5737f4a715c9c29186f55b8d28c903eabac53a))
* add specialization in `Java` defense ([b7708af](https://github.com/wellwelwel/blue-spec/commit/b7708afbfd4aefca67066d78535f4affee07c305))
* add specialization in `PHP` defense ([ac264e8](https://github.com/wellwelwel/blue-spec/commit/ac264e8879c513c178c5f95b2d1660c37e5e80df))
* add specialization in `Python` defense ([d3bb5f4](https://github.com/wellwelwel/blue-spec/commit/d3bb5f420b11c3731e181792357932fdd02d2156))
* add specialization in `Ruby` defense ([740b5f4](https://github.com/wellwelwel/blue-spec/commit/740b5f43e63a1ad047b2829826cd227a7ff20d88))
* add specialization in `Rust` defense ([cead4b5](https://github.com/wellwelwel/blue-spec/commit/cead4b55bb02a9869f11e8635fa6916ae6e770cb))
* add specialization in SSRF defense ([be1baba](https://github.com/wellwelwel/blue-spec/commit/be1babaf63a11520cbdfb35b33c7a36ab6c6b584))
* support skills by categories ([a04b969](https://github.com/wellwelwel/blue-spec/commit/a04b969f08fc925456cd618f7857061c8bee6f5f))

## [0.4.0](https://github.com/wellwelwel/blue-spec/compare/v0.3.0...v0.4.0) (2026-06-24)


### Features

* create security reports and PoCs from detections ([#5](https://github.com/wellwelwel/blue-spec/issues/5)) ([cf9eafe](https://github.com/wellwelwel/blue-spec/commit/cf9eafe095ee98f20796f395703f2d888984d14f))

## [0.3.0](https://github.com/wellwelwel/blue-spec/compare/v0.2.0...v0.3.0) (2026-06-22)


### Features

* **cli:** search for agents dynamically ([#3](https://github.com/wellwelwel/blue-spec/issues/3)) ([18b88c4](https://github.com/wellwelwel/blue-spec/commit/18b88c49bc76b506032892e4392e36ab56ff9406))
* mature the `charter` command ([4f463f3](https://github.com/wellwelwel/blue-spec/commit/4f463f3b66bd5b36551c080d2eab73d2a8f61908))

## [0.2.0](https://github.com/wellwelwel/blue-spec/compare/v0.1.1...v0.2.0) (2026-06-19)


### Features

* initial commit ([96f1ff5](https://github.com/wellwelwel/blue-spec/commit/96f1ff538803b5b99857a065db55552405071cfe))
* user-defined sub-skills via `/bluespec.specialize` ([dfc62c3](https://github.com/wellwelwel/blue-spec/commit/dfc62c33097a51ba419fcc4c950b3cbd3acb8fca))


### Bug Fixes

* flexibilize sub-skills rules ([6ae766b](https://github.com/wellwelwel/blue-spec/commit/6ae766b6ab4cb087491752f06d07c9569da51969))


### Miscellaneous Chores

* release 0.1.2 ([2650f3b](https://github.com/wellwelwel/blue-spec/commit/2650f3b13eb226f1e99fffb244c72e817fc30eb1))
* release 0.2.0 ([e5cae65](https://github.com/wellwelwel/blue-spec/commit/e5cae657a333641162144aa03b78f0c4e2cfaff3))
