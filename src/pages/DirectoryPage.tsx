import { useEffect, useState } from 'react';
import { Search, User } from 'lucide-react';
import { supabase, type Profile } from '../lib/supabase';

export function DirectoryPage() {
  const [people, setPeople] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    supabase.from('profiles').select('*').order('full_name')
      .then(({ data }) => { setPeople((data as Profile[]) || []); setLoading(false); });
  }, []);

  const filtered = people.filter((p) => {
    const matchRole = roleFilter === 'ALL' || p.role === roleFilter;
    const q = search.toLowerCase();
    return matchRole && (!q || p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.department.toLowerCase().includes(q));
  });

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="font-mono text-xs text-lime uppercase tracking-widest mb-1">HMorix Team Directory</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-cream">People</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-cream/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="hm-input pl-10" placeholder="Search name, email, department..." />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'admin', 'hr', 'team_leader', 'employee', 'intern'].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-lg text-xs font-mono border transition capitalize ${
                roleFilter === r ? 'bg-lime text-obsidian border-lime font-semibold' : 'bg-obsidian-2 text-cream/70 border-cream/15 hover:border-lime/40'
              }`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-cream/60 text-sm">Loading directory...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="hm-card hm-card-hover p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-lime/20 border border-lime/40 flex items-center justify-center shrink-0">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.full_name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-lime" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-display font-semibold text-sm text-cream">{p.full_name}</div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-lime/15 text-lime capitalize">{p.role.replace('_', ' ')}</span>
                </div>
                <div className="text-xs text-cream/60 mt-0.5">{p.designation}</div>
                <div className="text-xs font-mono text-cream/50 mt-0.5">{p.department}</div>
                <div className="text-xs text-cream/55 mt-0.5 truncate">{p.email}</div>
                {p.employee_code && (
                  <div className="text-[10px] font-mono text-lime mt-1">{p.employee_code}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
