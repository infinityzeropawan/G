'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Zap, Phone, MapPin, Mail, Star, ChevronDown, Menu, X,
  Users, Award, Clock, Dumbbell, Heart, Zap as Lightning, Shield,
  ArrowRight, CheckCircle, Share2, MessageCircle, Video, PlayCircle,
  Calendar, CreditCard, Ticket
} from 'lucide-react';
import Footer from '@/components/Footer';

const FbIcon = () => <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>;
const InstaIcon = () => <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
const XIcon = () => <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
const YtIcon = () => <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.872.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;

const stats = [
  { value: '5000+', label: 'Happy Members' },
  { value: '10+', label: 'Expert Trainers' },
  { value: '24/7', label: 'Always Open' },
  { value: '15+', label: 'Years Experience' },
];

const services = [
  { icon: Dumbbell, title: 'Bodybuilding', desc: 'State-of-the-art equipment for strength & muscle building with expert guidance', color: 'from-orange-500 to-red-600' },
  { icon: ArrowRight, title: 'Weight Loss', desc: 'Effective fat loss programs combining cardio, diet, and strength training', color: 'from-pink-500 to-rose-600' },
  { icon: ArrowRight, title: 'Weight Gain', desc: 'Specialized programs and nutrition for healthy weight and muscle mass gain', color: 'from-purple-500 to-indigo-600' },
  { icon: Heart, title: 'Cardio', desc: 'Modern treadmills, cycles and ellipticals for endurance training', color: 'from-green-500 to-emerald-600' },
  { icon: Lightning, title: 'Crossfit', desc: 'High-intensity functional training for maximum calorie burn and performance', color: 'from-yellow-500 to-orange-600' },
  { icon: Users, title: 'Yoga', desc: 'Improve flexibility, mental focus, and core strength in peaceful sessions', color: 'from-blue-400 to-cyan-500' },
  { icon: Users, title: 'Zumba', desc: 'Fun and energetic dance fitness classes to burn calories with joy', color: 'from-pink-400 to-red-500' },
  { icon: Shield, title: 'Personal Training', desc: 'One-on-one certified trainer sessions with custom diet & workout plans', color: 'from-blue-600 to-indigo-700' },
  { icon: Award, title: 'Diet Plan', desc: '5M+ food database with custom meal plans designed for your fitness goals', color: 'from-green-400 to-teal-500' },
];

const trainers = [
  { name: 'Rajesh Kumar', role: 'Head Trainer & Nutritionist', exp: '12 yrs', spec: 'Bodybuilding, Strength', cert: 'ACE Certified', initials: 'RK', bg: 'from-orange-400 to-red-500' },
  { name: 'Pooja Sharma', role: 'Yoga & Wellness Coach', exp: '8 yrs', spec: 'Yoga, Mindfulness', cert: 'RYT 500', initials: 'PS', bg: 'from-pink-400 to-rose-500' },
  { name: 'Arjun Mehta', role: 'CrossFit Specialist', exp: '6 yrs', spec: 'HIIT, CrossFit', cert: 'CrossFit L2', initials: 'AM', bg: 'from-blue-400 to-indigo-500' },
  { name: 'Sunita Rao', role: 'Cardio & Zumba Expert', exp: '9 yrs', spec: 'Cardio, Dance Fitness', cert: 'Zumba Pro', initials: 'SR', bg: 'from-green-400 to-emerald-500' },
];

const transformations = [
  { name: 'Rahul Sharma', type: 'Fat Loss', before: '98 kg', after: '72 kg', duration: '6 months', initials: 'RS', review: 'Lost 26kg! GymSmart trainers are the best. Life changing experience!' },
  { name: 'Priya Patel', type: 'Muscle Gain', before: '48 kg', after: '58 kg', duration: '4 months', initials: 'PP', review: 'Gained lean muscle, feel so confident now. Best gym in the city!' },
  { name: 'Amit Verma', type: 'Body Transformation', before: '110 kg', after: '78 kg', duration: '8 months', initials: 'AV', review: 'From XL to M size! The diet plans and training were perfectly tailored.' },
];

