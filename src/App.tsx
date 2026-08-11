import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AdvisorProfile, MetricData, StoreOption, ClientRecord, TabType } from './types';
import {
  initialAdvisorProfile,
  initialMetrics,
  mockStores,
  mockClients,
  mockRoleAccounts,
} from './data/mockData';

// Core UI Components
import { MobileFrame } from './components/MobileFrame';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';

// Interactive Modals & Drawers
import { AccountDrawer } from './components/drawers/AccountDrawer';
import { StoreSwitcherModal } from './components/modals/StoreSwitcherModal';
import { AppCenterModal } from './components/modals/AppCenterModal';
import { CustomerServiceModal } from './components/modals/CustomerServiceModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { AccountSecurityModal } from './components/modals/AccountSecurityModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { DetailListModal } from './components/modals/DetailListModal';
import { ClientDetailModal } from './components/modals/ClientDetailModal';
import { QuoteBuilderModal } from './components/modals/QuoteBuilderModal';

// Views for tabs
import { XiaowanView } from './components/views/XiaowanView';
import { WorkbenchView } from './components/views/WorkbenchView';
import { ClientsView } from './components/views/ClientsView';
import { TestDriveView } from './components/views/TestDriveView';
import { OrdersView } from './components/views/OrdersView';

