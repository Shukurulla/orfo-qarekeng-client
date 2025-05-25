import React, {
  forwardRef,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Input, Tooltip } from "antd";
import { motion } from "framer-motion";
import { useAppSelector } from "@/hooks/redux";

const { TextArea } = Input;

const TextEditor = forwardRef(
  (
    {
      value,
      onChange,
      results = [],
      highlightErrors = true,
      onWordSelect,
      selectedWordIndex = -1,
      placeholder = "Matn kiriting...",
      className = "",
      ...props
    },
    ref
  ) => {
    const textAreaRef = useRef(null);
    const overlayRef = useRef(null);
    const [cursorPosition, setCursorPosition] = useState(0);

    const { layout } = useAppSelector((state) => state.ui);
    const { fontSize, fontFamily, lineHeight, wordWrap } = layout.textEditor;

    // Combine refs
    useEffect(() => {
      if (ref) {
        ref.current = textAreaRef.current;
      }
    }, [ref]);

    // Handle text change
    const handleChange = useCallback(
      (e) => {
        const newValue = e.target.value;
        onChange(newValue);
        setCursorPosition(e.target.selectionStart);
      },
      [onChange]
    );

    // Handle cursor position change
    const handleSelect = useCallback((e) => {
      setCursorPosition(e.target.selectionStart);
    }, []);

    // Handle word click
    const handleWordClick = useCallback(
      (e) => {
        if (!results.length || !onWordSelect) return;

        const textarea = textAreaRef.current;
        const rect = textarea.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Find which word was clicked based on cursor position
        const cursorPos = textarea.selectionStart;

        // Find the word at cursor position
        const wordIndex = results.findIndex(
          (result) => cursorPos >= result.start && cursorPos <= result.end
        );

        if (wordIndex >= 0 && !results[wordIndex].isCorrect) {
          onWordSelect(wordIndex);
        }
      },
      [results, onWordSelect]
    );

    // Create highlighted text overlay
    const createHighlightedText = useCallback(() => {
      if (!highlightErrors || !results.length || !value) {
        return value;
      }

      let highlightedText = "";
      let lastIndex = 0;

      // Sort results by start position
      const sortedResults = [...results].sort((a, b) => a.start - b.start);

      sortedResults.forEach((result, index) => {
        // Add text before current word
        highlightedText += value.slice(lastIndex, result.start);

        // Add highlighted word
        const isSelected = index === selectedWordIndex;
        const word = value.slice(result.start, result.end);

        if (!result.isCorrect) {
          highlightedText += `<span class="spell-error ${
            isSelected ? "selected" : ""
          }" data-word-index="${index}">${word}</span>`;
        } else {
          highlightedText += word;
        }

        lastIndex = result.end;
      });

      // Add remaining text
      highlightedText += value.slice(lastIndex);

      return highlightedText;
    }, [value, results, highlightErrors, selectedWordIndex]);

    // Sync scroll between textarea and overlay
    const handleScroll = useCallback(() => {
      if (overlayRef.current && textAreaRef.current) {
        overlayRef.current.scrollTop = textAreaRef.current.scrollTop;
        overlayRef.current.scrollLeft = textAreaRef.current.scrollLeft;
      }
    }, []);

    // Style object for consistent styling
    const textStyle = {
      fontSize: `${fontSize}px`,
      fontFamily: fontFamily,
      lineHeight: lineHeight,
      whiteSpace: wordWrap ? "pre-wrap" : "pre",
      wordWrap: wordWrap ? "break-word" : "normal",
    };

    return (
      <div className={`relative ${className}`}>
        {/* Highlighted text overlay */}
        {highlightErrors && results.length > 0 && (
          <div
            ref={overlayRef}
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{
              ...textStyle,
              color: "transparent",
              padding: "6px 11px",
              border: "1px solid transparent",
              borderRadius: "6px",
              zIndex: 1,
            }}
            dangerouslySetInnerHTML={{
              __html: createHighlightedText(),
            }}
          />
        )}

        {/* Main textarea */}
        <TextArea
          ref={textAreaRef}
          value={value}
          onChange={handleChange}
          onSelect={handleSelect}
          onClick={handleWordClick}
          onScroll={handleScroll}
          placeholder={placeholder}
          style={{
            ...textStyle,
            backgroundColor: "transparent",
            position: "relative",
            zIndex: 2,
            resize: "vertical",
          }}
          className={`spell-checker-textarea ${
            highlightErrors ? "with-highlights" : ""
          }`}
          autoSize={{ minRows: 8, maxRows: 20 }}
          {...props}
        />

        {/* Word count and cursor position */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>
            So'zlar: {results.length} | Belgilar: {value.length}
          </span>
          <span>Kursor: {cursorPosition}</span>
        </div>

        {/* Custom styles */}
        <style jsx>{`
          .spell-checker-textarea :global(.spell-error) {
            background-color: rgba(255, 77, 79, 0.2);
            border-bottom: 2px wavy #ff4d4f;
            cursor: pointer;
            position: relative;
          }

          .spell-checker-textarea :global(.spell-error:hover) {
            background-color: rgba(255, 77, 79, 0.3);
          }

          .spell-checker-textarea :global(.spell-error.selected) {
            background-color: rgba(24, 144, 255, 0.2);
            border-bottom-color: #1890ff;
          }

          .spell-checker-textarea.with-highlights {
            caret-color: #000;
          }

          .dark .spell-checker-textarea :global(.spell-error) {
            background-color: rgba(255, 77, 79, 0.15);
          }

          .dark .spell-checker-textarea :global(.spell-error.selected) {
            background-color: rgba(24, 144, 255, 0.15);
          }

          .dark .spell-checker-textarea.with-highlights {
            caret-color: #fff;
          }
        `}</style>
      </div>
    );
  }
);

TextEditor.displayName = "TextEditor";

export default TextEditor;
