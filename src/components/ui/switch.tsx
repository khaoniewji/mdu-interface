// import React from "react";

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

function Switch({ checked = false, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`
                relative inline-flex h-5 w-9 flex-shrink-0 rounded-full
                transition-colors duration-200 ease-in-out focus:outline-none
                ${checked ? "bg-blue-500" : "bg-gray-600"}
            `}
      onClick={() => onChange?.(!checked)}
    >
      <span
        className={`
                    pointer-events-none inline-block h-4 w-4 transform rounded-full
                    bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${checked ? "translate-x-4" : "translate-x-0.5"}
                `}
        style={{ margin: "2px" }}
      />
    </button>
  );
}

export default Switch;
