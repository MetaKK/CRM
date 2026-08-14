import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AdvisorProfile,
  AppTool,
  FrontlineLabTool,
  MetricData,
  StoreOption,
  ClientRecord,
  TabType,
  WorkbenchPreferences,
  WorkbenchPriority,
  WorkbenchScheduleItem,
  WorkbenchSectionId,
  WorkbenchTaskReference,
  WorkbenchTaskSnapshot,
  WorkbenchTaskState,
  ProductAnalyticsEvent,
  RoleAccount,
} from './types';
import {
  defaultQuickToolIdsByRole,
  initialAdvisorProfile,
  initialMetrics,
  mockStores,
  mockClients,
  mockAppTools,
  frontlineLabTools,
  mockRoleAccounts,
} from './data/mockData';
import {
  MAX_QUICK_TOOLS,
  readWorkbenchPreferences,
  saveWorkbenchPreferences,
} from './lib/workbenchPreferences';
import { readRecentAppToolIds, recordRecentAppToolId } from './lib/appCenterPreferences';
import { readSupportedLabToolIds, toggleSupportedLabToolId } from './lib/labPreferences';
import {
  completeWorkbenchTask,
  createInitialWorkbenchTaskSnapshot,
  getWorkbenchTaskState,
  promoteScheduleTask,
  readWorkbenchTaskSnapshot,
  reopenWorkbenchTask,
  resetWorkbenchTaskSnapshots,
  saveWorkbenchTaskSnapshot,
  startWorkbenchTask,
  unpinScheduleTask,
} from './lib/workbenchTasks';
import {
  getAnalyticsActorType,
  getAnalyticsJourney,
  getAnalyticsRoleType,
  resetLocalAnalyticsEvents,
  trackAnalyticsEvent,
} from './lib/productAnalytics';

// Core UI Components
import { MobileFrame } from './components/MobileFrame';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';

// Interactive Modals & Drawers
import { AccountDrawer } from './components/drawers/AccountDrawer';
import { StoreSwitcherModal } from './components/modals/StoreSwitcherModal';
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
import { AnalyticsView } from './components/views/AnalyticsView';
import { AppCenterView } from './components/views/AppCenterView';

const getAvailableTools = (accountId: string) =>
  mockAppTools.filter((tool) => !tool.roleIds?.length || tool.roleIds.includes(accountId));

const analyticsModuleByTab: Record<TabType, ProductAnalyticsEvent['module']> = {
  xiaowan: 'xiaowan',
  workbench: 'workbench',
  app_center: 'app_center',
  analytics: 'analytics',
  clients: 'client_360',
  testdrive: 'test_drive',
  orders: 'order_delivery',
  team: 'workbench',
  approvals: 'order_delivery',
  inventory: 'work_essential',
  service: 'order_delivery',
  region: 'workbench',
};

const analyticsTargetByTab: Partial<Record<TabType, NonNullable<ProductAnalyticsEvent['properties']>['target']>> = {
  xiaowan: 'xiaowan',
  workbench: 'workbench',
  app_center: 'app_center',
  analytics: 'analytics',
  clients: 'clients',
  testdrive: 'testdrive',
  orders: 'orders',
  inventory: 'work_essential',
};

type AnalyticsPayload = Pick<ProductAnalyticsEvent, 'module' | 'action' | 'status' | 'trustLevel' | 'properties'>;

interface ToastState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface TaskUndoState {
  accountId: string;
  reference: WorkbenchTaskReference;
  previousState: WorkbenchTaskState;
}

