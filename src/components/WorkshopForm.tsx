import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Loader2, Calendar, Users, Building2, Phone, User, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { apiUrl } from '../utils/shopApi';

interface WorkshopFormProps {
    onClose: () => void;
}

interface FormData {
    name: string;
    organization: string;
    email: string;
    phone: string;
    date: string;
    participants: string;
    message: string;
}

export const WorkshopForm: React.FC<WorkshopFormProps> = ({ onClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await axios.post(apiUrl('/api/workshops/register'), data, { withCredentials: true });

            setIsSuccess(true);
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err) {
            console.error(err);
            setError("Failed to submit booking. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative p-6 md:p-12 bg-white text-left">

            {/* Success Overlay */}
            <AnimatePresence>
                {isSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 rounded-3xl"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="w-24 h-24 bg-[#F8D548]/20 rounded-full flex items-center justify-center mb-6"
                        >
                            <CheckCircle className="w-12 h-12 text-[#DBB520]" />
                        </motion.div>
                        <h3 className="text-3xl font-black text-[#4a3b2c] mb-2">Request Sent Successfully!</h3>
                        <p className="text-[#4a3b2c]/70 text-lg">We'll be in touch shortly to plan your workshop.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mb-10 text-center max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-black text-[#4a3b2c] mb-3 tracking-tight">Customize Your Session</h2>
                <p className="text-[#4a3b2c]/60 font-medium text-lg">Fill in the details below and we'll design a perfect upcycling workshop for your group.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto">

                {/* Name & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#4a3b2c]/60 ml-1">Name</label>
                        <div className="relative group">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#DBB520] group-focus-within:text-[#F8D548] transition-colors" />
                            <input
                                {...register('name', { required: true })}
                                className="w-full bg-gray-50 hover:bg-white border border-gray-200 focus:border-[#F8D548] rounded-2xl py-4 pr-4 transition-all outline-none text-[#4a3b2c] font-bold placeholder:text-[#4a3b2c]/30 shadow-sm focus:shadow-xl focus:ring-4 focus:ring-[#F8D548]/10"
                                style={{ paddingLeft: '60px' }}
                                placeholder="Your Name"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#4a3b2c]/60 ml-1">Phone</label>
                        <div className="relative group">
                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#DBB520] group-focus-within:text-[#F8D548] transition-colors" />
                            <input
                                {...register('phone', { required: true })}
                                className="w-full bg-gray-50 hover:bg-white border border-gray-200 focus:border-[#F8D548] rounded-2xl py-4 pr-4 transition-all outline-none text-[#4a3b2c] font-bold placeholder:text-[#4a3b2c]/30 shadow-sm focus:shadow-xl focus:ring-4 focus:ring-[#F8D548]/10"
                                style={{ paddingLeft: '60px' }}
                                placeholder="+91..."
                            />
                        </div>
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#4a3b2c]/60 ml-1">Email Address</label>
                    <div className="relative group">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#DBB520] group-focus-within:text-[#F8D548] transition-colors" />
                        <input
                            {...register('email', { required: true })}
                            type="email"
                            className="w-full bg-gray-50 hover:bg-white border border-gray-200 focus:border-[#F8D548] rounded-2xl py-4 pr-4 transition-all outline-none text-[#4a3b2c] font-bold placeholder:text-[#4a3b2c]/30 shadow-sm focus:shadow-xl focus:ring-4 focus:ring-[#F8D548]/10"
                            style={{ paddingLeft: '60px' }}
                            placeholder="you@email.com"
                        />
                    </div>
                </div>

                {/* Organization */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#4a3b2c]/60 ml-1">Organization / School</label>
                    <div className="relative group">
                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#DBB520] group-focus-within:text-[#F8D548] transition-colors" />
                        <input
                            {...register('organization', { required: true })}
                            className="w-full bg-gray-50 hover:bg-white border border-gray-200 focus:border-[#F8D548] rounded-2xl py-4 pr-4 transition-all outline-none text-[#4a3b2c] font-bold placeholder:text-[#4a3b2c]/30 shadow-sm focus:shadow-xl focus:ring-4 focus:ring-[#F8D548]/10"
                            style={{ paddingLeft: '60px' }}
                            placeholder="Organization Name"
                        />
                    </div>
                </div>

                {/* Date & Participants */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#4a3b2c]/60 ml-1">Preferred Date</label>
                        <div className="relative group">
                            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#DBB520] group-focus-within:text-[#F8D548] transition-colors" />
                            <input
                                {...register('date')}
                                type="date"
                                className="w-full bg-gray-50 hover:bg-white border border-gray-200 focus:border-[#F8D548] rounded-2xl py-4 pr-4 transition-all outline-none text-[#4a3b2c] font-bold cursor-pointer shadow-sm focus:shadow-xl focus:ring-4 focus:ring-[#F8D548]/10"
                                style={{ paddingLeft: '60px' }}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#4a3b2c]/60 ml-1">Batch Size</label>
                        <div className="relative group">
                            <Users className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#DBB520] group-focus-within:text-[#F8D548] transition-colors" />
                            <select
                                {...register('participants')}
                                className="w-full bg-gray-50 hover:bg-white border border-gray-200 focus:border-[#F8D548] rounded-2xl py-4 pr-10 transition-all outline-none text-[#4a3b2c] font-bold appearance-none cursor-pointer shadow-sm focus:shadow-xl focus:ring-4 focus:ring-[#F8D548]/10"
                                style={{ paddingLeft: '60px' }}
                            >
                                <option value="10-20">10-20 People</option>
                                <option value="20-50">20-50 People</option>
                                <option value="50+">50+ People</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#4a3b2c]/60 ml-1">Message (Optional)</label>
                    <textarea
                        {...register('message')}
                        rows={3}
                        className="w-full bg-gray-50 hover:bg-white border border-gray-200 focus:border-[#F8D548] rounded-2xl p-5 transition-all outline-none text-[#4a3b2c] font-bold resize-none placeholder:text-[#4a3b2c]/30 shadow-sm focus:shadow-xl focus:ring-4 focus:ring-[#F8D548]/10"
                        placeholder="Any specific requirements?"
                    />
                </div>

                {error && <p className="text-red-500 text-sm text-center font-bold bg-red-50 py-3 rounded-xl">{error}</p>}

                <div className="pt-4">
                    <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(248, 213, 72, 0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-[#F8D548] hover:bg-[#F3D040] text-[#4a3b2c] py-5 rounded-2xl font-black shadow-xl shadow-[#F8D548]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg tracking-wide uppercase"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" /> Processing...
                            </>
                        ) : (
                            <>
                                Confirm Booking Request
                                <CheckCircle className="w-6 h-6 opacity-40" />
                            </>
                        )}
                    </motion.button>
                </div>

            </form>
        </div>
    );
};
