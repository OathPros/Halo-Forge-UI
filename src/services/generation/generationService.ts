import { ArticleDraft, SourceItem } from '../../types/models';
import { nowIso } from '../../utils/date';
import { uid } from '../../utils/id';
import { slugify } from '../../utils/slug';

export const generationService = {
  generateFromSources(sources: SourceItem[]): ArticleDraft[] {
    const now = nowIso();
    return sources.map((source, index) => {
      const guessedTitle = source.name.replace(/\.[^.]+$/, '').slice(0, 70) || `Generated Article ${index + 1}`;
      const title = guessedTitle.charAt(0).toUpperCase() + guessedTitle.slice(1);
      return {
        id: uid('article'),
        slug: slugify(title),
        title,
        status: 'draft',
        articleType: 'Knowledge Base Article',
        editor: 'Rich',
        descriptionHtml: `<p>Generated from source: ${source.name}</p>`,
        resolutionHtml: '<ol><li>Review source context</li><li>Draft support resolution steps</li></ol>',
        internalMemoHtml: '<p>Internal notes pending SME review.</p>',
        attachments: [],
        tags: [],
        relatedArticles: [],
        teamsThatCanAccess: ['Any Team'],
        faqLists: [],
        active: true,
        nextReviewDate: '',
        allowedCustomers: [],
        sourceRefs: [source.id],
        updatedAt: now,
        version: 1
      };
    });
  }
};
