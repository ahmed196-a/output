import axios from 'axios';
import {
  AvailableNumber,
  NumberOrder,
  TelecomNumber,
  ComplianceRequirement,
  ComplianceField,
  SearchFilters,
  OrderStatus,
  PhoneNumberCapability,
  PhoneNumberType,
} from '@/types/telecom';

export function isTelnyxConfigured(): boolean {
  return !!process.env.TELNYX_API_KEY?.trim();
}

function getTelnyxClient() {
  const apiToken = process.env.TELNYX_API_KEY?.trim() || '';
  const baseURL = process.env.TELNYX_BASE_URL || 'https://api.telnyx.com/v2';

  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    timeout: 15000,
  });
}

// Mock Storage for Development Sandbox
let mockPurchasedNumbers: TelecomNumber[] = [];
let mockOrders: NumberOrder[] = [];

let mockComplianceRequirements: Record<string, ComplianceRequirement[]> = {
  'sub-442079460192': [
    {
      id: 'req-uk-proof-id',
      type: 'document',
      name: 'Proof of Identity',
      description: 'Upload a scan of a passport, driver license, or national ID card.',
      status: 'not_submitted',
      requiredFields: [
        {
          name: 'passport_scan',
          label: 'ID Document Scan (PDF/Image)',
          type: 'file',
          description: 'Max size 5MB. Must be in color and clear.',
          required: true,
        },
        {
          name: 'full_name',
          label: 'Full Name on Document',
          type: 'text',
          description: 'Must match the document exactly.',
          required: true,
        },
      ],
    },
    {
      id: 'req-uk-proof-address',
      type: 'document',
      name: 'Proof of Address',
      description: 'Upload a utility bill or bank statement showing your name and UK address.',
      status: 'not_submitted',
      requiredFields: [
        {
          name: 'utility_bill',
          label: 'Utility Bill Scan',
          type: 'file',
          description: 'Dated within the last 3 months.',
          required: true,
        },
        {
          name: 'postal_code',
          label: 'UK Postal Code',
          type: 'text',
          description: 'e.g. SW1A 1AA',
          required: true,
        },
      ],
    },
  ],
};

const MOCK_AVAILABLE_NUMBERS: AvailableNumber[] = [
  { phoneNumber: '+12025550143', countryCode: 'US', state: 'DC', locality: 'Washington', type: 'local', capabilities: ['voice', 'sms', 'mms'], cost: 1.00 },
  { phoneNumber: '+12125550188', countryCode: 'US', state: 'NY', locality: 'New York', type: 'local', capabilities: ['voice', 'sms'], cost: 1.25 },
  { phoneNumber: '+13125550109', countryCode: 'US', state: 'IL', locality: 'Chicago', type: 'local', capabilities: ['voice', 'sms', 'mms'], cost: 1.10 },
  { phoneNumber: '+18885559812', countryCode: 'US', type: 'toll_free', capabilities: ['voice', 'sms'], cost: 2.50 },
  { phoneNumber: '+18005559090', countryCode: 'US', type: 'toll_free', capabilities: ['voice', 'sms', 'mms'], cost: 3.00 },
  { phoneNumber: '+35314960192', countryCode: 'IE', locality: 'Dublin', type: 'local', capabilities: ['voice', 'sms'], cost: 2.50 },
  { phoneNumber: '+442079460192', countryCode: 'GB', locality: 'London', type: 'local', capabilities: ['voice', 'sms'], cost: 2.00 },
  { phoneNumber: '+14165550123', countryCode: 'CA', state: 'ON', locality: 'Toronto', type: 'local', capabilities: ['voice', 'sms', 'mms'], cost: 1.50 },
  { phoneNumber: '+493022445566', countryCode: 'DE', locality: 'Berlin', type: 'local', capabilities: ['voice'], cost: 2.20 },
  { phoneNumber: '+61291234567', countryCode: 'AU', locality: 'Sydney', type: 'local', capabilities: ['voice', 'sms'], cost: 2.80 },
];

export function updateMockNumberAgent(phoneNumber: string, agentId: string) {
  const num = mockPurchasedNumbers.find((n) => n.phoneNumber === phoneNumber);
  if (num) {
    num.agentId = agentId;
    return true;
  }
  return false;
}

