import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useOrganizationsFast, FastOrganization } from '@/hooks/useOrganizationsFast';
import { Organization } from '@/hooks/useOrganizations';
interface OrganizationSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  regionFilter?: string;
  disabled?: boolean;
  organizations?: Organization[]; // Allow passing filtered organizations
}
export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  value,
  onChange,
  label,
  placeholder,
  regionFilter,
  disabled = false,
  organizations: providedOrganizations
}) => {
  const { t } = useTranslation('auth');
  const {
    organizations: fastOrganizations,
    loading,
  } = useOrganizationsFast(providedOrganizations ? undefined : regionFilter);
  const [searchQuery, setSearchQuery] = useState('');

  const labelText = label ?? t('organizationSelector.label');
  const placeholderText = placeholder ?? t('organizationSelector.placeholder');

  // Use provided organizations if available, otherwise use region-filtered ones
  const organizations = (providedOrganizations || fastOrganizations) as (Organization | FastOrganization)[];

  // Filter organizations by region if regionFilter is provided
  let filteredOrganizations = searchQuery 
    ? organizations.filter(org => 
        org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.external_id?.includes(searchQuery) ||
        org.district?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : organizations;
  
  if (regionFilter) {
    filteredOrganizations = filteredOrganizations.filter(org => org.region_id === regionFilter);
  }
  const selectedOrg = organizations.find(org => org.id === value);
  return <div className="space-y-2">
      <Label>{labelText}</Label>
      <div className="w-full">
        <Select value={value} onValueChange={onChange} disabled={loading || disabled}>
          <SelectTrigger>
            <SelectValue placeholder={loading ? t('organizationSelector.loading') : placeholderText}>
              {selectedOrg ? <div className="flex flex-col text-left">
                  <span className="font-medium">{selectedOrg.name}</span>
                  {selectedOrg.district && <span className="text-sm text-muted-foreground">
                      {selectedOrg.district} • {selectedOrg.type}
                      {selectedOrg.is_manual && ` (${t('organizationSelector.manual')})`}
                    </span>}
                </div> : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background border border-border">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t('organizationSelector.searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8" />
              </div>
            </div>
            
            {filteredOrganizations.filter(org => org.id && org.id.trim() !== '' && org.name && org.name.trim() !== '').map(org => <SelectItem key={org.id} value={org.id}>
                  <div className="flex flex-col w-full">
                    <span className="font-medium">{org.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {org.external_id && `№${org.external_id} • `}
                      {org.district} • {org.type}
                      {org.is_manual && ` (${t('organizationSelector.manual')})`}
                    </span>
                  </div>
                </SelectItem>)}
            
            {filteredOrganizations.length === 0 && searchQuery && <div className="p-2 text-center text-muted-foreground">
                {t('organizationSelector.notFound')}
              </div>}
            
            {organizations.length === 0 && !loading && <div className="p-2 text-center text-muted-foreground">
                {t('organizationSelector.empty')}
              </div>}
          </SelectContent>
        </Select>
      </div>
      
      {!selectedOrg && organizations.length > 0 && <p className="text-xs text-muted-foreground">{t('organizationSelector.hint')}</p>}
    </div>;
};
