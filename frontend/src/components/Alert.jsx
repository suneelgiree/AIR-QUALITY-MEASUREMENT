import React from "react";
export const Alert = ({ type = "info", message }) => (
  <div
    className={`p-3 mb-3 rounded ${
      type === "error"
        ? "bg-red-100 text-red-700 border border-red-400"
        : "bg-blue-100 text-blue-700 border border-blue-400"
    }`}
  >
    {message}
  </div>
);