export async function searchAvailableNumbers(filters: SearchFilters): Promise<AvailableNumber[]> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;

  if (!isTelnyxConfigured()) {
    let filtered = MOCK_AVAILABLE_NUMBERS.filter((num) => {
      if (filters.country && num.countryCode.toLowerCase() !== filters.country.toLowerCase()) return false;
      if (filters.areaCode && !num.phoneNumber.includes(filters.areaCode.replace(/\D/g, ''))) return false;
      if (filters.type && filters.type !== 'all' && num.type !== filters.type) return false;
      if (filters.features && filters.features.length > 0) {
        if (!filters.features.every((f) => num.capabilities.includes(f))) return false;
      }
      return true;
    });

    if (filtered.length === 0 && filters.country) {
      const countryCode = filters.country.toUpperCase();
      const prefixMap: Record<string, string> = { IE: '+3531', US: '+1202', GB: '+4420', CA: '+1416', DE: '+4930', FR: '+331', AU: '+612' };
      const prefix = prefixMap[countryCode] || `+155`;
      filtered = Array.from({ length: 25 }, (_, i) => ({
        phoneNumber: `${prefix}${Math.floor(1000000 + (i * 12345) % 8999999)}`,
        countryCode,
        locality: countryCode === 'IE' ? (i % 2 === 0 ? 'Dublin' : 'Cork') : 'City Center',
        type: (filters.type && filters.type !== 'all' ? filters.type : 'local') as PhoneNumberType,
        capabilities: ['voice', 'sms', 'mms'],
        cost: 1.50 + (i % 3) * 0.5,
      }));
    }

    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }

  try {
    const params: Record<string, any> = {
      'filter[country_code]': filters.country,
      'page[size]': limit,
      'page[number]': page,
    };
    if (filters.areaCode) params['filter[area_code]'] = filters.areaCode;
    if (filters.type && filters.type !== 'all') params['filter[number_type]'] = filters.type === 'toll_free' ? 'toll-free' : filters.type;
    if (filters.features && filters.features.length > 0) params['filter[features]'] = filters.features.join(',');

    const res = await getTelnyxClient().get('/available_phone_numbers', { params });
    const rawData = res.data?.data || [];
    return rawData.map((item: any) => ({
      phoneNumber: item.phone_number,
      countryCode: item.country_code,
      state: item.administrative_area || undefined,
      locality: item.locality || undefined,
      type: item.number_type === 'toll-free' ? 'toll_free' : item.number_type,
      capabilities: (item.features || []).filter((f: any) => f.status === 'supported').map((f: any) => f.name),
      cost: item.cost_information?.monthly_recurring_price ? parseFloat(item.cost_information.monthly_recurring_price) : undefined,
    }));
  } catch (error: any) {
    throw new Error(`Telnyx Search Error: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
  }
}

export async function createNumberOrder(phoneNumber: string, customerReference?: string): Promise<NumberOrder> {
  if (!isTelnyxConfigured()) {
    const isComplianceRequired = ['GB', 'DE', 'IE', 'FR', 'IT', 'ES', 'AT', 'BE'].some((c) => phoneNumber.startsWith(`+${c === 'GB' ? '44' : c === 'DE' ? '49' : c === 'IE' ? '353' : '33'}`));
    const orderId = `ord-${Math.random().toString(36).substring(2, 10)}`;
    const subOrderId = isComplianceRequired ? `sub-${phoneNumber.replace(/\D/g, '')}` : `sub-none`;

    const newOrder: NumberOrder = {
      id: orderId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      phoneNumbers: [phoneNumber],
      requirementsMet: !isComplianceRequired,
      subOrderIds: isComplianceRequired ? [subOrderId] : [],
      customerReference: customerReference || 'WEB_PORTAL_ORDER',
    };

    mockOrders.unshift(newOrder);

    if (isComplianceRequired) {
      mockComplianceRequirements[subOrderId] = [
        {
          id: `req-${subOrderId}-id`,
          type: 'document',
          name: 'Proof of Identity',
          description: `Upload identity document for ${phoneNumber}.`,
          status: 'not_submitted',
          requiredFields: [
            { name: 'passport_scan', label: 'ID Scan', type: 'file', required: true },
            { name: 'full_name', label: 'Full Name', type: 'text', required: true },
          ],
        },
      ];
    } else {
      setTimeout(() => {
        const ord = mockOrders.find((o) => o.id === orderId);
        if (ord) ord.status = 'success';
        mockPurchasedNumbers.unshift({
          id: `num-${Math.random().toString(36).substring(2, 10)}`,
          phoneNumber,
          status: 'active',
          countryCode: 'US',
          type: 'local',
          capabilities: ['voice', 'sms'],
          purchasedAt: new Date().toISOString(),
        });
      }, 5000);
    }

    return newOrder;
  }

  try {
    const payload: Record<string, any> = {
      phone_numbers: [{ phone_number: phoneNumber }],
    };
    if (customerReference) payload.customer_reference = customerReference;

    const res = await getTelnyxClient().post('/number_orders', payload);
    const data = res.data?.data;
    return {
      id: data.id,
      status: data.status?.toLowerCase() === 'completed' ? 'success' : data.status?.toLowerCase() || 'pending',
      createdAt: data.created_at,
      phoneNumbers: data.phone_numbers?.map((p: any) => p.phone_number) || [],
      requirementsMet: data.requirements_met,
      subOrderIds: data.sub_number_orders_ids || [],
      customerReference: data.customer_reference,
    };
  } catch (error: any) {
    throw new Error(`Telnyx Order Error: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
  }
}

