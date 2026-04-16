import { FormEvent, useMemo, useState } from 'react';
import { useHaloForge } from '../hooks/useHaloForge';
import { exportService } from '../services/export/exportService';
import { Batch, SourceItem, WorkflowStep } from '../types/models';
import { formatDateTime, nowIso } from '../utils/date';
import { uid } from '../utils/id';

const steps: Array<{ id: WorkflowStep; label: string }> = [
  { id: 'source', label: 'Source' },
  { id: 'articles', label: 'Articles' },
  { id: 'review', label: 'Review Articles' },
  { id: 'publish', label: 'Publish' }
];

const batchStatusLabel = (status: Batch['status']) =>
  ({
    in_progress: 'In progress',
    ready_to_edit: 'Ready to edit',
    ready_to_publish: 'Ready to publish',
    partially_published: 'Partially published',
    published: 'Published'
  })[status];

export const App = () => {
  const { state, selectedBatch, selectedSource, selectedArticle, actions } = useHaloForge();
  const [sourceName, setSourceName] = useState('');
  const [sourceText, setSourceText] = useState('');

  const readyArticles = useMemo(
    () => selectedBatch?.articles.filter((a) => a.status === 'ready') ?? [],
    [selectedBatch]
  );

  const onFileUpload = async (e: FormEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || !selectedBatch) return;
    const items: SourceItem[] = await Promise.all(
      Array.from(files).map(async (file) => ({
        id: uid('source'),
        name: file.name,
        type: file.type || 'file',
        content: await file.text().catch(() => `Binary file: ${file.name}`),
        createdAt: nowIso(),
        updatedAt: nowIso()
      }))
    );
    actions.addSources(items);
  };

  if (!selectedBatch) {
    return (
      <div className="app">
        <header className="topbar"><strong>Halo Forge</strong></header>
        <main className="main"><button className="primary" onClick={actions.createBatch}>Create first batch</button></main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="forge">HF</div>
          <div>
            <div><strong>Halo Forge</strong></div>
            <div className="subtitle">Create &amp; Publish Halo Knowledge Articles</div>
          </div>
        </div>
        <img alt="York University" src={`${import.meta.env.BASE_URL}assets/yorku-wordmark.svg`} height={28} />
      </header>

      <div className="shell">
        <aside className="sidebar">
          <div className="row space"><strong>Saved batches</strong><button className="primary" onClick={actions.createBatch}>New batch</button></div>
          <input placeholder="Search batches" />
          {state.batches.map((b) => (
            <div key={b.id} className={`batch-item ${selectedBatch.id === b.id ? 'active' : ''}`} onClick={() => actions.selectBatch(b.id)}>
              <div className="row space"><strong className="title-truncate">{b.name}</strong>
                <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this batch? Published articles already downloaded/exported are unaffected. Unpublished article work in this batch will be lost.')) actions.deleteBatch(b.id); }}>⋯</button>
              </div>
              <small>{batchStatusLabel(b.status)} · {b.sources.length} source · {b.articles.length} article</small>
            </div>
          ))}
        </aside>

        <main className="main">
          <div className="panel row space">
            <div>
              <label>Batch name</label>
              <input value={selectedBatch.name} onChange={(e) => actions.renameBatch(e.target.value)} />
              <small>Updated {formatDateTime(selectedBatch.updatedAt)}</small>
            </div>
            <span className={`badge ${selectedBatch.status === 'published' ? 'published' : selectedBatch.status === 'ready_to_publish' ? 'ready' : 'draft'}`}>{batchStatusLabel(selectedBatch.status)}</span>
          </div>

          <div className="steps">
            {steps.map((s) => (
              <div key={s.id} className={`step ${selectedBatch.activeStep === s.id ? 'active' : ''}`} onClick={() => actions.setStep(s.id)}>{s.label}</div>
            ))}
          </div>

          {selectedBatch.activeStep === 'source' && (
            <div className="grid2">
              <div className="panel">
                <h3>Source</h3>
                <input type="file" multiple onInput={onFileUpload} />
                <label>Pasted source name</label>
                <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} />
                <label>Pasted source text</label>
                <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} />
                <button className="primary" onClick={() => {
                  if (!sourceText.trim()) return;
                  actions.addSources([{ id: uid('source'), name: sourceName.trim() || 'Pasted source', type: 'text', content: sourceText, createdAt: nowIso(), updatedAt: nowIso() }]);
                  setSourceName(''); setSourceText('');
                }}>Add source</button>
              </div>
              <div className="panel">
                <div className="row space"><h3>Batch Sources</h3><button className="navy" onClick={actions.generateArticles} disabled={selectedBatch.sources.length === 0}>Generate articles</button></div>
                <div className="list">
                  {selectedBatch.sources.map((s) => (
                    <div key={s.id} className={`source-row ${selectedBatch.selectedSourceId === s.id ? 'active' : ''}`} onClick={() => actions.selectSource(s.id)}>
                      <div className="title-truncate">{s.name}</div>
                      <button className="danger" onClick={(e) => { e.stopPropagation(); actions.removeSource(s.id); }}>Remove</button>
                    </div>
                  ))}
                </div>
                <h4>Preview and edit selected source</h4>
                {selectedSource ? <textarea value={selectedSource.content} onChange={(e) => actions.updateSource(selectedSource.id, e.target.value)} /> : <p>No source selected.</p>}
              </div>
            </div>
          )}

          {selectedBatch.activeStep === 'articles' && (
            <div className="panel">
              <h3>Articles</h3>
              <p>{selectedBatch.articles.length} generated article drafts.</p>
              <button className="navy" onClick={actions.generateArticles} disabled={selectedBatch.sources.length === 0}>Regenerate from current source batch</button>
            </div>
          )}

          {selectedBatch.activeStep === 'review' && (
            <div className="grid2">
              <div className="panel">
                <h3>Article Drafts</h3>
                <div className="list">
                  {selectedBatch.articles.map((a) => (
                    <div key={a.id} className={`article-row ${selectedBatch.selectedArticleId === a.id ? 'active' : ''}`} onClick={() => actions.selectArticle(a.id)}>
                      <div className="title-truncate">{a.title}</div>
                      <span className={`badge ${a.status}`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                {selectedArticle && (
                  <>
                    <label>Title</label><input value={selectedArticle.title} disabled={selectedArticle.status === 'ready'} onChange={(e) => actions.updateArticle(selectedArticle.id, { title: e.target.value })} />
                    <label>Article Type</label><input value={selectedArticle.articleType} disabled={selectedArticle.status === 'ready'} onChange={(e) => actions.updateArticle(selectedArticle.id, { articleType: e.target.value })} />
                    <label>Editor</label><input value={selectedArticle.editor} disabled={selectedArticle.status === 'ready'} onChange={(e) => actions.updateArticle(selectedArticle.id, { editor: e.target.value })} />
                    <label>Description</label><div className="rich" contentEditable={selectedArticle.status !== 'ready'} suppressContentEditableWarning onBlur={(e) => actions.updateArticle(selectedArticle.id, { descriptionHtml: e.currentTarget.innerHTML })} dangerouslySetInnerHTML={{ __html: selectedArticle.descriptionHtml }} />
                    <label>Resolution</label><div className="rich" contentEditable={selectedArticle.status !== 'ready'} suppressContentEditableWarning onBlur={(e) => actions.updateArticle(selectedArticle.id, { resolutionHtml: e.currentTarget.innerHTML })} dangerouslySetInnerHTML={{ __html: selectedArticle.resolutionHtml }} />
                    <label>Internal Memo</label><div className="rich" contentEditable={selectedArticle.status !== 'ready'} suppressContentEditableWarning onBlur={(e) => actions.updateArticle(selectedArticle.id, { internalMemoHtml: e.currentTarget.innerHTML })} dangerouslySetInnerHTML={{ __html: selectedArticle.internalMemoHtml }} />
                    <label>Attachments</label><input value={selectedArticle.attachments.join(', ')} disabled={selectedArticle.status === 'ready'} onChange={(e) => actions.updateArrayField(selectedArticle.id, 'attachments', e.target.value)} />
                    <label>Tags</label><input value={selectedArticle.tags.join(', ')} disabled={selectedArticle.status === 'ready'} onChange={(e) => actions.updateArrayField(selectedArticle.id, 'tags', e.target.value)} />
                    <label>Related Articles</label><input value={selectedArticle.relatedArticles.join(', ')} disabled={selectedArticle.status === 'ready'} onChange={(e) => actions.updateArrayField(selectedArticle.id, 'relatedArticles', e.target.value)} />
                    <label>Teams that can access this Article</label><input value={selectedArticle.teamsThatCanAccess.join(', ')} disabled={selectedArticle.status === 'ready'} onChange={(e) => actions.updateArrayField(selectedArticle.id, 'teamsThatCanAccess', e.target.value)} />
                    <label>FAQ Lists that this Article appears on</label><input value={selectedArticle.faqLists.join(', ')} disabled={selectedArticle.status === 'ready'} onChange={(e) => actions.updateArrayField(selectedArticle.id, 'faqLists', e.target.value)} />
                    <label>Active</label><select value={String(selectedArticle.active)} disabled={selectedArticle.status === 'ready'} onChange={(e) => actions.updateArticle(selectedArticle.id, { active: e.target.value === 'true' })}><option value="true">true</option><option value="false">false</option></select>
                    <label>Next Review Date</label><input type="date" value={selectedArticle.nextReviewDate} disabled={selectedArticle.status === 'ready'} onChange={(e) => actions.updateArticle(selectedArticle.id, { nextReviewDate: e.target.value })} />
                    <label>Allowed Customers</label><input value={selectedArticle.allowedCustomers.join(', ')} disabled={selectedArticle.status === 'ready'} onChange={(e) => actions.updateArrayField(selectedArticle.id, 'allowedCustomers', e.target.value)} />
                    <div className="row" style={{ marginTop: 10 }}>
                      {selectedArticle.status === 'ready' ? (
                        <button onClick={() => actions.transitionArticle(selectedArticle.id, 'draft')}>Edit Article</button>
                      ) : (
                        <button className="primary" onClick={() => actions.transitionArticle(selectedArticle.id, 'ready')}>Ready to publish</button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {selectedBatch.activeStep === 'publish' && (
            <div className="panel">
              <h3>Publish</h3>
              <p>Only ready articles can be published.</p>
              <div className="list">
                {selectedBatch.articles.map((a) => (
                  <div key={a.id} className="article-row">
                    <div>{a.title}</div>
                    <div className="row">
                      <span className={`badge ${a.status}`}>{a.status}</span>
                      {a.status === 'ready' && <button className="primary" onClick={() => actions.transitionArticle(a.id, 'published')}>Publish</button>}
                      {a.status === 'published' && (
                        <button onClick={() => exportService.downloadArticle({ ...a, sourceBatchId: selectedBatch.id })}>Download JSON</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <button onClick={() => exportService.downloadAllPublishedJson(selectedBatch)} disabled={selectedBatch.articles.every((a) => a.status !== 'published')}>Download all published JSON</button>
                <button className="navy" onClick={() => exportService.downloadBundleZip(selectedBatch)} disabled={selectedBatch.articles.every((a) => a.status !== 'published')}>Download ZIP publish bundle</button>
              </div>
              <p>{readyArticles.length} ready to publish</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
