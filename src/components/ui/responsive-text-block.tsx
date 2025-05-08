interface ResponsiveTextBlockProps {
  lines: string[];
  fontSize?: string;
  className?: string;
  element?: "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div";
  lineSpacing?: string;
  lineClassName?: string;
  textShadow?: boolean;
  fadeOnScroll?: boolean; // Apply fade-on-scroll data attribute to each line
}

export const ResponsiveTextBlock = ({
  lines,
  fontSize = "clamp(2.5rem, 8vw, 6rem)",
  className = "",
  element = "span",
  lineSpacing = "mb-8",
  lineClassName = "",
  textShadow = false,
  fadeOnScroll = false,
}: ResponsiveTextBlockProps) => {
  const containerClasses = `${className} ${textShadow ? "landing-page-text-shadow" : ""}`;

  return (
    <div className={containerClasses}>
      {lines.map((line, index) => {
        const isLastLine = index === lines.length - 1;
        const lineStyle = {
          fontSize,
          lineHeight: "0.9",
          // Add transition only when fadeOnScroll is enabled
          ...(fadeOnScroll ? { transition: "opacity 0.1s ease-out" } : {}),
        };
        const lineClasses = `whitespace-normal sm:whitespace-nowrap ${lineClassName} ${
          !isLastLine ? lineSpacing : ""
        }`;

        // Add data attributes for fade effect when enabled
        const fadeProps = fadeOnScroll
          ? {
              "data-fade-on-scroll": "true",
            }
          : {};

        // Render the appropriate element based on the element prop
        switch (element) {
          case "h1":
            return (
              <h1 key={index} style={lineStyle} className={lineClasses} {...fadeProps}>
                {line}
              </h1>
            );
          case "h2":
            return (
              <h2 key={index} style={lineStyle} className={lineClasses} {...fadeProps}>
                {line}
              </h2>
            );
          case "h3":
            return (
              <h3 key={index} style={lineStyle} className={lineClasses} {...fadeProps}>
                {line}
              </h3>
            );
          case "h4":
            return (
              <h4 key={index} style={lineStyle} className={lineClasses} {...fadeProps}>
                {line}
              </h4>
            );
          case "h5":
            return (
              <h5 key={index} style={lineStyle} className={lineClasses} {...fadeProps}>
                {line}
              </h5>
            );
          case "h6":
            return (
              <h6 key={index} style={lineStyle} className={lineClasses} {...fadeProps}>
                {line}
              </h6>
            );
          case "p":
            return (
              <p key={index} style={lineStyle} className={lineClasses} {...fadeProps}>
                {line}
              </p>
            );
          case "div":
            return (
              <div key={index} style={lineStyle} className={lineClasses} {...fadeProps}>
                {line}
              </div>
            );
          default:
            return (
              <span key={index} style={lineStyle} className={lineClasses} {...fadeProps}>
                {line}
              </span>
            );
        }
      })}
    </div>
  );
};
