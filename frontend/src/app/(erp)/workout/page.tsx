'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { Search, Plus, Dumbbell, Edit2, Trash2, X, Save } from 'lucide-react';

interface Workout {
  id: number; name: string; level: string; days: number;
  exercises: number; focus: string; duration: string; tags: string[];
}
interface Exercise {
  id: number; name: string; muscle: string; equipment: string; difficulty: string;
}

const initWorkouts: Workout[] = [
  { id: 1, name: 'Push Pull Legs',      level: 'Intermediate', days: 6, exercises: 24, focus: 'Hypertrophy', duration: '75 min', tags: ['PPL', 'Classic'] },
  { id: 2, name: 'Full Body Strength',  level: 'Beginner',     days: 3, exercises: 12, focus: 'Strength',    duration: '45 min', tags: ['Compound', 'Beginner'] },
  { id: 3, name: 'Arnold Split',        level: 'Advanced',     days: 6, exercises: 30, focus: 'Bodybuilding', duration: '90 min', tags: ['Classic', 'Volume'] },
  { id: 4, name: 'HIIT Fat Burn',       level: 'Intermediate', days: 4, exercises: 18, focus: 'Cardio',      duration: '40 min', tags: ['HIIT', 'Cardio'] },
  { id: 5, name: 'Calisthenics',        level: 'Beginner',     days: 4, exercises: 15, focus: 'Bodyweight',  duration: '50 min', tags: ['Bodyweight', 'Flexible'] },
  { id: 6, name: 'Powerlifting Program',level: 'Advanced',     days: 4, exercises: 10, focus: 'Strength',    duration: '80 min', tags: ['Powerlifting', 'Heavy'] },
];

const initExercises: Exercise[] = [
  { id: 1, name: 'Barbell Squat',    muscle: 'Quadriceps',      equipment: 'Barbell',    difficulty: 'Intermediate' },
  { id: 2, name: 'Bench Press',      muscle: 'Chest',           equipment: 'Barbell',    difficulty: 'Beginner' },
  { id: 3, name: 'Deadlift',         muscle: 'Posterior Chain', equipment: 'Barbell',    difficulty: 'Advanced' },
  { id: 4, name: 'Pull-Up',          muscle: 'Back',            equipment: 'Bodyweight', difficulty: 'Intermediate' },
  { id: 5, name: 'Shoulder Press',   muscle: 'Shoulders',       equipment: 'Dumbbell',   difficulty: 'Beginner' },
  { id: 6, name: 'Romanian Deadlift',muscle: 'Hamstrings',      equipment: 'Barbell',    difficulty: 'Intermediate' },
];

const GYM_ORANGE = 'hsl(24 95% 53%)';