export default function App() {
  // Main Account & Tab State
  const [activeAccountId, setActiveAccountId] = useState<string>('kian');
  const [activeTab, setActiveTab] = useState<TabType>('workbench');
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);

  // Derive active account profile
  const currentAccount =
    mockRoleAccounts.find((a) => a.id === activeAccountId) || mockRoleAccounts[0];

  const [profile, setProfile] = useState<AdvisorProfile>({
    name: currentAccount.name,
    phone: currentAccount.phone,
    verified: currentAccount.verified,
    role: currentAccount.roleTitle,
    store: currentAccount.store,
    advisorId: 'AQ-889021',
    region: currentAccount.region,
    salesMode: '体验中心 (Direct)',
  });

  // Modals state
  const [isStoreSwitcherOpen, setIsStoreSwitcherOpen] = useState(false);
  const [isAppCenterOpen, setIsAppCenterOpen] = useState(false);
  const [isCustomerServiceOpen, setIsCustomerServiceOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAccountSecurityOpen, setIsAccountSecurityOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeMetricDetail, setActiveMetricDetail] = useState<MetricData['id'] | null>(null);

  // Customer 360 & Quote Modals
  const [selectedClient360, setSelectedClient360] = useState<ClientRecord | null>(null);
  const [quoteBuilderClient, setQuoteBuilderClient] = useState<ClientRecord | null>(null);

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Switch Role Account
  const handleSelectAccount = (accId: string) => {
    setActiveAccountId(accId);
    setIsAccountDrawerOpen(false);
    const newAcc = mockRoleAccounts.find((a) => a.id === accId) || mockRoleAccounts[0];

    setProfile({
      name: newAcc.name,
      phone: newAcc.phone,
      verified: newAcc.verified,
      role: newAcc.roleTitle,
      store: newAcc.store,
      advisorId: 'AQ-889021',
      region: newAcc.region,
      salesMode: '体验中心 (Direct)',
    });

    // Verify if current tab is supported by the new account
    const isTabValid = newAcc.tabs.some((t) => t.id === activeTab);
    if (!isTabValid) {
      setActiveTab(newAcc.tabs[0]?.id || 'workbench');
    }

    showToast(`已切换至：${newAcc.name} (${newAcc.roleTitle})`);
  };

  // Store switch
  const handleSelectStore = (store: StoreOption) => {
    setProfile((prev) => ({
      ...prev,
      store: store.name,
      region: store.region,
    }));
    showToast(`已成功切换至：${store.name}`);
  };

  // Logout
  const handleLogout = () => {
    if (confirm('确定要安全退出当前账号吗？')) {
      showToast('已安全退出账号');
    }
  };

  return (
    <MobileFrame>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-slate-700 backdrop-blur-md"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="min-h-screen min-h-[100dvh] pb-24 flex flex-col justify-between">
        {/* Top Header Bar - Omitted on Xiaowan AI tab for full-screen conversational experience */}
        {activeTab !== 'xiaowan' && (
          <Header
            currentAccount={currentAccount}
            onOpenAccountDrawer={() => setIsAccountDrawerOpen(true)}
            onOpenCustomerService={() => setIsCustomerServiceOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onQuickAction={() => showToast('已触发：新建客户跟进 / 快速排程试驾')}
          />
        )}

        {/* Tab Views Router */}
        <AnimatePresence mode="wait">
          {activeTab === 'workbench' ? (
            <motion.div
              key="workbench"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <WorkbenchView
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onOpenAppCenter={() => setIsAppCenterOpen(true)}
                onSelectClient={(client) => setSelectedClient360(client)}
                onOpenQuoteBuilder={(client) => setQuoteBuilderClient(client)}
                currentAccount={currentAccount}
              />
            </motion.div>
          ) : activeTab === 'clients' ? (
            <motion.div
              key="clients"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <ClientsView
                onSelectClient={(client) => setSelectedClient360(client)}
                onOpenQuoteBuilder={(client) => setQuoteBuilderClient(client)}
              />
            </motion.div>
          ) : activeTab === 'testdrive' ? (
            <motion.div
              key="testdrive"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <TestDriveView />
            </motion.div>
          ) : activeTab === 'orders' || activeTab === 'approvals' || activeTab === 'inventory' || activeTab === 'service' || activeTab === 'region' ? (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <OrdersView />
            </motion.div>
          ) : activeTab === 'xiaowan' && currentAccount.hasXiaowan ? (
            <motion.div
              key="xiaowan"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <XiaowanView advisorName={currentAccount.name} storeName={currentAccount.store} />
            </motion.div>
          ) : (
            <motion.div
              key="fallback"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <WorkbenchView
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onOpenAppCenter={() => setIsAppCenterOpen(true)}
                onSelectClient={(client) => setSelectedClient360(client)}
                onOpenQuoteBuilder={(client) => setQuoteBuilderClient(client)}
                currentAccount={currentAccount}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation Bar */}
        <TabBar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          currentAccount={currentAccount}
        />
      </div>

      {/* Account Drawer Slide-Over (Triggered by Top Left Avatar) */}
      <AccountDrawer
        isOpen={isAccountDrawerOpen}
        onClose={() => setIsAccountDrawerOpen(false)}
        accounts={mockRoleAccounts}
        activeAccountId={activeAccountId}
        onSelectAccount={handleSelectAccount}
        onOpenStoreSwitcher={() => setIsStoreSwitcherOpen(true)}
        onOpenAppCenter={() => setIsAppCenterOpen(true)}
        onOpenCustomerService={() => setIsCustomerServiceOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAccountSecurity={() => setIsAccountSecurityOpen(true)}
        onLogout={handleLogout}
      />

      {/* Interactive Modals */}
      <ClientDetailModal
        isOpen={selectedClient360 !== null}
        onClose={() => setSelectedClient360(null)}
        client={selectedClient360}
        onOpenQuoteBuilder={(client) => {
          setSelectedClient360(null);
          setQuoteBuilderClient(client);
        }}
      />

      <QuoteBuilderModal
        isOpen={quoteBuilderClient !== null}
        onClose={() => setQuoteBuilderClient(null)}
        client={quoteBuilderClient}
        advisorName={profile.name}
        storeName={profile.store}
      />

      <StoreSwitcherModal
        isOpen={isStoreSwitcherOpen}
        onClose={() => setIsStoreSwitcherOpen(false)}
        stores={mockStores}
        currentStoreId={profile.store}
        onSelectStore={handleSelectStore}
      />

      <AppCenterModal
        isOpen={isAppCenterOpen}
        onClose={() => setIsAppCenterOpen(false)}
        advisorName={profile.name}
        storeName={profile.store}
        phone={profile.phone}
      />

      <CustomerServiceModal
        isOpen={isCustomerServiceOpen}
        onClose={() => setIsCustomerServiceOpen(false)}
        advisorName={profile.name}
        storeName={profile.store}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <AccountSecurityModal
        isOpen={isAccountSecurityOpen}
        onClose={() => setIsAccountSecurityOpen(false)}
        profile={profile}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <DetailListModal
        isOpen={activeMetricDetail !== null}
        onClose={() => setActiveMetricDetail(null)}
        metricType={activeMetricDetail}
      />
    </MobileFrame>
  );
}
