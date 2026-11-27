import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, ChevronRight, Clock, Kanban, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, type Task } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
  const { user, profile, profileError, loading, isLeader, refreshProfile, signOut } = useAuth();
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<{ punch_in: string; punch_out: string | null; total_minutes: number } | null>(null);
  const [punchLoading, setPunchLoading] = useState(false);
  const [teamCount, setTeamCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const today = new Date().toISOString().slice(0, 10);

    supabase.from('tasks').select('*').eq('assigned_to', profile.id).neq('status', 'done')
      .order('priority', { ascending: false }).limit(5)
      .then(({ data }) => setMyTasks((data as Task[]) || []));

    supabase.from('attendance_logs').select('punch_in, punch_out, total_minutes')
      .eq('user_id', profile.id).eq('work_date', today).maybeSingle()
      .then(({ data }) => setTodayAttendance(data as typeof todayAttendance));

    if (profile.team_id) {
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('team_id', profile.team_id)
        .then(({ count }) => setTeamCount(count || 0));
    }
  }, [profile]);

  const punchIn = async () => {
    if (!profile) return;
    setPunchLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from('attendance_logs').insert({
      user_id: profile.id, work_date: today, punch_in: new Date().toISOString(),
      work_mode: 'Remote', status: 'present'
    }).select().single();
    setTodayAttendance(data as typeof todayAttendance);
    setPunchLoading(false);
  };

  const punchOut = async () => {
    if (!todayAttendance || !profile) return;
    setPunchLoading(true);
    const now = new Date();
    const mins = Math.round((now.getTime() - new Date(todayAttendance.punch_in).getTime()) / 60000);
    const { data } = await supabase.from('attendance_logs')
      .update({ punch_out: now.toISOString(), total_minutes: mins })
      .eq('user_id', profile.id).eq('work_date', new Date().toISOString().slice(0, 10))
      .select().single();
    setTodayAttendance(data as typeof todayAttendance);
    setPunchLoading(false);
  };

  const priorityColor: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-300 border-red-500/40',
    high: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
    medium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
    low: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-cream/60 font-mono text-sm">
        Loading your HMorix workspace...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="hm-card p-6 sm:p-8 space-y-4 border-red-500/30">
          <p className="font-mono text-xs text-lime uppercase">Profile Setup Required</p>
          <h1 className="font-display text-2xl font-bold text-cream">Unable to load your workspace profile</h1>
          <p className="text-sm text-cream/70">
            Signed in as <code className="text-lime">{user?.email}</code>, but the <code className="text-lime">profiles</code> table returned no record.
          </p>
          {profileError && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-mono">
              {profileError}
            </div>
          )}
          <p className="text-xs text-cream/55">
            Make sure you have run <code>supabase/schema.sql</code> in your Supabase SQL Editor.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button onClick={() => refreshProfile()} className="hm-btn-primary">Retry</button>
            <button onClick={() => signOut()} className="hm-btn-secondary">Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="hm-card p-6 bg-gradient-to-br from-obsidian-2 via-obsidian-2 to-lime/5 border-lime/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-lime uppercase tracking-widest">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-cream mt-1">{profile.full_name}</h1>
            <p className="text-sm text-cream/65 mt-0.5">{profile.designation} · {profile.department} · <span className="text-lime font-mono">{profile.employee_code}</span></p>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs text-cream/50">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Kanban, label: 'Open Tasks', value: myTasks.length, to: '/tasks' },
          { icon: CheckCircle2, label: 'Team Size', value: teamCount || '—', to: '/teams' },
          { icon: Clock, label: 'Today', value: todayAttendance ? (todayAttendance.punch_out ? '✅ Done' : '🟢 Active') : '⚪ Not In', to: '/tasks' },
          { icon: Award, label: 'Role', value: profile.role.replace('_', ' '), to: '/directory' },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="hm-card hm-card-hover p-4 flex items-start gap-3">
            <s.icon className="w-5 h-5 text-lime mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-mono text-cream/50">{s.label}</div>
              <div className="font-display text-lg font-bold text-cream capitalize">{s.value}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Attendance Card */}
        <div className="md:col-span-2 hm-card p-5 space-y-4">
          <h2 className="font-display font-semibold text-cream flex items-center gap-2"><Clock className="w-4 h-4 text-lime" /> Attendance</h2>
          {!todayAttendance ? (
            <button onClick={punchIn} disabled={punchLoading} className="hm-btn-primary w-full">
              {punchLoading ? 'Logging...' : '🟢 Punch In for Today'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-lime/10 border border-lime/30 text-sm">
                <div className="font-mono text-xs text-lime mb-0.5">PUNCH IN</div>
                <div className="font-bold text-cream">{new Date(todayAttendance.punch_in).toLocaleTimeString()}</div>
              </div>
              {todayAttendance.punch_out ? (
                <div className="p-3 rounded-xl bg-obsidian-3 border border-cream/15 text-sm">
                  <div className="font-mono text-xs text-cream/50 mb-0.5">SESSION</div>
                  <div className="font-bold text-cream">{Math.floor(todayAttendance.total_minutes / 60)}h {todayAttendance.total_minutes % 60}m logged</div>
                </div>
              ) : (
                <button onClick={punchOut} disabled={punchLoading} className="hm-btn-secondary w-full">
                  {punchLoading ? 'Saving...' : '🔴 Punch Out'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div className="md:col-span-3 hm-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-cream flex items-center gap-2"><Kanban className="w-4 h-4 text-lime" /> My Active Tasks</h2>
            <Link to="/tasks" className="text-xs font-mono text-lime hover:underline flex items-center gap-1">
              All Tasks <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <p className="text-sm text-cream/60 py-4 text-center">No open tasks assigned. 🎉</p>
          ) : (
            <div className="space-y-2.5">
              {myTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-obsidian-3 border border-cream/10">
                  <span className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono border shrink-0 ${priorityColor[task.priority]}`}>
                    {task.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-cream truncate">{task.title}</div>
                    <div className="text-xs text-cream/55 mt-0.5 font-mono">{task.task_code} · Due: {task.due_date || '—'}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian-2 text-cream/60 capitalize shrink-0">
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLeader && (
        <Link to="/leader" className="hm-card hm-card-hover p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-lime" />
            <div>
              <div className="font-display font-semibold text-cream">Team Leader Board</div>
              <div className="text-xs text-cream/60">Assign tasks, manage sprints, track team activity</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-lime" />
        </Link>
      )}
    </div>
  );
}
