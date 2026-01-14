import React from "react";
import ReactDOM from "react-dom/client";
import App from "../App"; // or "./App" depending on where App.tsx is

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
