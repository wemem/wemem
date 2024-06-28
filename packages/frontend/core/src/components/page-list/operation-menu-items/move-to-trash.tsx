import type { ConfirmModalProps, MenuItemProps } from '@affine/component';
import { ConfirmModal, MenuIcon, MenuItem } from '@affine/component';
import { useI18n } from '@affine/i18n';
import { DeleteIcon } from '@blocksuite/icons/rc';

export const MoveToTrash = (props: MenuItemProps) => {
  const t = useI18n();

  return (
    <MenuItem
      preFix={
        <MenuIcon>
          <DeleteIcon />
        </MenuIcon>
      }
      type="danger"
      {...props}
    >
      {t['com.affine.moveToTrash.title']()}
    </MenuItem>
  );
};

const MoveToTrashConfirm = ({
  titles,
  ...confirmModalProps
}: {
  titles: string[];
} & ConfirmModalProps) => {
  const t = useI18n();
  const multiple = titles.length > 1;
  const title = multiple
    ? t['com.affine.moveToTrash.confirmModal.title.multiple']({
        number: titles.length.toString(),
      })
    : t['com.affine.moveToTrash.confirmModal.title']();
  const description = multiple
    ? t['com.affine.moveToTrash.confirmModal.description.multiple']({
        number: titles.length.toString(),
      })
    : t['com.affine.moveToTrash.confirmModal.description']({
        title: titles[0] || t['Untitled'](),
      });
  return (
    <ConfirmModal
      title={title}
      description={description}
      cancelText={t['com.affine.confirmModal.button.cancel']()}
      confirmButtonOptions={{
        ['data-testid' as string]: 'confirm-delete-page',
        type: 'error',
        children: t.Delete(),
      }}
      {...confirmModalProps}
    />
  );
};

MoveToTrash.ConfirmModal = MoveToTrashConfirm;
