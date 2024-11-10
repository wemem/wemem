import { useWorkspace } from '@affine/core/components/hooks/use-workspace';

export function useCleanDuplicateOnDocRemove() {
  const workspace = useWorkspace();

  workspace?.docCollection.slots.docAdded.on(docId => {
    const doc = workspace.docCollection.docs.get(docId);
    if (!doc) {
      return;
    }

    console.log('doc.meta?.feedSource', doc.meta?.feedSource);
  });

  // const docs = dbService.db.feedDocs.find();
  // docs.forEach(doc => {
  //   dbService.db.feedDocs.delete(doc.id);
  // });
  // Listen for document removal events
  workspace?.docCollection.slots.docRemoved.on(docId => {
    const doc = workspace.docCollection.docs.get(docId);
    if (!doc) {
      return;
    }

    console.log('doc.meta?.feedSource', doc.meta?.feedSource);
  });
}
