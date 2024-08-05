import { EditFeedModal } from '@affine/core/components/page-list/feed/edit-feed';
import { useCallback, useState } from 'react';

export const useEditSubscriptionModal = ({
  title,
  showTips,
}: {
  title: string;
  showTips?: boolean;
}) => {
  const [data, setData] = useState<{
    name: string;
    onConfirm: (name: string) => void;
  }>();
  const close = useCallback(() => setData(undefined), []);

  return {
    node: data ? (
      <EditFeedModal
        showTips={showTips}
        title={title}
        init={data.name}
        open={!!data}
        onOpenChange={close}
        onConfirm={data.onConfirm}
      />
    ) : null,
    open: (name: string): Promise<string> =>
      new Promise<string>(res => {
        setData({
          name,
          onConfirm: feed => {
            res(feed);
          },
        });
      }),
  };
};
