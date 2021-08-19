<div align="center">

<img src="assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS

[![GitHub release](https://img.shields.io/github/release/Thomas-Smyth/SquadJS.svg?style=flat-square)](https://github.com/Thomas-Smyth/SquadJS/releases)
[![GitHub contributors](https://img.shields.io/github/contributors/Thomas-Smyth/SquadJS.svg?style=flat-square)](https://github.com/Thomas-Smyth/SquadJS/graphs/contributors)
[![GitHub release](https://img.shields.io/github/license/Thomas-Smyth/SquadJS.svg?style=flat-square)](https://github.com/Thomas-Smyth/SquadJS/blob/master/LICENSE)

<br>

[![GitHub issues](https://img.shields.io/github/issues/Thomas-Smyth/SquadJS.svg?style=flat-square)](https://github.com/Thomas-Smyth/SquadJS/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/Thomas-Smyth/SquadJS.svg?style=flat-square)](https://github.com/Thomas-Smyth/SquadJS/pulls)
[![GitHub issues](https://img.shields.io/github/stars/Thomas-Smyth/SquadJS.svg?style=flat-square)](https://github.com/Thomas-Smyth/SquadJS/stargazers)
[![Discord](https://img.shields.io/discord/266210223406972928.svg?style=flat-square&logo=discord)](https://discord.gg/9F2Ng5C)

<br><br>
</div>

## **About**
SquadJS is a scripting framework, designed for Squad servers, that aims to handle all communication and data collection to and from the servers. Using SquadJS as the base to any of your scripting projects allows you to easily write complex plugins without having to worry about the hassle of RCON or log parsing. However, for your convenience SquadJS comes shipped with multiple plugins already built for you allowing you to experience the power of SquadJS right away.

## Versions and Releases
Whilst installing SquadJS you may do the following to obtain slightly different versions:
* Download the [latest release](https://github.com/Thomas-Smyth/SquadJS/releases/latest) - To get the latest **stable** version of SquadJS.
* Download/clone the [`master` branch](https://github.com/Thomas-Smyth/SquadJS/) - To get the most up to date version of SquadJS.

All changes proposed to SquadJS will be merged into the `master` branch prior to being released in the next stable version to allow for a period of larger-scale testing to occur. Therefore, we only recommend individuals who are willing to update regularly and partake in testing/bug reporting use the `master` branch. Please note, updates to the `master` branch will not be advertised in the SquadJS startup information, however, notifications of merged pull requests into the `master` branch may be found in our [Discord](https://discord.gg/9F2Ng5C). Once the `master` branch is deemed stable a release will be published and advertised via the SquadJS startup information and our [Discord](https://discord.gg/9F2Ng5C).

Releases will be given a version number with the format `v{major}.{minor}.{patch}`, e.g. `v3.1.4`. Changes to `{major}`/`{minor}`/`{patch}` will imply the following:
* `{major}` - The release contains a new/updated feature that is (potentially) breaking, e.g. changes to event outputs that may cause custom plugins to break.
* `{minor}` - The release contains a new/updated feature.
* `{patch}` - The release contains a bug fix.

Please note, `{minor}`/`{patch}` releases may still break SquadJS installations, however, this may be prevented with configuration changes and should not require custom plugins to be updated.

Release version numbers and changelogs are managed by [Release Drafter](https://github.com/marketplace/actions/release-drafter) which relies on the appropriate labels being applied to pull requests. Version numbers are updated in the `package.json` file manually prior to publishing the release draft.

The above policy was written and put into effect after the release of SquadJS v2.0.5. A major version bump to SquadJS v3.0.0 was made to signify this policy taking affect and to draw a line under the previous poor management of releases and version numbers.

## Credits
SquadJS would not be possible without the support of so many individuals and organisations. Our thanks goes out to:
* [SquadJS's contributors](https://github.com/Thomas-Smyth/SquadJS/graphs/contributors).
* [Thomas Smyth's GitHub sponsors](https://github.com/sponsors/Thomas-Smyth).
* subtlerod for proposing the initial log parsing idea, helping to design the log parsing process and for providing multiple servers to test with.
* Shanomac99 and the rest of the Squad Wiki team for providing us with [layer information](https://github.com/Squad-Wiki-Editorial/squad-wiki-pipeline-map-data).
* Fourleaf, Mex, various members of ToG / ToG-L and others that helped to stage logs and participate in small scale tests.
* Various Squad servers/communities for participating in larger scale tests and for providing feedback on plugins.
* Everyone in the [Squad RCON Discord](https://discord.gg/9F2Ng5C) and others who have submitted bug reports, suggestions, feedback and provided logs.

## License
```
Boost Software License - Version 1.0 - August 17th, 2003

Copyright (c) 2020 Thomas Smyth

Permission is hereby granted, free of charge, to any person or organization
obtaining a copy of the software and accompanying documentation covered by
this license (the "Software") to use, reproduce, display, distribute,
execute, and transmit the Software, and to prepare derivative works of the
Software, and to permit third-parties to whom the Software is furnished to
do so, all subject to the following:

The copyright notices in the Software and this entire statement, including
the above license grant, this restriction and the following disclaimer,
must be included in all copies of the Software, in whole or in part, and
all derivative works of the Software, unless such copies or derivative
works are solely in the form of machine-executable object code generated by
a source language processor.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO EVENT
SHALL THE COPYRIGHT HOLDERS OR ANYONE DISTRIBUTING THE SOFTWARE BE LIABLE
FOR ANY DAMAGES OR OTHER LIABILITY, WHETHER IN CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```
