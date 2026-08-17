import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import { io } from "socket.io-client";

import "leaflet/dist/leaflet.css";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5050";

const DEFAULT_CENTER = [
  12.8797,
  121.774,
];

const GPS_QUEUE_KEY =
  "eios_gps_queue";

/* =========================================================
   NORMALIZE ENUMERATOR PAYLOAD
========================================================= */

function normalizeEnumerators(payload) {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return Object.entries(payload).map(
    ([id, data]) => ({
      id,
      ...data,
    })
  );
}

/* =========================================================
   MARKER COLOR
========================================================= */

function getMarkerColor(status) {
  switch (
    String(status || "").toLowerCase()
  ) {
    case "active":
    case "moving":
    case "surveying":
      return "#16a34a";

    case "idle":
      return "#f59e0b";

    case "offline":
      return "#dc2626";

    default:
      return "#2563eb";
  }
}

/* =========================================================
   READ CURRENT USER
========================================================= */

function getCurrentUser() {
  try {
    const rawUser =
      localStorage.getItem(
        "eios_user"
      );

    if (!rawUser) {
      return null;
    }

    return JSON.parse(rawUser);
  } catch (error) {
    console.error(
      "Unable to read EIOS user:",
      error
    );

    return null;
  }
}

/* =========================================================
   GPS OFFLINE QUEUE
========================================================= */

function readGpsQueue() {
  try {
    const rawQueue =
      localStorage.getItem(
        GPS_QUEUE_KEY
      );

    if (!rawQueue) {
      return [];
    }

    const parsedQueue =
      JSON.parse(rawQueue);

    return Array.isArray(parsedQueue)
      ? parsedQueue
      : [];
  } catch (error) {
    console.error(
      "Unable to read GPS queue:",
      error
    );

    return [];
  }
}

function saveGpsQueue(queue) {
  localStorage.setItem(
    GPS_QUEUE_KEY,
    JSON.stringify(queue)
  );
}

function queueGpsPayload(payload) {
  const existingQueue =
    readGpsQueue();

  existingQueue.push(payload);

  /*
   * Prevent unlimited browser storage growth.
   * Keep only the newest 2,000 GPS points.
   */
  const trimmedQueue =
    existingQueue.slice(-2000);

  saveGpsQueue(trimmedQueue);
}

/* =========================================================
   MAP RECENTER CONTROLLER
========================================================= */

function MapLocationController({
  location,
}) {
  const map = useMap();

  const centeredRef =
    useRef(false);

  useEffect(() => {
    if (
      !location ||
      centeredRef.current
    ) {
      return;
    }

    map.flyTo(
      [
        location.latitude,
        location.longitude,
      ],
      16,
      {
        animate: true,
        duration: 1.5,
      }
    );

    centeredRef.current = true;
  }, [
    location,
    map,
  ]);

  return null;
}

/* =========================================================
   LIVE OPERATIONS MAP
========================================================= */

