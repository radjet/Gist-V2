import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- Global Error Handlers (Added for debugging) ---
window.onerror = function (message, source, lineno, colno, error) {
  console.error("UNCAUGHT_ERROR:", {
    message,
    source,
    lineno,
    colno,
    stack: error?.stack,
    error
  });
  return false; // let default handler run too
};

window.onunhandledrejection = function (event) {
  console.error("UNHANDLED_REJECTION:", {
    reason: event.reason,
    message: event.reason?.message,
    stack: event.reason?.stack
  });
};
// ---------------------------------------------------

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);