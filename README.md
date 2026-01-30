# 🎲 Die! By the Browser

### *Velocity-First Dice Rolling*
A free (in all senses), lightweight, zero-dependency, single-file web utility designed for tabletop RPG players who prioritize speed over 3D animations.

---

## 🚀 The Vision: Why this exists

**Die! By the Browser** was born from a vision of a "simple HTML app" that solves the "Input Velocity" problem. By utilizing a custom-built virtual keypad designed specifically for dice notation on small touchscreen devices, it acts like a calculator for your tabletop sessions — getting you the results as fast as your thumbs can move. Physical keyboards are also supported for maximum utility.  

## ✨ Key Features

* **Custom Virtual Keypad**: optimized for mobile devices which uses a "text input that isn't a text input" strategy. This prevents the native mobile keyboard from popping up, allowing for rapid-fire entry of number of dice, "d", and die size.
* **Deep-Link State**: The app synchronizes your input with the URL hash whenever you roll the dice. You can bookmark favourite combinations or share a link to a specific configuration with your party.
* **Zero Dependencies**: Written in pure vanilla JavaScript, CSS, and HTML. No frameworks, no trackers, and no external requests.
* **Offline by Design**: As a single self-contained file, it is naturally offline-compatible. It works in basements, on planes, or in convention centers with zero connectivity.
* **User Agency (View-Mode Overrides)**: Includes a manual override menu to force "Mobile Mode" on tablets or "Desktop Mode" on phones, ensuring the user — not the device — can choose the interface.
* **Integrated Test Suite**: Features a built-in headless test runner to ensure logic integrity and state persistence across all platforms.



## 🛠 Technical Highlights

* **Namespace Architecture**: Organized as a modular `DiceApp` object to ensure clean separation of concerns between state management, UI rendering, and parsing logic.
* **State-to-URL Sync**: A bidirectional synchronization logic that ensures the UI, the internal state, and the browser's navigation history stay aligned.
* **Regex-Based Parser**: A robust parser handles standard RPG notation while strictly validating inputs to prevent broken rolls.
* **Dual-Input Sync**: Sophisticated event handling maintains cursor position and string integrity whether using a physical keyboard or the custom virtual keypad.

## 📜 License: AGPLv3 (The "Pay It Forward" Shield)

This project is licensed under the **GNU Affero General Public License v3**.

I chose this license specifically to ensure that this tool remains a shared community resource. It follows a **Reciprocity** model:

1.  **Free to use**: Anyone can use, host, and share this tool.
2.  **Free to modify**: Anyone can modify this tool, and share those modifications with the community. 
3.  **Pay It Forward**: Whether hosting it on a network or distributed via other means, modifications to this code are legally required to be shared back with the community.
4.  **No "Closed" Commercialization**: This prevents the logic from being locked away in a proprietary "Pro" version without contributing to the open-source original.

---
*Created with the philosophy that utility should never be sacrificed.*
