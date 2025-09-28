# Top Care Fashion Mobile Documentation

This directory contains the Top Care Fashion mobile application built with **Expo 54** and **React Native 0.81**. The project uses TypeScript in strict mode and implements authentication flows and main tab navigation using React Navigation.

## ⚡ Quick Start

### Requirements
- Node.js 18 LTS or later (required by Expo 54)
- npm 9+ (or use pnpm/yarn, but ensure lockfile consistency)
- macOS with Xcode for iOS development on real devices/simulators
- Android Studio with at least one virtual device or a real device for Android development

(Optional) Install `expo-cli` globally with `npm install --global expo-cli` for the `expo` command; otherwise, use `npx expo`.

### Install Dependencies
```powershell
cd mobile
npm install
```

### Start Development Server
```powershell
npm start            # Open Expo DevTools, scan QR code to debug in Expo Go
npm run android      # Run directly on connected Android device/emulator
npm run ios          # Launch iOS simulator on macOS
npm run web          # Preview in browser using React Native for Web
```

Expo DevTools provides options to switch targets, view logs, enable hot reloading, and more.

## 📁 Directory Overview

```
mobile/
├── App.tsx                 # Navigation container with Stack/Tab configuration
├── index.ts                # Expo entry point, registers root component
├── app.json                # Expo project configuration (name, icons, platform settings)
├── package.json            # Scripts and dependency management
├── tsconfig.json           # TypeScript configuration (extends expo/tsconfig.base)
├── assets/                 # Local image assets (button icons, default avatars, etc.)
├── constants/
│   └── assetUrls.ts        # Supabase remote asset URLs and exported logo URLs
└── screens/
    ├── auth/               # Authentication flow: Splash, Landing, Login, Register, Forgot Password
    └── main/
        ├── DiscoverStack/
        ├── HomeStack/
        ├── InboxStack/
        ├── MyTopStack/     # User profile page (current tab navigation screen)
        └── SellStack/
```

> Except for `MyTopScreen`, other directories under `screens/main` are placeholders and can be populated with actual business pages incrementally.

## 🧭 Navigation and Page Structure

- `App.tsx` defines a headerless Stack Navigator: `Splash → Landing → Login/Register/ForgotPassword → Main`
- `MainTabs` currently registers only the `My TOP` tab; additional modules like Discover, Home, Sell, and Inbox can be added later
- `LoginScreen`, `RegisterScreen`, etc., use React Navigation's `navigation` prop to navigate between authentication flows
- `MyTopScreen` displays a user profile structure with mock data, leaving room for real data integration (`TODO` comments)

## 🧩 State and Data

- The project does not yet include global state management or backend integration; pages temporarily store inputs and mock data using `useState`
- All static assets are registered in `constants/assetUrls.ts`. Use the exported `ASSETS` object (or named exports such as `LOGO_FULL_COLOR`) instead of importing from `assets/` directly. A `REMOTE_ASSET_BASE_URL` is available if you need to reference Supabase-hosted files.

## 🎨 Design and Assets

- The `assets/` directory stores the raw source art (SVG/PNG). **Always expose assets via `constants/assetUrls.ts`** so runtime code has a single source of truth.
- Static SVG support is enabled by the combination of:
    - `metro.config.js` – removes `.svg` from `assetExts` and routes it through `react-native-svg-transformer`
    - `svg.d.ts` – TypeScript declaration so `import Logo from './logo.svg'` is typed as `React.FC<SvgProps>`
    - `react-native-svg` / `react-native-svg-transformer` – already listed in `package.json`
- Usage example:
    ```tsx
    import { LOGO_FULL_COLOR } from "../constants/assetUrls";

    export function BrandMark() {
        return <LOGO_FULL_COLOR width={160} height={48} />;
    }
    ```
 - SVG usage and notes:
     - The project supports importing `.svg` files directly as React components for use inside the app and for web. Use the centralized `constants/assetUrls.ts` exports (e.g., `LOGO_FULL_COLOR`) so screens import assets from one place.
     - Example: import `LOGO_FULL_COLOR` (a React component) and render it with `<LOGO_FULL_COLOR width={160} height={48} />`.
     - Important: for native app stores (Android/iOS) the OS and many build tools expect app icons and splash images to be bitmaps (PNG). Keep your production `app.json` icon and splash references pointing to PNG files (e.g., `./assets/icon.png`, `./assets/splash-icon.png`). You can still keep SVG sources in `assets/` for design and in-app rendering; convert to PNG during release/build step if needed.
 - Icon library (Ionicons) and recommended usage:
     - The app standardizes on Ionicons via `@expo/vector-icons`. There is a small wrapper at `mobile/components/Icon.tsx` that provides consistent defaults.
     - Quick usage examples:
         ```tsx
         // preferred: use the wrapper
         import Icon from '../components/Icon';

         // in JSX
         <Icon name="chevron-back" size={24} color="#111" />

         // or import directly from @expo/vector-icons when you need custom behavior
         import { Ionicons } from '@expo/vector-icons';
         <Ionicons name="person-circle" size={28} color="#F54B3D" />
         ```
- Web design mockups/screenshots are stored in `web/public/TOPApp/` and its subdirectories, serving as UI references for the mobile app.

### Brand Color
The primary brand color used in the app is **#F54B3D**. Ensure consistency across all UI components.

### Icons
The project standardizes on **Ionicons** via `@expo/vector-icons`. Import from `mobile/components/Icon` (see implementation) or directly from the package, and avoid ad-hoc unicode arrows in UI components.

## 🛠️ Build and Release

Expo provides multiple build options based on your needs:

```powershell
npx expo prebuild              # Generate native projects (if custom modules are needed)
npx expo run:android           # Build and install Android native app
npx expo run:ios               # Build iOS native app (requires macOS + Xcode)
# Cloud builds (EAS): Requires Expo account login
npx expo login
npx eas build --platform android   # Generate Android APK/AAB
npx eas build --platform ios       # Generate iOS build (requires macOS)
npx eas submit --platform android  # Optional: Submit to Play Console
npx eas submit --platform ios      # Optional: Submit to App Store Connect
```

Before building, update app icons, splash screen assets, and check `app.json` for version numbers, Bundle Identifier/Package Name, etc.

## 🔍 Debugging and Development Tips

- Use the **Logs** panel in Expo DevTools for real-time logs, or shake your device to open the developer menu
- For remote device testing behind firewalls, run `npm run tunnel` to start Expo with `--tunnel` automatically.
- TypeScript is configured with `strict` mode. Add type declarations for new files to maintain type safety.
- React Navigation 7 requires `@react-navigation/native` along with dependencies like `react-native-screens` and `react-native-safe-area-context`. Follow official documentation when adding new navigation stacks.
- For backend API calls, consider adding an `api.ts` file in `constants/` or using libraries like React Query for centralized management.

## ✅ Next Steps

- Integrate real authentication APIs and user profile data, replacing current mock data
- Complete app icon/splash screen assets in `assets/` to match `app.json` references
- Implement Discover, Home, Sell, and Inbox pages for the main tab navigation
- Add basic unit tests or UI tests (e.g., using Jest + React Native Testing Library)

For more information or suggestions for improving this documentation, feel free to create an issue in the repository or update this file directly.
