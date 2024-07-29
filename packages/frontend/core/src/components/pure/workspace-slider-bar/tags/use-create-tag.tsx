import { useCallback, useState } from 'react';

import { CreateTagModal } from './create-tag';

export const useCreateTag = ({ title }: { title: string }) => {
  const [data, setData] = useState<{
    name: string;
  }>();
  const close = useCallback(() => setData(undefined), []);

  return {
    node: data ? (
      <CreateTagModal
        title={title}
        init={data.name}
        open={!!data}
        onOpenChange={close}
      />
    ) : null,
    open: (name: string) => setData({ name }),
  };
};
