# Lean Dark+ (Community Edition)

A minimalist dark mode browser extension based on Dark Reader, focused on fast performance and reduced distraction.

## Features

- Smart dark theming without harsh color inversion.
- Per-site toggles and custom brightness, contrast, and color scheme controls.
- Full Chrome Manifest V3 (Service Worker) and Firefox support.
- Clean popup interface with zero clutter.

## Installation

### From Release
1. Download `dr-chrome-mv3.zip` from [Releases](https://github.com/sambukuper/modern-darkreader-community/releases).
2. Extract the archive into a folder.
3. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the extracted folder.

### Build from Source
1. Clone the repository:
   ```bash
   git clone https://github.com/sambukuper/modern-darkreader-community.git
   cd modern-darkreader-community
   ```
2. Install dependencies:
   ```bash
   pnpm install
   # or: npm install
   ```
3. Build for Chrome (Manifest V3):
   ```bash
   npm run build -- --release --chrome-mv3
   ```
   Or for Firefox:
   ```bash
   npm run build -- --release --firefox
   ```
4. Load the output directory (`build/release/chrome-mv3`) into your browser as an unpacked extension.

## License

MIT - see [LICENSE](LICENSE) for details.