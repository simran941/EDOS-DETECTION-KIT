# Live Console App (minimal)
This ZIP contains a minimal React + Vite project with the `LiveConsolePage` component.

How to run:
1. Ensure Node.js (16+) and npm are installed.
2. Extract the ZIP.
3. Run:
   ```
   npm install
   npm run dev
   ```
4. Open `http://localhost:5173` (Vite default) to view.

Notes:
- The page supports either a mock local stream (default) or a real WebSocket. Leave the WS URL input empty to use the mock.
- The component uses Tailwind-style classes; a full Tailwind setup is NOT included. The minimal `styles.css` provides acceptable fallback visuals.
