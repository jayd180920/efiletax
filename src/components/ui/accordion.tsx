"use client";

import * as React from "react";

interface AccordionProps {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  className?: string;
  children: React.ReactNode;
}

interface AccordionItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

interface AccordionTriggerProps {
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

interface AccordionContentProps {
  className?: string;
  children: React.ReactNode;
}

type AccordionContextValue = {
  value: string | string[];
  toggle: (itemValue: string) => void;
  isExpanded: (itemValue: string) => boolean;
  type: "single" | "multiple";
};

const AccordionContext = React.createContext<AccordionContextValue>({
  value: "",
  toggle: () => {},
  isExpanded: () => false,
  type: "single",
});

const AccordionItemContext = React.createContext<{ value: string }>({
  value: "",
});

export function Accordion({
  type = "single",
  defaultValue = type === "single" ? "" : [],
  className = "",
  children,
}: AccordionProps) {
  const [value, setValue] = React.useState<string | string[]>(defaultValue);

  const toggle = React.useCallback(
    (itemValue: string) => {
      if (type === "single") {
        setValue(value === itemValue ? "" : itemValue);
      } else {
        setValue((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.includes(itemValue)
            ? prevArray.filter((v) => v !== itemValue)
            : [...prevArray, itemValue];
        });
      }
    },
    [type, value]
  );

  const isExpanded = React.useCallback(
    (itemValue: string) => {
      if (type === "single") {
        return value === itemValue;
      }
      return Array.isArray(value) && value.includes(itemValue);
    },
    [type, value]
  );

  return (
    <AccordionContext.Provider value={{ value, toggle, isExpanded, type }}>
      <div className={`space-y-2 ${className}`}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  className = "",
  children,
}: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div
        className={`border main-accordin rounded-md overflow-hidden ${className}`}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({
  className = "",
  children,
  icon,
}: AccordionTriggerProps) {
  const { toggle, isExpanded } = React.useContext(AccordionContext);
  const { value } = React.useContext(AccordionItemContext);
  const expanded = isExpanded(value);

  return (
    <button
      type="button"
      onClick={() => toggle(value)}
      className={`flex w-full items-center justify-between px-4 py-3 text-left font-medium transition-all hover:bg-gray-50 ${className}`}
      aria-expanded={expanded}
    >
      {children}
      {icon || (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-5 w-5 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      )}
    </button>
  );
}

export function AccordionContent({
  className = "",
  children,
}: AccordionContentProps) {
  console.log("AccordionContent", children);
  const { isExpanded } = React.useContext(AccordionContext);
  const { value } = React.useContext(AccordionItemContext);
  const expanded = isExpanded(value);

  return expanded ? (
    <div className={`form-accrodion px-4 pb-4 pt-0 ${className}`}>
      {children}
    </div>
  ) : null;
}
