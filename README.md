# Nipah

**A highly customizable terminal emulator for Windows.**

Nipah is a concept for a modern Windows terminal built around the visual language of Windows 11 and the freedom to customize almost everything.

The goal is to combine a comfortable, familiar interface with a powerful terminal experience, playful details, and tools that let users make the application their own.

> **Project status:** Concept / pre-development. Nipah is not ready for everyday use yet. The features described below are planned ideas, not implemented functionality.

## Vision

Nipah aims to be more than a terminal with a different color scheme. It should provide a flexible workspace that can adapt to different workflows and personal styles.

The visual direction takes inspiration from Windows 11 and Fluent Design:

- Rounded surfaces and thoughtful spacing.
- Optional Mica and Acrylic-inspired materials.
- Smooth, configurable animations.
- Light and dark appearance modes.
- User-defined accent colors and palettes.

The interface should remain useful and readable whether it is minimally configured or heavily customized.

## Planned features

All features in this section are part of the current concept and may change during development.

### Terminal

- Run real shell sessions instead of simulating command execution.
- PowerShell support as the primary experience.
- Multiple terminal tabs.
- Configurable terminal profiles.
- A foundation for additional shells in the future.

### Deep customization

- Custom colors and complete color palettes.
- Font family, size, and text appearance settings.
- Cursor style and behavior.
- Background colors and images.
- Transparency and visual effects.
- Configurable animations.
- Customizable panels and layouts.
- Import and export of themes and configuration presets.

### Friendly Errors

PowerShell errors can be intimidating and difficult to read. Nipah is planned to offer alternative visual presentations for common errors.

Possible modes:

- **Original** — show the original shell output.
- **Friendly** — explain errors in clearer language.
- **Funny** — use playful messages and optional character reactions.

The original error details should remain accessible. Friendly presentation must not change how PowerShell executes commands, its exit codes, or the underlying error information.

### Nipah Pets

Optional desktop-style companions that react to terminal activity.

The concept includes:

- Character animations and different moods.
- Reactions to commands, successful operations, errors, and idle time.
- A classic offline mode with predefined phrases.
- An optional AI-powered mode for generated reactions.
- Customizable characters, appearance, and reaction frequency.

One character idea is a chibi Civil Protection officer inspired by the world of *Half-Life 2*.

### Secret themes and easter eggs

Nipah may include hidden themes activated by special commands.

The current concept includes a `freeman` easter egg: a Combine-inspired interface theme with matching warning and error presentation. A `normal` command may return to the regular appearance.

These are optional visual easter eggs and should never interfere with normal shell commands.

## Design principles

1. **Customization first.** Users should be able to shape the interface to their preferences.
2. **Real terminal behavior.** Nipah should host real shell processes, not imitate a command prompt.
3. **Clarity.** Custom error presentation must preserve access to the original diagnostic information.
4. **Optional extras.** Pets, AI reactions, effects, and playful features should be configurable or disableable.
5. **User control.** Themes and visual settings should be easy to save, share, and restore.

## Technology direction

The current technical direction for the Windows version is:

- **C# and WinUI 3** for the native Windows application.
- **Windows Pseudo Console (ConPTY)** for hosting real terminal processes.
- **WebView2 and xterm.js** as a possible terminal rendering layer.

This architecture is a starting point for investigation, not a final implementation decision.

## Roadmap

The roadmap will be refined as the concept develops.

- [x] Create the repository.
- [x] Add the MIT license.
- [x] Add a project-specific .gitignore.
- [ ] Finalize the product concept and interface direction.
- [ ] Define the application architecture.
- [ ] Create the initial Windows application.
- [ ] Implement a working terminal session.
- [ ] Add tabs and terminal profiles.
- [ ] Build the appearance and theme system.
- [ ] Explore Friendly Errors.
- [ ] Prototype Nipah Pets.

## License

Nipah is licensed under the [MIT License](LICENSE).

---

Nipah is an independent project. Product ideas, features, and technical decisions may evolve as the project moves from concept to implementation.
