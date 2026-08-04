import { useState } from 'react';
import { Sidebar, MobileTopBar, type PageKey } from '@/components/Sidebar';
import { FavoritesProvider } from '@/store/favorites';
import { Dashboard } from '@/pages/Dashboard';
import { BidList } from '@/pages/BidList';
import { BidDetail } from '@/pages/BidDetail';
import { Favorites } from '@/pages/Favorites';
import { Analysis } from '@/pages/Analysis';
import { Settings } from '@/pages/Settings';

type View = { page: PageKey } | { page: 'detail'; bidNtceNo: string; bidNtceOrd: string };

function App() {
  const [view, setView] = useState<View>({ page: 'dashboard' });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (page: PageKey) => setView({ page });
  const handleSelectBid = (bidNtceNo: string, bidNtceOrd: string) =>
    setView({ page: 'detail', bidNtceNo, bidNtceOrd });
  const handleBack = () => setView({ page: 'bids' });

  const currentPage: PageKey = view.page === 'detail' ? 'bids' : view.page;

  return (
    <FavoritesProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar
          current={currentPage}
          onNavigate={handleNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTopBar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
              {view.page === 'dashboard' && (
                <Dashboard onNavigate={handleNavigate} onSelectBid={handleSelectBid} />
              )}
              {view.page === 'bids' && <BidList onSelectBid={handleSelectBid} />}
              {view.page === 'detail' && (
                <BidDetail
                  bidNtceNo={view.bidNtceNo}
                  bidNtceOrd={view.bidNtceOrd}
                  onBack={handleBack}
                />
              )}
              {view.page === 'favorites' && <Favorites onSelectBid={handleSelectBid} />}
              {view.page === 'analysis' && <Analysis />}
              {view.page === 'settings' && <Settings />}
            </div>
          </main>
        </div>
      </div>
    </FavoritesProvider>
  );
}

export default App;
