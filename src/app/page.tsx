import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import BottomBar from '@/components/BottomBar';

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MainContent />
        <BottomBar />
      </div>
    </div>
  );
}
