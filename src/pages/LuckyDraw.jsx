import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import usePageMeta from "../hooks/usePageMeta.js";
import { getUserLuckyDrawEntries, verifyAndUseCode } from "../services/luckyDrawService.js";
import EmptyState from "../components/common/EmptyState.jsx";
import { Link } from "react-router-dom";

const LuckyDraw = () => {
  usePageMeta({ title: "My Lucky Draw Entries | Nagneshwari Jewels" });
  
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);

  useEffect(() => {
    if (user) {
      getUserLuckyDrawEntries(user.id).then((data) => {
        setEntries(data);
        setLoading(false);
      });
    }
  }, [user]);

  const handleRedeem = async (code, id) => {
    if (!window.confirm("Are you sure you want to redeem this code now?")) return;
    setRedeemingId(id);
    try {
      await verifyAndUseCode(code);
      const data = await getUserLuckyDrawEntries(user.id);
      setEntries(data);
    } catch (err) {
      alert(err.message || "Failed to redeem code.");
    } finally {
      setRedeemingId(null);
    }
  };

  if (loading) return <div className="py-20 text-center text-stone">Loading your rewards...</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <h1 className="font-display text-3xl">Lucky Draw QR Codes</h1>
      <p className="text-stone">Show these QR codes to the store admin or click Redeem to claim your lucky draw prizes.</p>

      {entries.length === 0 ? (
        <EmptyState title="No codes yet" description="Place an order above ₹3000 to unlock your first lucky draw entry!" action={<Link to="/shop" className="rounded-full bg-onyx px-5 py-2 text-white">Shop Now</Link>} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {entries.map(entry => (
            <div key={entry.id} className={`rounded-3xl border ${(entry.is_used || (entry.order_id && entry.orders?.status === 'cancelled')) ? "bg-stone/5 border-stone/20 opacity-70" : "bg-white border-rose/30 shadow-soft"} p-6 flex flex-col items-center text-center`}>
              <img src={`https://quickchart.io/qr?text=${entry.code}&size=200&margin=2`} alt="QR Code" className="w-40 h-40 rounded-xl mb-4 p-2 bg-white shadow-sm" />
              <p className="font-bold text-xl tracking-widest text-onyx">{entry.code}</p>
              <p className="text-sm text-stone mt-2">Order ID: {entry.order_id}</p>
              <p className="text-xs text-stone mt-1">Issued: {new Date(entry.created_at).toLocaleDateString()}</p>
              
              {entry.order_id && entry.orders?.status === 'cancelled' ? (
                <div className="mt-4 bg-rose/10 text-rose px-4 py-1.5 rounded-full text-sm font-bold w-full uppercase tracking-wider">VOID (CANCELLED)</div>
              ) : entry.is_used ? (
                <div className="mt-4 bg-rose/10 text-rose px-4 py-1.5 rounded-full text-sm font-bold w-full uppercase tracking-wider">REDEEMED</div>
              ) : (
                <button 
                  onClick={() => handleRedeem(entry.code, entry.id)}
                  disabled={redeemingId === entry.id || (entry.order_id && entry.orders?.status !== 'delivered')}
                  className="mt-4 w-full rounded-full bg-onyx px-4 py-1.5 text-sm font-bold text-white uppercase tracking-wider disabled:opacity-50"
                >
                  {redeemingId === entry.id ? "REDEEMING..." : (entry.order_id && entry.orders?.status !== 'delivered') ? "REDEEM AFTER DELIVERY" : "REDEEM NOW"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default LuckyDraw;