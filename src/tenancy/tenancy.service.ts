import { TenantInfo } from '../common/types.js';
import { config } from '../config/index.js';

const tenantDb = new Map<string, TenantInfo>([
  [
    config.defaultTenantKey,
    {
      tenantId: config.defaultTenantId,
      name: 'Default Workspace Tenant',
      apiKey: config.defaultTenantKey,
      status: 'active',
    },
  ],
]);

export class TenancyService {
  resolveTenantFromApiKey(apiKeyHeader?: string): TenantInfo {
    if (config.singleTenantMode) {
      return {
        tenantId: config.defaultTenantId,
        name: 'Single Tenant Workspace',
        apiKey: config.defaultTenantKey,
        status: 'active',
      };
    }

    if (!apiKeyHeader) {
      return {
        tenantId: config.defaultTenantId,
        name: 'Anonymous Tenant',
        apiKey: config.defaultTenantKey,
        status: 'active',
      };
    }

    const cleanedKey = apiKeyHeader.replace('Bearer ', '').trim();
    const tenant = tenantDb.get(cleanedKey);

    if (!tenant) {
      // Fallback or auto-provision tenant for development
      return {
        tenantId: `tenant_${cleanedKey.slice(0, 8)}`,
        name: 'Dynamic API Tenant',
        apiKey: cleanedKey,
        status: 'active',
      };
    }

    return tenant;
  }
}

export const tenancyService = new TenancyService();