const testimonials = [
  { name: 'Sneha Mehta', rating: 5, text: 'GymSmart has completely transformed my lifestyle. The trainers are professional and the facilities are world-class. 100% recommended!', member: 'Premium Member – 2 years', initials: 'SM' },
  { name: 'Vijay Singh', rating: 5, text: 'Best gym in Mumbai! The 24/7 access is super convenient for my work schedule. Diet plans actually work!', member: 'Gold Member – 1 year', initials: 'VS' },
  { name: 'Anita Gupta', rating: 5, text: 'Lost 15kg in 4 months with the personalized program. The team is super supportive and motivating!', member: 'Annual Member – 3 years', initials: 'AG' },
  { name: 'Rohit Yadav', rating: 5, text: 'Amazing equipment, clean facilities, and expert trainers. The GymSmart app makes tracking progress so easy!', member: 'Premium Member – 18 months', initials: 'RY' },
];

const plans = [
  { name: '1 Month', price: '₹1,500', oldPrice: '₹2,000', duration: '1 month', features: ['General Gym Access', 'Locker facility', 'Cardio equipment'], color: 'border-gray-200' },
  { name: '3 Months', price: '₹4,000', oldPrice: '₹4,500', duration: '3 months', features: ['Everything in 1 Month', 'Basic Diet Guidance', 'Group Classes'], color: 'border-blue-400', badge: 'Popular' },
  { name: '6 Months', price: '₹7,500', oldPrice: '₹9,000', duration: '6 months', features: ['Everything in 3 Months', '1 PT Session/month', 'Body comp analysis'], color: 'border-orange-400' },
  { name: '12 Months', price: '₹12,000', oldPrice: '₹18,000', duration: 'Annual', features: ['Everything in 6 Months', '2 months FREE', 'Advanced Meal Planning'], color: 'border-yellow-500', badge: 'Best Value' },
  { name: 'Personal Training', price: '₹8,000', oldPrice: '₹10,000', duration: '/month', features: ['1-on-1 Dedicated Trainer', 'Custom Daily Diet', 'Priority Access'], color: 'border-purple-500' },
];

