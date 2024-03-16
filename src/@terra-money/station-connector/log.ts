export function log(message: string, extra?: any) {
  if (window.station?.debugMode) {
    console.log(`🛰️ STATION EXTENSION: ${message}`, extra)
  }
}
