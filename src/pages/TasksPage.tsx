import { useEffect, useState } from 'react';

import { CheckCircle2, Loader2, MessageSquare, Paperclip, Plus, Upload, X } from 'lucide-react';
import { supabase, uploadFile, type Task, type TaskComment } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['todo', 'in_progress', 'review', 'done'] as const;
const STATUS_LABEL: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', review: 'In Review', done: 'Done' };
const PRIORITY_COLOR: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-300 border-red-500/40',
  high: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
  medium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
  low: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
};

export function TasksPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [comment, setComment] = useState('');
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submissionNote, setSubmissionNote] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase.from('tasks').select('*, profiles(full_name, avatar_url, employee_code)')
      .eq('assigned_to', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setTasks((data as Task[]) || []); setLoading(false); });
  }, [profile]);

  const openTask = async (task: Task) => {
    setSelected(task);
    setSubmissionNote(task.submission_note || '');
    const { data } = await supabase.from('task_comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('task_id', task.id)
      .order('created_at');
    setComments((data as TaskComment[]) || []);
  };

  const updateStatus = async (taskId: string, status: Task['status']) => {
    await supabase.from('tasks').update({ status }).eq('id', taskId);
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status } : t));
    if (selected?.id === taskId) setSelected((p) => p ? { ...p, status } : p);
  };

  const submitWork = async () => {
    if (!selected || !profile) return;
    setSubmitting(true);
    let submUrl = selected.submission_url;
    if (submissionFile) submUrl = await uploadFile('hmorix-tasks', `submissions/${selected.id}`, submissionFile);
    await supabase.from('tasks').update({ submission_note: submissionNote, submission_url: submUrl, status: 'review' }).eq('id', selected.id);
    setTasks((prev) => prev.map((t) => t.id === selected.id ? { ...t, submission_note: submissionNote, submission_url: submUrl, status: 'review' } : t));
    setSelected((p) => p ? { ...p, submission_note: submissionNote, submission_url: submUrl, status: 'review' } : p);
    setSubmitting(false);
  };

  const addComment = async () => {
    if (!selected || !profile || !comment.trim()) return;
    setSubmittingComment(true);
    let attachUrl = '';
    if (commentFile) attachUrl = await uploadFile('hmorix-tasks', `comments/${selected.id}`, commentFile);
    const { data } = await supabase.from('task_comments').insert({
      task_id: selected.id, author_id: profile.id, body: comment, attachment_url: attachUrl
    }).select('*, profiles(full_name, avatar_url)').single();
    setComments((prev) => [...prev, data as TaskComment]);
    setComment('');
    setCommentFile(null);
    setSubmittingComment(false);
  };

  const byStatus = (s: Task['status']) => tasks.filter((t) => t.status === s);

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="font-mono text-xs text-lime uppercase tracking-widest mb-1">Sprint Board</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-cream">My Tasks</h1>
      </div>

      {loading ? (
        <p className="text-cream/60 text-sm">Loading tasks...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {STATUSES.map((status) => (
            <div key={status} className="bg-obsidian-2 rounded-2xl border border-cream/10 p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  status === 'done' ? 'bg-lime' : status === 'review' ? 'bg-purple-400' :
                  status === 'in_progress' ? 'bg-yellow-400' : 'bg-cream/40'
                }`} />
                <h2 className="font-display font-semibold text-sm text-cream">{STATUS_LABEL[status]}</h2>
                <span className="ml-auto text-xs font-mono text-cream/50">{byStatus(status).length}</span>
              </div>

              <div className="space-y-3">
                {byStatus(status).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => openTask(task)}
                    className="w-full text-left p-4 rounded-xl bg-obsidian-3 border border-cream/10 hover:border-lime/40 transition"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${PRIORITY_COLOR[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] font-mono text-cream/40">{task.task_code}</span>
                    </div>
                    <div className="text-sm font-semibold text-cream leading-snug">{task.title}</div>
                    {task.due_date && <div className="text-[11px] font-mono text-cream/50 mt-1.5">Due: {task.due_date}</div>}
                    {task.estimated_hours > 0 && (
                      <div className="text-[11px] font-mono text-cream/50">Est: {task.estimated_hours}h</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-obsidian-2 border-l border-cream/10 h-full overflow-y-auto flex flex-col">

            <div className="sticky top-0 bg-obsidian-2 border-b border-cream/10 p-5 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <span className="font-mono text-xs text-lime">{selected.task_code}</span>
                <h2 className="font-display text-xl font-bold text-cream mt-0.5 leading-snug">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg bg-obsidian-3 text-cream/70 hover:text-cream">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-mono text-cream/60 mb-2">Update Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition ${
                        selected.status === s ? 'bg-lime text-obsidian border-lime font-semibold' : 'bg-obsidian-3 text-cream/70 border-cream/15 hover:border-lime/40'
                      }`}>
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-obsidian-3">
                  <div className="font-mono text-cream/50 mb-0.5">Priority</div>
                  <span className={`inline-block px-2 py-0.5 rounded border text-[11px] font-mono capitalize ${PRIORITY_COLOR[selected.priority]}`}>{selected.priority}</span>
                </div>
                <div className="p-3 rounded-lg bg-obsidian-3">
                  <div className="font-mono text-cream/50 mb-0.5">Due Date</div>
                  <div className="font-semibold text-cream">{selected.due_date || '—'}</div>
                </div>
                <div className="p-3 rounded-lg bg-obsidian-3">
                  <div className="font-mono text-cream/50 mb-0.5">Estimated</div>
                  <div className="font-semibold text-cream">{selected.estimated_hours}h</div>
                </div>
                <div className="p-3 rounded-lg bg-obsidian-3">
                  <div className="font-mono text-cream/50 mb-0.5">Logged</div>
                  <div className="font-semibold text-cream">{selected.logged_hours}h</div>
                </div>
              </div>

              {selected.description && (
                <div className="p-3 rounded-lg bg-obsidian-3">
                  <div className="font-mono text-xs text-cream/50 mb-1.5">Description</div>
                  <p className="text-sm text-cream/80 leading-relaxed">{selected.description}</p>
                </div>
              )}

              {/* Work Submission */}
              {selected.status !== 'done' && (
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-cream/60">Submit Work</label>
                  <textarea rows={2} value={submissionNote} onChange={(e) => setSubmissionNote(e.target.value)}
                    className="hm-input" placeholder="Describe what you built / link PR or deploy..." />
                  <label className="hm-btn-secondary cursor-pointer !justify-start">
                    <Paperclip className="w-4 h-4 text-lime" />
                    {submissionFile ? submissionFile.name.slice(0, 20) : 'Attach File'}
                    <input type="file" className="hidden" onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)} />
                  </label>
                  <button onClick={submitWork} disabled={submitting || !submissionNote.trim()} className="hm-btn-primary w-full">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Submit for Review
                  </button>
                </div>
              )}

              {selected.submission_note && (
                <div className="p-3 rounded-lg bg-lime/10 border border-lime/30">
                  <div className="font-mono text-xs text-lime mb-1">SUBMISSION</div>
                  <p className="text-sm text-cream/80">{selected.submission_note}</p>
                  {selected.submission_url && (
                    <a href={selected.submission_url} target="_blank" rel="noreferrer" className="text-xs text-lime hover:underline mt-1 inline-block">
                      View Attachment
                    </a>
                  )}
                </div>
              )}

              {/* Comments */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-lime" />
                  <h3 className="font-display font-semibold text-sm text-cream">Comments ({comments.length})</h3>
                </div>
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-obsidian-3 border border-cream/10">
                      <div className="text-xs font-mono text-lime mb-1">{c.profiles?.full_name || 'Team Member'}</div>
                      <p className="text-sm text-cream/80">{c.body}</p>
                      {c.attachment_url && (
                        <a href={c.attachment_url} target="_blank" rel="noreferrer" className="text-xs text-lime hover:underline mt-1 inline-flex items-center gap-1">
                          <Paperclip className="w-3 h-3" /> Attachment
                        </a>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input value={comment} onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); } }}
                    className="hm-input flex-1 !py-2 text-xs" placeholder="Add comment... (Enter to send)" />
                  <label className="p-2 rounded-lg bg-obsidian-3 border border-cream/10 cursor-pointer hover:border-lime/40 transition">
                    <Paperclip className="w-4 h-4 text-lime" />
                    <input type="file" className="hidden" onChange={(e) => setCommentFile(e.target.files?.[0] || null)} />
                  </label>
                  <button onClick={addComment} disabled={submittingComment || !comment.trim()} className="p-2 rounded-lg bg-lime text-obsidian hover:bg-lime-dim transition disabled:opacity-50">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {commentFile && <div className="text-xs text-cream/50 mt-1 font-mono">{commentFile.name}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
