import { UserButton } from "@clerk/nextjs";
import { SidebarToggle } from "./sidebar-toggle";

export function Header() {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <SidebarToggle />
      <div className="flex-1" />
      <UserButton
        appearance={{
          elements: {
            avatarBox: "h-8 w-8",
          },
        }}
      />
    </header>
  );
}