export default function Workout() {
  const [tab, setTab] = useState('Workout Plans');
  const [search, setSearch] = useState('');
  const [workouts, setWorkouts] = useState<Workout[]>(initWorkouts);
  const [exercises, setExercises] = useState<Exercise[]>(initExercises);

  // Workout plan modal
  const [showWkModal, setShowWkModal] = useState(false);
  const [editWkId, setEditWkId] = useState<number | null>(null);
  const [wkForm, setWkForm] = useState({ name: '', level: 'Beginner', days: '', exercises: '', focus: '', duration: '', tags: '' });

  // Exercise modal
  const [showExModal, setShowExModal] = useState(false);
  const [editExId, setEditExId] = useState<number | null>(null);
  const [exForm, setExForm] = useState({ name: '', muscle: '', equipment: 'Barbell', difficulty: 'Beginner' });

  // Workout CRUD
  const openAddWk = () => { setEditWkId(null); setWkForm({ name: '', level: 'Beginner', days: '', exercises: '', focus: '', duration: '', tags: '' }); setShowWkModal(true); };
  const openEditWk = (w: Workout) => { setEditWkId(w.id); setWkForm({ name: w.name, level: w.level, days: String(w.days), exercises: String(w.exercises), focus: w.focus, duration: w.duration, tags: w.tags.join(', ') }); setShowWkModal(true); };
  const saveWk = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...wkForm, days: Number(wkForm.days), exercises: Number(wkForm.exercises), tags: wkForm.tags.split(',').map(t => t.trim()).filter(Boolean) };
    if (editWkId) {
      setWorkouts(workouts.map(w => w.id === editWkId ? { ...w, ...data } : w));
    } else {
      setWorkouts([...workouts, { id: Date.now(), ...data }]);
    }
    setShowWkModal(false);
  };
  const deleteWk = (id: number) => { if (confirm('Delete this workout plan?')) setWorkouts(workouts.filter(w => w.id !== id)); };

  // Exercise CRUD
  const openAddEx = () => { setEditExId(null); setExForm({ name: '', muscle: '', equipment: 'Barbell', difficulty: 'Beginner' }); setShowExModal(true); };
  const openEditEx = (ex: Exercise) => { setEditExId(ex.id); setExForm({ name: ex.name, muscle: ex.muscle, equipment: ex.equipment, difficulty: ex.difficulty }); setShowExModal(true); };
  const saveEx = (e: React.FormEvent) => {
    e.preventDefault();
    if (editExId) {
      setExercises(exercises.map(ex => ex.id === editExId ? { ...ex, ...exForm } : ex));
    } else {
      setExercises([...exercises, { id: Date.now(), ...exForm }]);
    }
    setShowExModal(false);
  };
  const deleteEx = (id: number) => { if (confirm('Delete this exercise?')) setExercises(exercises.filter(ex => ex.id !== id)); };

  const filteredWk = workouts.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));
  const filteredEx = exercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()) || ex.muscle.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-full">
      <Header title="Workout Library" subtitle="Comprehensive exercise and workout plan database" />
      <div className="p-4 sm:p-6 space-y-5">

        {/* Banner */}
        <div className="rounded-xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Complete Workout Database</h2>
              <p className="text-blue-100 mt-1 text-sm">{workouts.length} workout programs · {exercises.length} exercises</p>
            </div>
            <Dumbbell size={56} className="text-blue-300/40" />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 flex justify-between items-center">
            <div className="flex">
              {['Workout Plans', 'Exercise Library'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${tab === t ? 'text-orange-600 bg-orange-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  style={tab === t ? { borderBottomColor: GYM_ORANGE } : {}}>
                  {t}
                </button>
              ))}
            </div>
            <div className="px-4 flex gap-3 items-center">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-36" />
              </div>
              <button onClick={tab === 'Workout Plans' ? openAddWk : openAddEx}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium"
                style={{ background: GYM_ORANGE }}>
                <Plus size={15} /> Add
              </button>
            </div>
          </div>

          <div className="p-5">
            {/* Workout Plans grid */}
            {tab === 'Workout Plans' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredWk.map(w => (
                  <div key={w.id} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Dumbbell size={17} className="text-blue-600" /></div>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${w.level === 'Beginner' ? 'bg-green-100 text-green-700' : w.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{w.level}</span>
                        <button onClick={() => openEditWk(w)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={13} /></button>
                        <button onClick={() => deleteWk(w.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-3">{w.name}</h3>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[{ l: 'Days', v: w.days }, { l: 'Exercises', v: w.exercises }, { l: 'Duration', v: w.duration }].map(s => (
                        <div key={s.l} className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-sm font-bold text-gray-900">{s.v}</p>
                          <p className="text-xs text-gray-500">{s.l}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">{w.tags.map(tag => <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{tag}</span>)}</div>
                    <p className="text-xs text-gray-500">Focus: <span className="font-medium text-gray-700">{w.focus}</span></p>
                  </div>
                ))}
                {filteredWk.length === 0 && <div className="col-span-3 text-center py-10 text-gray-500">No workout plans found.</div>}
              </div>
            )}

            {/* Exercise Library table */}
            {tab === 'Exercise Library' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50"><tr>{['Exercise', 'Primary Muscle', 'Equipment', 'Difficulty', 'Actions'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEx.map(ex => (
                      <tr key={ex.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{ex.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{ex.muscle}</td>
                        <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{ex.equipment}</span></td>
                        <td className="px-4 py-3"><span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${ex.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' : ex.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{ex.difficulty}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditEx(ex)} className="text-blue-500 hover:text-blue-700"><Edit2 size={15} /></button>
                            <button onClick={() => deleteEx(ex.id)} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredEx.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">No exercises found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workout Plan Modal */}
      {showWkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg">{editWkId ? 'Edit Workout Plan' : 'Add Workout Plan'}</h3>
              <button onClick={() => setShowWkModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={saveWk} className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label><input required type="text" value={wkForm.name} onChange={e => setWkForm({ ...wkForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select value={wkForm.level} onChange={e => setWkForm({ ...wkForm, level: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['Beginner', 'Intermediate', 'Advanced', 'All Levels'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Days per week</label><input required type="number" min="1" max="7" value={wkForm.days} onChange={e => setWkForm({ ...wkForm, days: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Focus Area</label><input required type="text" placeholder="e.g. Hypertrophy" value={wkForm.focus} onChange={e => setWkForm({ ...wkForm, focus: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Duration</label><input required type="text" placeholder="e.g. 60 min" value={wkForm.duration} onChange={e => setWkForm({ ...wkForm, duration: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">No. of Exercises</label><input required type="number" min="1" value={wkForm.exercises} onChange={e => setWkForm({ ...wkForm, exercises: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label><input type="text" placeholder="e.g. PPL, Classic" value={wkForm.tags} onChange={e => setWkForm({ ...wkForm, tags: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowWkModal(false)} className="px-4 py-2 border rounded-lg font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2" style={{ background: GYM_ORANGE }}><Save size={15} /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exercise Modal */}
      {showExModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg">{editExId ? 'Edit Exercise' : 'Add Exercise'}</h3>
              <button onClick={() => setShowExModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={saveEx} className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Exercise Name *</label><input required type="text" value={exForm.name} onChange={e => setExForm({ ...exForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Primary Muscle *</label><input required type="text" placeholder="e.g. Chest, Quadriceps" value={exForm.muscle} onChange={e => setExForm({ ...exForm, muscle: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
                  <select value={exForm.equipment} onChange={e => setExForm({ ...exForm, equipment: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['Barbell', 'Dumbbell', 'Machine', 'Bodyweight', 'Cables', 'Kettlebell'].map(eq => <option key={eq}>{eq}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select value={exForm.difficulty} onChange={e => setExForm({ ...exForm, difficulty: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['Beginner', 'Intermediate', 'Advanced'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowExModal(false)} className="px-4 py-2 border rounded-lg font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2" style={{ background: GYM_ORANGE }}><Save size={15} /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
