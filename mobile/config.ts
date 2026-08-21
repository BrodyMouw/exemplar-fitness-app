// Set EXPO_PUBLIC_API_BASE in mobile/.env - see .env.example.
//
// A physical device can't reach "localhost", so this needs your machine's LAN
// IP (or http://10.0.2.2:5002 for the Android emulator). The fallback only
// suits a simulator running on the same machine as the API.
export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:5002";
