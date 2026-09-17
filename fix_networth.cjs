const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/features/finance/components/networth');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const fullPath = path.join(dir, file);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Fix mangled borderdark:
  content = content.replace(/borderdark:/g, '');
  content = content.replace(/borderrounded/g, 'border rounded');
  content = content.replace(/dark:/g, '');
  content = content.replace(/dark:bg-slate-[0-9]{3}/g, '');
  content = content.replace(/bg-white/g, '');
  content = content.replace(/dark:text-white/g, '');

  content = content.replace(/bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg/g, 'card p-6 bg-[var(--green)] text-[var(--bg)]');
  content = content.replace(/text-indigo-100/g, 'opacity-80');
  content = content.replace(/bg-white\/10 border-b border-white\/20/g, 'border-b');
  content = content.replace(/border-white\/20/g, '');
  content = content.replace(/className="w-full py-2 bg-white rounded font-semibold hover:bg-slate-50 transition" style={{ color: "var\(--green\)" }}/g, 'className="w-full py-2 rounded font-semibold transition bg-[var(--bg)] text-[var(--green)]"');

  content = content.replace(/bg-slate-50/g, 'bg-black/5');
  content = content.replace(/bg-slate-200/g, 'bg-black/10');
  content = content.replace(/bg-emerald-500/g, 'bg-[var(--green)]');
  content = content.replace(/bg-emerald-600/g, 'bg-[var(--green)]');
  content = content.replace(/hover:bg-emerald-700/g, 'opacity-90');
  content = content.replace(/bg-violet-500/g, 'bg-[var(--green)]');

  // Replace remaining text colors in AssetLiabilityEditor
  content = content.replace(/className="px-4 py-2 bg-\[var\(--green\)\] text-white rounded hover:bg-\[var\(--green\)\] text-sm font-medium"/g, 'className="px-4 py-2 bg-[var(--green)] text-[var(--bg)] rounded opacity-90 text-sm font-medium"');
  content = content.replace(/className="px-4 py-2 bg-\[var\(--danger\)\] text-white rounded hover:bg-red-700 text-sm font-medium"/g, 'className="px-4 py-2 bg-[var(--danger)] text-[var(--bg)] rounded opacity-90 text-sm font-medium"');
  content = content.replace(/className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-medium"/g, 'className="px-4 py-2 bg-[var(--green)] text-[var(--bg)] rounded opacity-90 text-sm font-medium"');

  // Fix mangled elements
  content = content.replace(/className="([^"]*)(\s+)p-4 rounded-xl([^"]*)"/g, 'className="$1 p-4 card"');
  content = content.replace(/className="([^"]*)(\s+)p-4 rounded-2xl([^"]*)"/g, 'className="$1 p-4 card"');

  content = content.replace(/className="lg:col-span-2  p-4 card shadow-sm flex flex-col"/g, 'className="lg:col-span-2 card p-4 flex flex-col"');
  content = content.replace(/className=" p-4 card"/g, 'className="card p-4"');
  content = content.replace(/className="  p-4 card"/g, 'className="card p-4"');

  // Inputs
  content = content.replace(/className="([^"]*)border rounded([^"]*)"/g, 'className="$1 border rounded bg-transparent text-[var(--text)] $2"');
  
  content = content.replace(/className="lg:col-span-1 card p-6 bg-\[var\(--green\)\] text-\[var\(--bg\)\]"/g, 'className="lg:col-span-1 card p-6 bg-[var(--green)] text-[var(--bg)]" style={{ background: "var(--green)", color: "var(--bg)" }}');

  // Clean empty class attributes
  content = content.replace(/className="\s+"/g, '');
  content = content.replace(/\s\s+/g, ' ');

  fs.writeFileSync(fullPath, content);
}
console.log('NetWorth styles fixed!');
