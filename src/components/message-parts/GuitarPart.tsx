import React from "react";
import GuitarRecommendation from "../example-GuitarRecommendation";

export const GuitarPart = React.memo(({ id }: { id: string }) => {
  return (
    <div className="max-w-[80%] mx-auto chat__tool-card chat__tool-card--recommend-guitar">
      <GuitarRecommendation id={id} />
    </div>
  );
});

GuitarPart.displayName = "GuitarPart";
