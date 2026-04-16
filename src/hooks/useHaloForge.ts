import { useEffect, useMemo, useState } from 'react';
import { generationService } from '../services/generation/generationService';
import { storageService } from '../services/storage/storageService';
import { AppState, ArticleDraft, ArticleStatus, Batch, BatchStatus, SourceItem, WorkflowStep } from '../types/models';
import { nowIso } from '../utils/date';
import { uid } from '../utils/id';
import { slugify } from '../utils/slug';

const deriveBatchStatus = (batch: Batch): BatchStatus => {
  if (batch.articles.length === 0) return 'in_progress';
  const published = batch.articles.filter((a) => a.status === 'published').length;
  if (published === batch.articles.length) return 'published';
  if (published > 0) return 'partially_published';
  if (batch.articles.some((a) => a.status === 'ready')) return 'ready_to_publish';
  return 'ready_to_edit';
};

const parseList = (raw: string): string[] => raw.split(',').map((s) => s.trim()).filter(Boolean);

export const useHaloForge = () => {
  const [state, setState] = useState<AppState>(storageService.load());

  useEffect(() => {
    storageService.save(state);
  }, [state]);

  const selectedBatch = useMemo(
    () => state.batches.find((b) => b.id === state.selectedBatchId) ?? state.batches[0],
    [state]
  );

  const selectedArticle = useMemo(
    () => selectedBatch?.articles.find((a) => a.id === selectedBatch.selectedArticleId) ?? selectedBatch?.articles[0],
    [selectedBatch]
  );

  const selectedSource = useMemo(
    () => selectedBatch?.sources.find((s) => s.id === selectedBatch.selectedSourceId) ?? selectedBatch?.sources[0],
    [selectedBatch]
  );

  const upsertBatch = (batch: Batch) => {
    setState((prev) => ({
      ...prev,
      batches: prev.batches.map((b) => (b.id === batch.id ? { ...batch, status: deriveBatchStatus(batch), updatedAt: nowIso() } : b))
    }));
  };

  const createBatch = () => {
    const newBatch: Batch = {
      id: uid('batch'),
      name: `New batch ${state.batches.length + 1}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: 'in_progress',
      sources: [],
      articles: [],
      activeStep: 'source'
    };
    setState((prev) => ({ ...prev, batches: [newBatch, ...prev.batches], selectedBatchId: newBatch.id }));
  };

  const deleteBatch = (id: string) => {
    setState((prev) => {
      const batches = prev.batches.filter((b) => b.id !== id);
      return { batches, selectedBatchId: batches[0]?.id };
    });
  };

  const renameBatch = (name: string) => {
    if (!selectedBatch) return;
    upsertBatch({ ...selectedBatch, name });
  };

  const selectBatch = (id: string) => setState((prev) => ({ ...prev, selectedBatchId: id }));

  const setStep = (step: WorkflowStep) => {
    if (!selectedBatch) return;
    upsertBatch({ ...selectedBatch, activeStep: step });
  };

  const addSources = (sources: SourceItem[]) => {
    if (!selectedBatch) return;
    const first = sources[0]?.id ?? selectedBatch.selectedSourceId;
    upsertBatch({ ...selectedBatch, sources: [...selectedBatch.sources, ...sources], selectedSourceId: first });
  };

  const updateSource = (sourceId: string, content: string) => {
    if (!selectedBatch) return;
    upsertBatch({
      ...selectedBatch,
      sources: selectedBatch.sources.map((s) => (s.id === sourceId ? { ...s, content, updatedAt: nowIso() } : s))
    });
  };

  const removeSource = (sourceId: string) => {
    if (!selectedBatch) return;
    const next = selectedBatch.sources.filter((s) => s.id !== sourceId);
    upsertBatch({ ...selectedBatch, sources: next, selectedSourceId: next[0]?.id });
  };

  const generateArticles = () => {
    if (!selectedBatch || selectedBatch.sources.length === 0) return;
    const generated = generationService.generateFromSources(selectedBatch.sources);
    upsertBatch({ ...selectedBatch, articles: generated, selectedArticleId: generated[0]?.id, activeStep: 'review' });
  };

  const updateArticle = (articleId: string, patch: Partial<ArticleDraft>) => {
    if (!selectedBatch) return;
    upsertBatch({
      ...selectedBatch,
      articles: selectedBatch.articles.map((a) =>
        a.id === articleId
          ? { ...a, ...patch, slug: slugify(patch.title ?? a.title), updatedAt: nowIso(), version: a.version + 1 }
          : a
      )
    });
  };

  const transitionArticle = (articleId: string, status: ArticleStatus) => {
    const patch: Partial<ArticleDraft> = { status, updatedAt: nowIso() };
    if (status === 'published') patch.publishedAt = nowIso();
    updateArticle(articleId, patch);
  };

  const updateArrayField = (articleId: string, key: keyof ArticleDraft, input: string) => {
    updateArticle(articleId, { [key]: parseList(input) } as Partial<ArticleDraft>);
  };

  return {
    state,
    selectedBatch,
    selectedArticle,
    selectedSource,
    actions: {
      createBatch,
      deleteBatch,
      renameBatch,
      selectBatch,
      setStep,
      addSources,
      updateSource,
      removeSource,
      generateArticles,
      updateArticle,
      transitionArticle,
      updateArrayField,
      selectSource: (sourceId: string) => selectedBatch && upsertBatch({ ...selectedBatch, selectedSourceId: sourceId }),
      selectArticle: (articleId: string) => selectedBatch && upsertBatch({ ...selectedBatch, selectedArticleId: articleId })
    }
  };
};
