# Vault Cleaner

A concise Obsidian plugin focused on identifying and cleaning empty directories and unlinked files with smart pattern matching and multi-language support.

## Features

- 🔍 **Smart Scanning**: Automatically identifies empty directories and unlinked files
- 🎯 **Pattern Matching**: Regex-based file pattern matching with cleanable and protected patterns
- 🛡️ **Safe Protection**: Automatically excludes referenced files and Obsidian-supported formats
- 🌐 **Multi-language**: Full support for English and Chinese interfaces
- ⚙️ **Configurable**: Customizable scan depth, file size limits, and exclusion rules
- ✅ **Batch Operations**: Support for bulk selection and deletion
- 💡 **Clean Interface**: Minimalist design following Obsidian's UI principles

## Installation

### Manual Installation

1. Download the latest release from the releases page
2. Extract the files to your Obsidian plugins directory: `{vault}/.obsidian/plugins/vault-cleaner/`
3. Enable "Vault Cleaner" in Obsidian's Community Plugins settings

### Development Installation

1. Clone this repository to your plugins directory
2. Run `pnpm install` to install dependencies
3. Run `pnpm run build` to build the plugin
4. Enable the plugin in Obsidian

## Usage

### Basic Usage

1. **Open the Plugin**:
   - Click the trash can icon in the sidebar
   - Or use Command Palette and search for "Clean Files"

2. **Scan Files**:
   - Click "Start Scan" button
   - Wait for the scanning process to complete

3. **Review and Delete**:
   - Review the scan results
   - Select items you want to delete
   - Click "Delete Selected Items"
   - Confirm the deletion operation

### Configuration

Access plugin settings through Obsidian's Settings → Community Plugins → Vault Cleaner.

#### Pattern Settings

- **Cleanable File Patterns**: Regex patterns for files that can be cleaned (e.g., `\\.tmp$|\\.log$`)
- **Protected File Patterns**: Regex patterns for files that should never be cleaned (e.g., `\\.md$|\\.canvas$`)

#### Scan Settings

- **Scan Depth**: Maximum directory depth to scan (default: 10)
- **Minimum File Size**: Minimum file size in bytes to consider for cleaning (default: 0)
- **Exclude Hidden Files**: Whether to exclude hidden files from scanning
- **Include Empty Directories**: Whether to include empty directories in scan results

#### Example Patterns

The plugin includes built-in examples for common Obsidian file types:
- Core files: `\\.md$|\\.canvas$`
- Config files: `\\.obsidian/.*\\.json$`
- Plugin files: `\\.obsidian/plugins/.*\\.(js|css)$`
- Theme files: `\\.obsidian/themes/.*\\.css$`
- Cache files: `\\.obsidian/.*\\.cache$`

## Safety Features

- ✅ **Reference Protection**: Files referenced by Obsidian are never marked for deletion
- ✅ **Confirmation Required**: All deletions require user confirmation
- ✅ **Detailed Preview**: Shows exactly what will be deleted before confirmation
- ✅ **Pattern Protection**: Protected patterns override cleanable patterns
- ✅ **Error Handling**: Comprehensive error handling and logging

## Scanning Logic

### Files That May Be Cleaned:
- Empty directories
- Files matching cleanable patterns (e.g., `.tmp`, `.log`, `.cache`)
- Unreferenced files that don't match protected patterns
- Files below minimum size threshold (if configured)

### Files That Are Protected:
- Files referenced by any Obsidian note or canvas
- Files matching protected patterns
- Files below minimum file size (if configured)
- Hidden files (if exclusion is enabled)

## Development

### Requirements

- Node.js 16+
- pnpm package manager

### Development Commands

```bash
# Install dependencies
pnpm install

# Development mode (watch for changes)
pnpm run dev

# Build production version
pnpm run build

# Version bump
pnpm version patch
```

### Project Structure

```
vault-cleaner/
├── src/
│   ├── main.ts              # Plugin entry point
│   ├── scanner.ts           # File scanning service
│   ├── ui.ts               # User interface components
│   ├── settings.ts         # Settings configuration
│   ├── types.ts            # TypeScript type definitions
│   └── i18n/               # Internationalization
│       ├── I18nManager.ts  # Language manager
│       ├── en-US.json      # English translations
│       └── zh-CN.json      # Chinese translations
├── styles.css              # Plugin styles
├── manifest.json           # Plugin manifest
├── package.json            # Project configuration
├── tsconfig.json           # TypeScript configuration
├── esbuild.config.mjs      # Build configuration
└── README.md               # This file
```

### Key Components

- **FileScanner**: Core scanning logic with pattern matching and reference detection
- **UI Manager**: Interface components for scan results and user interactions
- **Settings Manager**: Configuration interface with pattern examples
- **I18n Manager**: Multi-language support system

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Guidelines

- Follow TypeScript best practices
- Maintain code formatting with 4-space indentation
- Add appropriate comments for complex logic
- Test thoroughly before submitting PRs
- Use Chinese for git commit messages (project convention)

## License

MIT License

## Changelog

### v0.1.0
- Initial release
- Basic scanning and deletion functionality
- Regex pattern matching system
- Multi-language support (English/Chinese)
- Configurable settings interface
- Safe deletion with confirmation
- Reference protection system

## Support

If you encounter any issues or have feature requests, please create an issue on the GitHub repository.