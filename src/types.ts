export interface RoleAccount {
  id: string;
  shortName: string;
  avatarText?: string;
  iconBg: string;
  iconText: string;
  avatarBg: string;
  name: string;
  phone: string;
  verified: boolean;
  signature: string;
  roleTitle: string;
  store: string;
  region: string;
  hasXiaowan: boolean;
  unreadCount?: number;
  tabs: {
    id: TabType;
    label: string;
    iconName: string;
    hasSparkle?: boolean;
    badge?: number;
  }[];
  workbenchMetrics: {
    label: string;
    value: string | number;
    color: string;
    targetTab?: TabType;
  }[];
  workbenchTitle: string;
  workbenchSubtitle: string;
}

export type TabType =
  | 'xiaowan'
  | 'workbench'
  | 'clients'
  | 'testdrive'
  | 'orders'
  | 'team'
  | 'approvals'
  | 'inventory'
  | 'service'
  | 'region';

export interface AdvisorProfile {
  name: string;
  phone: string;
  verified: boolean;
  role: string;
  store: string;
  advisorId: string;
  avatarUrl?: string;
  region: string; // e.g. 'UAE (迪拜)', 'China (中国)', 'SE Asia (东南亚)'
  salesMode: '体验中心 (Direct)' | '经销商模式 (Dealer)' | '直营模式 (Direct)' | '代理模式 (Agency)';
}

export interface MetricData {
  id: 'clients' | 'testDrives' | 'followUps' | 'followingUp' | 'orders' | 'slaUrgent';
  label: string;
  value: number;
  unit?: string;
  iconName: string;
  colorTheme: string; // 'blue' | 'emerald' | 'amber' | 'indigo' | 'rose'
}

export interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  iconBgColor: string;
  iconTextColor: string;
  badge?: string | number;
}

export interface StoreOption {
  id: string;
  name: string;
  address: string;
  isCurrent?: boolean;
  phone: string;
  rating: number;
  region: string;
}

// Multichannel Lead Origin
export interface LeadChannelOrigin {
  category: '数字广告' | '品牌展厅' | '车展路演' | '老客推荐' | 'WhatsApp';
  platform: 'Meta (Facebook/IG)' | 'Meta广告' | 'TikTok' | 'Google Search' | '门店自然到访' | '门店到访' | '官网预约' | '转介绍';
  campaign: string;
  formVersion: string;
  createdTime: string;
}

// Vehicle & VIN Asset
export interface VehicleAsset {
  vin: string;
  modelName: string;
  configTrim: string;
  colorExterior: string;
  colorInterior: string;
  locationStatus: '门店现车' | '海运在途' | 'Jebel Ali Port (海运在途)' | '门店现车 (Store Stock)' | '预定生产 (In Production)' | '已客户绑定 (Customer Bound)';
  estimatedArrival: string;
  msrp: number; // Listed Price
  currency: string;
}

// Customer 360 Dual-Axis Record
export interface ClientRecord {
  id: string;
  customerGlobalId: string; // 统一客户ID e.g. 'C-90281'
  name: string;
  phone: string;
  countryCode: string; // e.g. '+971', '+86'
  intentCar: string;
  status: '线索接入' | '需求确认' | '待试驾' | '方案报价' | '金融置换中' | '已订车' | '已交车' | '已战败';
  opportunityStage: 'L0 线索' | 'L1 线索' | 'L1 有效线索' | 'L2 待试驾' | 'L2 试驾完成' | 'L3 已报价' | 'L3 报价发出' | 'L4 已订车' | 'L4 锁单/付定' | 'L5 车辆交付';
  lastContact: string;
  budget: string;
  avatarBg: string;
  // World-Class CRM Dual-Axis Fields
  channelOrigin: LeadChannelOrigin;
  slaStatus: 'normal' | 'warning' | 'overdue';
  slaCountdownMinutes: number; // e.g. 12 minutes remaining
  householdRole: '车主本人' | '家庭共同决策人' | '企业车队负责人';
  consentMap: {
    whatsapp: boolean;
    phoneCall: boolean;
    sms: boolean;
    dataCrossBorder: boolean;
  };
  tradeInCar?: {
    brandModel: string;
    year: number;
    estimatedValue: string;
  };
  matchedVehicle?: VehicleAsset;
}

export interface TestDriveRecord {
  id: string;
  clientName: string;
  phone: string;
  carModel: string;
  vinAssigned: string;
  timeSlot: string;
  status: '待预约' | '已预约' | '签到试驾中' | '已完成' | '已反馈下一步';
  advisor: string;
  route: string;
}

export interface QuoteVersionItem {
  versionNo: string; // e.g. 'V1 基础方案', 'V2 含金融置换'
  date: string;
  carModel: string;
  basePrice: number;
  optionsPrice: number;
  discount: number;
  tradeInAllowance: number;
  downPayment: number;
  monthlyInstallment: number;
  loanTermMonths: number;
  finalPrice: number;
  currency: string;
  approvalStatus: '顾问权限内' | '需主管审批' | '已通过';
}

export interface OrderRecord {
  id: string;
  orderNo: string;
  clientName: string;
  carModel: string;
  color: string;
  totalPrice: string;
  deposit: string;
  status: '待付尾款' | '准备交车 (PDI完成)' | '已交车' | '已完成';
  date: string;
  boundVin: string;
  pdiStatus: '未开始' | '进行中' | '已合格';
}

export interface AppTool {
  id: string;
  name: string;
  desc: string;
  iconName: string;
  color: string;
  category: '销售工具' | '客户管理' | '数据分析' | '营销宣传';
}

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  time: string;
  type: 'system' | 'client' | 'testDrive' | 'order' | 'sla';
  isUnread: boolean;
}
