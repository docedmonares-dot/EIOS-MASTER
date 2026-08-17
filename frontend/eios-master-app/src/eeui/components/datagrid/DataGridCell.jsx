export default function DataGridCell({
  children,
  align = "left",
  width = "",
  className = "",
  ...cellProps
}) {
  const classes = [
    "eeui-datagrid__cell",
    `eeui-datagrid__cell--${align}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style = width
    ? {
        width,
        minWidth: width,
        maxWidth: width,
      }
    : undefined;

  return (
    <div
      className={classes}
      style={style}
      role="cell"
      {...cellProps}
    >
      {children}
    </div>
  );
}