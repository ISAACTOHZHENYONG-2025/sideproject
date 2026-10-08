type DietBadgesProps = {
  isHalal: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
};

const badgeClass =
  "px-1.5 py-0.5 rounded-[6px] bg-[#E6F7ED] text-primary text-[10px] font-bold uppercase tracking-wide leading-none";

export default function DietBadges({ isHalal, isVegetarian, isVegan }: DietBadgesProps) {
  const labels = [isHalal && "Halal", isVegan ? "Vegan" : isVegetarian && "Vegetarian"].filter(Boolean);
  return (
    <>
      {labels.map((label) => (
        <span className={badgeClass} key={String(label)}>
          {label}
        </span>
      ))}
    </>
  );
}
