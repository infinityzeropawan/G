'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Toast, { ToastType } from '@/components/Toast';
import { Plus, Dumbbell, Utensils, Trash2, Edit2, X, RefreshCw, Save } from 'lucide-react';
import { workoutApi, type Exercise, type DietPlan } from '@/lib/api';

const CATEGORIES   = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body', 'Yoga'];
const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const GOALS        = ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Endurance', 'Flexibility'];
const DIFF_COLORS: Record<string, string> = {
  BEGINNER:     'bg-green-100 text-green-700',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-700',
  ADVANCED:     'bg-red-100 text-red-700',
};

const emptyExercise = { name: '', category: 'Chest', muscleGroup: '', sets: '', reps: '', duration: '', difficulty: 'BEGINNER', description: '', videoUrl: '' };
const emptyDiet = { name: '', goal: 'Weight Loss', calories: '', protein: '', carbs: '', fats: '', description: '', meals: '' };

export default function Library() {
  const [tab, setTab]               = useState('Exercises');
  const [exercises, setExercises]   = useState<Exercise[]>([]);
  const [dietPlans, setDietPlans]   = useState<DietPlan[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<{ message: string; type: ToastType } | null>(null);

  // Exercise modal
  const [showExModal, setShowExModal]   = useState(false);
  const [editExId, setEditExId]         = useState<number | null>(null);
  const [exForm, setExForm]             = useState(emptyExercise);

  // Diet modal
  const [showDietModal, setShowDietModal] = useState(false);
  const [editDietId, setEditDietId]       = useState<number | null>(null);
  const [dietForm, setDietForm]           = useState(emptyDiet);

  const showToast = useCallback((msg: string, t: ToastType) => setToast({ message: msg, type: t }), []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [exRes, dietRes] = await Promise.all([
        workoutApi.getExercises(),
        workoutApi.getDietPlans(),
      ]);
      setExercises(exRes.data);
      setDietPlans(dietRes.data);
    } catch (e) { showToast((e as Error).message, 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Exercise CRUD
  const openAddEx = () => { setEditExId(null); setExForm(emptyExercise); setShowExModal(true); };
  const openEditEx = (ex: Exercise) => {
    setEditExId(ex.id);
    setExForm({ name: ex.name, category: ex.category, muscleGroup: ex.muscleGroup.join(', '), sets: String(ex.sets || ''), reps: ex.reps || '', duration: ex.duration || '', difficulty: ex.difficulty, description: ex.description || '', videoUrl: ex.videoUrl || '' });
    setShowExModal(true);
  };
  const saveExercise = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...exForm, muscleGroup: exForm.muscleGroup.split(',').map(s => s.trim()), sets: exForm.sets ? Number(exForm.sets) : undefined };
      if (editExId) { await workoutApi.updateExercise(editExId, payload); showToast('Exercise updated!', 'success'); }
      else { await workoutApi.createExercise(payload); showToast('Exercise added!', 'success'); }
      setShowExModal(false); await loadAll();
    } catch (err) { showToast((err as Error).message, 'error'); }
    finally { setSaving(false); }
  };
  const deleteExercise = async (id: number) => {
    if (!confirm('Delete this exercise?')) return;
    try { await workoutApi.removeExercise(id); showToast('Deleted', 'success'); await loadAll(); }
    catch (err) { showToast((err as Error).message, 'error'); }
  };

  // Diet CRUD
  const openAddDiet = () => { setEditDietId(null); setDietForm(emptyDiet); setShowDietModal(true); };
  const openEditDiet = (d: DietPlan) => {
    setEditDietId(d.id);
    setDietForm({ name: d.name, goal: d.goal, calories: String(d.calories || ''), protein: String(d.protein || ''), carbs: String(d.carbs || ''), fats: String(d.fats || ''), description: d.description || '', meals: d.meals.join('\n') });
    setShowDietModal(true);
  };
  const saveDietPlan = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...dietForm, calories: dietForm.calories ? Number(dietForm.calories) : undefined, protein: dietForm.protein ? Number(dietForm.protein) : undefined, carbs: dietForm.carbs ? Number(dietForm.carbs) : undefined, fats: dietForm.fats ? Number(dietForm.fats) : undefined, meals: dietForm.meals.split('\n').map(s => s.trim()).filter(Boolean) };
      if (editDietId) { await workoutApi.updateDietPlan(editDietId, payload); showToast('Diet plan updated!', 'success'); }
      else { await workoutApi.createDietPlan(payload); showToast('Diet plan created!', 'success'); }
      setShowDietModal(false); await loadAll();
    } catch (err) { showToast((err as Error).message, 'error'); }
    finally { setSaving(false); }
  };
  const deleteDietPlan = async (id: number) => {
    if (!confirm('Delete this diet plan?')) return;
    try { await workoutApi.removeDietPlan(id); showToast('Deleted', 'success'); await loadAll(); }
    catch (err) { showToast((err as Error).message, 'error'); }
  };

  return (
    <div className="min-h-full pb-10">
      <Header title="Library" subtitle="Manage exercise library and diet plans" />
      <div className="p-4 sm:p-6 space-y-5">

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 flex justify-between items-center">
            <div className="flex">
              {['Exercises', 'Diet Plans'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${tab === t ? 'text-orange-600 bg-orange-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  style={tab === t ? { borderBottomColor: 'hsl(24 95% 53%)' } : {}}>{t}</button>
              ))}
            </div>
            <div className="px-4 flex gap-2">
              <button onClick={loadAll} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><RefreshCw size={14} /></button>
              {tab === 'Exercises'  && <button onClick={openAddEx}   className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90" style={{ background: 'hsl(24 95% 53%)' }}><Plus size={14} /> Add Exercise</button>}
              {tab === 'Diet Plans' && <button onClick={openAddDiet} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90" style={{ background: 'hsl(24 95% 53%)' }}><Plus size={14} /> Add Diet Plan</button>}
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : tab === 'Exercises' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {exercises.map(ex => (
                  <div key={ex.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Dumbbell size={16} className="text-orange-500" />
                          <p className="font-semibold text-gray-900">{ex.name}</p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ex.category}</span>
                        <span className={`ml-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${DIFF_COLORS[ex.difficulty]}`}>{ex.difficulty}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditEx(ex)} className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100"><Edit2 size={13} /></button>
                        <button onClick={() => deleteExercise(ex.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5 mt-2">
                      <p>💪 {ex.muscleGroup.join(', ')}</p>
                      {ex.sets && <p>📊 {ex.sets} sets × {ex.reps} reps</p>}
                      {ex.duration && <p>⏱ {ex.duration}</p>}
                    </div>
                  </div>
                ))}
                {exercises.length === 0 && <div className="col-span-3 text-center py-10 text-gray-400">No exercises yet. Add your first!</div>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {dietPlans.map(d => (
                  <div key={d.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Utensils size={16} className="text-green-500" />
                          <p className="font-semibold text-gray-900">{d.name}</p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{d.goal}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditDiet(d)} className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100"><Edit2 size={13} /></button>
                        <button onClick={() => deleteDietPlan(d.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5 mt-2">
                      {d.calories && <p>🔥 {d.calories} kcal/day</p>}
                      {d.protein  && <p>🥩 Protein: {d.protein}g · Carbs: {d.carbs}g · Fats: {d.fats}g</p>}
                      <div className="mt-2 space-y-0.5">
                        {d.meals.map((m, i) => <p key={i} className="text-xs text-gray-600">• {m}</p>)}
                      </div>
                    </div>
                  </div>
                ))}
                {dietPlans.length === 0 && <div className="col-span-3 text-center py-10 text-gray-400">No diet plans yet. Create your first!</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exercise Modal */}
      {showExModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editExId ? 'Edit Exercise' : 'Add Exercise'}</h3>
              <button onClick={() => setShowExModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={saveExercise} className="p-4 sm:p-6 space-y-4">
              {[{ label: 'Exercise Name', key: 'name', type: 'text' }, { label: 'Muscle Groups (comma separated)', key: 'muscleGroup', type: 'text', placeholder: 'Chest, Triceps' }, { label: 'Sets', key: 'sets', type: 'number', req: false }, { label: 'Reps', key: 'reps', type: 'text', req: false, placeholder: '8-12' }, { label: 'Duration', key: 'duration', type: 'text', req: false, placeholder: '30 min' }, { label: 'Video URL (optional)', key: 'videoUrl', type: 'url', req: false }, { label: 'Description', key: 'description', type: 'text', req: false }].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input required={f.req !== false} type={f.type} placeholder={f.placeholder} value={(exForm as Record<string, string>)[f.key]} onChange={e => setExForm({ ...exForm, [f.key]: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={exForm.category} onChange={e => setExForm({ ...exForm, category: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select value={exForm.difficulty} onChange={e => setExForm({ ...exForm, difficulty: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowExModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: 'hsl(24 95% 53%)' }}>
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} />{editExId ? 'Update' : 'Add'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diet Plan Modal */}
      {showDietModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editDietId ? 'Edit Diet Plan' : 'Create Diet Plan'}</h3>
              <button onClick={() => setShowDietModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={saveDietPlan} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input required type="text" value={dietForm.name} onChange={e => setDietForm({ ...dietForm, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
                <select value={dietForm.goal} onChange={e => setDietForm({ ...dietForm, goal: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                  {GOALS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ label: 'Calories (kcal)', key: 'calories' }, { label: 'Protein (g)', key: 'protein' }, { label: 'Carbs (g)', key: 'carbs' }, { label: 'Fats (g)', key: 'fats' }].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    <input type="number" value={(dietForm as Record<string, string>)[f.key]} onChange={e => setDietForm({ ...dietForm, [f.key]: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meals (one per line)</label>
                <textarea rows={4} value={dietForm.meals} onChange={e => setDietForm({ ...dietForm, meals: e.target.value })} placeholder="Oats + Eggs (Breakfast)&#10;Chicken Salad (Lunch)&#10;Protein Shake (Snack)&#10;Grilled Fish (Dinner)" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDietModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: 'hsl(24 95% 53%)' }}>
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} />{editDietId ? 'Update' : 'Create'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
