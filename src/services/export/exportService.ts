import JSZip from 'jszip';
import { Batch, PublishBundle, PublishManifest, PublishedArticle } from '../../types/models';
import { nowIso } from '../../utils/date';
import { slugify } from '../../utils/slug';

const writeBlob = async (name: string, blob: Blob) => {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(href), 5000);
};

const publishedArticle = (batch: Batch, article: PublishedArticle): PublishedArticle => ({
  ...article,
  sourceBatchId: batch.id,
  slug: slugify(article.title)
});

export const exportService = {
  buildBundle(batch: Batch): PublishBundle {
    const articles = batch.articles
      .filter((a) => a.status === 'published')
      .map((a) => publishedArticle(batch, a as PublishedArticle));

    const index = articles.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      status: a.status,
      tags: a.tags,
      faqLists: a.faqLists,
      nextReviewDate: a.nextReviewDate,
      publishedAt: a.publishedAt,
      updatedAt: a.updatedAt
    }));

    const files = ['articles/index.json', ...articles.map((a) => `articles/${a.slug}.json`)];
    const manifest: PublishManifest = {
      tool: 'Halo Forge',
      exportedAt: nowIso(),
      batchId: batch.id,
      batchName: batch.name,
      publishedArticleCount: articles.length,
      files,
      schemaVersion: 1
    };

    return { articles, index, manifest };
  },

  async downloadArticle(article: PublishedArticle): Promise<void> {
    const json = JSON.stringify(article, null, 2);
    await writeBlob(`${slugify(article.title)}.json`, new Blob([json], { type: 'application/json' }));
  },

  async downloadBundleZip(batch: Batch): Promise<void> {
    const bundle = this.buildBundle(batch);
    const zip = new JSZip();

    zip.file('manifest.json', JSON.stringify(bundle.manifest, null, 2));
    zip.file('articles/index.json', JSON.stringify(bundle.index, null, 2));
    bundle.articles.forEach((article) => {
      zip.file(`articles/${article.slug}.json`, JSON.stringify(article, null, 2));
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const date = new Date().toISOString().slice(0, 10);
    await writeBlob(`halo-forge-export-${slugify(batch.name)}-${date}.zip`, blob);
  },

  async downloadAllPublishedJson(batch: Batch): Promise<void> {
    const bundle = this.buildBundle(batch);
    for (const article of bundle.articles) {
      // eslint-disable-next-line no-await-in-loop
      await this.downloadArticle(article);
    }
  }
};
