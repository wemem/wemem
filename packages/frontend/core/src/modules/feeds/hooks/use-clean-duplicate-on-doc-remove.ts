import { useWorkspace } from '@affine/core/components/hooks/use-workspace';
import { useService, WorkspaceDBService } from '@toeverything/infra';

export function useCleanDuplicateOnDocRemove() {
  const workspace = useWorkspace();
  const dbService = useService(WorkspaceDBService);

  // const docs = dbService.db.feedDocs.find();
  // docs.forEach(doc => {
  //   dbService.db.feedDocs.delete(doc.id);
  // });
  // Listen for document removal events
  workspace?.docCollection.slots.docRemoved.on(docId => {
    dbService.db.feedDocs.delete(docId);
  });
}
