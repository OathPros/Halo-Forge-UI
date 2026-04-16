export type WorkflowStep = 'source' | 'articles' | 'review' | 'publish';

export type BatchStatus =
  | 'in_progress'
  | 'ready_to_edit'
  | 'ready_to_publish'
  | 'partially_published'
  | 'published';

export type ArticleStatus = 'draft' | 'ready' | 'published';

export interface SourceItem {
  id: string;
  name: string;
  type: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleDraft {
  id: string;
  slug: string;
  title: string;
  status: ArticleStatus;
  articleType: string;
  editor: string;
  descriptionHtml: string;
  resolutionHtml: string;
  internalMemoHtml: string;
  attachments: string[];
  tags: string[];
  relatedArticles: string[];
  teamsThatCanAccess: string[];
  faqLists: string[];
  active: boolean;
  nextReviewDate: string;
  allowedCustomers: string[];
  sourceRefs: string[];
  publishedAt?: string;
  updatedAt: string;
  version: number;
}

export interface PublishedArticle extends ArticleDraft {
  sourceBatchId: string;
}

export interface PublishManifest {
  tool: 'Halo Forge';
  exportedAt: string;
  batchId: string;
  batchName: string;
  publishedArticleCount: number;
  files: string[];
  schemaVersion: 1;
}

export interface PublishBundle {
  manifest: PublishManifest;
  index: Array<Pick<PublishedArticle, 'id' | 'slug' | 'title' | 'status' | 'tags' | 'faqLists' | 'nextReviewDate' | 'publishedAt' | 'updatedAt'>>;
  articles: PublishedArticle[];
}

export interface Batch {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  status: BatchStatus;
  sources: SourceItem[];
  articles: ArticleDraft[];
  activeStep: WorkflowStep;
  selectedSourceId?: string;
  selectedArticleId?: string;
}

export interface AppState {
  batches: Batch[];
  selectedBatchId?: string;
}