export default function LiveOperationsMap() {
  const [
    enumerators,
    setEnumerators,
  ] = useState([]);

  const [
    socketConnected,
    setSocketConnected,
  ] = useState(false);

  const [
    currentLocation,
    setCurrentLocation,
  ] = useState(null);

  const [
    locationError,
    setLocationError,
  ] = useState("");

  const [
    gpsQueueCount,
    setGpsQueueCount,
  ] = useState(
    () => readGpsQueue().length
  );

  const socketRef =
    useRef(null);

  const latestPayloadRef =
    useRef(null);

  /* =======================================================
     SOCKET CONNECTION
  ======================================================= */

  useEffect(() => {
    const socket =
      io(SOCKET_URL, {
        transports: [
          "websocket",
          "polling",
        ],

        auth: {
          token:
            localStorage.getItem(
              "eios_token"
            ),
        },
      });

    socketRef.current =
      socket;

    socket.on(
      "connect",
      () => {
        setSocketConnected(true);

        const queuedPayloads =
          readGpsQueue();

        queuedPayloads.forEach(
          (payload) => {
            socket.emit(
              "gps-update",
              payload
            );
          }
        );

        if (
          queuedPayloads.length > 0
        ) {
          saveGpsQueue([]);
          setGpsQueueCount(0);
        }

        if (
          latestPayloadRef.current
        ) {
          socket.emit(
            "gps-update",
            latestPayloadRef.current
          );
        }
      }
    );

    socket.on(
      "disconnect",
      () => {
        setSocketConnected(false);
      }
    );

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "GPS socket connection error:",
          error.message
        );

        setSocketConnected(false);
      }
    );

    socket.on(
      "supervisor-update",
      (payload) => {
        console.log(
          "LIVE GPS PAYLOAD:",
          payload
        );

        setEnumerators(
          normalizeEnumerators(
            payload
          )
        );
      }
    );

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off(
        "connect_error"
      );
      socket.off(
        "supervisor-update"
      );

      socket.disconnect();

      socketRef.current =
        null;
    };
  }, []);

  /* =======================================================
     LIVE BROWSER GPS
  ======================================================= */

  useEffect(() => {
    if (
      !navigator.geolocation
    ) {
      setLocationError(
        "Geolocation is not supported by this browser."
      );

      return undefined;
    }

    const currentUser =
      getCurrentUser();

    const watchId =
      navigator.geolocation.watchPosition(
        (position) => {
          const latitude =
            Number(
              position.coords.latitude
            );

          const longitude =
            Number(
              position.coords.longitude
            );

          const accuracy =
            Number(
              position.coords.accuracy
            );

          const location = {
            latitude,
            longitude,
            accuracy:
              Number.isFinite(
                accuracy
              )
                ? accuracy
                : null,

            altitude:
              position.coords
                .altitude ?? null,

            altitude_accuracy:
              position.coords
                .altitudeAccuracy ??
              null,

            heading:
              position.coords
                .heading ?? null,

            speed:
              position.coords
                .speed ?? null,

            captured_at:
              new Date(
                position.timestamp
              ).toISOString(),
          };

          setCurrentLocation(
            location
          );

          setLocationError("");

          const payload = {
            user_id:
              currentUser
                ?.user_id ??
              currentUser?.id ??
              null,

            enumerator_id:
              currentUser
                ?.enumerator_id ??
              null,

            full_name:
              currentUser
                ?.full_name ??
              currentUser?.name ??
              "Current User",

            role:
              currentUser
                ?.backendRole ??
              currentUser?.role ??
              null,

            status:
              "active",

            latitude,
            longitude,

            accuracy:
              location.accuracy,

            altitude:
              location.altitude,

            altitude_accuracy:
              location
                .altitude_accuracy,

            heading:
              location.heading,

            speed:
              location.speed,

            captured_at:
              location.captured_at,

            source:
              "browser_geolocation",

            is_offline:
              !navigator.onLine,
          };

          latestPayloadRef.current =
            payload;

          const socket =
            socketRef.current;

          if (
            navigator.onLine &&
            socket?.connected
          ) {
            socket.emit(
              "gps-update",
              payload
            );
          } else {
            queueGpsPayload(
              payload
            );

            setGpsQueueCount(
              readGpsQueue()
                .length
            );
          }
        },

        (error) => {
          let message =
            error.message ||
            "Unable to read the current location.";

          if (
            error.code === 1
          ) {
            message =
              "Location permission was denied. Please allow location access in Chrome.";
          }

          if (
            error.code === 2
          ) {
            message =
              "Your current location is unavailable.";
          }

          if (
            error.code === 3
          ) {
            message =
              "The GPS request timed out.";
          }

          setLocationError(
            message
          );

          console.error(
            "LIVE GPS ERROR:",
            {
              code: error.code,
              message,
            }
          );
        },

        {
          enableHighAccuracy:
            true,

          timeout:
            20000,

          maximumAge:
            5000,
        }
      );

    return () => {
      navigator.geolocation
        .clearWatch(
          watchId
        );
    };
  }, []);

  /* =======================================================
     RETRY QUEUE WHEN INTERNET RETURNS
  ======================================================= */

  useEffect(() => {
    const handleOnline = () => {
      const socket =
        socketRef.current;

      if (
        !socket?.connected
      ) {
        return;
      }

      const queuedPayloads =
        readGpsQueue();

      queuedPayloads.forEach(
        (payload) => {
          socket.emit(
            "gps-update",
            {
              ...payload,
              synchronized_at:
                new Date()
                  .toISOString(),

              is_offline:
                false,
            }
          );
        }
      );

      if (
        queuedPayloads.length > 0
      ) {
        saveGpsQueue([]);
        setGpsQueueCount(0);
      }
    };

    window.addEventListener(
      "online",
      handleOnline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );
    };
  }, []);

  /* =======================================================
     VALID ENUMERATOR LOCATIONS
  ======================================================= */

  const validEnumerators =
    useMemo(
      () =>
        enumerators.filter(
          (enumerator) => {
            const latitude =
              Number(
                enumerator.latitude ??
                  enumerator.lat ??
                  enumerator.gps_lat
              );

            const longitude =
              Number(
                enumerator.longitude ??
                  enumerator.lng ??
                  enumerator.gps_lng
              );

            return (
              Number.isFinite(
                latitude
              ) &&
              Number.isFinite(
                longitude
              )
            );
          }
        ),
      [enumerators]
    );

  const trackedCount =
    validEnumerators.length +
    (currentLocation ? 1 : 0);

  return (
    <div className="live-operations-map">
      <div className="live-operations-map__status">
        <span
          className={
            socketConnected
              ? "live-operations-map__dot live-operations-map__dot--online"
              : "live-operations-map__dot live-operations-map__dot--offline"
          }
        />

        <strong>
          {socketConnected
            ? "GPS stream connected"
            : "GPS stream disconnected"}
        </strong>

        <span>
          {trackedCount} tracked
        </span>

        {currentLocation && (
          <span>
            Accuracy:{" "}
            {Math.round(
              currentLocation.accuracy ??
                0
            )}{" "}
            m
          </span>
        )}

        {gpsQueueCount > 0 && (
          <span>
            {gpsQueueCount} GPS
            update
            {gpsQueueCount === 1
              ? ""
              : "s"}{" "}
            queued
          </span>
        )}
      </div>

      {locationError && (
        <div
          style={{
            marginBottom: "8px",
            padding: "8px 10px",
            borderRadius: "8px",
            background:
              "#fef2f2",
            color: "#991b1b",
            fontSize: "13px",
          }}
        >
          {locationError}
        </div>
      )}

      <MapContainer
        center={
          currentLocation
            ? [
                currentLocation.latitude,
                currentLocation.longitude,
              ]
            : DEFAULT_CENTER
        }
        zoom={
          currentLocation
            ? 16
            : 6
        }
        scrollWheelZoom
        style={{
          height: "100%",
          minHeight: "235px",
          width: "100%",
          borderRadius: "14px",
        }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapLocationController
          location={
            currentLocation
          }
        />

        {currentLocation && (
          <>
            <Circle
              center={[
                currentLocation.latitude,
                currentLocation.longitude,
              ]}
              radius={
                Math.max(
                  currentLocation.accuracy ||
                    0,
                  10
                )
              }
              pathOptions={{
                color: "#2563eb",
                fillColor:
                  "#60a5fa",
                fillOpacity: 0.16,
                weight: 1,
              }}
            />

            <CircleMarker
              center={[
                currentLocation.latitude,
                currentLocation.longitude,
              ]}
              radius={10}
              pathOptions={{
                color: "#ffffff",
                fillColor:
                  "#2563eb",
                fillOpacity: 1,
                weight: 3,
              }}
            >
              <Popup>
                <strong>
                  My Current Location
                </strong>

                <br />

                Latitude:{" "}
                {currentLocation.latitude.toFixed(
                  6
                )}

                <br />

                Longitude:{" "}
                {currentLocation.longitude.toFixed(
                  6
                )}

                <br />

                Accuracy:{" "}
                {Math.round(
                  currentLocation.accuracy ||
                    0
                )}{" "}
                meters

                <br />

                Updated:{" "}
                {new Date(
                  currentLocation.captured_at
                ).toLocaleTimeString()}
              </Popup>
            </CircleMarker>
          </>
        )}

        {validEnumerators.map(
          (enumerator) => {
            const latitude =
              Number(
                enumerator.latitude ??
                  enumerator.lat ??
                  enumerator.gps_lat
              );

            const longitude =
              Number(
                enumerator.longitude ??
                  enumerator.lng ??
                  enumerator.gps_lng
              );

            const markerId =
              enumerator.id ??
              enumerator.user_id ??
              enumerator.enumerator_id ??
              `${latitude}-${longitude}`;

            return (
              <CircleMarker
                key={markerId}
                center={[
                  latitude,
                  longitude,
                ]}
                radius={9}
                pathOptions={{
                  color:
                    "#ffffff",

                  fillColor:
                    getMarkerColor(
                      enumerator.status
                    ),

                  fillOpacity: 1,
                  weight: 3,
                }}
              >
                <Popup>
                  <strong>
                    {enumerator.full_name ??
                      enumerator.name ??
                      enumerator.user_id ??
                      enumerator.id ??
                      "Enumerator"}
                  </strong>

                  <br />

                  Status:{" "}
                  {enumerator.status ??
                    "unknown"}

                  <br />

                  Latitude:{" "}
                  {latitude.toFixed(
                    6
                  )}

                  <br />

                  Longitude:{" "}
                  {longitude.toFixed(
                    6
                  )}

                  {enumerator.accuracy && (
                    <>
                      <br />
                      Accuracy:{" "}
                      {Math.round(
                        Number(
                          enumerator.accuracy
                        )
                      )}{" "}
                      meters
                    </>
                  )}
                </Popup>
              </CircleMarker>
            );
          }
        )}
      </MapContainer>
    </div>
  );
}