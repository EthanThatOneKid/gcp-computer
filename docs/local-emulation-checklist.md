# Local Emulation Checklist

Use this when production is not ready and you need a localhost demo path.

## Start Conditions
- `APP_MODE=local-emulated`
- `npm install`
- `npm run dev`

## Demo Flow
1. Open `http://localhost:3000`.
2. Confirm the page shows `Local Emulation`.
3. Sign in with credentials auth.
4. Create a new chat.
5. Send a prompt that triggers a command run.
6. Send a prompt that writes and reads a file.
7. Send a prompt that mounts a directory.
8. Reload the page and confirm the chat and sandbox still load.
9. Sign out and confirm you return to the login page.

## Pass Criteria
- Login works without Google credentials.
- Sandbox commands run inside the emulator, not on the host OS.
- Agent responses render without Gemini.
- Tool logs show up in the UI.
- The demo can be repeated after refresh.

If every item passes, the app is demo-ready on localhost.
