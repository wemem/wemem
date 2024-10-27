export const OrganizeSupportType = ['feedFolder', 'feed', 'feedDoc'] as const;
export type OrganizeSupportType = 'feedFolder' | 'feed' | 'feedDoc';

export const isOrganizeSupportType = (
  type: string
): type is OrganizeSupportType =>
  OrganizeSupportType.includes(type as OrganizeSupportType);
