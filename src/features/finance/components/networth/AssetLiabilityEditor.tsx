import React, { useState } from "react";
import type { Asset, Liability } from "../../../../db/db";
import { formatNRS } from "../../utils/currencyFormat";
interface AssetLiabilityEditorProps {
  assets: Asset[];
  liabilities: Liability[];
  addAsset: (a: Omit<Asset, "id">) => Promise<any>;
  deleteAsset: (id: number) => Promise<void>;
  addLiability: (l: Omit<Liability, "id">) => Promise<any>;
  deleteLiability: (id: number) => Promise<void>;
}
export const AssetLiabilityEditor: React.FC<AssetLiabilityEditorProps> = ({
  assets,
  liabilities,
  addAsset,
  deleteAsset,
  addLiability,
  deleteLiability,
}) => {
  const [assetName, setAssetName] = useState("");
  const [assetVal, setAssetVal] = useState("");
  const [assetCat, setAssetCat] = useState<Asset["category"]>("cash");
  const [liabName, setLiabName] = useState("");
  const [liabVal, setLiabVal] = useState("");
  const [liabCat, setLiabCat] = useState<Liability["category"]>("other");
  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetVal) return;
    await addAsset({
      name: assetName,
      category: assetCat,
      value: parseFloat(assetVal),
      lastUpdated: new Date().toISOString(),
    });
    setAssetName("");
    setAssetVal("");
  };
  const handleAddLiab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liabName || !liabVal) return;
    await addLiability({
      name: liabName,
      category: liabCat,
      amount: parseFloat(liabVal),
      lastUpdated: new Date().toISOString(),
    });
    setLiabName("");
    setLiabVal("");
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {" "}
      {/* Assets */}{" "}
      <div
        className="bg-slate-800 p-4 card"
        style={{ borderColor: "var(--border)" }}
      >
        {" "}
        <h3 className="text-lg font-bold mb-4">Assets</h3>{" "}
        <ul className="mb-4 space-y-2">
          {" "}
          {assets.map((a) => (
            <li
              key={a.id}
              className="flex justify-between items-center text-sm"
              style={{ color: "var(--muted)" }}
            >
              {" "}
              <div>
                {" "}
                <span className="font-semibold">{a.name}</span>{" "}
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  ({a.category})
                </span>{" "}
              </div>{" "}
              <div className="flex items-center gap-2">
                {" "}
                <span>{formatNRS(a.value)}</span>{" "}
                <button
                  onClick={() => a.id && deleteAsset(a.id)}
                  className="text-[var(--danger)] hover:text-[var(--danger)] text-xs"
                >
                  Del
                </button>{" "}
              </div>{" "}
            </li>
          ))}{" "}
        </ul>{" "}
        <form onSubmit={handleAddAsset} className="flex flex-col gap-2">
          {" "}
          <input
            
            placeholder="Asset Name"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            required
          />{" "}
          <div className="flex gap-2">
            {" "}
            <input
              
              placeholder="Value"
              type="number"
              value={assetVal}
              onChange={(e) => setAssetVal(e.target.value)}
              required
            />{" "}
            <select
              
              value={assetCat}
              onChange={(e) => setAssetCat(e.target.value as any)}
            >
              {" "}
              <option value="cash">Cash</option>{" "}
              <option value="investments">Investments</option>{" "}
              <option value="real_estate">Real Estate</option>{" "}
              <option value="crypto">Crypto</option>{" "}
              <option value="other">Other</option>{" "}
            </select>{" "}
          </div>{" "}
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--green)] text-[var(--bg)] rounded opacity-90 text-sm font-medium"
          >
            Add Asset
          </button>{" "}
        </form>{" "}
      </div>{" "}
      {/* Liabilities */}{" "}
      <div
        className="bg-slate-800 p-4 card"
        style={{ borderColor: "var(--border)" }}
      >
        {" "}
        <h3 className="text-lg font-bold mb-4">Liabilities</h3>{" "}
        <ul className="mb-4 space-y-2">
          {" "}
          {liabilities.map((l) => (
            <li
              key={l.id}
              className="flex justify-between items-center text-sm"
              style={{ color: "var(--muted)" }}
            >
              {" "}
              <div>
                {" "}
                <span className="font-semibold">{l.name}</span>{" "}
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  ({l.category})
                </span>{" "}
              </div>{" "}
              <div className="flex items-center gap-2">
                {" "}
                <span>{formatNRS(l.amount)}</span>{" "}
                <button
                  onClick={() => l.id && deleteLiability(l.id)}
                  className="text-[var(--danger)] hover:text-[var(--danger)] text-xs"
                >
                  Del
                </button>{" "}
              </div>{" "}
            </li>
          ))}{" "}
        </ul>{" "}
        <form onSubmit={handleAddLiab} className="flex flex-col gap-2">
          {" "}
          <input
            
            placeholder="Liability Name"
            value={liabName}
            onChange={(e) => setLiabName(e.target.value)}
            required
          />{" "}
          <div className="flex gap-2">
            {" "}
            <input
              
              placeholder="Amount"
              type="number"
              value={liabVal}
              onChange={(e) => setLiabVal(e.target.value)}
              required
            />{" "}
            <select
              
              value={liabCat}
              onChange={(e) => setLiabCat(e.target.value as any)}
            >
              {" "}
              <option value="mortgage">Mortgage</option>{" "}
              <option value="loan">Loan</option>{" "}
              <option value="credit_card">Credit Card</option>{" "}
              <option value="other">Other</option>{" "}
            </select>{" "}
          </div>{" "}
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--danger)] text-[var(--bg)] rounded opacity-90 text-sm font-medium"
          >
            Add Liability
          </button>{" "}
        </form>{" "}
      </div>{" "}
    </div>
  );
};
