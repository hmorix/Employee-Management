import { useEffect, useState } from 'react';

import { CheckCircle2, Loader2, Plus, Trash2, Users, X } from 'lucide-react';
import { supabase, type Profile, type Task, type Team } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function TeamLeaderBoardPage() {
  const { profile, session } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Team modal
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDept, setTeamDept] = useState('Engineering');
  const [teamDesc, setTeamDesc] = useState('');
  const [savingTeam, setSavingTeam] = useState(false);

  // Assign Task modal
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDue, setTaskDue] = useState('');
  const [taskHours, setTaskHours] = useState('4');
  const [taskAssignTo, setTaskAssignTo] = useState('');
  const [taskTeam, setTaskTeam] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      supabase.from('teams').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('tasks').select('*, profiles(full_name, employee_code)')
        .eq('assigned_by', profile.id)
        .order('created_at', { ascending: false }).limit(50),
    ]).then(([teamsRes, membersRes, tasksRes]) => {
      setTeams((teamsRes.data as Team[]) || []);
      setMembers((membersRes.data as Profile[]) || []);
      setTasks((tasksRes.data as Task[]) || []);
      setLoading(false);
    });
  }, [profile]);

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingTeam(true);
    const { data } = await supabase.from('teams').insert({
      name: teamName, department: teamDept, description: teamDesc,
      leader_id: profile.id, created_by: profile.id
    }).select().single();
    setTeams((prev) => [data as Team, ...prev]);
    setSavingTeam(false);
    setShowTeamForm(false);
    setTeamName(''); setTeamDept('Engineering'); setTeamDesc('');
  };

  const assignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingTask(true);
    const year = new Date().getFullYear();
    const taskCode = `HMX-TASK-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data } = await supabase.from('tasks').insert({
      task_code: taskCode, title: taskTitle, description: taskDesc,
      priority: taskPriority, due_date: taskDue || null,
      estimated_hours: parseFloat(taskHours),
      assigned_to: taskAssignTo || null,
      assigned_by: profile.id,
      team_id: taskTeam || null,
      status: 'todo'
    }).select('*, profiles(full_name, employee_code)').single();
    setTasks((prev) => [data as Task, ...prev]);
    setSavingTask(false);
    setShowTaskForm(false);
    setTaskTitle(''); setTaskDesc(''); setTaskPriority('medium'); setTaskDue(''); setTaskHours('4'); setTaskAssignTo(''); setTaskTeam('');
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    await supabase.from('tasks').update({ status }).eq('id', id);
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  };

  const promoteToTL = async (userId: string) => {
    if (!confirm('Promote this person to Team Leader?')) return;
    await supabase.from('profiles').update({ role: 'team_leader' }).eq('id', userId);
    setMembers((prev) => prev.map((m) => m.id === userId ? { ...m, role: 'team_leader' } : m));
  };

  if (loading) return <div className="p-8 text-cream/60 text-sm">Loading TL Board...</div>;

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-lime uppercase tracking-widest mb-1">Team Leader Board</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-cream">Manage Teams & Assign Work</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowTeamForm(true)} className="hm-btn-secondary text-sm">
            <Users className="w-4 h-4 text-lime" /> Create Team
          </button>
          <button onClick={() => setShowTaskForm(true)} className="hm-btn-primary text-sm">
            <Plus className="w-4 h-4" /> Assign Task
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      <section>
        <h2 className="font-display font-semibold text-cream mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-lime" /> Teams ({teams.length})</h2>
        {teams.length === 0 ? (
          <div className="hm-card p-8 text-center text-cream/60 text-sm">No teams yet. Create the first team!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teams.map((team) => {
              const teamMembers = members.filter((m) => m.team_id === team.id);
              return (
                <div key={team.id} className="hm-card p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-lime/15 border border-lime/40 flex items-center justify-center">
                      <Users className="w-4 h-4 text-lime" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-cream">{team.name}</div>
                      <div className="text-xs font-mono text-cream/55">{team.department}</div>
                    </div>
                  </div>
                  <div className="text-sm text-cream/70">{team.description}</div>
                  <div className="border-t border-cream/10 pt-3 space-y-1.5">
                    {teamMembers.length === 0 ? (
                      <p className="text-xs text-cream/50">No members assigned yet</p>
                    ) : teamMembers.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 text-xs">
                        <div className="w-5 h-5 rounded-full bg-obsidian-3 border border-cream/20 flex items-center justify-center">
                          <span className="text-[9px] text-lime font-bold">{m.full_name[0]}</span>
                        </div>
                        <span className="text-cream/80 truncate">{m.full_name}</span>
                        <span className="text-cream/40 font-mono capitalize">{m.role.replace('_', ' ')}</span>
                        {m.role === 'intern' || m.role === 'employee' ? (
                          <button onClick={() => promoteToTL(m.id)} className="ml-auto text-[10px] text-lime hover:underline font-mono">→ TL</button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Tasks Assigned by Me */}
      <section>
        <h2 className="font-display font-semibold text-cream mb-4">Tasks I Assigned ({tasks.length})</h2>
        <div className="hm-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream/10">
                  {['Code', 'Title', 'Assigned To', 'Priority', 'Status', 'Due', 'Actions'].map((h) => (
                    <th key={h} className="text-left p-3 font-mono text-xs text-cream/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-cream/60 text-sm">No tasks assigned yet.</td></tr>
                ) : tasks.map((task) => (
                  <tr key={task.id}
                    className="border-b border-cream/5 hover:bg-obsidian-3 transition">
                    <td className="p-3 font-mono text-xs text-lime">{task.task_code}</td>
                    <td className="p-3 font-semibold text-cream max-w-xs truncate">{task.title}</td>
                    <td className="p-3 text-cream/70 text-xs">{task.profiles?.full_name || '—'}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${
                        task.priority === 'critical' ? 'bg-red-500/15 text-red-300 border-red-500/40' :
                        task.priority === 'high' ? 'bg-orange-500/15 text-orange-300 border-orange-500/40' :
                        task.priority === 'medium' ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40' :
                        'bg-blue-500/15 text-blue-300 border-blue-500/40'
                      }`}>{task.priority}</span>
                    </td>
                    <td className="p-3">
                      <select value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value as Task['status'])}
                        className="text-xs font-mono bg-obsidian-3 border border-cream/15 rounded px-2 py-1 text-cream">
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">In Review</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td className="p-3 font-mono text-xs text-cream/55">{task.due_date || '—'}</td>
                    <td className="p-3">
                      <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded bg-obsidian-3 border border-cream/10 hover:border-red-500/40 hover:text-red-400 text-cream/60 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Create Team Modal */}
      {showTeamForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-obsidian-2 border border-cream/15 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-cream">Create New Team</h2>
              <button onClick={() => setShowTeamForm(false)} className="p-1.5 rounded text-cream/60 hover:text-cream"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={createTeam} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-cream/60 mb-1">Team Name *</label>
                <input required value={teamName} onChange={(e) => setTeamName(e.target.value)} className="hm-input" placeholder="AI Engineering Pod" />
              </div>
              <div>
                <label className="block text-xs font-mono text-cream/60 mb-1">Department</label>
                <input value={teamDept} onChange={(e) => setTeamDept(e.target.value)} className="hm-input" />
              </div>
              <div>
                <label className="block text-xs font-mono text-cream/60 mb-1">Description</label>
                <textarea rows={2} value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)} className="hm-input" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={savingTeam} className="hm-btn-primary flex-1">
                  {savingTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Create Team
                </button>
                <button type="button" onClick={() => setShowTeamForm(false)} className="hm-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-obsidian-2 border border-cream/15 rounded-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-cream">Assign Task</h2>
              <button onClick={() => setShowTaskForm(false)} className="p-1.5 rounded text-cream/60 hover:text-cream"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={assignTask} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-cream/60 mb-1">Task Title *</label>
                <input required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="hm-input" placeholder="Build user auth flow" />
              </div>
              <div>
                <label className="block text-xs font-mono text-cream/60 mb-1">Description</label>
                <textarea rows={3} value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} className="hm-input" placeholder="Detailed requirements, links, resources..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-cream/60 mb-1">Priority</label>
                  <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="hm-input">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-cream/60 mb-1">Est. Hours</label>
                  <input type="number" value={taskHours} onChange={(e) => setTaskHours(e.target.value)} className="hm-input" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-cream/60 mb-1">Due Date</label>
                  <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} className="hm-input" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-cream/60 mb-1">Assign To</label>
                  <select value={taskAssignTo} onChange={(e) => setTaskAssignTo(e.target.value)} className="hm-input">
                    <option value="">— Unassigned —</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.full_name} ({m.role})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-cream/60 mb-1">Assign to Team</label>
                <select value={taskTeam} onChange={(e) => setTaskTeam(e.target.value)} className="hm-input">
                  <option value="">— No Team —</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={savingTask} className="hm-btn-primary flex-1">
                  {savingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Assign Task
                </button>
                <button type="button" onClick={() => setShowTaskForm(false)} className="hm-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
