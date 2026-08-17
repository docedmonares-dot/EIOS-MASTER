import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5050');

function App() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    socket.on('attendance:clock-in', (payload) => {
      setEvents((prev) => [payload, ...prev]);
    });

    socket.on('attendance:clock-out', (payload) => {
      setEvents((prev) => [payload, ...prev]);
    });

    return () => {
      socket.off('attendance:clock-in');
      socket.off('attendance:clock-out');
    };
  }, []);

  return (
    <div className="App">
      <h1>EIOS Live Command Center</h1>
      <h2>Real-Time Attendance Feed</h2>

      {events.length === 0 ? (
        <p>No live events yet.</p>
      ) : (
        <ul>
          {events.map((event, index) => (
            <li key={index}>
              <strong>{event.type}</strong> — {event.data?.attendance_status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;