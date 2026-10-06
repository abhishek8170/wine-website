import {
  Bell,
  BookOpen,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Contact,
  Home,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
  Users,
  Wine,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: Home },
    ],
  },
  {
    label: "Store",
    items: [
      { label: "Products", path: "/products", icon: Wine },
      { label: "Collections", path: "/collections", icon: LayoutGrid },
      { label: "Inventory", path: "/inventory", icon: Package },
      { label: "Orders", path: "/orders", icon: ShoppingBag },
      { label: "Shipments", path: "/shipments", icon: Truck },
      { label: "Delivery", path: "/delivery", icon: ClipboardList },
    ],
  },
  {
    label: "Customers & Communication",
    items: [
      { label: "Customers", path: "/customers", icon: Users },
      { label: "Notifications", path: "/notifications", icon: Bell },
      { label: "Contact Messages", path: "/contact-messages", icon: MessageSquare },
      { label: "Newsletter", path: "/newsletter", icon: Contact },
      { label: "Reviews", path: "/reviews", icon: CircleHelp },
    ],
  },
  {
    label: "Content & Marketing",
    items: [
      { label: "Coupons", path: "/coupons", icon: Tag },
      { label: "Our Story", path: "/our-story", icon: BookOpen },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Settings", path: "/settings", icon: Settings },
      { label: "Admin Management", path: "/admin-management", icon: ShieldCheck },
    ],
  },
];

const AdminSidebar = ({
  brandName,
  admin,
  open,
  onClose,
  onLogout,
}) => {
  const renderNavigation = (mobile = false) => (
    <nav className="space-y-5 px-3 pb-5">
      {navigation.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-2 text-[8px] font-semibold uppercase tracking-[0.24em] text-[#c9a45c]/65">
            {group.label}
          </p>

          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={mobile ? onClose : undefined}
                  className={({ isActive }) =>
                    [
                      "group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all duration-200",
                      isActive
                        ? "bg-[#c9a45c] text-[#351716] shadow-[0_8px_24px_rgba(201,164,92,0.16)]"
                        : "text-[#e9dccb] hover:bg-white/[0.07] hover:text-[#fffaf3]",
                    ].join(" ")
                  }
                >
                  <Icon size={16} strokeWidth={1.7} />

                  <span className="min-w-0 flex-1 truncate font-medium">
                    {item.label}
                  </span>

                  <ChevronRight
                    size={13}
                    className="opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-50"
                  />
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const sidebar = (
    <aside className="flex h-full w-[272px] flex-col border-r border-[#c9a45c]/20 bg-[#2b1413] text-[#f8efe2] shadow-[10px_0_45px_rgba(35,14,13,0.12)]">
      <div className="flex min-h-[88px] items-center border-b border-[#c9a45c]/15 px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c9a45c]/35 bg-[#c9a45c]/10 text-[#c9a45c]">
            <Wine size={20} strokeWidth={1.6} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-wide text-[#fffaf3]">
              {brandName}
            </p>
            <p className="mt-0.5 text-[8px] uppercase tracking-[0.25em] text-[#c9a45c]">
              Wine House Admin
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-5 [scrollbar-width:thin] [scrollbar-color:#6d453f_transparent]">
        {renderNavigation()}
      </div>

      <div className="border-t border-[#c9a45c]/15 p-3">
        <div className="mb-3 rounded-xl border border-white/[0.07] bg-white/[0.04] p-3">
          <p className="truncate text-xs font-medium text-[#fffaf3]">
            {admin?.name || `${brandName} Admin`}
          </p>
          <p className="mt-1 truncate text-[10px] text-[#cbbcad]">
            {admin?.email || "Store administrator"}
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] px-3 py-2.5 text-xs text-[#e9dccb] transition hover:border-[#c9a45c]/30 hover:bg-white/[0.06] hover:text-[#fffaf3]"
        >
          <LogOut size={16} strokeWidth={1.7} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-[60] hidden lg:flex">
        {sidebar}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[80] bg-[#1d0d0c]/60 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={[
          "fixed inset-y-0 left-0 z-[90] transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="relative h-full">
          {sidebar}

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#c9a45c]/30 bg-[#351716] text-[#c9a45c]"
            aria-label="Close navigation"
          >
            <X size={17} />
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
