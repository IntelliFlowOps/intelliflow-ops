import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-[260px] h-screen bg-[#061324] text-white flex flex-col px-4 py-5">

      {/* LOGO BLOCK */}
      <div className="mb-6 flex items-center gap-3">

        <div className="w-[52px] h-[52px] rounded-2xl bg-[#081b31] flex items-center justify-center overflow-hidden">

          <img
            src="/logo.png"
            alt="IntelliFlow logo"
            className="w-full h-full object-contain scale-125"
          />

        </div>

        <div>
          <div className="text-[15px] font-semibold">
            IntelliFlow
          </div>

          <div className="text-[10px] tracking-[0.22em] text-cyan-200/70">
            COMMUNICATIONS
          </div>
        </div>

      </div>

      {/* NAV ITEMS */}

      <nav className="flex flex-col gap-2">

        {[
          { label: "Dashboard",              path: "/" },
          { label: "Customers",              path: "/customers" },
          { label: "Individual Commissions", path: "/marketers" },
          { label: "Campaigns",              path: "/campaigns" },
          { label: "Creative Insights",      path: "/creative" },
          { label: "Founder Assistant",      path: "/founder-assistant" },
          { label: "Marketer Assistant",     path: "/marketer-assistant" },
          { label: "Ledger",                 path: "/ledger" },
          { label: "Activity",               path: "/activity" },
          { label: "Analytics",              path: "/analytics" },
        ].map((item) => (

          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `px-4 py-3 rounded-xl text-sm ${
                isActive
                  ? "bg-cyan-400/15 text-cyan-100"
                  : "hover:bg-white/5 text-white/80"
              }`
            }
          >
            {item.label}
          </NavLink>

        ))}

      </nav>

    </div>
  );
}
