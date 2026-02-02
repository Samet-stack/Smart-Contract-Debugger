import { useState, useRef, useEffect } from "react";
import { cn } from "../../../ui-lib/utils/cn";
// import { X, ChevronDown, Check } from "lucide-react"; // Removed as not installed

// Fallback icons if lucide-react is not installed
const IconX = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);
const IconChevronDown = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6" /></svg>
);
const IconCheck = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 6 9 17l-5-5" /></svg>
);

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  allowCustom?: boolean;
  validateCustomValue?: (value: string) => boolean; // Optional validation function
}

export default function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  className,
  label,
  allowCustom = false, // To allow typing custom text (like PC)
  validateCustomValue, // Validation function
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0); // To track highlighted element index
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null); // Ref for scrollable container
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]); // Refs for each option

  // Computing filtered options here for keyboard navigation
  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(query.toLowerCase())
  );

  // Auto-scroll when index changes
  useEffect(() => {
    if (isOpen && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest", // Scroll just enough to be visible
      });
    }
  }, [highlightedIndex, isOpen]);

  // Reset refs when list changes (filtering)
  useEffect(() => {
    optionRefs.current = optionRefs.current.slice(0, filteredOptions.length);
  }, [filteredOptions]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Arrow key navigation
    if (e.key === "ArrowDown") {
      e.preventDefault();
      // Move down the list (without going past the end)
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      // Move up the list (without going past the start)
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(filteredOptions.length - 1);
      } else {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
      }
    } else if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission if inside a form
      if (isOpen && filteredOptions.length > 0) {
        // If menu is open, toggle highlighted item
        toggleOption(filteredOptions[highlightedIndex]);
      } else if (query && allowCustom) {
        // Handle custom value PC (hex) entry
        if (validateCustomValue && !validateCustomValue(query)) {
          // Invalid custom value
          return;
        }
        if (!selected.includes(query)) {
          onChange([...selected, query]);
        }
        setQuery("");
      }
    } else if (e.key === "Tab") {
      if (isOpen) setIsOpen(false);
    } else if (e.key === "Backspace" && !query && selected.length > 0) {
      // If Backspace and empty, remove last tag
      onChange(selected.slice(0, -1));
    }
  };


  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== option));
  };

  // const filteredOptions = options.filter(opt =>
  //   opt.toLowerCase().includes(query.toLowerCase())
  // ); 
  // Moved up to be accessible in handleKeyDown

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}

      <div
        className="min-h-[40px] w-full rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900 px-2 py-1.5 text-sm transition-all focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 cursor-text flex flex-wrap gap-1.5 items-center"
        onClick={() => setIsOpen(true)}
      >
        {selected.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800"
          >
            {item}
            <button
              type="button"
              onClick={(e) => removeOption(item, e)}
              className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
            >
              <IconX className="h-3 w-3" />
            </button>
          </span>
        ))}

        <div className="flex-1 flex items-center min-w-[60px]">
          <input
            type="text"
            className="w-full bg-transparent p-0 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:text-gray-100 text-sm"
            placeholder={selected.length === 0 ? placeholder : ""}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightedIndex(0);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="flex-shrink-0 text-gray-400">
          <IconChevronDown className="h-4 w-4" />
        </div>
      </div>

      {isOpen && (
        <div
          ref={optionsListRef}
          className="absolute top-full left-0 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900 z-50"
        >
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-center text-xs text-gray-500">No results found.</div>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = selected.includes(option);
              return (
                <div
                  key={option}
                  ref={(el) => { if (el) optionRefs.current[index] = el }} // Attach ref here
                  className={cn(
                    "flex items-center justify-between rounded px-2 py-1.5 text-xs cursor-pointer",
                    isSelected
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                      : "text-gray-700 dark:text-gray-300",
                    // Style for keyboard highlighted element
                    index === highlightedIndex && !isSelected ? "bg-gray-100 dark:bg-gray-800" : "",
                    !isSelected && "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  onClick={() => toggleOption(option)}
                  onMouseEnter={() => setHighlightedIndex(index)} // Mouse updates index too
                >
                  <span className="font-medium font-mono">{option}</span>
                  {isSelected && <IconCheck className="h-3.5 w-3.5" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
