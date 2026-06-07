import React from "react";

const Spinner = ({ size = 48, text }) => {
  return (
    <div className="w-full flex items-center justify-center py-8">
      <div className="flex flex-col items-center">
        <div
          className="animate-spin rounded-full border-4 border-t-transparent"
          style={{ width: size, height: size, borderColor: "rgba(255,255,255,0.15)", borderTopColor: "#fff" }}
        />
        {text && <div className="mt-2 text-white">{text}</div>}
      </div>
    </div>
  );
};

export default Spinner;