const schedule = [
  { time: '06:00 AM - 08:00 AM', monday: 'Cardio (Sunita)', tuesday: 'CrossFit (Arjun)', wednesday: 'Yoga (Pooja)', thursday: 'Strength (Rajesh)', friday: 'Zumba (Sunita)', saturday: 'CrossFit (Arjun)', sunday: 'Rest' },
  { time: '08:00 AM - 10:00 AM', monday: 'Strength (Rajesh)', tuesday: 'Yoga (Pooja)', wednesday: 'Cardio (Sunita)', thursday: 'CrossFit (Arjun)', friday: 'Strength (Rajesh)', saturday: 'Yoga (Pooja)', sunday: 'Open Gym' },
  { time: '06:00 PM - 08:00 PM', monday: 'Zumba (Sunita)', tuesday: 'Strength (Rajesh)', wednesday: 'CrossFit (Arjun)', thursday: 'Yoga (Pooja)', friday: 'Cardio (Sunita)', saturday: 'Zumba (Sunita)', sunday: 'Open Gym' },
  { time: '08:00 PM - 10:00 PM', monday: 'CrossFit (Arjun)', tuesday: 'Cardio (Sunita)', wednesday: 'Strength (Rajesh)', thursday: 'Zumba (Sunita)', friday: 'Yoga (Pooja)', saturday: 'Rest', sunday: 'Closed' },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // BMI Calculator State
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmiResult, setBmiResult] = useState<{value: string, status: string, color: string} | null>(null);

  // Booking Form State
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingData, setBookingData] = useState({ name: '', phone: '', date: '', type: 'trial' });

  // Contact Form State
  const [isSending, setIsSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactData, setContactData] = useState({ name: '', email: '', message: '' });

  const calculateBMI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !height) return;
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    const bmi = w / (h * h);
    let status = '';
    let color = '';
    if (bmi < 18.5) { status = 'Underweight'; color = 'text-blue-400'; }
    else if (bmi >= 18.5 && bmi < 24.9) { status = 'Normal Weight'; color = 'text-green-400'; }
    else if (bmi >= 25 && bmi < 29.9) { status = 'Overweight'; color = 'text-yellow-400'; }
    else { status = 'Obese'; color = 'text-red-400'; }
    setBmiResult({ value: bmi.toFixed(1), status, color });
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData.name || !bookingData.phone || !bookingData.date) return;
    setIsBooking(true);
    setTimeout(() => {
      setIsBooking(false);
      setBookingSuccess(true);
      setBookingData({ name: '', phone: '', date: '', type: 'trial' });
      setTimeout(() => setBookingSuccess(false), 5000);
    }, 1500);
  };

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactData.name || !contactData.email || !contactData.message) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setContactSuccess(true);
      setContactData({ name: '', email: '', message: '' });
      setTimeout(() => setContactSuccess(false), 5000);
    }, 1500);
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="GymSmart" width={40} height={40} className="rounded-lg object-cover" />
            <div>
              <span className="font-bold text-lg text-white tracking-tight">GymSmart</span>
              <span className="text-[10px] text-orange-400 block -mt-1 tracking-widest uppercase">Fitness ERP</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            {['About', 'Plans', 'Trainers', 'Services', 'Schedule', 'Booking', 'Gallery'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-orange-400 transition-colors">{item}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-1.5">
              ERP Login
            </Link>
            <a href="#booking" className="text-sm font-bold px-5 py-2.5 rounded-xl text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(15 90% 45%))' }}>
              Join Now
            </a>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-300">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-black/98 border-t border-white/10 px-4 py-4 space-y-3 h-screen overflow-y-auto">
            {['About', 'Plans', 'Trainers', 'Services', 'Schedule', 'Booking', 'Gallery', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-orange-400 py-2 text-sm font-medium">{item}</a>
            ))}
            <div className="flex gap-3 pt-2">
              <Link href="/dashboard" className="flex-1 text-center border border-white/20 py-2.5 rounded-xl text-sm font-medium">ERP Login</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: `url('/gym-hero.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 50%, rgba(20,10,0,0.8) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to top, #0a0a0a, transparent)' }} />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-20">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium text-orange-300 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Welcome to GymSmart
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-tight mb-6">
            <span className="text-white">Transform Your Body,</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Build Your Confidence
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join our premium fitness center with expert trainers, personalized workout plans, diet guidance, and modern equipment. <br className="hidden sm:block" />
            <strong className="text-white">Your fitness journey starts today.</strong>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a href="#plans" className="px-8 py-4 text-white font-bold text-lg rounded-2xl transition-all hover:scale-105 hover:shadow-2xl flex items-center gap-2 w-full sm:w-auto justify-center" style={{ background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(10 90% 45%))', boxShadow: '0 0 40px rgba(249,115,22,0.4)' }}>
              Join Now <ArrowRight size={18} />
            </a>
            <a href="#booking" className="px-8 py-4 font-bold text-lg rounded-2xl border-2 border-white/30 text-white hover:bg-white/10 transition-all flex items-center gap-2 w-full sm:w-auto justify-center backdrop-blur-sm">
              Free Trial
            </a>
            <a href="#contact" className="px-8 py-4 font-bold text-lg rounded-2xl border-2 border-white/10 text-gray-300 hover:bg-white/5 transition-all flex items-center gap-2 w-full sm:w-auto justify-center backdrop-blur-sm">
              Contact Us
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
          <ChevronDown size={28} className="text-white/50" />
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-24 px-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block text-xs font-bold tracking-widest uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-5">About GymSmart</div>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
                Building Stronger <br />
                <span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Communities since 2010
                </span>
              </h2>
              <h3 className="text-xl font-bold text-white mb-2">Our Mission & Vision</h3>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                To inspire and empower our community to lead healthier, happier lives through premium fitness facilities, expert guidance, and a supportive environment.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                {[
                  '10+ Certified Trainers',
                  '24/7 Open',
                  '5M+ Food Database',
                  'Ladies Only Sections',
                  'Steam & Locker Rooms',
                  'Free Diet Consultation',
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <CheckCircle size={16} className="text-orange-400 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Happy Members', value: '5000+', icon: Users, color: 'from-orange-500 to-red-600' },
                { label: 'Expert Trainers', value: '10+', icon: Award, color: 'from-blue-500 to-indigo-600' },
                { label: 'Hours Open', value: '24/7', icon: Clock, color: 'from-green-500 to-emerald-600' },
                { label: 'Transformations', value: '2000+', icon: Heart, color: 'from-pink-500 to-rose-600' },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4`}>
                    <s.icon size={22} className="text-white" />
                  </div>
                  <div className="text-3xl font-black text-white mb-1">{s.value}</div>
                  <div className="text-gray-500 text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BMI CALCULATOR ── */}
      <section id="bmi" className="py-24 px-4 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block text-xs font-bold tracking-widest uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-5">Fitness Tools</div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Calculate Your <span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>BMI</span></h2>
              <p className="text-gray-400 mb-8 leading-relaxed">Body Mass Index (BMI) is a simple calculation using a person&apos;s height and weight. The formula is BMI = kg/m2 where kg is a person&apos;s weight in kilograms and m2 is their height in metres squared.</p>
              
              <form onSubmit={calculateBMI} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-2">Height (cm)</label>
                    <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 175" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors" required />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-2">Weight (kg)</label>
                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 70" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors" required />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(10 90% 45%))' }}>
                  Calculate BMI
                </button>
              </form>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-2xl p-8 text-center h-full flex flex-col justify-center items-center">
              {bmiResult ? (
                <div className="animate-in fade-in zoom-in duration-300">
                  <h3 className="text-lg font-bold text-gray-300 mb-2">Your BMI is</h3>
                  <div className={`text-6xl font-black mb-4 ${bmiResult.color}`}>{bmiResult.value}</div>
                  <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white font-semibold mb-6">
                    {bmiResult.status}
                  </div>
                  <p className="text-sm text-gray-400">
                    {bmiResult.status === 'Underweight' && 'You should aim to build muscle mass. Check out our Weight Gain programs.'}
                    {bmiResult.status === 'Normal Weight' && 'Great job! Maintain your physique with our General Fitness plans.'}
                    {bmiResult.status === 'Overweight' && 'Time to burn some calories! Our Weight Loss and Cardio programs are perfect for you.'}
                    {bmiResult.status === 'Obese' && 'Let our Personal Trainers guide you safely towards a healthier lifestyle.'}
                  </p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <Heart size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Enter your height and weight<br/>to see your BMI result here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── MEMBERSHIP PLANS ── */}
      <section id="plans" className="py-24 px-4 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold tracking-widest uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-5">Membership Plans</div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Choose Your <span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Plan</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">Special discounts and No Cost EMI available on long-term plans!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {plans.map((p, i) => (
              <div key={i} className={`relative bg-white/5 border-2 rounded-2xl p-6 hover:bg-white/8 transition-all flex flex-col ${p.color} ${p.badge ? 'transform lg:-translate-y-4 shadow-2xl' : ''}`}>
                {p.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1.5 rounded-full text-white whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}>
                    ⭐ {p.badge}
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-2">{p.name}</h3>
                <div className="mb-4">
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-black" style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{p.price}</span>
                  </div>
                  <span className="text-gray-500 text-sm line-through block">{p.oldPrice}</span>
                  {p.name === '12 Months' && <span className="text-xs text-green-400 font-semibold mt-1 block">Includes EMI Options</span>}
                </div>
                <div className="space-y-3 mb-6 flex-1">
                  {p.features.map((f, j) => (
                    <div key={j} className="flex items-start gap-2.5 text-xs text-gray-300">
                      <CheckCircle size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </div>
                  ))}
                </div>
                <a href="#booking" className="block text-center py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={p.badge ? { background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(10 90% 45%))', color: 'white' } : { border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
                  Buy Membership
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRAINERS ── */}
      <section id="trainers" className="py-24 px-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold tracking-widest uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-5">Expert Team</div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Meet Your <span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Trainers</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trainers.map((t, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-orange-500/30 transition-all group">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${t.bg} flex items-center justify-center text-white font-black text-3xl mx-auto mb-5 group-hover:scale-105 transition-transform`}>
                  {t.initials}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{t.name}</h3>
                <p className="text-orange-400 text-xs font-semibold mb-3">{t.role}</p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400 mb-3">
                  <span className="bg-white/10 px-3 py-1 rounded-full">Exp: {t.exp}</span>
                  <span className="bg-white/10 px-3 py-1 rounded-full">{t.cert}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Spec: {t.spec}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES / PROGRAMS ── */}
      <section id="services" className="py-24 px-4 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold tracking-widest uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-5">Our Programs</div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Services <span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>& Programs</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 hover:bg-white/8 transition-all group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <s.icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLASS SCHEDULE ── */}
      <section id="schedule" className="py-24 px-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold tracking-widest uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-5">Timetable</div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Class <span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Schedule</span></h2>
            <p className="text-gray-400 max-w-xl mx-auto">Dynamic batches designed for morning and evening flexibility</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse bg-white/5 rounded-2xl overflow-hidden border border-white/10">
              <thead>
                <tr className="bg-white/10 text-white">
                  <th className="py-4 px-4 text-left font-semibold">Time</th>
                  <th className="py-4 px-4 text-left font-semibold">Monday</th>
                  <th className="py-4 px-4 text-left font-semibold">Tuesday</th>
                  <th className="py-4 px-4 text-left font-semibold">Wednesday</th>
                  <th className="py-4 px-4 text-left font-semibold">Thursday</th>
                  <th className="py-4 px-4 text-left font-semibold">Friday</th>
                  <th className="py-4 px-4 text-left font-semibold">Saturday</th>
                  <th className="py-4 px-4 text-left font-semibold text-orange-400">Sunday</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {schedule.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors text-sm text-gray-300">
                    <td className="py-4 px-4 font-semibold text-orange-400">{row.time}</td>
                    <td className="py-4 px-4">{row.monday}</td>
                    <td className="py-4 px-4">{row.tuesday}</td>
                    <td className="py-4 px-4">{row.wednesday}</td>
                    <td className="py-4 px-4">{row.thursday}</td>
                    <td className="py-4 px-4">{row.friday}</td>
                    <td className="py-4 px-4">{row.saturday}</td>
                    <td className="py-4 px-4 text-gray-500">{row.sunday}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FACILITY GALLERY ── */}
      <section id="facility" className="py-24 px-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold tracking-widest uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-5">Our Facility</div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">World-Class <span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Equipment</span></h2>
            <p className="text-gray-400 max-w-xl mx-auto">Train in an environment designed for champions.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl overflow-hidden aspect-video md:aspect-square relative group">
              <Image src="/gym_gallery_cardio.png" alt="Cardio Section" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <span className="font-bold text-lg text-white">Advanced Cardio</span>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden aspect-video md:aspect-square relative group">
              <Image src="/gym_gallery_weights.png" alt="Free Weights" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <span className="font-bold text-lg text-white">Free Weights Area</span>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden aspect-video md:aspect-square relative group">
              <Image src="/gym_gallery_studio.png" alt="Studio" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <span className="font-bold text-lg text-white">Yoga & Group Studio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ONLINE BOOKING ── */}
      <section id="booking" className="py-24 px-4 bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a]">
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold tracking-widest uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-5">Quick Action</div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Online <span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Booking</span></h2>
            <p className="text-gray-400 max-w-xl mx-auto">Book your trial, buy membership, or reserve a slot online in seconds.</p>
          </div>
          
          <div className="bg-black border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
            {bookingSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="text-green-500" size={40} />
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Booking Confirmed!</h3>
                <p className="text-gray-400">Thank you for choosing GymSmart. Our team will contact you shortly to confirm the details.</p>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleBooking}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <label className="cursor-pointer">
                    <input type="radio" name="booking_type" value="trial" checked={bookingData.type === 'trial'} onChange={e => setBookingData({...bookingData, type: e.target.value})} className="peer sr-only" />
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center peer-checked:border-orange-500 peer-checked:bg-orange-500/10 transition-all">
                      <Ticket className="mx-auto mb-2 text-orange-400" size={24} />
                      <span className="font-semibold text-white">Book Trial</span>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input type="radio" name="booking_type" value="membership" checked={bookingData.type === 'membership'} onChange={e => setBookingData({...bookingData, type: e.target.value})} className="peer sr-only" />
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center peer-checked:border-orange-500 peer-checked:bg-orange-500/10 transition-all">
                      <CreditCard className="mx-auto mb-2 text-orange-400" size={24} />
                      <span className="font-semibold text-white">Buy Membership</span>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input type="radio" name="booking_type" value="class" checked={bookingData.type === 'class'} onChange={e => setBookingData({...bookingData, type: e.target.value})} className="peer sr-only" />
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center peer-checked:border-orange-500 peer-checked:bg-orange-500/10 transition-all">
                      <Calendar className="mx-auto mb-2 text-orange-400" size={24} />
                      <span className="font-semibold text-white">Reserve Class Slot</span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-2">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" required value={bookingData.name} onChange={e => setBookingData({...bookingData, name: e.target.value})} placeholder="John Doe" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-2">Phone / WhatsApp <span className="text-red-500">*</span></label>
                    <input type="tel" required value={bookingData.phone} onChange={e => setBookingData({...bookingData, phone: e.target.value})} placeholder="+91 XXXXX XXXXX" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-2">Preferred Date <span className="text-red-500">*</span></label>
                  <input type="date" required value={bookingData.date} onChange={e => setBookingData({...bookingData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors [&::-webkit-calendar-picker-indicator]:filter-invert" />
                </div>

                <button type="submit" disabled={isBooking} className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-[1.02] hover:shadow-2xl mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100" style={{ background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(10 90% 45%))' }}>
                  {isBooking ? 'Processing...' : (
                    <>Proceed to Book <ArrowRight size={18} /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── TRANSFORMATION GALLERY ── */}
      <section id="gallery" className="py-24 px-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold tracking-widest uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-5">Real Results</div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Transformation <span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Gallery</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {transformations.map((t, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all group">
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black text-xl">
                      {t.initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{t.name}</h3>
                      <span className="text-xs text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full">{t.type}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <p className="text-xs text-red-400 font-semibold uppercase mb-1">Before</p>
                      <p className="text-lg font-black text-red-400">{t.before}</p>
                    </div>
                    <div className="text-center bg-white/5 rounded-xl p-3 flex items-center justify-center">
                      <ArrowRight size={18} className="text-orange-400" />
                    </div>
                    <div className="text-center bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                      <p className="text-xs text-green-400 font-semibold uppercase mb-1">After</p>
                      <p className="text-lg font-black text-green-400">{t.after}</p>
                    </div>
                  </div>
                  <div className="text-center text-xs text-gray-500 mb-3">⏱ Achieved in {t.duration}</div>
                </div>
                <div className="px-6 pb-6">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-gray-300 text-sm italic">&quot;{t.review}&quot;</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-4 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              What Members <span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Say</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <div className="lg:col-span-1 bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-3xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"></div>
              <div className="relative z-10 w-full">
                <PlayCircle size={60} className="text-orange-500 mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform" />
                <h3 className="font-bold text-xl text-white mb-2">Watch Video Reviews</h3>
                <p className="text-sm text-gray-300">See real members talk about their life-changing journeys at GymSmart.</p>
              </div>
            </div>
            
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {testimonials.slice(0,4).map((t, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-orange-500/30 transition-all">
                  <div className="flex text-yellow-400 mb-4">{[...Array(t.rating)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}</div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4 italic">&quot;{t.text}&quot;</p>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.member}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-24 px-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Get In <span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Touch</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              {[
                { icon: Phone, label: 'Call / WhatsApp', value: '+91 83479 77566', href: 'tel:+918347977566', color: 'from-green-500 to-emerald-600' },
                { icon: Mail, label: 'Email Us', value: 'info@gymsmart.com', href: 'mailto:info@gymsmart.com', color: 'from-blue-500 to-indigo-600' },
                { icon: MapPin, label: 'Visit Us', value: 'Andheri West, Mumbai, Maharashtra 400058', href: '#', color: 'from-red-500 to-rose-600' },
                { icon: Clock, label: 'Open Hours', value: '24/7 – Open Every Day', href: '#', color: 'from-orange-500 to-yellow-600' },
              ].map((c, i) => (
                <a key={i} href={c.href} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-orange-500/30 transition-all group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <c.icon size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{c.label}</p>
                    <p className="text-white font-semibold">{c.value}</p>
                  </div>
                </a>
              ))}
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
              {contactSuccess ? (
                <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 z-10">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="text-green-500" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-gray-400">We'll get back to you within 24 hours.</p>
                </div>
              ) : null}
              
              <h3 className="text-2xl font-bold text-white mb-6">Send a Message</h3>
              <form className="space-y-4" onSubmit={handleContact}>
                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={contactData.name} onChange={e => setContactData({...contactData, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors" placeholder="Your Name" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" required value={contactData.email} onChange={e => setContactData({...contactData, email: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1">Message <span className="text-red-500">*</span></label>
                  <textarea required value={contactData.message} onChange={e => setContactData({...contactData, message: e.target.value})} rows={4} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors" placeholder="How can we help you?"></textarea>
                </div>
                <button type="submit" disabled={isSending} className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02] mt-2 flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:scale-100" style={{ background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(10 90% 45%))' }}>
                  {isSending ? 'Sending...' : (
                    <>Send Message <MessageCircle size={18} /></>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-black border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <Image src="/logo.png" alt="GymSmart" width={40} height={40} className="rounded-lg object-cover" />
                <div>
                  <span className="font-bold text-lg text-white">GymSmart</span>
                  <span className="text-[10px] text-orange-400 block -mt-1 tracking-widest uppercase">Fitness ERP</span>
                </div>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">Mumbai&apos;s premier fitness destination. Transform your body, transform your life with expert guidance and cutting-edge facilities.</p>
              <div className="flex gap-3 mt-4">
                {[
                  { Icon: FbIcon, color: 'text-[#1877F2]', hoverBg: 'hover:bg-[#1877F2]/20', href: '#' },
                  { Icon: InstaIcon, color: 'text-[#E1306C]', hoverBg: 'hover:bg-[#E1306C]/20', href: '#' },
                  { Icon: MessageCircle, color: 'text-[#25D366]', hoverBg: 'hover:bg-[#25D366]/20', href: '#' },
                  { Icon: XIcon, color: 'text-white', hoverBg: 'hover:bg-white/20', href: '#' },
                  { Icon: YtIcon, color: 'text-[#FF0000]', hoverBg: 'hover:bg-[#FF0000]/20', href: '#' }
                ].map((s, i) => (
                  <a key={i} href={s.href} className={`w-9 h-9 rounded-full bg-white/10 flex items-center justify-center ${s.color} ${s.hoverBg} transition-all`}>
                    <s.Icon />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm">Quick Links</h4>
              <div className="space-y-2.5">
                {['About', 'Plans', 'Trainers', 'Services', 'Schedule', 'Booking'].map(l => (
                  <a key={l} href={`#${l.toLowerCase()}`} className="block text-gray-500 hover:text-orange-400 text-sm transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm">Contact</h4>
              <div className="space-y-3 text-sm text-gray-500">
                <p>📞 +91 83479 77566</p>
                <p>📧 info@gymsmart.com</p>
                <p>📍 Andheri West, Mumbai</p>
              </div>
              <Link href="/dashboard" className="mt-4 inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20">
                ERP Login →
              </Link>
            </div>
          </div>
          <Footer className="border-t border-white/10 pt-6 text-gray-400 bg-transparent" />
        </div>
      </footer>
    </div>
  );
}
