import type { EntityDefinition } from "@/lib/entities/core/entityDefinition";
import { companyEntity } from "@/lib/entities/companies/companyEntity";
import { countryEntity } from "@/lib/entities/countries/countryEntity";
import { emailConfigurationEntity } from "@/lib/entities/emailConfigurations/emailConfigurationEntity";
import {
  portalSupplierInvoiceEntity,
  purchaseInvoiceEntity,
} from "@/lib/entities/portalSupplierInvoices/portalSupplierInvoiceEntity";
import { supplierEntity } from "@/lib/entities/suppliers/supplierEntity";
import { chartOfAccountEntity } from "@/lib/entities/chartOfAccounts/chartOfAccountEntity";
import { paymentChannelEntity } from "@/lib/entities/paymentChannels/paymentChannelEntity";
import { fiscalTreatmentEntity } from "@/lib/entities/fiscalTreatments/fiscalTreatmentEntity";
import { taxAreaEntity } from "@/lib/entities/taxAreas/taxAreaEntity";
import { itemBalanceEntryEntity } from "@/lib/entities/itemBalanceEntries/itemBalanceEntryEntity";
import { itemEntity } from "@/lib/entities/items/itemEntity";
import { taxConfigurationEntity } from "@/lib/entities/taxConfigurations/taxConfigurationEntity";
import { treasuryGeneralEntity } from "@/lib/entities/treasuryGeneral/treasuryGeneralEntity";
import { treasuryGeneralMovementEntity } from "@/lib/entities/treasuryGeneralMovements/treasuryGeneralMovementEntity";
import { treasuryMemberEntity } from "@/lib/entities/treasuryMembers/treasuryMemberEntity";
import { warehouseEntity } from "@/lib/entities/warehouses/warehouseEntity";
import { workGroupEntity } from "@/lib/entities/workGroups/workGroupEntity";

export const entityRegistry = {
  [countryEntity.key]: countryEntity,
  [companyEntity.key]: companyEntity,
  [emailConfigurationEntity.key]: emailConfigurationEntity,
  [chartOfAccountEntity.key]: chartOfAccountEntity,
  [paymentChannelEntity.key]: paymentChannelEntity,
  [taxAreaEntity.key]: taxAreaEntity,
  [fiscalTreatmentEntity.key]: fiscalTreatmentEntity,
  [taxConfigurationEntity.key]: taxConfigurationEntity,
  [supplierEntity.key]: supplierEntity,
  [portalSupplierInvoiceEntity.key]: portalSupplierInvoiceEntity,
  [purchaseInvoiceEntity.key]: purchaseInvoiceEntity,
  [itemEntity.key]: itemEntity,
  [itemBalanceEntryEntity.key]: itemBalanceEntryEntity,
  [treasuryGeneralEntity.key]: treasuryGeneralEntity,
  [treasuryGeneralMovementEntity.key]: treasuryGeneralMovementEntity,
  [treasuryMemberEntity.key]: treasuryMemberEntity,
  [warehouseEntity.key]: warehouseEntity,
  [workGroupEntity.key]: workGroupEntity,
} satisfies Record<string, EntityDefinition>;

export type RegisteredEntityKey = keyof typeof entityRegistry;

export function getEntityDefinition(entityKey: string) {
  return entityRegistry[entityKey as RegisteredEntityKey] ?? null;
}

export function getRegisteredEntities() {
  return Object.values(entityRegistry);
}
