import React from "react";
import ItemCard from "../example-ItemCard";

export const ItemsPart = React.memo(({ items }: { items: any[] }) => {
  return (
    <div className="max-w-[80%] mx-auto chat__tool-card chat__tool-card--items">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <ItemCard key={item.id || i} item={item} />
        ))}
      </div>
    </div>
  );
});

ItemsPart.displayName = "ItemsPart";
