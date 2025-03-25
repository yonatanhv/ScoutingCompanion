import { Link, useLocation } from "wouter";
import { ClipboardCheck, Users, RefreshCw } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      <div className="flex justify-around">
        <Link href="/scout">
          <div className={`flex-1 py-3 flex flex-col items-center cursor-pointer ${location === '/scout' ? 'text-primary' : 'text-gray-500'}`}>
            <ClipboardCheck className="h-5 w-5" />
            <span className="text-xs mt-1">Scout</span>
          </div>
        </Link>
        <Link href="/team">
          <div className={`flex-1 py-3 flex flex-col items-center cursor-pointer ${location === '/team' ? 'text-primary' : 'text-gray-500'}`}>
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Teams</span>
          </div>
        </Link>
        <Link href="/data">
          <div className={`flex-1 py-3 flex flex-col items-center cursor-pointer ${location === '/data' ? 'text-primary' : 'text-gray-500'}`}>
            <RefreshCw className="h-5 w-5" />
            <span className="text-xs mt-1">Sync</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