export default function App() {
  // Main Account & Tab State
  const [activeAccountId, setActiveAccountId] = useState<string>('kian');
  const [activeTab, setActiveTab] = useState<TabType>('workbench');
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);

  // Derive active account profile
  const currentAccount =
    mockRoleAccounts.find((a) => a.id === activeAccountId) || mockRoleAccounts[0];
  const availableTools = getAvailableTools(currentAccount.id);
  const defaultQuickToolIds = defaultQuickToolIdsByRole[currentAccount.id] || [];
  const [workbenchTaskSnapshot, setWorkbenchTaskSnapshot] = useState<WorkbenchTaskSnapshot>(() => (
    readWorkbenchTaskSnapshot(mockRoleAccounts[0])
  ));
  const activeTaskSnapshot = workbenchTaskSnapshot.accountId === currentAccount.id
    ? workbenchTaskSnapshot
    : createInitialWorkbenchTaskSnapshot(currentAccount);
  const promotedPriorities = currentAccount.workbenchSchedule.flatMap((item) => {
    const state = getWorkbenchTaskState(activeTaskSnapshot, { kind: 'schedule', id: item.id });
    if (!state.focused || state.status === 'completed') return [];
    return [{
      id: `promoted-${item.id}`,
      rank: 1 as const,
      urgency: item.urgency,
      title: item.title,
      subject: item.subject,
      description: state.focusSource === 'ai'
        ? `依据优先级、时效与客户影响置顶 · ${item.description}`
        : `由你从今日行程置顶 · ${item.description}`,
      dueLabel: `${item.time} 安排`,
      actionLabel: '查看安排',
      interaction: item.clientId && item.targetTab === 'clients' ? 'client' as const : 'tab' as const,
      targetTab: item.targetTab,
      clientId: item.clientId,
      source: state.focusSource,
      sourceScheduleId: item.id,
    }];
  });
  const activeBasePriorities = currentAccount.workbenchPriorities.filter((priority) => (
    getWorkbenchTaskState(activeTaskSnapshot, { kind: 'priority', id: priority.id }).status !== 'completed'
  ));
  const workbenchPriorities = [...promotedPriorities, ...activeBasePriorities];

  const [workbenchPreferences, setWorkbenchPreferences] = useState<WorkbenchPreferences>(() =>
    readWorkbenchPreferences(
      'kian',
      getAvailableTools('kian').map((tool) => tool.id),
      defaultQuickToolIdsByRole.kian || [],
      mockRoleAccounts.find((account) => account.id === 'kian')?.autoPromoteEnabledByDefault,
    ),
  );

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
  const [appCenterInitialToolId, setAppCenterInitialToolId] = useState<string | null>(null);
  const [appCenterReturnTab, setAppCenterReturnTab] = useState<TabType>('workbench');
  const [recentAppToolIds, setRecentAppToolIds] = useState<string[]>(() =>
    readRecentAppToolIds('kian', getAvailableTools('kian').map((tool) => tool.id)),
  );
  const [supportedLabToolIds, setSupportedLabToolIds] = useState<string[]>(() =>
    readSupportedLabToolIds(frontlineLabTools.map((tool) => tool.id)),
  );
  const [isCustomerServiceOpen, setIsCustomerServiceOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAccountSecurityOpen, setIsAccountSecurityOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeMetricDetail, setActiveMetricDetail] = useState<MetricData['id'] | null>(null);
  const [analyticsRevision, setAnalyticsRevision] = useState(0);
  const recordedScreenRef = useRef<string | null>(null);
  const hasRecordedAppOpenRef = useRef(false);

  // Customer 360 & Quote Modals
  const [selectedClient360, setSelectedClient360] = useState<ClientRecord | null>(null);
  const [quoteBuilderClient, setQuoteBuilderClient] = useState<ClientRecord | null>(null);

  // Toast alert
  const [toast, setToast] = useState<ToastState | null>(null);
  const [taskUndo, setTaskUndo] = useState<TaskUndoState | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const recordAnalytics = useCallback((account: RoleAccount, payload: AnalyticsPayload) => {
    trackAnalyticsEvent({
      actorType: getAnalyticsActorType(account),
      roleType: getAnalyticsRoleType(account.id),
      journey: getAnalyticsJourney(account),
      ...payload,
    });
    setAnalyticsRevision((revision) => revision + 1);
  }, []);

  const showToast = (message: string, action?: Pick<ToastState, 'actionLabel' | 'onAction'>, duration = 2500) => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    setToast({ message, ...action });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      setTaskUndo(null);
      toastTimerRef.current = null;
    }, duration);
  };

  useEffect(() => () => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    setWorkbenchPreferences(
      readWorkbenchPreferences(
        currentAccount.id,
        availableTools.map((tool) => tool.id),
        defaultQuickToolIds,
        currentAccount.autoPromoteEnabledByDefault,
      ),
    );
    setRecentAppToolIds(readRecentAppToolIds(currentAccount.id, availableTools.map((tool) => tool.id)));
    setWorkbenchTaskSnapshot(readWorkbenchTaskSnapshot(currentAccount));
    setTaskUndo(null);
  }, [currentAccount.id]);

  useEffect(() => {
    if (hasRecordedAppOpenRef.current) return;
    hasRecordedAppOpenRef.current = true;
    recordAnalytics(currentAccount, { module: 'app', action: 'app_opened', status: 'viewed', trustLevel: 'verified_behavior' });
  }, [currentAccount, recordAnalytics]);

  useEffect(() => {
    const screenKey = `${currentAccount.id}:${activeTab}`;
    if (recordedScreenRef.current === screenKey) return;
    recordedScreenRef.current = screenKey;
    recordAnalytics(currentAccount, {
      module: analyticsModuleByTab[activeTab],
      action: 'page_viewed',
      status: 'viewed',
      trustLevel: 'verified_behavior',
      properties: analyticsTargetByTab[activeTab] ? { target: analyticsTargetByTab[activeTab] } : undefined,
    });
  }, [activeTab, currentAccount, recordAnalytics]);

  const updateWorkbenchPreferences = (nextPreferences: WorkbenchPreferences) => {
    setWorkbenchPreferences(nextPreferences);
    saveWorkbenchPreferences(currentAccount.id, nextPreferences);
  };

  const updateWorkbenchTaskSnapshot = (
    update: (snapshot: WorkbenchTaskSnapshot) => WorkbenchTaskSnapshot,
  ) => {
    setWorkbenchTaskSnapshot((current) => {
      const source = current.accountId === currentAccount.id
        ? current
        : readWorkbenchTaskSnapshot(currentAccount);
      const next = update(source);
      saveWorkbenchTaskSnapshot(next);
      return next;
    });
  };

  const handleQuickToolToggle = (toolId: string) => {
    const isPinned = workbenchPreferences.quickToolIds.includes(toolId);
    if (!isPinned && workbenchPreferences.quickToolIds.length >= MAX_QUICK_TOOLS) {
      showToast(`工作必备最多保留 ${MAX_QUICK_TOOLS} 个，请先移除一个`);
      return;
    }

    const quickToolIds = isPinned
      ? workbenchPreferences.quickToolIds.filter((id) => id !== toolId)
      : [...workbenchPreferences.quickToolIds, toolId];

    updateWorkbenchPreferences({ ...workbenchPreferences, quickToolIds });
    recordAnalytics(currentAccount, {
      module: 'work_essential',
      action: 'tool_configured',
      status: 'succeeded',
      trustLevel: 'verified_behavior',
      properties: { target: 'work_essential', configurationAction: isPinned ? 'remove' : 'add', toolType: 'tool' },
    });
    const tool = availableTools.find((item) => item.id === toolId);
    showToast(isPinned ? `已从工作必备移除：${tool?.quickLabel || '应用'}` : `已添加到工作必备：${tool?.quickLabel || '应用'}`);
  };

  const handleSectionOrderChange = (sectionOrder: WorkbenchSectionId[]) => {
    updateWorkbenchPreferences({ ...workbenchPreferences, sectionOrder });
    recordAnalytics(currentAccount, { module: 'workbench', action: 'layout_reordered', status: 'succeeded', trustLevel: 'verified_behavior', properties: { configurationAction: 'reorder' } });
  };

  const handleAutoPromoteEnabledChange = (autoPromoteEnabled: boolean) => {
    updateWorkbenchPreferences({ ...workbenchPreferences, autoPromoteEnabled });
    recordAnalytics(currentAccount, {
      module: 'workbench',
      action: 'auto_transfer_toggled',
      status: 'succeeded',
      trustLevel: 'verified_behavior',
      properties: { method: 'automatic', toggleState: autoPromoteEnabled ? 'enabled' : 'disabled' },
    });
    showToast(autoPromoteEnabled ? '已开启自动置顶' : '已关闭自动置顶');
  };

  const handlePromoteSchedule = (item: WorkbenchScheduleItem, source: 'ai' | 'manual', mode: 'manual' | 'automatic' = 'manual') => {
    const state = getWorkbenchTaskState(activeTaskSnapshot, { kind: 'schedule', id: item.id });
    if (state.focused || state.status === 'completed') return;
    updateWorkbenchTaskSnapshot((snapshot) => promoteScheduleTask(snapshot, item.id, source, mode));
    recordAnalytics(currentAccount, {
      module: 'workbench',
      action: 'priority_promoted',
      status: 'succeeded',
      trustLevel: 'verified_behavior',
      properties: { method: mode, source },
    });
    showToast(source === 'ai' ? `已智能置顶「${item.title}」` : `已置顶「${item.title}」`);
  };

  const handleUnpinSchedule = (item: WorkbenchScheduleItem) => {
    const state = getWorkbenchTaskState(activeTaskSnapshot, { kind: 'schedule', id: item.id });
    if (!state.focused) return;
    updateWorkbenchTaskSnapshot((snapshot) => unpinScheduleTask(snapshot, item.id));
    recordAnalytics(currentAccount, {
      module: 'workbench',
      action: 'priority_unpinned',
      status: 'succeeded',
      trustLevel: 'verified_behavior',
      properties: { stage: 'schedule', source: state.focusSource, method: state.focusMethod },
    });
    showToast(`已取消置顶「${item.title}」`);
  };

  const handleTaskStarted = (reference: WorkbenchTaskReference, stage: 'priority' | 'schedule') => {
    const state = getWorkbenchTaskState(activeTaskSnapshot, reference);
    if (state.status !== 'pending') return;
    updateWorkbenchTaskSnapshot((snapshot) => startWorkbenchTask(snapshot, reference));
    recordAnalytics(currentAccount, {
      module: 'workbench',
      action: 'task_started',
      status: 'started',
      trustLevel: 'verified_behavior',
      properties: { stage },
    });
  };

  const handleTaskCompleted = (reference: WorkbenchTaskReference, stage: 'priority' | 'schedule') => {
    const previousState = getWorkbenchTaskState(activeTaskSnapshot, reference);
    if (previousState.status === 'completed') return;
    updateWorkbenchTaskSnapshot((snapshot) => completeWorkbenchTask(snapshot, reference));
    const undoState: TaskUndoState = { accountId: currentAccount.id, reference, previousState };
    setTaskUndo(undoState);
    recordAnalytics(currentAccount, {
      module: 'workbench',
      action: 'task_completed',
      status: 'succeeded',
      trustLevel: 'verified_behavior',
      properties: { stage },
    });
    showToast('已标记为处理完成', {
      actionLabel: '撤销',
      onAction: () => {
        if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
        updateWorkbenchTaskSnapshot((snapshot) => reopenWorkbenchTask(snapshot, reference, previousState));
        recordAnalytics(currentAccount, {
          module: 'workbench',
          action: 'task_reopened',
          status: 'succeeded',
          trustLevel: 'verified_behavior',
          properties: { stage },
        });
        setTaskUndo(null);
        setToast(null);
        toastTimerRef.current = null;
      },
    }, 5000);
  };

  const handleTaskReopened = (reference: WorkbenchTaskReference) => {
    const state = getWorkbenchTaskState(activeTaskSnapshot, reference);
    if (state.status !== 'completed') return;
    updateWorkbenchTaskSnapshot((snapshot) => reopenWorkbenchTask(snapshot, reference));
    recordAnalytics(currentAccount, {
      module: 'workbench',
      action: 'task_reopened',
      status: 'succeeded',
      trustLevel: 'verified_behavior',
      properties: { stage: reference.kind },
    });
    showToast('已恢复为处理中');
  };

  const openAppCenter = (toolId: string | null = null) => {
    recordAnalytics(currentAccount, { module: 'app_center', action: 'app_center_opened', status: 'viewed', trustLevel: 'verified_behavior' });
    if (activeTab !== 'app_center') setAppCenterReturnTab(activeTab);
    setAppCenterInitialToolId(toolId);
    setActiveTab('app_center');
  };

  const handleLaunchTool = (tool: AppTool, source: 'work_essential' | 'app_center' = 'work_essential') => {
    recordAnalytics(currentAccount, {
      module: source,
      action: 'tool_launched',
      status: 'started',
      trustLevel: 'process_proxy',
      properties: { source, toolType: 'tool' },
    });
    setRecentAppToolIds(recordRecentAppToolId(currentAccount.id, tool.id, availableTools.map((item) => item.id)));
    if (tool.action === 'quote') {
      recordAnalytics(currentAccount, { module: 'quote', action: 'quote_opened', status: 'started', trustLevel: 'process_proxy', properties: { source } });
      setQuoteBuilderClient(mockClients[0]);
      return;
    }
    if (tool.targetTab) {
      setActiveTab(tool.targetTab);
      return;
    }
    if (source === 'work_essential') {
      openAppCenter(tool.id);
      return;
    }
    showToast(`已为你打开：${tool.quickLabel}`);
  };

  const handleLabToolSupport = (tool: FrontlineLabTool, nextSupported: boolean) => {
    setSupportedLabToolIds(toggleSupportedLabToolId(tool.id, frontlineLabTools.map((item) => item.id)));
    recordAnalytics(currentAccount, {
      module: 'app_center',
      action: 'lab_tool_supported',
      status: nextSupported ? 'succeeded' : 'cancelled',
      trustLevel: 'verified_behavior',
      properties: { source: 'lab', toolType: 'lab_tool' },
    });
    showToast(nextSupported ? `已支持：${tool.quickLabel}` : `已取消支持：${tool.quickLabel}`);
  };

  const openClient360 = (client: ClientRecord, source: NonNullable<ProductAnalyticsEvent['properties']>['source']) => {
    recordAnalytics(currentAccount, { module: 'client_360', action: 'client_opened', status: 'viewed', trustLevel: 'process_proxy', properties: { source } });
    setSelectedClient360(client);
  };

  const openQuoteBuilder = (client: ClientRecord, source: NonNullable<ProductAnalyticsEvent['properties']>['source']) => {
    recordAnalytics(currentAccount, { module: 'quote', action: 'quote_opened', status: 'started', trustLevel: 'process_proxy', properties: { source } });
    setQuoteBuilderClient(client);
  };

  // Switch Role Account
  const handleSelectAccount = (accId: string) => {
    const nextAccount = mockRoleAccounts.find((account) => account.id === accId) || mockRoleAccounts[0];
    recordAnalytics(currentAccount, {
      module: 'app',
      action: 'role_switched',
      status: 'succeeded',
      trustLevel: 'verified_behavior',
      properties: { target: nextAccount.id === 'operations' ? 'analytics' : 'workbench' },
    });
    setActiveAccountId(accId);
    setIsAccountDrawerOpen(false);
    const newAcc = nextAccount;

    setWorkbenchPreferences(
      readWorkbenchPreferences(
        newAcc.id,
        getAvailableTools(newAcc.id).map((tool) => tool.id),
        defaultQuickToolIdsByRole[newAcc.id] || [],
        newAcc.autoPromoteEnabledByDefault,
      ),
    );

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

  const resetAnalytics = () => {
    resetLocalAnalyticsEvents();
    setAnalyticsRevision((revision) => revision + 1);
    showToast('已清除本机真实埋点，演示基线保留');
  };

  const resetWorkbenchDemo = () => {
    resetWorkbenchTaskSnapshots();
    const resetSnapshot = createInitialWorkbenchTaskSnapshot(currentAccount);
    saveWorkbenchTaskSnapshot(resetSnapshot);
    setWorkbenchTaskSnapshot(resetSnapshot);
    setTaskUndo(null);
    showToast('工作台演示已重置，布局与工作必备保持不变');
  };

  // Logout
  const handleLogout = () => {
    if (confirm('确定要安全退出当前账号吗？')) {
      showToast('已安全退出账号');
    }
  };

  const renderWorkbench = () => (
    <WorkbenchView
      onNavigateToTab={(tab) => setActiveTab(tab)}
      onOpenAppCenter={() => openAppCenter()}
      onSelectClient={(client) => openClient360(client, 'workbench')}
      onOpenQuoteBuilder={(client) => openQuoteBuilder(client, 'workbench')}
      currentAccount={currentAccount}
      priorities={workbenchPriorities}
      tools={availableTools}
      quickToolIds={workbenchPreferences.quickToolIds}
      sectionOrder={workbenchPreferences.sectionOrder}
      onLaunchTool={handleLaunchTool}
      onSectionOrderChange={handleSectionOrderChange}
      onPromoteSchedule={handlePromoteSchedule}
      onUnpinSchedule={handleUnpinSchedule}
      onTaskStarted={handleTaskStarted}
      onTaskCompleted={handleTaskCompleted}
      onTaskReopened={handleTaskReopened}
      autoPromoteEnabled={workbenchPreferences.autoPromoteEnabled}
      autoPromotionPaused={Boolean(taskUndo)}
      taskSnapshot={activeTaskSnapshot}
      onAutoPromoteEnabledChange={handleAutoPromoteEnabledChange}
      onPriorityOpened={(isTransferred) => recordAnalytics(currentAccount, { module: 'workbench', action: isTransferred ? 'transferred_priority_opened' : 'priority_opened', status: 'viewed', trustLevel: 'verified_behavior', properties: { stage: 'priority' } })}
      onScheduleOpened={() => recordAnalytics(currentAccount, { module: 'workbench', action: 'schedule_opened', status: 'viewed', trustLevel: 'verified_behavior', properties: { stage: 'schedule' } })}
      onRecommendationShown={(mode) => recordAnalytics(currentAccount, { module: 'workbench', action: 'recommendation_shown', status: 'viewed', trustLevel: 'verified_behavior', properties: { source: 'ai', method: mode } })}
      onRecommendationAccepted={() => recordAnalytics(currentAccount, { module: 'workbench', action: 'recommendation_accepted', status: 'succeeded', trustLevel: 'verified_behavior', properties: { source: 'ai', method: 'manual' } })}
    />
  );

  return (
    <MobileFrame>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-12 left-1/2 -translate-x-1/2 z-50 flex max-w-[calc(100vw-32px)] items-center gap-3 rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md"
          >
            <span className="truncate">{toast.message}</span>
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                onClick={toast.onAction}
                className="shrink-0 border-l border-white/20 pl-3 font-bold text-[#8fc3ff] cursor-pointer"
              >
                {toast.actionLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className={`min-h-screen min-h-[100dvh] flex flex-col justify-between ${activeTab === 'app_center' ? '' : 'pb-24'}`}>
        {/* Top Header Bar - Omitted on Xiaowan AI tab for full-screen conversational experience */}
        {activeTab !== 'xiaowan' && activeTab !== 'app_center' && (
          <Header
            currentAccount={currentAccount}
            onOpenAccountDrawer={() => setIsAccountDrawerOpen(true)}
            onOpenCustomerService={() => setIsCustomerServiceOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onQuickAction={() => {
              recordAnalytics(currentAccount, { module: 'app', action: 'quick_action_started', status: 'started', trustLevel: 'process_proxy' });
              showToast('已触发：新建客户跟进 / 快速排程试驾');
            }}
          />
        )}

        {/* Tab Views Router */}
        <AnimatePresence mode="wait">
          {activeTab === 'app_center' ? (
            <motion.div
              key="app-center"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.16 }}
            >
              <AppCenterView
                roleTitle={currentAccount.roleTitle}
                tools={availableTools}
                labTools={frontlineLabTools}
                pinnedToolIds={workbenchPreferences.quickToolIds}
                recentToolIds={recentAppToolIds}
                supportedLabToolIds={supportedLabToolIds}
                initialToolId={appCenterInitialToolId}
                onBack={() => {
                  setAppCenterInitialToolId(null);
                  setActiveTab(appCenterReturnTab);
                }}
                onTogglePinnedTool={handleQuickToolToggle}
                onLaunchTool={(tool) => handleLaunchTool(tool, 'app_center')}
                onToolDetailOpen={() => recordAnalytics(currentAccount, { module: 'app_center', action: 'tool_detail_viewed', status: 'viewed', trustLevel: 'verified_behavior', properties: { source: 'app_center', toolType: 'tool' } })}
                onLabOpened={() => recordAnalytics(currentAccount, { module: 'app_center', action: 'lab_opened', status: 'viewed', trustLevel: 'verified_behavior', properties: { source: 'app_center', target: 'lab', toolType: 'lab_tool' } })}
                onLabToolViewed={() => recordAnalytics(currentAccount, { module: 'app_center', action: 'lab_tool_viewed', status: 'viewed', trustLevel: 'verified_behavior', properties: { source: 'lab', toolType: 'lab_tool' } })}
                onLabToolSupportToggled={handleLabToolSupport}
                onLabToolLaunched={() => recordAnalytics(currentAccount, { module: 'app_center', action: 'lab_tool_launched', status: 'started', trustLevel: 'process_proxy', properties: { source: 'lab', toolType: 'lab_tool' } })}
                onLabTutorialOpened={() => recordAnalytics(currentAccount, { module: 'app_center', action: 'lab_tutorial_opened', status: 'viewed', trustLevel: 'verified_behavior', properties: { source: 'lab', toolType: 'lab_tool' } })}
                onLabSubmissionStarted={() => recordAnalytics(currentAccount, { module: 'app_center', action: 'lab_submission_started', status: 'started', trustLevel: 'process_proxy', properties: { source: 'lab', toolType: 'lab_tool' } })}
              />
            </motion.div>
          ) : activeTab === 'workbench' ? (
            <motion.div
              key="workbench"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {renderWorkbench()}
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
                onSelectClient={(client) => openClient360(client, 'clients')}
                onOpenQuoteBuilder={(client) => openQuoteBuilder(client, 'clients')}
                onClientCreated={() => recordAnalytics(currentAccount, { module: 'client_360', action: 'client_created', status: 'started', trustLevel: 'process_proxy' })}
                onSearchStarted={() => recordAnalytics(currentAccount, { module: 'client_360', action: 'client_search_started', status: 'started', trustLevel: 'process_proxy' })}
                onFilterChanged={() => recordAnalytics(currentAccount, { module: 'client_360', action: 'client_filter_changed', status: 'succeeded', trustLevel: 'verified_behavior' })}
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
              <TestDriveView
                onBookTestDrive={() => recordAnalytics(currentAccount, { module: 'test_drive', action: 'test_drive_booked', status: 'started', trustLevel: 'process_proxy' })}
                onReleaseTestDrive={() => recordAnalytics(currentAccount, { module: 'test_drive', action: 'test_drive_released', status: 'started', trustLevel: 'process_proxy' })}
              />
            </motion.div>
          ) : activeTab === 'orders' || activeTab === 'approvals' || activeTab === 'inventory' || activeTab === 'service' || activeTab === 'region' ? (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <OrdersView
                onOrderCreated={() => recordAnalytics(currentAccount, { module: 'order_delivery', action: 'order_created', status: 'started', trustLevel: 'process_proxy' })}
                onContractOpened={() => recordAnalytics(currentAccount, { module: 'order_delivery', action: 'contract_opened', status: 'viewed', trustLevel: 'process_proxy' })}
                onDeliveryStarted={() => recordAnalytics(currentAccount, { module: 'order_delivery', action: 'delivery_started', status: 'started', trustLevel: 'process_proxy' })}
              />
            </motion.div>
          ) : activeTab === 'xiaowan' && currentAccount.hasXiaowan ? (
            <motion.div
              key="xiaowan"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <XiaowanView
                advisorName={currentAccount.name}
                storeName={currentAccount.store}
                onAnalyticsAction={(action) => recordAnalytics(currentAccount, { module: 'xiaowan', action, status: 'started', trustLevel: 'process_proxy' })}
              />
            </motion.div>
          ) : activeTab === 'analytics' && currentAccount.id === 'operations' ? (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <AnalyticsView
                revision={analyticsRevision}
                onPeriodChanged={() => recordAnalytics(currentAccount, { module: 'analytics', action: 'period_changed', status: 'viewed', trustLevel: 'verified_behavior' })}
                onSourceExplained={() => recordAnalytics(currentAccount, { module: 'analytics', action: 'source_explained', status: 'viewed', trustLevel: 'verified_behavior' })}
                onResetLocalData={resetAnalytics}
              />
            </motion.div>
          ) : (
            <motion.div
              key="fallback"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {renderWorkbench()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation Bar */}
        {activeTab !== 'app_center' && <TabBar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          currentAccount={currentAccount}
        />}
      </div>

      {/* Account Drawer Slide-Over (Triggered by Top Left Avatar) */}
      <AccountDrawer
        isOpen={isAccountDrawerOpen}
        onClose={() => setIsAccountDrawerOpen(false)}
        accounts={mockRoleAccounts}
        activeAccountId={activeAccountId}
        onSelectAccount={handleSelectAccount}
        onOpenStoreSwitcher={() => setIsStoreSwitcherOpen(true)}
        onOpenAppCenter={() => {
          setIsAccountDrawerOpen(false);
          openAppCenter();
        }}
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
          openQuoteBuilder(client, 'clients');
        }}
      />

      <QuoteBuilderModal
        isOpen={quoteBuilderClient !== null}
        onClose={() => setQuoteBuilderClient(null)}
        client={quoteBuilderClient}
        advisorName={profile.name}
        storeName={profile.store}
        onGenerateQuote={() => recordAnalytics(currentAccount, { module: 'quote', action: 'quote_generated', status: 'succeeded', trustLevel: 'verified_behavior', properties: { toolType: 'quote_card' } })}
        onShareQuote={() => recordAnalytics(currentAccount, { module: 'quote', action: 'quote_shared', status: 'external_handoff', trustLevel: 'process_proxy', properties: { toolType: 'quote_card' } })}
        onCancelQuote={() => recordAnalytics(currentAccount, { module: 'quote', action: 'quote_cancelled', status: 'cancelled', trustLevel: 'verified_behavior', properties: { toolType: 'quote_card' } })}
        onQuoteFailed={() => recordAnalytics(currentAccount, { module: 'quote', action: 'quote_failed', status: 'failed', trustLevel: 'verified_behavior', properties: { toolType: 'quote_card' } })}
      />

      <StoreSwitcherModal
        isOpen={isStoreSwitcherOpen}
        onClose={() => setIsStoreSwitcherOpen(false)}
        stores={mockStores}
        currentStoreId={profile.store}
        onSelectStore={handleSelectStore}
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
        onResetWorkbenchDemo={resetWorkbenchDemo}
      />

      <DetailListModal
        isOpen={activeMetricDetail !== null}
        onClose={() => setActiveMetricDetail(null)}
        metricType={activeMetricDetail}
      />
    </MobileFrame>
  );
}
