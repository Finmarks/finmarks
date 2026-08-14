# Changelog

All notable changes to the `Finmarks` package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

While the package is `0.x`, minor version bumps (`0.1.0` → `0.2.0`) may
include breaking changes to the API or dataset shape; patch bumps
(`0.1.0` → `0.1.1`) are additive or fix-only. Once `1.0.0` ships, standard
semver applies.

## [Unreleased]

## [0.1.0] - Unreleased

### Added

- Initial `Finmarks` package: entity dataset, JSON Schema validation,
  `getEntity`/`search`/category and IFSC/UPI lookup helpers.
- CI pipeline: schema validation and dist-staleness check on every PR,
  npm publish and CDN deploy on release.
