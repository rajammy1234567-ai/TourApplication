export function Modal({
  title,
  description,
  children,
  onClose,
  actions,
  wide,
  xl,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  onClose: () => void;
  actions: React.ReactNode;
  wide?: boolean;
  xl?: boolean;
}) {
  const sizeClass = xl ? " modal-xl" : wide ? " modal-wide" : "";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal modal-shell${sizeClass}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {children ? <div className="modal-body">{children}</div> : null}
        <div className="modal-actions">{actions}</div>
      </div>
    </div>
  );
}