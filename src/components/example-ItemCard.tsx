import { useNavigate } from "@tanstack/react-router";
import type { Item } from "@/lib/mock-db";

export default function ItemCard({ item }: { item: Item }) {
  const navigate = useNavigate();
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-orange-500/20 bg-gray-800/50">
      {item.image ? (
        <div className="aspect-[4/3] relative overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
        {item.description ? (
          <p className="text-sm text-gray-300 mb-3 line-clamp-2">
            {item.description}
          </p>
        ) : null}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">#{item.id}</div>
          <button
            type="button"
            onClick={() => {
              // Could navigate to a future item detail route
              navigate({ to: "/" });
            }}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-1.5 rounded-lg text-sm hover:opacity-90 transition-opacity"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
