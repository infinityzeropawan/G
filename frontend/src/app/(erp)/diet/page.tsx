'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Search, Plus, Apple, Edit2, Trash2, X, Save } from 'lucide-react';
import { workoutApi, DietPlan } from '@/lib/api';

export default function DietPlans() {
  const [search, setSearch] = useState('');
  const [diets, setDiets] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    goal: 'Weight Loss',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    description: '',
    meals: '',
  });

  const fetchDiets = async () => {
    try {
      setLoading(true);
      const res = await workoutApi.getDietPlans();
      if (res.success) setDiets(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load diet plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiets();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ name: '', goal: 'Weight Loss', calories: '', protein: '', carbs: '', fats: '', description: '', meals: '' });
    setShowModal(true);
  };

  const openEdit = (d: DietPlan) => {
    setEditId(d.id);
    setForm({
      name: d.name,
      goal: d.goal,
      calories: d.calories ? String(d.calories) : '',
      protein: d.protein ? String(d.protein) : '',
      carbs: d.carbs ? String(d.carbs) : '',
      fats: d.fats ? String(d.fats) : '',
      description: d.description || '',
      meals: d.meals.join('\n'), // Use newline for easy editing
    });
    setShowModal(true);
  };

  const saveDiet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<DietPlan> = {
        name: form.name,
        goal: form.goal,
        description: form.description,
        meals: form.meals.split('\n').map(m => m.trim()).filter(Boolean),
      };
      if (form.calories) payload.calories = parseInt(form.calories, 10);
      if (form.protein) payload.protein = parseFloat(form.protein);
      if (form.carbs) payload.carbs = parseFloat(form.carbs);
      if (form.fats) payload.fats = parseFloat(form.fats);

      if (editId) {
        await workoutApi.updateDietPlan(editId, payload);
      } else {
        await workoutApi.createDietPlan(payload);
      }
      setShowModal(false);
      fetchDiets();
    } catch (err: any) {
      alert(err.message || 'Failed to save diet plan');
    }
  };

  const deleteDiet = async (id: number) => {
    if (confirm('Delete this diet plan?')) {
      try {
        await workoutApi.removeDietPlan(id);
        fetchDiets();
      } catch (err: any) {
        alert(err.message || 'Failed to delete diet plan');
      }
    }
  };

  const filteredDiets = diets.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.goal.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-full">
      <Header title="Diet & Nutrition" subtitle="Manage dietary plans for members" />
      <div className="p-4 sm:p-6 space-y-5">

        {/* Banner */}
        <div className="rounded-xl p-5 text-primary-foreground bg-primary/90">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Nutrition Database</h2>
              <p className="text-primary-foreground/80 mt-1 text-sm">{diets.length} diet plans available</p>
            </div>
            <Apple size={56} className="text-primary-foreground/20" />
          </div>
        </div>

        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}

        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border flex justify-between items-center p-4">
            <h3 className="font-semibold text-foreground">Diet Plans</h3>
            <div className="flex gap-3 items-center">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Search diets..." 
                  className="pl-8 pr-3 py-2 text-sm border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary w-48" 
                />
              </div>
              <button 
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2 text-sm text-primary-foreground rounded-lg font-medium bg-primary hover:opacity-90 transition-opacity"
              >
                <Plus size={15} /> Add Plan
              </button>
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">Loading diet plans...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredDiets.map(d => (
                  <div key={d.id} className="border border-border bg-background rounded-2xl p-5 hover:border-primary/50 hover:shadow-md transition-all group flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Apple size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-lg">{d.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase
                            ${d.goal === 'Weight Loss' ? 'bg-orange-500/10 text-orange-600' : 
                              d.goal === 'Muscle Gain' ? 'bg-blue-500/10 text-blue-600' : 
                              'bg-green-500/10 text-green-600'}`}
                          >
                            {d.goal}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(d)} className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg"><Edit2 size={15} /></button>
                        <button onClick={() => deleteDiet(d.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 size={15} /></button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 mb-4 bg-secondary p-3 rounded-xl text-center">
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">Calories</div>
                        <div className="font-bold text-foreground text-sm">{d.calories || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">Pro</div>
                        <div className="font-bold text-foreground text-sm">{d.protein || '-'}g</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">Carbs</div>
                        <div className="font-bold text-foreground text-sm">{d.carbs || '-'}g</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">Fats</div>
                        <div className="font-bold text-foreground text-sm">{d.fats || '-'}g</div>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Meals Included</p>
                      <ul className="space-y-1.5">
                        {d.meals.slice(0, 4).map((meal, idx) => (
                          <li key={idx} className="flex gap-2 items-start text-sm text-foreground">
                            <span className="text-primary mt-1">•</span>
                            <span className="line-clamp-1">{meal}</span>
                          </li>
                        ))}
                        {d.meals.length > 4 && (
                          <li className="text-xs text-muted-foreground font-medium pl-3 pt-1">
                            + {d.meals.length - 4} more meals
                          </li>
                        )}
                        {d.meals.length === 0 && <li className="text-sm text-muted-foreground italic">No meals defined.</li>}
                      </ul>
                    </div>
                  </div>
                ))}
                {filteredDiets.length === 0 && (
                  <div className="col-span-full text-center py-10 text-muted-foreground">No diet plans found.</div>
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
              <h3 className="font-bold text-lg text-foreground">{editId ? 'Edit Diet Plan' : 'Add Diet Plan'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <form onSubmit={saveDiet} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                  <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Goal</label>
                  <select value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary">
                    <option>Weight Loss</option>
                    <option>Muscle Gain</option>
                    <option>Maintenance</option>
                    <option>Endurance</option>
                    <option>Flexibility</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Cals</label>
                  <input type="number" placeholder="kcal" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })} className="w-full px-2 py-2 text-center border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Pro</label>
                  <input type="number" step="0.1" placeholder="g" value={form.protein} onChange={e => setForm({ ...form, protein: e.target.value })} className="w-full px-2 py-2 text-center border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Carbs</label>
                  <input type="number" step="0.1" placeholder="g" value={form.carbs} onChange={e => setForm({ ...form, carbs: e.target.value })} className="w-full px-2 py-2 text-center border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Fats</label>
                  <input type="number" step="0.1" placeholder="g" value={form.fats} onChange={e => setForm({ ...form, fats: e.target.value })} className="w-full px-2 py-2 text-center border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Meals (One per line)</label>
                <textarea rows={4} placeholder="Oats + Eggs&#10;Chicken Salad" value={form.meals} onChange={e => setForm({ ...form, meals: e.target.value })} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary resize-none" />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-lg font-medium text-foreground hover:bg-secondary">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg font-medium text-primary-foreground bg-primary flex items-center gap-2 hover:opacity-90">
                  <Save size={15} /> Save Diet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
