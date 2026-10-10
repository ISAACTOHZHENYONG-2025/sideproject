type MaterialIconProps = {
  name: string;
  className?: string;
};

// Hidden from screen readers, which would otherwise read the ligature name ("near_me"). Every icon sits beside
// visible text or inside a button with an aria-label, so nothing is lost.
export default function MaterialIcon({ name, className = "" }: MaterialIconProps) {
  return (
    <span aria-hidden className={`material-symbols-outlined ${className}`}>
      {name}
    </span>
  );
}
