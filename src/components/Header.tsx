import { Link } from "@tanstack/react-router";

import TanStackChatHeaderUser from "../integrations/tanchat/header-user.tsx";

export default function Header() {
  return (
    <header className="p-2 flex gap-2 bg-white text-black justify-between">
      <nav className="flex flex-row">
        <div className="px-2 font-bold">
          <Link to="/">Home</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/example/guitars">Guitar Demo</Link>
        </div>
      </nav>

      <div>
        <TanStackChatHeaderUser />
      </div>
    </header>
  );
}
