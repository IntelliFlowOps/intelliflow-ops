import { useMemo, useState } from "react";
import { useTabData } from "../hooks/useSheetData.jsx";
import DrawerPanel from "../components/DrawerPanel.jsx";

const PEOPLE = ["Emma","Wyatt","ED","Micah"];

const PIN_MAP = {
  Emma:"3724",
  Wyatt:"2654",
  ED:"1876",
  Micah:"9789"
};

const money=v=>parseFloat(String(v??"").replace(/[^0-9.-]/g,""))||0;

const fmt=v=>`$${Number(v||0).toLocaleString(undefined,{
minimumFractionDigits:2,
maximumFractionDigits:2
})}`;

function findAssignmentColumn(row){

return Object.keys(row).find(k=>
k.toLowerCase().includes("rep")||
k.toLowerCase().includes("marketer")||
k.toLowerCase().includes("closer")
);

}

function belongs(row,person){

const col=findAssignmentColumn(row);

if(!col) return false;

return String(row[col]).trim().toLowerCase()===person.toLowerCase();

}

function unpaid(row){

if(row["_isPaidOut"]) return false;

if(row["Payout Batch / Month"]) return false;

return true;

}

function commission(row,person){

if(person==="Emma") return money(row["Emma Commission"]);

if(person==="Wyatt") return money(row["Wyatt Commission"]);

if(person==="ED"||person==="Micah")
return money(row["Sales Commission"]);

return 0;

}

function summary(rows,person){

const owned=rows.filter(r=>belongs(r,person));

const unpaidRows=owned
.filter(unpaid)
.map(r=>commission(r,person))
.filter(Boolean);

const total=unpaidRows.reduce((a,b)=>a+b,0);

return total;

}

export default function MarketersPage(){

const {rows:ledger=[]}=useTabData("COMMISSION_LEDGER");

const [pins,setPins]=useState({
Emma:"",
Wyatt:"",
ED:"",
Micah:""
});

const [open,setOpen]=useState(null);

const totals=useMemo(()=>({

Emma:summary(ledger,"Emma"),
Wyatt:summary(ledger,"Wyatt"),
ED:summary(ledger,"ED"),
Micah:summary(ledger,"Micah")

}),[ledger]);

function unlock(name){

if(pins[name]!==PIN_MAP[name]) return;

setOpen(name);

}

function close(){

setOpen(null);

setPins({
Emma:"",
Wyatt:"",
ED:"",
Micah:""
});

}

return(

<div className="space-y-6">

<h1 className="text-3xl font-semibold text-white">
Marketer Commissions
</h1>

<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

{PEOPLE.map(name=>(

<div
key={name}
className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 shadow-lg">

<div className="text-lg font-semibold text-white">

{name}

</div>

<input
type="password"
value={pins[name]}
onChange={e=>setPins(x=>({...x,[name]:e.target.value}))}
placeholder="Enter PIN"
className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white"
/>

<button
onClick={()=>unlock(name)}
className="mt-3 w-full rounded-xl bg-white text-black py-2 font-semibold">

Unlock

</button>

</div>

))}

</div>

{open && (

<DrawerPanel
isOpen
onClose={close}
title={`${open} Commission`}
description="Current unpaid total">

<div className="text-3xl text-white font-semibold">

{fmt(totals[open])}

</div>

</DrawerPanel>

)}

</div>

);

}
