import { useEffect, useState } from 'react';
import { Users, ChevronRight } from 'lucide-react';
import { supabase, type Team } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function TeamsPage() {
  const { profile } = useAuth();
  const [teams, setTeams] = useState<(Team & { member_count?: number; leader_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('teams').select('*').order('created_at', { ascending: false })
      .then(async ({ data }) => {
        const teamList = (data as Team[]) || [];
        const enriched = await Promise.all(teamList.map(async (team) => {
          const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('team_id', team.id);
          let leader_name = 'TBD';
          if (team.leader_id) {
            const { data: ldr } = await supabase.from('profiles').select('full_name').eq('id', team.leader_id).single();
            if (ldr) leader_name = ldr.full_name;
          }
          return { ...team, member_count: count || 0, leader_name };
        }));
        setTeams(enriched);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-5 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="font-mono text-xs text-lime uppercase tracking-widest mb-1">HMorix Organization</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-cream">Teams</h1>
      </div>

      {loading ? (
        <p className="text-cream/60 text-sm">Loading teams...</p>
      ) : teams.length === 0 ? (
        <div className="hm-card p-10 text-center text-cream/60">
          No teams created yet. Admin or HR can create teams from hrm.hmorix.in.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {teams.map((team) => {
            const isMyTeam = profile?.team_id === team.id;
            return (
              <div key={team.id} className={`hm-card p-6 space-y-3 ${isMyTeam ? 'border-lime/40' : 'hm-card-hover'}`}>
                <div className="flex items-start gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: team.color_tag + '22', border: `1px solid ${team.color_tag}55` }}>
                      <Users className="w-5 h-5" style={{ color: team.color_tag }} />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-lg text-cream leading-tight">{team.name}</h2>
                      <p className="text-xs font-mono text-cream/55">{team.department}</p>
                    </div>
                  </div>
                  {isMyTeam && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-lime/15 text-lime border border-lime/40">My Team</span>
                  )}
                </div>
                {team.description && <p className="text-sm text-cream/70">{team.description}</p>}
                <div className="flex items-center justify-between pt-2 border-t border-cream/10 text-xs font-mono text-cream/55">
                  <span>TL: <span className="text-cream/80">{team.leader_name}</span></span>
                  <span className="flex items-center gap-1 text-lime"><Users className="w-3.5 h-3.5" /> {team.member_count} members</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
