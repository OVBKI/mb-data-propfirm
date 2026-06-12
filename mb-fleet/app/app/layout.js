import Sidebar from "@/components/Sidebar";
import DemoBanner from "@/components/DemoBanner";
import { FleetProvider } from "@/components/FleetProvider";

export default function AppLayout({ children }) {
  return (
    <FleetProvider>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0 min-h-screen flex flex-col">
          <DemoBanner />
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
        </div>
      </div>
    </FleetProvider>
  );
}
