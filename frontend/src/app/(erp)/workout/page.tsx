'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Search, Plus, Dumbbell, Edit2, Trash2, X, Save } from 'lucide-react';
import { workoutApi, Exercise } from '@/lib/api';

const GYM_PRIMARY = 'hsl(var(--primary))';

export default function WorkoutLibrary() {
  const [search, setSearch] = useState('');
  const [workouts, setWorkouts] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    category: 'Chest',
    muscleGroup: '',
    sets: '',
    reps: '',
    duration: '',
    difficulty: 'BEGINNER',
  });

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const res = await workoutApi.getExercises();
      if (res.success) setWorkouts(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ name: '', category: 'Chest', muscleGroup: '', sets: '', reps: '', duration: '', difficulty: 'BEGINNER' });
    setShowModal(true);
  };

  const openEdit = (w: Exercise) => {
    setEditId(w.id);
    setForm({
      name: w.name,
      category: w.category,
      muscleGroup: w.muscleGroup.join(', '),
      sets: w.sets ? String(w.sets) : '',
      reps: w.reps || '',
      duration: w.duration || '',
      difficulty: w.difficulty,
    });
    setShowModal(true);
  };

  const saveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Exercise> = {
        name: form.name,
        category: form.category,
        muscleGroup: form.muscleGroup.split(',').map(s => s.trim()).filter(Boolean),
        difficulty: form.difficulty,
      };
      if (form.sets) payload.sets = parseInt(form.sets, 10);
      if (form.reps) payload.reps = form.reps;
      if (form.duration) payload.duration = form.duration;

      if (editId) {
        await workoutApi.updateExercise(editId, payload);
      } else {
        await workoutApi.createExercise(payload);
      }
      setShowModal(false);
      fetchWorkouts();
    } catch (err: any) {
      alert(err.message || 'Failed to save workout');
    }
  };

  const deleteWorkout = async (id: number) => {
    if (confirm('Delete this workout/exercise?')) {
      try {
        await workoutApi.removeExercise(id);
        fetchWorkouts();
      } catch (err: any) {
        alert(err.message || 'Failed to delete workout');
      }
    }
  };

  const filteredWorkouts = workouts.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) || 
    w.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-full">
      <Header title="Workout Library" subtitle="Manage exercises and training plans" />
      <div className="p-4 sm:p-6 space-y-5">

        {/* Banner */}
        <div className="rounded-xl p-5 text-primary-foreground bg-primary/90">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Complete Workout Database</h2>
              <p className="text-primary-foreground/80 mt-1 text-sm">{workouts.length} exercises & routines available</p>
            </div>
            <Dumbbell size={56} className="text-primary-foreground/20" />
          </div>
        </div>

        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}

        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border flex justify-between items-center p-4">
            <h3 className="font-semibold text-foreground">Exercises & Plans</h3>
            <div className="flex gap-3 items-center">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Search workouts..." 
                  className="pl-8 pr-3 py-2 text-sm border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary w-48" 
                />
              </div>
              <button 
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2 text-sm text-primary-foreground rounded-lg font-medium bg-primary hover:opacity-90 transition-opacity"
              >
                <Plus size={15} /> Add New
              </button>
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">Loading workouts...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredWorkouts.map(w => (
                  <div key={w.id} className="border border-border bg-background rounded-xl p-4 hover:border-primary/50 hover:shadow-sm transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Dumbbell size={17} className="text-primary" />
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(w)} className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg"><Edit2 size={14} /></button>
                        <button onClick={() => deleteWorkout(w.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-foreground line-clamp-1">{w.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{w.category}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {(w.sets || w.reps) && (
                        <div className="bg-secondary rounded-lg p-2 text-center">
                          <p className="text-sm font-bold text-foreground">{w.sets || '-'} × {w.reps || '-'}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sets/Reps</p>
                        </div>
                      )}
                      {w.duration && (
                        <div className="bg-secondary rounded-lg p-2 text-center">
                          <p className="text-sm font-bold text-foreground">{w.duration}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {w.muscleGroup.slice(0, 3).map(muscle => (
                        <span key={muscle} className="text-[10px] bg-secondary border border-border text-foreground px-2 py-0.5 rounded-full">
                          {muscle}
                        </span>
                      ))}
                      {w.muscleGroup.length > 3 && <span className="text-[10px] text-muted-foreground">+{w.muscleGroup.length - 3}</span>}
                    </div>
                    
                    <div className="mt-auto pt-2 border-t border-border flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Difficulty:</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase
                        ${w.difficulty === 'BEGINNER' ? 'bg-green-500/10 text-green-600' : 
                          w.difficulty === 'INTERMEDIATE' ? 'bg-yellow-500/10 text-yellow-600' : 
                          'bg-red-500/10 text-red-600'}`}
                      >
                        {w.difficulty}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredWorkouts.length === 0 && (
                  <div className="col-span-full text-center py-10 text-muted-foreground">No workouts found.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-border">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">{editId ? 'Edit Workout' : 'Add Workout'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <form onSubmit={saveWorkout} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary">
                    {['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary">
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Muscle Groups (comma separated)</label>
                <input type="text" placeholder="e.g. Chest, Triceps" value={form.muscleGroup} onChange={e => setForm({ ...form, muscleGroup: e.target.value })} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary" />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Sets</label>
                  <input type="number" min="1" value={form.sets} onChange={e => setForm({ ...form, sets: e.target.value })} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Reps</label>
                  <input type="text" placeholder="e.g. 8-12" value={form.reps} onChange={e => setForm({ ...form, reps: e.target.value })} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Duration</label>
                  <input type="text" placeholder="e.g. 30 min" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary" />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-lg font-medium text-foreground hover:bg-secondary">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg font-medium text-primary-foreground bg-primary flex items-center gap-2 hover:opacity-90">
                  <Save size={15} /> Save Workout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
