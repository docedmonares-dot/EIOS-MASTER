const GEOLOCATION_ERROR_REASONS = [
  "UNKNOWN",
  "PERMISSION_DENIED",
  "POSITION_UNAVAILABLE",
  "TIMEOUT",
];

export function captureDeviceLocation(options = {}) {
  const navigatorApi = globalThis.navigator;
  const capturedAt = () => new Date().toISOString();

  if (!navigatorApi?.geolocation) {
    return Promise.resolve({
      status: "unavailable",
      reason: "GEOLOCATION_NOT_SUPPORTED",
      secure_context: globalThis.isSecureContext === true,
      captured_at: capturedAt(),
    });
  }

  return new Promise((resolve) => {
    navigatorApi.geolocation.getCurrentPosition(
      (position) => resolve({
        status: "captured",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        secure_context: globalThis.isSecureContext === true,
        captured_at: new Date(position.timestamp).toISOString(),
      }),
      (error) => resolve({
        status: "unavailable",
        reason: GEOLOCATION_ERROR_REASONS[error.code] || "UNKNOWN",
        message: error.message || null,
        secure_context: globalThis.isSecureContext === true,
        captured_at: capturedAt(),
      }),
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 30000,
      }
    );
  });
}
