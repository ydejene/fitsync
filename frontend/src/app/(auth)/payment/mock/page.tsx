"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function MockPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const merchOrderId = searchParams.get("merchOrderId") || "FS1773832329724EW0YFS";
  const amount = searchParams.get("amount") || "12000.00";
  const planName = searchParams.get("planName") || "FitSync Half Yearly Subscription";

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(7200); // 2-hour countdown
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Countdown timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // OTP Resend timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleSendOTP = () => {
    if (phone.length < 9) {
      setError("Please enter a valid phone number");
      return;
    }
    setOtpSent(true);
    setOtpTimer(60);
    setError("");
    const mockOTP = "123456";
    alert(`[SIMULATED SMS]\nTo: +251${phone}\nMessage: Your Telebirr verification code is: ${mockOTP}`);
  };

  const handlePay = async () => {
    if (!otpSent) {
      setError("Please send and enter the verification code first");
      return;
    }
    if (otp !== "123456") {
      setError("Invalid verification code. Use '123456'");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/telebirr/mock-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchOrderId }),
      }).then((r) => r.json());

      if (res.success) {
        sessionStorage.setItem("fitsync_merch_order_id", merchOrderId);
        router.push("/payment/success");
      } else {
        setError(res.message || "Payment simulation failed");
      }
    } catch (err) {
      setError("Communication error with backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#333]">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
           <div className="flex items-center">
              <span className="text-[#008136] font-bold text-xl italic tracking-tighter">ethio telecom</span>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="text-right leading-none">
              <span className="text-[#005BAB] font-bold text-[10px] block mb-0.5">ቴሌብር</span>
              <span className="text-[#005BAB] font-bold text-xl tracking-tighter">telebirr</span>
           </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6 relative">
           <p className="text-[13px] text-gray-500 mb-6 italic">
             You are using the instant payment transaction, the transaction will be closed in <span className="text-red-500 font-bold">{seconds}</span> seconds, please pay in time!
           </p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
              <div className="flex items-center border border-gray-100 rounded bg-[#F9F9F9]">
                <div className="bg-[#EEEEEE] px-4 py-2.5 w-40 text-xs text-gray-600 font-medium">Transaction To:</div>
                <div className="px-4 py-2.5 flex-1 bg-white font-semibold text-sm">fitsyncej44</div>
              </div>
              <div className="flex items-center border border-gray-100 rounded bg-[#F9F9F9]">
                <div className="bg-[#EEEEEE] px-4 py-2.5 w-48 text-xs text-gray-600 font-medium">Merchant order number:</div>
                <div className="px-4 py-2.5 flex-1 bg-white font-semibold text-[11px] truncate uppercase">{merchOrderId}</div>
              </div>
              <div className="flex items-center border border-gray-100 rounded bg-[#F9F9F9]">
                <div className="bg-[#EEEEEE] px-4 py-2.5 w-40 text-xs text-gray-600 font-medium">Name of commodity:</div>
                <div className="px-4 py-2.5 flex-1 bg-white font-semibold text-sm">{planName}</div>
              </div>
              <div className="flex items-center border border-gray-100 rounded bg-[#F9F9F9]">
                <div className="bg-[#EEEEEE] px-4 py-2.5 w-48 text-xs text-gray-600 font-medium">Type of transaction:</div>
                <div className="px-4 py-2.5 flex-1 bg-white font-semibold text-sm">BuyGoods</div>
              </div>
           </div>

           <div className="pt-6 border-t border-dashed border-gray-200 flex items-baseline gap-2">
             <span className="text-[#005BAB] text-2xl">The order amount:</span>
             <h2 className="text-[#005BAB] text-3xl font-bold">
               {amount} <span className="text-2xl font-medium">ETB</span>
             </h2>
           </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
           <div className="flex border-b border-gray-200 bg-gray-50">
              <button className="px-10 py-5 text-[#005BAB] font-bold border-b-4 border-[#005BAB] bg-white">Login Account to Pay</button>
              <button className="px-10 py-5 text-gray-400 font-medium hover:text-gray-600 text-sm transition-colors">QR Scan</button>
           </div>

           <div className="p-8 md:p-12 flex flex-col lg:flex-row gap-12">
              <div className="flex-1 space-y-10">
                 {error && (
                   <div className="bg-red-50 text-red-600 text-sm p-4 rounded border border-red-100 font-medium flex items-center gap-2">
                     <i className="fa-solid fa-circle-exclamation" /> {error}
                   </div>
                 )}

                 <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">Phone Number</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold border-r pr-3">+251</div>
                      <input 
                        type="tel"
                        className="w-full bg-[#F8F8F8] border border-gray-200 rounded p-4 pl-20 outline-none focus:border-[#005BAB] focus:bg-white text-xl font-bold transition-all"
                        placeholder="Please enter phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">SMS Verification Code</label>
                    <div className="flex gap-3">
                       <input 
                        type="text"
                        className="flex-1 bg-[#F8F8F8] border border-gray-200 rounded p-4 outline-none focus:border-[#005BAB] focus:bg-white text-xl font-bold tracking-[0.5em] transition-all"
                        placeholder="Verification Code"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                       />
                       <button 
                         onClick={handleSendOTP}
                         disabled={otpTimer > 0}
                         className={`px-8 py-4 rounded font-bold text-white transition-all shadow-md active:translate-y-0.5 ${otpTimer > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#005BAB] hover:bg-[#004a8d]'}`}
                       >
                         {otpTimer > 0 ? `Resend (${otpTimer}s)` : "Send SMS Code"}
                       </button>
                    </div>
                 </div>

                 <button 
                   onClick={handlePay}
                   disabled={loading}
                   className="w-full bg-[#005BAB] text-white font-bold py-5 rounded-lg shadow-xl hover:bg-[#004a8d] active:scale-[0.99] transition-all text-xl mt-4 flex items-center justify-center gap-3"
                 >
                   {loading ? <i className="fa-solid fa-spinner fa-spin" /> : "Authorize Payment"}
                 </button>
              </div>

              <div className="w-full lg:w-80 flex-shrink-0">
                 <div className="bg-[#98C44A] text-white p-8 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <i className="fa-solid fa-lightbulb text-6xl" />
                    </div>
                    <h3 className="font-bold mb-6 text-xl flex items-center gap-2">
                      <i className="fa-solid fa-circle-info" /> Tips:
                    </h3>
                    <ul className="space-y-6 text-[15px] leading-relaxed font-medium">
                       <li className="flex gap-2">
                         <span>1.</span>
                         <span>You are using the E-Money instant payment platform, please double confirm your network environment is under safe status.</span>
                       </li>
                       <li className="flex gap-2">
                         <span>2.</span>
                         <span>If you face any challenge, kindly call 127 for assistance.</span>
                       </li>
                    </ul>
                 </div>
              </div>
           </div>
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto p-12 text-center text-gray-400 text-xs border-t border-gray-200 mt-20 mb-10">
        <p>© 2024 ethio telecom. All rights reserved.</p>
        <div className="mt-4 flex items-center justify-center gap-6 grayscale opacity-50">
           <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Telebirr_logo.png/640px-Telebirr_logo.png" className="h-4" alt="" />
           <span className="font-bold italic">ethio telecom</span>
        </div>
      </footer>
    </div>
  );
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-[#005BAB]" />
      </div>
    }>
      <MockPaymentContent />
    </Suspense>
  );
}
