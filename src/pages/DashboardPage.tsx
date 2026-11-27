import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, ChevronRight, Clock, Kanban, Users } from 'lucide-react';
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

    const load = async () => {
      try {
        const { data: td } = await supabase.from('tasks').select('*').eq('assigned_to', profile.id).neq('status', 'done')
          .order('priority', { ascending: false }).limit(5);
        setMyTasks((td as Task[]) || []);
      } catch { /* silent */ }

      try {
        const { data: att } = await supabase.from('attendance_logs').select('punch_in, punch_out, total_minutes')
          .eq('user_id', profile.id).eq('work_date', today).maybeSingle();
        setTodayAttendance(att as typeof todayAttendance);
      } catch { /* silent */ }

      if (profile.team_id) {
        try {
          const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('team_id', profile.team_id);
          setTeamCount(count || 0);
        } catch { /* silent */ }
      }
    };
    load();
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
      <div className="min-h-[60vh] flex items-center justify-center font-mono text-sm" style={{ color: 'rgba(234,232,227,0.6)' }}>
        Loading your HMorix workspace...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="hm-card p-6 sm:p-8 space-y-4" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <p className="font-mono text-xs uppercase" style={{ color: '#C8FF00' }}>Profile Setup Required</p>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#EAE8E3' }}>Unable to load your workspace profile</h1>
          <p className="text-sm" style={{ color: 'rgba(234,232,227,0.7)' }}>
            Signed in as <code style={{ color: '#C8FF00' }}>{user?.email}</code>, but the <code style={{ color: '#C8FF00' }}>profiles</code> table returned no record.
          </p>
          {profileError && (
            <div className="p-3 rounded-lg font-mono text-xs" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5' }}>
              {profileError}
            </div>
          )}
          <p className="text-xs" style={{ color: 'rgba(234,232,227,0.55)' }}>
            Make sure you have run <code>supabase/schema.sql</code> in your Supabase SQL Editor at{' '}
            <a href="https://supabase.com/dashboard/project/ouigbkolkigqtwuhmkfm/sql" target="_blank" rel="noreferrer" style={{ color: '#C8FF00' }}>
              supabase.com/dashboard
            </a>
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button onClick={() => refreshProfile()} className="hm-btn-primary">Retry</button>
            <button onClick={() => signOut()} className="hm-btn-secondary">Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="hm-card p-6" style={{ background: 'linear-gradient(135deg, #141414 0%, #141414 70%, rgba(200,255,0,0.05) 100%)', borderColor: 'rgba(200,255,0,0.2)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: '#C8FF00' }}>Good {greeting}</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1" style={{ color: '#EAE8E3' }}>{profile.full_name}</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(234,232,227,0.65)' }}>
              {profile.designation} · {profile.department} · <span className="font-mono" style={{ color: '#C8FF00' }}>{profile.employee_code}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs" style={{ color: 'rgba(234,232,227,0.5)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Kanban, label: 'Open Tasks', value: myTasks.length, to: '/tasks' },
          { icon: CheckCircle2, label: 'Team Size', value: teamCount || '—', to: '/teams' },
          { icon: Clock, label: 'Today', value: todayAttendance ? (todayAttendance.punch_out ? '✅ Done' : '🟢 Active') : '⚪ Not In', to: '/tasks' },
          { icon: Award, label: 'Role', value: profile.role.replace('_', ' '), to: '/directory' },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="hm-card hm-card-hover p-4 flex items-start gap-3">
            <s.icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#C8FF00' }} />
            <div>
              <div className="text-xs font-mono" style={{ color: 'rgba(234,232,227,0.5)' }}>{s.label}</div>
              <div className="font-display text-lg font-bold capitalize" style={{ color: '#EAE8E3' }}>{s.value}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Attendance Card */}
        <div className="md:col-span-2 hm-card p-5 space-y-4">
          <h2 className="font-display font-semibold flex items-center gap-2" style={{ color: '#EAE8E3' }}>
            <Clock className="w-4 h-4" style={{ color: '#C8FF00' }} /> Attendance
          </h2>
          {!todayAttendance ? (
            <button onClick={punchIn} disabled={punchLoading} className="hm-btn-primary w-full">
              {punchLoading ? 'Logging...' : '🟢 Punch In for Today'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.3)' }}>
                <div className="font-mono text-xs mb-0.5" style={{ color: '#C8FF00' }}>PUNCH IN</div>
                <div className="font-bold" style={{ color: '#EAE8E3' }}>{new Date(todayAttendance.punch_in).toLocaleTimeString()}</div>
              </div>
              {todayAttendance.punch_out ? (
                <div className="p-3 rounded-xl text-sm" style={{ background: '#1C1C1C', border: '1px solid rgba(234,232,227,0.15)' }}>
                  <div className="font-mono text-xs mb-0.5" style={{ color: 'rgba(234,232,227,0.5)' }}>SESSION</div>
                  <div className="font-bold" style={{ color: '#EAE8E3' }}>{Math.floor(todayAttendance.total_minutes / 60)}h {todayAttendance.total_minutes % 60}m logged</div>
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
            <h2 className="font-display font-semibold flex items-center gap-2" style={{ color: '#EAE8E3' }}>
              <Kanban className="w-4 h-4" style={{ color: '#C8FF00' }} /> My Active Tasks
            </h2>
            <Link to="/tasks" className="text-xs font-mono flex items-center gap-1 hover:underline" style={{ color: '#C8FF00' }}>
              All Tasks <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'rgba(234,232,227,0.6)' }}>No open tasks assigned. 🎉</p>
          ) : (
            <div className="space-y-2.5">
              {myTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#1C1C1C', border: '1px solid rgba(234,232,227,0.1)' }}>
                  <span className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono border shrink-0 ${priorityColor[task.priority]}`}>
                    {task.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: '#EAE8E3' }}>{task.title}</div>
                    <div className="text-xs mt-0.5 font-mono" style={{ color: 'rgba(234,232,227,0.55)' }}>{task.task_code} · Due: {task.due_date || '—'}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded capitalize shrink-0" style={{ background: '#141414', color: 'rgba(234,232,227,0.6)' }}>
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
            <Users className="w-5 h-5" style={{ color: '#C8FF00' }} />
            <div>
              <div className="font-display font-semibold" style={{ color: '#EAE8E3' }}>Team Leader Board</div>
              <div className="text-xs" style={{ color: 'rgba(234,232,227,0.6)' }}>Assign tasks, manage sprints, track team activity</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: '#C8FF00' }} />
        </Link>
      )}
    </div>
  );
}
