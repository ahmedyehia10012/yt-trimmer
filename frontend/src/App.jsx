import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Download,
    Youtube,
    Scissors,
    Clock,
    Settings,
    AlertCircle,
    ChevronRight,
    Loader2,
    Play,
    CheckCircle,
    History,
    Timer,
    Layout,
    Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Component for precise time input
const TimeInput = ({ label, seconds, onChange, maxSeconds }) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const update = (field, val) => {
        let newH = h, newM = m, newS = s;
        const v = parseInt(val) || 0;
        if (field === 'h') newH = v;
        if (field === 'm') newM = Math.min(v, 59);
        if (field === 's') newS = Math.min(v, 59);

        const total = newH * 3600 + newM * 60 + newS;
        onChange(Math.min(total, maxSeconds));
    };

    return (
        <div className="flex flex-col gap-3 w-full">
            <span className="text-sm font-bold text-slate-400 px-1">{label}</span>
            <div className="flex items-center justify-between bg-slate-950/50 border border-slate-800 rounded-2xl p-3 focus-within:border-brand-500/50 focus-within:ring-1 focus-within:ring-brand-500/20 transition-all">
                <div className="flex flex-col items-center flex-1">
                    <input
                        type="number" value={h} onChange={(e) => update('h', e.target.value)}
                        className="w-full bg-transparent text-center text-xl font-bold font-mono focus:outline-none placeholder:text-slate-800"
                        placeholder="00"
                    />
                    <span className="text-[10px] text-slate-600 font-bold uppercase mt-1">ساعة</span>
                </div>
                <span className="text-slate-700 font-black text-xl px-1 mb-5">:</span>
                <div className="flex flex-col items-center flex-1">
                    <input
                        type="number" value={m} onChange={(e) => update('m', e.target.value)}
                        className="w-full bg-transparent text-center text-xl font-bold font-mono focus:outline-none placeholder:text-slate-800"
                        placeholder="00"
                    />
                    <span className="text-[10px] text-slate-600 font-bold uppercase mt-1">دقيقة</span>
                </div>
                <span className="text-slate-700 font-black text-xl px-1 mb-5">:</span>
                <div className="flex flex-col items-center flex-1">
                    <input
                        type="number" value={s} onChange={(e) => update('s', e.target.value)}
                        className="w-full bg-transparent text-center text-xl font-bold font-mono focus:outline-none placeholder:text-slate-800"
                        placeholder="00"
                    />
                    <span className="text-[10px] text-slate-600 font-bold uppercase mt-1">ثانية</span>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [url, setUrl] = useState('');
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [start, setStart] = useState(0);
    const [end, setEnd] = useState(0);
    const [quality, setQuality] = useState('1080');
    const [isProcessing, setIsProcessing] = useState(false);

    const formatSec = (s) => {
        const date = new Date(null);
        date.setSeconds(s);
        return date.toISOString().substr(11, 8);
    };

    const fetchInfo = async () => {
        if (!url) return;
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`/api/info?url=${encodeURIComponent(url)}`);
            setVideo(res.data);
            setStart(0);
            setEnd(res.data.duration);
        } catch (e) {
            setError('⚠️ خطأ في تحميل بيانات الفيديو. تأكد من صحة الرابط.');
        } finally {
            setLoading(false);
        }
    };

    const doDownload = () => {
        if (start >= end) {
            setError('❌ وقت البداية يجب أن يكون أقل من وقت النهاية');
            return;
        }
        setIsProcessing(true);
        window.location.href = `/api/download?url=${encodeURIComponent(url)}&start=${start}&end=${end}&quality=${quality}`;
        setTimeout(() => setIsProcessing(false), 5000);
    };

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-start p-6 md:p-12 overflow-x-hidden" dir="rtl">
            {/* Dynamic Background */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <header className="w-full max-w-5xl mb-16 flex flex-col items-center gap-4 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-brand-500/10 text-brand-400 px-4 py-1.5 rounded-full text-sm font-bold border border-brand-500/20 mb-4 flex items-center gap-2"
                >
                    <Trophy size={14} /> نسخة المحترفين 3.0
                </motion.div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tight bg-gradient-to-l from-white via-brand-200 to-brand-500 bg-clip-text text-transparent">
                    YouTube Cut
                </h1>
                <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
                    الأداة الأسرع لتحميل مقاطع يوتيوب بجودة 2K وتنسيق مثالي لبرامج أدوبي بريمير وكاب كات.
                </p>
            </header>

            <main className="w-full max-w-4xl space-y-8">
                {/* Search Field */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-brand-500/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative bg-slate-900/60 backdrop-blur-3xl border border-slate-700/50 rounded-[32px] p-2 flex flex-col md:flex-row gap-2">
                        <div className="flex-grow relative">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
                                placeholder="الصق رابط الفيديو هنا... (YouTube URL)"
                                className="w-full bg-transparent h-16 md:h-18 px-14 text-lg md:text-xl focus:outline-none placeholder:text-slate-600 font-medium"
                            />
                            <Youtube className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={28} />
                        </div>
                        <button
                            onClick={fetchInfo}
                            disabled={loading || !url}
                            className="bg-brand-500 hover:bg-brand-400 disabled:bg-slate-800 text-white font-bold h-16 md:h-18 px-10 rounded-2xl transition-all shadow-xl shadow-brand-500/20 disabled:shadow-none flex items-center justify-center gap-3 overflow-hidden group/btn"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <span className="text-xl">تحميل البيانات</span>
                                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl flex items-center gap-4 text-lg font-bold"
                        >
                            <AlertCircle size={24} />
                            {error}
                        </motion.div>
                    )}

                    {video && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[40px] overflow-hidden p-6 md:p-10 space-y-10"
                        >
                            {/* Video Preview */}
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-full md:w-80 shrink-0">
                                    <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 group">
                                        <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                                        <div className="absolute bottom-5 right-5 bg-black/60 backdrop-blur px-3 py-1 rounded-xl text-xs font-bold font-mono">
                                            {formatSec(video.duration)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-grow space-y-4 py-2">
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight line-clamp-2">{video.title}</h2>
                                    <div className="flex flex-wrap gap-3">
                                        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 text-slate-300">
                                            <Play size={18} className="text-brand-400" />
                                            <span>متاح بـ 2K Ultra HD</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Precise Controls */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-slate-900/40 p-8 md:p-10 rounded-[40px] border border-white/5 shadow-inner">
                                <div className="flex flex-col gap-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-400">
                                            <Timer size={20} />
                                        </div>
                                        <h3 className="text-xl font-bold italic">التحديد السريع بالمسطرة</h3>
                                    </div>

                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest px-1">
                                                <span className="text-slate-500">نقطة البداية</span>
                                                <span className="text-brand-400 bg-brand-400/10 px-2 py-1 rounded-lg">{formatSec(start)}</span>
                                            </div>
                                            <input
                                                type="range" min="0" max={video.duration} value={start}
                                                onChange={(e) => setStart(Math.min(parseInt(e.target.value), end - 1))}
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest px-1">
                                                <span className="text-slate-500">نقطة النهاية</span>
                                                <span className="text-purple-400 bg-purple-400/10 px-2 py-1 rounded-lg">{formatSec(end)}</span>
                                            </div>
                                            <input
                                                type="range" min="0" max={video.duration} value={end}
                                                onChange={(e) => setEnd(Math.max(parseInt(e.target.value), start + 1))}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-8 bg-black/20 p-8 rounded-3xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                                            <Scissors size={20} />
                                        </div>
                                        <h3 className="text-xl font-bold italic">الإدخال اليدوي الدقيق</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-8 w-full">
                                        <TimeInput
                                            label="توقيت البداية" seconds={start} maxSeconds={video.duration}
                                            onChange={(val) => setStart(val)}
                                        />
                                        <TimeInput
                                            label="توقيت النهاية" seconds={end} maxSeconds={video.duration}
                                            onChange={(val) => setEnd(val)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Settings and Download */}
                            <div className="pt-6 flex flex-col md:flex-row gap-6 items-end">
                                <div className="w-full md:w-1/2 space-y-4">
                                    <label className="text-sm font-bold text-slate-400 px-2 flex items-center gap-2">
                                        <Settings size={16} /> الجودة المخرجة
                                    </label>
                                    <select
                                        value={quality}
                                        onChange={(e) => setQuality(e.target.value)}
                                        className="w-full bg-slate-900/80 border border-slate-700/50 h-16 rounded-2xl px-6 font-bold focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="1440">Ultra HD (2K - 1440p)</option>
                                        <option value="1080">Full HD (1080p)</option>
                                        <option value="720">HD Ready (720p)</option>
                                    </select>
                                </div>
                                <button
                                    onClick={doDownload}
                                    disabled={isProcessing}
                                    className="w-full md:w-1/2 h-16 bg-gradient-to-l from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-black text-2xl rounded-2xl transition-all shadow-2xl shadow-brand-500/30 flex items-center justify-center gap-4 group"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : (
                                        <>
                                            <Download size={28} className="group-hover:-translate-y-1 transition-transform" />
                                            <span>بدء استخراج المقطع</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <footer className="mt-20 w-full max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 py-12 border-t border-white/5">
                    {[
                        { icon: <CheckCircle className="text-brand-400" />, title: 'دقة المونتاج', desc: 'استمتع بدقة 1440p المثالية لأعمال السينما والمحتوى الاحترافي.' },
                        { icon: <Layout className="text-purple-400" />, title: 'واجهة عصرية', desc: 'تصميم يركز على سهولة الاستخدام والوصول السريع للأدوات.' },
                        { icon: <History className="text-blue-400" />, title: 'معالجة سريعة', desc: 'نظام داخلي يقوم بدمج الفيديو والصوت بترميز H.264 عالي الأداء.' }
                    ].map((item, i) => (
                        <div key={i} className="space-y-3">
                            <div className="flex items-center gap-3">
                                {item.icon}
                                <h4 className="font-bold text-lg">{item.title}</h4>
                            </div>
                            <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="text-center py-10 text-slate-700 font-bold border-t border-white/5">
                    صُنع لتمكين المبدعين العرب © 2026
                </div>
            </footer>
        </div>
    );
};

export default App;