export async function getOrder(orderId: string): Promise<NumberOrder> {
  if (!isTelnyxConfigured()) {
    const ord = mockOrders.find((o) => o.id === orderId);
    if (!ord) throw new Error(`Order ${orderId} not found.`);
    return ord;
  }

  try {
    const res = await getTelnyxClient().get(`/number_orders/${orderId}`);
    const data = res.data?.data;
    return {
      id: data.id,
      status: data.status?.toLowerCase() === 'completed' ? 'success' : data.status?.toLowerCase() || 'pending',
      createdAt: data.created_at,
      phoneNumbers: data.phone_numbers?.map((p: any) => p.phone_number) || [],
      requirementsMet: data.requirements_met,
      subOrderIds: data.sub_number_orders_ids || [],
      customerReference: data.customer_reference,
    };
  } catch (error: any) {
    throw new Error(`Telnyx Order Fetch Error: ${error.message}`);
  }
}

export async function getOrders(): Promise<NumberOrder[]> {
  if (!isTelnyxConfigured()) return mockOrders;
  try {
    const res = await getTelnyxClient().get('/number_orders', { params: { 'page[size]': 50 } });
    const rawData = res.data?.data || [];
    return rawData.map((data: any) => ({
      id: data.id,
      status: data.status?.toLowerCase() === 'completed' ? 'success' : data.status?.toLowerCase() || 'pending',
      createdAt: data.created_at,
      phoneNumbers: data.phone_numbers?.map((p: any) => p.phone_number) || [],
      requirementsMet: data.requirements_met,
      subOrderIds: data.sub_number_orders_ids || [],
      customerReference: data.customer_reference,
    }));
  } catch (error: any) {
    throw new Error(`Telnyx Orders List Error: ${error.message}`);
  }
}

export async function getPurchasedNumbers(): Promise<TelecomNumber[]> {
  if (!isTelnyxConfigured()) return mockPurchasedNumbers;
  try {
    const res = await getTelnyxClient().get('/phone_numbers', { params: { 'page[size]': 100 } });
    const rawData = res.data?.data || [];
    return rawData.map((item: any) => ({
      id: item.id,
      phoneNumber: item.phone_number,
      status: item.status,
      countryCode: item.country_code,
      type: item.number_type === 'toll-free' ? 'toll_free' : item.number_type,
      capabilities: ['voice', 'sms'],
      purchasedAt: item.created_at || item.purchased_at,
    }));
  } catch (error: any) {
    throw new Error(`Telnyx Numbers List Error: ${error.message}`);
  }
}

export async function getComplianceRequirements(subOrderId: string): Promise<ComplianceRequirement[]> {
  if (!isTelnyxConfigured()) return mockComplianceRequirements[subOrderId] || [];
  try {
    const res = await getTelnyxClient().get(`/sub_number_orders/${subOrderId}`);
    const data = res.data?.data;
    return (data?.regulatory_requirements || []).map((req: any) => ({
      id: req.id,
      type: req.field_type || 'document',
      name: req.name,
      description: req.description || req.acceptance_criteria || 'Regulatory requirement submission required.',
      status: req.status === 'approved' ? 'approved' : 'not_submitted',
      requiredFields: [
        { name: `${req.id}_text`, label: req.name, type: 'text', required: true }
      ],
    }));
  } catch (error: any) {
    throw new Error(`Telnyx Compliance Error: ${error.message}`);
  }
}

export async function submitCompliance(subOrderId: string, requirements: Record<string, string>): Promise<NumberOrder> {
  if (!isTelnyxConfigured()) {
    const parentOrder = mockOrders.find((o) => o.subOrderIds.includes(subOrderId));
    if (parentOrder) {
      parentOrder.status = 'processing';
      setTimeout(() => {
        parentOrder.requirementsMet = true;
        parentOrder.status = 'success';
        parentOrder.phoneNumbers.forEach((num) => {
          if (!mockPurchasedNumbers.some((pn) => pn.phoneNumber === num)) {
            mockPurchasedNumbers.unshift({
              id: `num-${Math.random().toString(36).substring(2, 10)}`,
              phoneNumber: num,
              status: 'active',
              countryCode: 'GB',
              type: 'local',
              capabilities: ['voice', 'sms'],
              purchasedAt: new Date().toISOString(),
            });
          }
        });
      }, 6000);
    }
    return parentOrder || mockOrders[0];
  }

  try {
    const regulatoryPayload = Object.entries(requirements).map(([key, val]) => ({
      requirement_id: key.split('_')[0],
      field_value: val,
    }));

    const res = await getTelnyxClient().patch(`/sub_number_orders/${subOrderId}`, { regulatory_requirements: regulatoryPayload });
    const subOrderData = res.data?.data;
    if (subOrderData?.phone_number_order_id) {
      return await getOrder(subOrderData.phone_number_order_id);
    }
    return mockOrders[0];
  } catch (error: any) {
    throw new Error(`Telnyx Submit Compliance Error: ${error.message}`);
  }
}
