import Sidebar from '@/components/Sidebar';
import SessionsList from '@/components/SessionsList';
import BottomBar from '@/components/BottomBar';

export default function SessionsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <SessionsList />
        <BottomBar />
      </div>
    </div>
  );
}

