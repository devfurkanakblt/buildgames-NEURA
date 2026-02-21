**COMMAND:** Create the **"Neural Interface" (Dashboard)** Component using Next.js & Tailwind.

**VISUAL REQUIREMENTS:**
1.  **Layout:** A grid of "Data Cards". Each card looks like a holographic projection.
2.  **Card Content:** - Display the Image (from IPFS).
    - Show "Reward: 0.5 AVAX".
    - Two neon buttons: "YES" (Green/Cyan) and "NO" (Red/Pink).
3.  **Animations:** Use `Framer Motion`. The cards should "glitch" slightly on hover or fade in smoothly.
4.  **Web3 Integration:** - Connect the "YES/NO" buttons to the `submitSignal` function in the smart contract using Wagmi hooks.
    - Show a loading spinner that looks like a "Neural Processing" bar.

**CODE STRUCTURE:** - Provide the full `TaskCard.tsx` component.
- Ensure it handles the "Loading" and "Success" states visually.